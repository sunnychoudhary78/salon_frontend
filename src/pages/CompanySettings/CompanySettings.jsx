import React, { useEffect, useRef, useState } from 'react'
import api from '@/api/axios'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import RequirePermission from '@/components/common/RequirePermission'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

export default function CompanySettingsPage({ isCompanyActive = true }) {
  const { companyId } = useParams()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('general')

  const [showGmailPassword, setShowGmailPassword] = useState(false)
  const [showCompanyPassword, setShowCompanyPassword] = useState(false)

  const [settings, setSettings] = useState({
    calendar_year_start: '',
    calendar_year_end: '',
    default_probation_days: 90,
    default_notice_period_days: 30,
    timezone: 'UTC',
    notes: '',
    designations: [],
    gmail_config: { enabled: false, email: '', smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: '' },
    company_email_config: { enabled: false, email: '', smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: '' },
  })

  const [newDesignation, setNewDesignation] = useState('')
  const [desigAddOpen, setDesigAddOpen] = useState(false)
  const [desigAddName, setDesigAddName] = useState('')
  const [desigAddError, setDesigAddError] = useState('')
  const desigAddInputRef = useRef(null)
  const [desigEditingId, setDesigEditingId] = useState('')
  const [desigEditName, setDesigEditName] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/company-settings', { params: { companyId } })
      const s = res.data || {}
      setSettings({
        calendar_year_start: s.calendar_year_start || '',
        calendar_year_end: s.calendar_year_end || '',
        default_probation_days: s.default_probation_days ?? 90,
        default_notice_period_days: s.default_notice_period_days ?? 30,
        timezone: s.timezone || 'UTC',
        notes: s.notes || '',
        designations: Array.isArray(s.designations) ? s.designations : [],
        gmail_config: {
          enabled: !!s.gmail_config?.enabled,
          email: s.gmail_config?.email || '',
          smtp_host: s.gmail_config?.smtp_host || '',
          smtp_port: s.gmail_config?.smtp_port ? String(s.gmail_config.smtp_port) : '',
          smtp_user: s.gmail_config?.smtp_user || '',
          smtp_pass: s.gmail_config?.smtp_pass || '',
        },
        company_email_config: {
          enabled: !!s.company_email_config?.enabled,
          email: s.company_email_config?.email || '',
          smtp_host: s.company_email_config?.smtp_host || '',
          smtp_port: s.company_email_config?.smtp_port ? String(s.company_email_config.smtp_port) : '',
          smtp_user: s.company_email_config?.smtp_user || '',
          smtp_pass: s.company_email_config?.smtp_pass || '',
        },
      })
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [companyId])

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const payload = {
        calendar_year_start: settings.calendar_year_start || null,
        calendar_year_end: settings.calendar_year_end || null,
        default_probation_days: Number(settings.default_probation_days) || 0,
        default_notice_period_days: Number(settings.default_notice_period_days) || 0,
        timezone: settings.timezone || null,
        notes: settings.notes || null,
        gmail_config: {
          enabled: !!settings.gmail_config?.enabled,
          email: settings.gmail_config?.email || null,
          smtp_host: settings.gmail_config?.smtp_host || null,
          smtp_port: settings.gmail_config?.smtp_port ? Number(settings.gmail_config.smtp_port) : null,
          smtp_user: settings.gmail_config?.smtp_user || null,
          smtp_pass: settings.gmail_config?.smtp_pass || null,
        },
        company_email_config: {
          enabled: !!settings.company_email_config?.enabled,
          email: settings.company_email_config?.email || null,
          smtp_host: settings.company_email_config?.smtp_host || null,
          smtp_port: settings.company_email_config?.smtp_port ? Number(settings.company_email_config.smtp_port) : null,
          smtp_user: settings.company_email_config?.smtp_user || null,
          smtp_pass: settings.company_email_config?.smtp_pass || null,
        },
      }

      await api.patch('/company-settings', payload, { params: { companyId } })
      await load()
      toast.success('Settings saved successfully')
    } catch (e) {
      const msg = e?.response?.data?.message || 'Save failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }


  return (
    <section className="p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {!isCompanyActive && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-4 text-sm">
              Company is inactive. Settings cannot be changed.
            </div>
          )}
          <div className="rounded bg-gray-50 border overflow-hidden mb-4">
            {[
              { key: 'general', label: 'General' },
              { key: 'calendar', label: 'Calendar' },
              { key: 'email', label: 'Email' },
              { key: 'designations', label: 'Designations' },
            ].map(t => (
              <button key={t.key} className={`px-4 py-1.5 cursor-pointer ${tab === t.key ? 'bg-white font-medium' : 'text-gray-600'}`} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Timezone</Label>
                <Input value={settings.timezone} onChange={e => setSettings(s => ({ ...s, timezone: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-2 block">Notes</Label>
                <Input value={settings.notes || ''} onChange={e => setSettings(s => ({ ...s, notes: e.target.value }))} placeholder="Optional" />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <Button onClick={save} disabled={saving || loading || !isCompanyActive}>{saving ? 'Saving…' : 'Save Settings'}</Button>
                {error ? <span className="text-red-600 text-sm">{error}</span> : null}
              </div>
            </div>
          )}



          {tab === 'email' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 w-full ">
                <Card className='flex-1'>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle>Gmail</CardTitle>
                    <label className="flex items-center gap-2">
                      <Checkbox checked={!!settings.gmail_config.enabled} onCheckedChange={(v) => setSettings(s => ({ ...s, gmail_config: { ...s.gmail_config, enabled: !!v } }))} />
                      <span className="text-sm">Enable</span>
                    </label>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label className="mb-2 block">Gmail Email</Label>
                        <Input value={settings.gmail_config.email} onChange={e => setSettings(s => ({ ...s, gmail_config: { ...s.gmail_config, email: e.target.value } }))} />
                      </div>
                      <div>
                        <Label className="mb-2 block">Gmail SMTP Host</Label>
                        <Input value={settings.gmail_config.smtp_host} onChange={e => setSettings(s => ({ ...s, gmail_config: { ...s.gmail_config, smtp_host: e.target.value } }))} />
                      </div>
                      <div>
                        <Label className="mb-2 block">Gmail SMTP Port</Label>
                        <Input inputMode="numeric" value={String(settings.gmail_config.smtp_port || '')} onChange={e => {
                          const v = (e.target.value || '').replace(/\D/g, '')
                          setSettings(s => ({ ...s, gmail_config: { ...s.gmail_config, smtp_port: v } }))
                        }} />
                      </div>
                      <div>
                        <Label className="mb-2 block">Gmail Username</Label>
                        <Input value={settings.gmail_config.smtp_user} onChange={e => setSettings(s => ({ ...s, gmail_config: { ...s.gmail_config, smtp_user: e.target.value } }))} />
                      </div>
                      <div>
                        <Label className="mb-2 block">Gmail App Password</Label>

                        <div className="relative">
                          <Input
                            type={showGmailPassword ? 'text' : 'password'}
                            value={settings.gmail_config.smtp_pass}
                            onChange={e =>
                              setSettings(s => ({
                                ...s,
                                gmail_config: { ...s.gmail_config, smtp_pass: e.target.value }
                              }))
                            }
                            className="pr-10"
                          />

                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowGmailPassword(v => !v)}
                          >
                            {showGmailPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className='flex-1'>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle>Company Email</CardTitle>
                    <label className="flex items-center gap-2">
                      <Checkbox checked={!!settings.company_email_config.enabled} onCheckedChange={(v) => setSettings(s => ({ ...s, company_email_config: { ...s.company_email_config, enabled: !!v } }))} />
                      <span className="text-sm">Enable</span>
                    </label>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label className="mb-2 block">Company Email</Label>
                        <Input value={settings.company_email_config.email} onChange={e => setSettings(s => ({ ...s, company_email_config: { ...s.company_email_config, email: e.target.value } }))} />
                      </div>
                      <div>
                        <Label className="mb-2 block">Company SMTP Host</Label>
                        <Input value={settings.company_email_config.smtp_host} onChange={e => setSettings(s => ({ ...s, company_email_config: { ...s.company_email_config, smtp_host: e.target.value } }))} />
                      </div>
                      <div>
                        <Label className="mb-2 block">Company SMTP Port</Label>
                        <Input inputMode="numeric" value={String(settings.company_email_config.smtp_port || '')} onChange={e => {
                          const v = (e.target.value || '').replace(/\D/g, '')
                          setSettings(s => ({ ...s, company_email_config: { ...s.company_email_config, smtp_port: v } }))
                        }} />
                      </div>
                      <div>
                        <Label className="mb-2 block">Company SMTP Username</Label>
                        <Input value={settings.company_email_config.smtp_user} onChange={e => setSettings(s => ({ ...s, company_email_config: { ...s.company_email_config, smtp_user: e.target.value } }))} />
                      </div>
                      <div>
                        <Label className="mb-2 block">Company SMTP Password</Label>

                        <div className="relative">
                          <Input
                            type={showCompanyPassword ? 'text' : 'password'}
                            value={settings.company_email_config.smtp_pass}
                            onChange={e =>
                              setSettings(s => ({
                                ...s,
                                company_email_config: {
                                  ...s.company_email_config,
                                  smtp_pass: e.target.value
                                }
                              }))
                            }
                            className="pr-10"
                          />

                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowCompanyPassword(v => !v)}
                          >
                            {showCompanyPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={save} disabled={saving || loading || !isCompanyActive}>{saving ? 'Saving…' : 'Save Settings'}</Button>
                {error ? <span className="text-red-600 text-sm">{error}</span> : null}
              </div>
            </div>
          )}

          {tab === 'allocations' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {leaveTypes.map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <Label className="min-w-[180px]">{t.name} {!t.is_active && <span className="text-red-500 text-xs">(Inactive)</span>}</Label>
                    <Input
                      inputMode="decimal"
                      value={String(allocByType[t.id] ?? '')}
                      placeholder="0"
                      onChange={(e) => {
                        const v = e.target.value
                        const cleaned = v.replace(/[^\d.]/g, '')
                        setAllocByType((m) => ({ ...m, [t.id]: cleaned }))
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={save} disabled={saving || loading || !isCompanyActive}>{saving ? 'Saving…' : 'Save Allocations'}</Button>
                {error ? <span className="text-red-600 text-sm">{error}</span> : null}
              </div>
            </div>
          )}

          {tab === 'probation' && (
            <div className="space-y-4">
              <h2 className='text-xs text-orange-400'>These are monthly allocations</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {leaveTypes.map((t) => (
                  <div key={t.id} className="flex items-center gap-3">
                    <Label className="min-w-[180px]">{t.name} {!t.is_active && <span className="text-red-500 text-xs">(Inactive)</span>}</Label>
                    <Input
                      inputMode="decimal"
                      value={String(probationAllocByType[t.id] ?? '')}
                      placeholder="0"
                      onChange={(e) => {
                        const v = e.target.value
                        const cleaned = v.replace(/[^\d.]/g, '')
                        setProbationAllocByType((m) => ({ ...m, [t.id]: cleaned }))
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={save} disabled={saving || loading || !isCompanyActive}>{saving ? 'Saving…' : 'Save Allocations'}</Button>
                {error ? <span className="text-red-600 text-sm">{error}</span> : null}
              </div>
            </div>
          )}

          {tab === 'designations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Manage designation list.</div>
                <Dialog open={desigAddOpen} onOpenChange={setDesigAddOpen}>
                  <RequirePermission permission="variables.create">
                    <DialogTrigger asChild>
                      <Button disabled={!isCompanyActive}>Add Designation</Button>
                    </DialogTrigger>
                  </RequirePermission>
                  <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Add Designation</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label className="block text-sm mb-1">Name <span className="text-red-500">*</span></Label>
                        <Input ref={desigAddInputRef} value={desigAddName} onChange={e => { const v = (e.target.value || '').replace(/[^A-Za-z0-9\s\-\/\&\(\)\.\,\_]/g, ''); setDesigAddName(v); if (desigAddError) setDesigAddError('') }} placeholder="Designation name" maxLength={100} />
                        {desigAddError ? <p className="text-red-500 text-sm mt-1">{desigAddError}</p> : null}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setDesigAddOpen(false)}>Cancel</Button>
                        <RequirePermission permission="variables.create"><Button onClick={async () => {
                          const raw = String(desigAddName || '')
                          const sanitized = raw.replace(/[^A-Za-z0-9\s\-\/\&\(\)\.\,\_]/g, '').trim()
                          if (sanitized !== raw.trim()) setDesigAddName(sanitized)
                          if (!sanitized) { setDesigAddError('Input is required'); desigAddInputRef.current && desigAddInputRef.current.focus(); return }
                          if (sanitized.length < 2 || sanitized.length > 100) { toast.error('Name must be 2–100 characters (letters, numbers, spaces, - / & ( ) . , _)'); return }
                          try {
                            const res = await api.post('/company-settings/designations', { name: sanitized }, { params: { companyId } })
                            setSettings(s => ({ ...s, designations: [...(s.designations || []), res.data] }))
                            setDesigAddName(''); setDesigAddError(''); setDesigAddOpen(false)
                            toast.success('Designation added')
                          } catch (e) { toast.error(e?.response?.data?.message || 'Failed to add designation') }
                        }} disabled={loading || !isCompanyActive}>Add</Button></RequirePermission>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(settings.designations || []).map(it => (
                    <TableRow key={it.id}>
                      <TableCell>
                        {desigEditingId === it.id ? (
                          <Input value={desigEditName} onChange={e => { const v = (e.target.value || '').replace(/[^A-Za-z0-9\s\-\/\&\(\)\.\,\_]/g, ''); setDesigEditName(v) }} maxLength={100} />
                        ) : (
                          <span>{it.name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {desigEditingId === it.id ? (
                          <div className="flex gap-2">
                            <RequirePermission permission="variables.update"><Button disabled={!isCompanyActive} onClick={async () => {
                              if (!desigEditingId) return
                              const raw = String(desigEditName || '')
                              const sanitized = raw.replace(/[^A-Za-z0-9\s\-\/\&\(\)\.\,\_]/g, '').trim()
                              if (sanitized !== raw.trim()) setDesigEditName(sanitized)
                              if (!sanitized || sanitized.length < 2 || sanitized.length > 100) { toast.error('Name must be 2–100 characters (letters, numbers, spaces, - / & ( ) . , _)'); return }
                              try {
                                const res = await api.patch(`/company-settings/designations/${desigEditingId}`, { name: sanitized }, { params: { companyId } })
                                setSettings(s => ({ ...s, designations: (s.designations || []).map(d => d.id === desigEditingId ? res.data : d) }))
                                setDesigEditingId(''); setDesigEditName('')
                                toast.success('Designation updated')
                              } catch (e) { toast.error(e?.response?.data?.message || 'Failed to update designation') }
                            }}>Save</Button></RequirePermission>
                            <Button variant="secondary" onClick={() => setDesigEditingId('')}>Cancel</Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <RequirePermission permission="variables.update"><Button variant="secondary" disabled={!isCompanyActive} onClick={() => { setDesigEditingId(it.id); setDesigEditName(it.name || '') }}>Edit</Button></RequirePermission>
                            <RequirePermission permission="variables.delete"><Button variant="destructive" disabled={!isCompanyActive} onClick={async () => {
                              try {
                                await api.delete(`/company-settings/designations/${it.id}`, { params: { companyId } })
                                setSettings(s => ({ ...s, designations: (s.designations || []).filter(d => d.id !== it.id) }))
                                toast.success('Designation deleted')
                              } catch (e) { toast.error(e?.response?.data?.message || 'Failed to delete') }
                            }}>Delete</Button></RequirePermission>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

        </CardContent>
      </Card>





    </section>
  )
}
