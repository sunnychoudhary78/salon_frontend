// src/components/ChangePasswordDialog.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import api from '@/api/axios';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from "lucide-react";


/**
 * Props:
 * - open (bool)
 * - onOpenChange (fn) // receives new open state
 * - onSuccess (fn) optional callback when password changed
 */
export default function ChangePasswordDialog({ open, onOpenChange, onSuccess }) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        }
    });

    const [submitting, setSubmitting] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const close = () => {
        reset();
        onOpenChange?.(false);
    };

    const onSubmit = async (values) => {
        const { currentPassword, newPassword, confirmPassword } = values;

        // client-side validation (react-hook-form already validates but double-check)
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Please fill all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('New password and confirmation do not match');
            return;
        }
        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            toast.error('New password must be at least 8 characters long');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/auth/change-password', {
                currentPassword,
                newPassword,
                confirmPassword
            });
            if (res && (res.status === 200 || res.status === 204 || (res.data && res.data.message))) {
                toast.success(res.data?.message || 'Password changed successfully');
                onSuccess && onSuccess();
                close();
            } else {
                toast.success('Password changed');
                onSuccess && onSuccess();
                close();
            }
        } catch (err) {
            console.error('change-password error', err);
            const msg = err?.response?.data?.message || err.message || 'Failed to change password';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={Boolean(open)} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Label>Current password</Label>
                        <div className="relative mt-1">
                            <Input
                                type={showCurrent ? 'text' : 'password'}
                                {...register('currentPassword', { required: 'Current password is required' })}
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(v => !v)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm"
                                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                            >
                                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.currentPassword && <div className="text-xs text-red-600 mt-1">{errors.currentPassword.message}</div>}
                    </div>

                    <div>
                        <Label>New password</Label>
                        <div className="relative mt-1">
                            <Input
                                type={showNew ? 'text' : 'password'}
                                {...register('newPassword', {
                                    required: 'New password is required',
                                    minLength: { value: 8, message: 'Password must be at least 8 characters' }
                                })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(v => !v)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm"
                                aria-label={showNew ? 'Hide new password' : 'Show new password'}
                            >
                                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.newPassword && <div className="text-xs text-red-600 mt-1">{errors.newPassword.message}</div>}
                        <div className="text-xs text-gray-500 mt-1">Use at least 8 characters. Consider using mixed case, numbers & symbols.</div>
                    </div>

                    <div>
                        <Label>Confirm new password</Label>
                        <div className="relative mt-1">
                            <Input
                                type={showConfirm ? 'text' : 'password'}
                                {...register('confirmPassword', { required: 'Please confirm the new password' })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(v => !v)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm"
                                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                            >
                                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.confirmPassword && <div className="text-xs text-red-600 mt-1">{errors.confirmPassword.message}</div>}
                    </div>

                    <DialogFooter className="flex items-center justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={close} disabled={submitting}>Cancel</Button>
                        <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Change password'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
