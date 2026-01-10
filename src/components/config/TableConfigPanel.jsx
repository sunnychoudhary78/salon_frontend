// src/components/TableConfigPanel.jsx
import React, { useEffect, useState } from 'react';
import api from '@/api/axios'; // your axios wrapper
import {
    Button
} from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { arrayMove } from '@dnd-kit/sortable'; // helper (we'll implement ordering via ids)
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MdDragIndicator } from "react-icons/md";
import { ScrollArea } from "@/components/ui/scroll-area"
import { FiSettings } from "react-icons/fi";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

// Sortable item wrapper (using dnd-kit)
function SortableItem({ id, item, onToggle }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center justify-between gap-3 p-2 border rounded mb-2 bg-white">
            <div className="flex items-center gap-3">
                <div {...attributes} {...listeners} className="cursor-grab p-1">
                    <MdDragIndicator className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox checked={!!item.visible} onCheckedChange={() => onToggle(item.key)} />
                    <div className="text-sm">{item.label}</div>
                </div>
            </div>
            <div className="text-xs text-slate-500">#{item.order}</div>
        </div>
    );
}

export default function TableConfigPanel({ tableKey = 'employees', onSaved, initialColumns = [] }) {
    const [open, setOpen] = useState(false);
    const [columns, setColumns] = useState([]); // registry with label
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [userConfig, setUserConfig] = useState(null); // saved config or null

    const sensors = useSensors(useSensor(PointerSensor));

    useEffect(() => {
        if (!open) return;
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    async function fetchData() {
        setLoading(true);
        try {
            const res = await api.get(`/table-configs?table=${encodeURIComponent(tableKey)}`);
            let registry = res.data.columns || [];
            
            // Merge with initialColumns if provided (prioritize remote registry for metadata, but add missing keys from initial)
            if (Array.isArray(initialColumns)) {
                const regMap = new Map(registry.map(c => [c.key, c]));
                initialColumns.forEach(c => {
                    if (!regMap.has(c.key)) {
                        regMap.set(c.key, c);
                    }
                });
                registry = Array.from(regMap.values());
            }

            if (!Array.isArray(registry) || registry.length === 0) {
                registry = Array.isArray(initialColumns) ? initialColumns : [];
            } else {
                const keys = new Set(registry.map((r) => r.key));
                const extras = (Array.isArray(initialColumns) ? initialColumns : []).filter((r) => !keys.has(r.key));
                registry = [...registry, ...extras];
            }
            const config = res.data.config ? res.data.config.config : null;

            // If config exists, merge visibility/order into registry order
            if (config && Array.isArray(config)) {
                // map config by key
                const cfgMap = Object.fromEntries(config.map((c) => [c.key, c]));
                // create ordered array based on config.order
                const ordered = config
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((c) => {
                        const reg = registry.find((r) => r.key === c.key);
                        return {
                            key: c.key,
                            label: reg ? reg.label : c.key,
                            visible: !!c.visible,
                            order: c.order,
                        };
                    });

                // include registry items not present in config at the end (visible by default true)
                const missing = registry.filter((r) => !cfgMap[r.key]).map((r, idx) => ({
                    key: r.key,
                    label: r.label,
                    visible: true,
                    order: ordered.length + idx + 1,
                }));

                setColumns([...ordered, ...missing]);
                setUserConfig(config);
            } else {
                // No user config — use registry default order (visible=true)
                const defaults = registry.map((r, idx) => ({
                    key: r.key,
                    label: r.label,
                    visible: true,
                    order: idx + 1,
                }));
                setColumns(defaults);
                setUserConfig(null);
            }
        } catch (err) {
            const registry = Array.isArray(initialColumns) ? initialColumns : [];
            const defaults = registry.map((r, idx) => ({
                key: r.key,
                label: r.label,
                visible: true,
                order: idx + 1,
            }));
            setColumns(defaults);
            setUserConfig(null);
        } finally {
            setLoading(false);
        }
    }

    // toggle visible
    const toggleVisible = (key) => {
        setColumns((cols) => {
            const idx = cols.findIndex((c) => c.key === key);
            if (idx === -1) return cols;
            const visibleCount = cols.filter((c) => c.visible).length;
            if (cols[idx].visible && visibleCount <= 1) return cols;
            return cols.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c));
        });
    };

    // dnd-kit drag handlers
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = columns.findIndex((c) => c.key === active.id);
        const newIndex = columns.findIndex((c) => c.key === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const next = arrayMove(columns, oldIndex, newIndex).map((c, i) => ({ ...c, order: i + 1 }));
        setColumns(next);
    };

    // Save config
    async function onSave() {
        // validate at least one visible
        if (!columns.some((c) => c.visible)) {
            alert('Please select at least one visible column');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                table_key: tableKey,
                config: columns.map((c) => ({ key: c.key, visible: !!c.visible, order: Number(c.order) })),
            };
            const res = await api.post('/table-configs', payload);
            setUserConfig(res.data.config.config || payload.config);
            setOpen(false);
            if (onSaved) onSaved(res.data.config);
        } catch (err) {
            console.error('Failed to save config', err);
            alert('Failed to save configuration');
        } finally {
            setSaving(false);
        }
    }

    // reset to defaults from registry
    function onReset() {
        setColumns((cols) => cols.map((c, i) => ({ ...c, visible: true, order: i + 1 })));
    }

    return (
        <div>
            <Dialog open={open} onOpenChange={setOpen}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Configure Columns">
                                <FiSettings className='text-primary' />
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>configer columns</TooltipContent>
                </Tooltip>

                <DialogContent className="w-[640px] max-w-full">
                    <DialogHeader>
                        <DialogTitle>Configure table columns</DialogTitle>
                    </DialogHeader>

                    <div className="mt-4">
                        {loading ? (
                            <div>Loading...</div>
                        ) : (
                            <>
                                <div className="mb-3 text-sm text-slate-600">Drag to reorder. Toggle to show/hide columns.</div>
                                <ScrollArea className="h-80">

                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext items={columns.map((c) => c.key)} strategy={verticalListSortingStrategy}>
                                            <div>
                                                {columns.filter((col) => col.key !== "user_id").map((col) => (
                                                    <SortableItem key={col.key} id={col.key} item={col} onToggle={toggleVisible} />
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>

                                </ScrollArea>
                            </>
                        )}
                    </div>

                    <DialogFooter className="flex justify-between">
                        <div className="flex items-center gap-2">
                            <Button className='cursor-pointer' variant="ghost" onClick={onReset}>Reset to defaults</Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button className='cursor-pointer' variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button className='cursor-pointer' onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
