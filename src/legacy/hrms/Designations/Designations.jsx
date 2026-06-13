import React, { useEffect, useState } from 'react'
import api from '@/api/axios'
import { toast } from 'react-hot-toast'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import RequirePermission from '@/components/common/RequirePermission'

export default function Designations() {
  const [tab, setTab] = useState('blood')
  const [loading, setLoading] = useState(false)
  // Blood Groups
  const [bloodGroups, setBloodGroups] = useState([])
  const [bgAddOpen, setBgAddOpen] = useState(false)
  const [bgName, setBgName] = useState('')
  const [bgEditId, setBgEditId] = useState('')
  const [bgEditName, setBgEditName] = useState('')
  // Marital Statuses
  const [maritals, setMaritals] = useState([])
  const [msAddOpen, setMsAddOpen] = useState(false)
  const [msName, setMsName] = useState('')
  const [msEditId, setMsEditId] = useState('')
  const [msEditName, setMsEditName] = useState('')
  // Genders
  const [genders, setGenders] = useState([])
  const [gAddOpen, setGAddOpen] = useState(false)
  const [gName, setGName] = useState('')
  const [gEditId, setGEditId] = useState('')
  const [gEditName, setGEditName] = useState('')

  const [bgError, setBgError] = useState(null)
  const [msError, setMsError] = useState(null)
  const [gError, setGError] = useState(null)

  const loadBloodGroups = async () => {
    try {
      const res = await api.get('/variables/blood-groups')
      setBloodGroups(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load blood groups')
      setBloodGroups([])
    }
  }
  const loadMaritals = async () => {
    try {
      const res = await api.get('/variables/marital-statuses')
      setMaritals(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load marital statuses')
      setMaritals([])
    }
  }
  const loadGenders = async () => {
    try {
      const res = await api.get('/variables/genders')
      setGenders(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load genders')
      setGenders([])
    }
  }

  useEffect(() => { loadBloodGroups(); loadMaritals(); loadGenders(); }, [])

  const addBloodGroup = async () => {
    const sanitized = String(bgName || '').replace(/[^A-Za-z\s+\-]/g, '').trim()
    if (sanitized !== String(bgName || '').trim()) setBgName(sanitized)
    if (!sanitized || sanitized.length < 2 || sanitized.length > 100) { setBgError('Name must be letters and +/- , 2–100 characters'); return }
    try {
      const res = await api.post('/variables/blood-groups', { name: sanitized })
      setBloodGroups(prev => [...prev, res.data])
      setBgName('')
      setBgAddOpen(false)
      toast.success('Blood group added')
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to add') }
  }
  const saveBloodGroup = async () => {
    if (!bgEditId) return
    const sanitized = String(bgEditName || '').replace(/[^A-Za-z\s+\-]/g, '').trim()
    if (sanitized !== String(bgEditName || '').trim()) setBgEditName(sanitized)
    if (!sanitized || sanitized.length < 2 || sanitized.length > 100) { toast.error('Name must be letters and +/- , 2–100 characters'); return }
    try {
      const res = await api.patch(`/variables/blood-groups/${bgEditId}`, { name: sanitized })
      setBloodGroups(prev => prev.map(p => p.id === bgEditId ? res.data : p))
      setBgEditId(''); setBgEditName('')
      toast.success('Blood group updated')
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to update') }
  }
  const removeBloodGroup = async (id) => {
    await api.delete(`/variables/blood-groups/${id}`)
    setBloodGroups(prev => prev.filter(p => p.id !== id))
  }

  const addMarital = async () => {
    const sanitized = String(msName || '').replace(/[^A-Za-z\s]/g, '').trim()
    if (!sanitized || sanitized.length < 2 || sanitized.length > 100) { setMsError('Name must be letters/spaces, 2–100 characters'); return }
    try {
      const res = await api.post('/variables/marital-statuses', { name: sanitized })
      setMaritals(prev => [...prev, res.data])
      setMsName(''); setMsAddOpen(false)
      toast.success('Marital status added')
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to add') }
  }
  const saveMarital = async () => {
    if (!msEditId) return
    const sanitized = String(msEditName || '').replace(/[^A-Za-z\s]/g, '').trim()
    if (!sanitized || sanitized.length < 2 || sanitized.length > 100) { toast.error('Name must be letters/spaces, 2–100 characters'); return }
    try {
      const res = await api.patch(`/variables/marital-statuses/${msEditId}`, { name: sanitized })
      setMaritals(prev => prev.map(p => p.id === msEditId ? res.data : p))
      setMsEditId(''); setMsEditName('')
      toast.success('Marital status updated')
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to update') }
  }
  const removeMarital = async (id) => {
    await api.delete(`/variables/marital-statuses/${id}`)
    setMaritals(prev => prev.filter(p => p.id !== id))
  }

  const addGender = async () => {
    const sanitized = String(gName || '').replace(/[^A-Za-z\s]/g, '').trim()
    if (!sanitized || sanitized.length < 2 || sanitized.length > 100) { setGError('Name must be letters/spaces, 2–100 characters'); return }
    try {
      const res = await api.post('/variables/genders', { name: sanitized })
      setGenders(prev => [...prev, res.data])
      setGName(''); setGAddOpen(false)
      toast.success('Gender added')
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to add') }
  }
  const saveGender = async () => {
    if (!gEditId) return
    const sanitized = String(gEditName || '').replace(/[^A-Za-z\s]/g, '').trim()
    if (!sanitized || sanitized.length < 2 || sanitized.length > 100) { toast.error('Name must be letters/spaces, 2–100 characters'); return }
    try {
      const res = await api.patch(`/variables/genders/${gEditId}`, { name: sanitized })
      setGenders(prev => prev.map(p => p.id === gEditId ? res.data : p))
      setGEditId(''); setGEditName('')
      toast.success('Gender updated')
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to update') }
  }
  const removeGender = async (id) => {
    await api.delete(`/variables/genders/${id}`)
    setGenders(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant={tab === 'blood' ? 'default' : 'outline'} onClick={() => setTab('blood')}>Blood Groups</Button>
        <Button variant={tab === 'marital' ? 'default' : 'outline'} onClick={() => setTab('marital')}>Marital Statuses</Button>
        <Button variant={tab === 'gender' ? 'default' : 'outline'} onClick={() => setTab('gender')}>Genders</Button>
      </div>

      {tab === 'blood' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Manage blood groups.</div>
            <Dialog open={bgAddOpen} onOpenChange={(v) => { setBgAddOpen(v); setBgError(null); }}>
              <RequirePermission permission="variables.create">
                <DialogTrigger asChild><Button>Add Blood Group</Button></DialogTrigger>
              </RequirePermission>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Add Blood Group</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">Name</label>
                    <Input
                      value={bgName}
                      onChange={e => {
                        const v = (e.target.value || '').replace(/[^A-Za-z\s+\-]/g, '');
                        setBgName(v);
                        if (bgError) setBgError(null);
                      }}
                      placeholder="e.g., O+"
                      maxLength={100}
                      className={bgError ? "border-red-500" : ""}
                    />
                    {bgError && <p className="text-xs text-red-500 mt-1">{bgError}</p>}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setBgAddOpen(false)}>Cancel</Button>
                    <RequirePermission permission="variables.create"><Button onClick={addBloodGroup}>Add</Button></RequirePermission>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="w-40">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {bloodGroups.map(it => (
                <TableRow key={it.id}><TableCell>
                  {bgEditId === it.id ? (
                    <Input value={bgEditName} onChange={e => { const v = (e.target.value || '').replace(/[^A-Za-z\s+\-]/g, ''); setBgEditName(v) }} maxLength={100} />
                  ) : (<span>{it.name}</span>)}
                </TableCell>
                <TableCell>
                  {bgEditId === it.id ? (
                    <div className="flex gap-2"><RequirePermission permission="variables.update"><Button onClick={saveBloodGroup}>Save</Button></RequirePermission><Button variant="secondary" onClick={() => setBgEditId('')}>Cancel</Button></div>
                  ) : (
                    <div className="flex gap-2"><RequirePermission permission="variables.update"><Button variant="secondary" onClick={() => { setBgEditId(it.id); setBgEditName(it.name || '') }}>Edit</Button></RequirePermission><RequirePermission permission="variables.delete"><Button variant="destructive" onClick={() => removeBloodGroup(it.id)}>Delete</Button></RequirePermission></div>
                  )}
                </TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {tab === 'marital' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Manage marital statuses.</div>
            <Dialog open={msAddOpen} onOpenChange={(v) => { setMsAddOpen(v); setMsError(null); }}>
              <RequirePermission permission="variables.create">
                <DialogTrigger asChild><Button>Add Marital Status</Button></DialogTrigger>
              </RequirePermission>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Add Marital Status</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">Name</label>
                    <Input
                      value={msName}
                      onChange={e => {
                        const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, '');
                        setMsName(v);
                        if (msError) setMsError(null);
                      }}
                      placeholder="e.g., Single"
                      maxLength={100}
                      className={msError ? "border-red-500" : ""}
                    />
                    {msError && <p className="text-xs text-red-500 mt-1">{msError}</p>}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setMsAddOpen(false)}>Cancel</Button>
                    <RequirePermission permission="variables.create"><Button onClick={addMarital}>Add</Button></RequirePermission>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="w-40">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {maritals.map(it => (
                <TableRow key={it.id}><TableCell>
                  {msEditId === it.id ? (
                    <Input value={msEditName} onChange={e => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setMsEditName(v) }} maxLength={100} />
                  ) : (<span>{it.name}</span>)}
                </TableCell>
                <TableCell>
                  {msEditId === it.id ? (
                    <div className="flex gap-2"><RequirePermission permission="variables.update"><Button onClick={saveMarital}>Save</Button></RequirePermission><Button variant="secondary" onClick={() => setMsEditId('')}>Cancel</Button></div>
                  ) : (
                    <div className="flex gap-2"><RequirePermission permission="variables.update"><Button variant="secondary" onClick={() => { setMsEditId(it.id); setMsEditName(it.name || '') }}>Edit</Button></RequirePermission><RequirePermission permission="variables.delete"><Button variant="destructive" onClick={() => removeMarital(it.id)}>Delete</Button></RequirePermission></div>
                  )}
                </TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {tab === 'gender' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Manage genders.</div>
            <Dialog open={gAddOpen} onOpenChange={(v) => { setGAddOpen(v); setGError(null); }}>
              <RequirePermission permission="variables.create">
                <DialogTrigger asChild><Button>Add Gender</Button></DialogTrigger>
              </RequirePermission>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Add Gender</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">Name</label>
                    <Input
                      value={gName}
                      onChange={e => {
                        const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, '');
                        setGName(v);
                        if (gError) setGError(null);
                      }}
                      placeholder="e.g., Male"
                      maxLength={100}
                      className={gError ? "border-red-500" : ""}
                    />
                    {gError && <p className="text-xs text-red-500 mt-1">{gError}</p>}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setGAddOpen(false)}>Cancel</Button>
                    <RequirePermission permission="variables.create"><Button onClick={addGender}>Add</Button></RequirePermission>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="w-40">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {genders.map(it => (
                <TableRow key={it.id}><TableCell>
                  {gEditId === it.id ? (
                    <Input value={gEditName} onChange={e => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setGEditName(v) }} maxLength={100} />
                  ) : (<span>{it.name}</span>)}
                </TableCell>
                <TableCell>
                  {gEditId === it.id ? (
                    <div className="flex gap-2"><RequirePermission permission="variables.update"><Button onClick={saveGender}>Save</Button></RequirePermission><Button variant="secondary" onClick={() => setGEditId('')}>Cancel</Button></div>
                  ) : (
                    <div className="flex gap-2"><RequirePermission permission="variables.update"><Button variant="secondary" onClick={() => { setGEditId(it.id); setGEditName(it.name || '') }}>Edit</Button></RequirePermission><RequirePermission permission="variables.delete"><Button variant="destructive" onClick={() => removeGender(it.id)}>Delete</Button></RequirePermission></div>
                  )}
                </TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

