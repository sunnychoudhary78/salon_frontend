import React, { useEffect, useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import api from '@/api/axios'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { FiTrash2 } from 'react-icons/fi'

export default function MyDetails() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sameAsPresent, setSameAsPresent] = useState(false)
  const [canEdit, setCanEdit] = useState(true)
  const [bloodGroups, setBloodGroups] = useState([])
  const [maritalStatuses, setMaritalStatuses] = useState([])
  const [genders, setGenders] = useState([])
  const [step, setStep] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [myUserId, setMyUserId] = useState('')

  const { register, control, handleSubmit, reset, setValue, getValues } = useForm({
    defaultValues: {
      user: { id: '', name: '', email: '' },
      dob: '',
      gender: '',
      blood_group: '',
      marital_status: '',
      date_of_marriage: '',
      nominee_name: '',
      nominee_dob: '',
      nominee_relation: '',
      father_name: '',
      father_dob: '',
      mother_name: '',
      mother_dob: '',
      spouse_name: '',
      spouse_dob: '',
      contact_secondary: '',
      bank_name: '',
      ifsc_code: '',
      account_number: '',
      aadhar_number: '',
      pan_number: '',
      esi_no: '',
      uan_no: '',
      educations: [],
      experiences: [],
      addresses: [],
    }
  })

  const { fields: educationFields, append: appendEducation, remove: removeEducation } = useFieldArray({ control, name: 'educations' })
  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({ control, name: 'experiences' })
  const { fields: addressFields, append: appendAddress, update: updateAddress } = useFieldArray({ control, name: 'addresses' })

  const handleBlurSave = () => null

  useEffect(() => {
    const boot = async () => {
      setLoading(true)
      setError(null)
      try {
        const [bgRes, msRes, gRes] = await Promise.all([
          api.get('/variables/blood-groups').catch(() => ({ data: [] })),
          api.get('/variables/marital-statuses').catch(() => ({ data: [] })),
          api.get('/variables/genders').catch(() => ({ data: [] })),
        ])
        const toNames = (arr) => (Array.isArray(arr) ? arr.map(x => (typeof x === 'string' ? x : (x && x.name) || '')).filter(Boolean) : [])
        setBloodGroups(toNames(Array.isArray(bgRes.data) ? bgRes.data : []))
        setMaritalStatuses(toNames(Array.isArray(msRes.data) ? msRes.data : []))
        setGenders(toNames(Array.isArray(gRes.data) ? gRes.data : []))
        const meRes = await api.get('/auth/me')
        const me = meRes.data?.user || meRes.data
        setMyUserId(String(me?.id || ''))
        const empRes = await api.get(`/employees/by-user/${me?.id}`)
        const { employee: emp } = empRes?.data?.data || {}
        setCanEdit(!!emp?.employee_edit_enabled)
        

        const present = Array.isArray(emp?.addresses) ? emp.addresses.find(a => (a.address_type || a.type) === 'current' || (a.address_type || a.type) === 'present') : null
        const permanent = Array.isArray(emp?.addresses) ? emp.addresses.find(a => (a.address_type || a.type) === 'permanent') : null

        reset({
          user: { id: me?.id || '', name: me?.name || '', email: me?.email || '' },
          dob: emp.dob || '',
          gender: emp.gender || '',
          blood_group: emp.blood_group || '',
          marital_status: emp.marital_status || '',
          date_of_marriage: emp.date_of_marriage || '',
          nominee_name: emp.nominee_name || '',
          nominee_dob: emp.nominee_dob || '',
          nominee_relation: emp.nominee_relation || '',
          father_name: emp.father_name || '',
          father_dob: emp.father_dob || '',
          mother_name: emp.mother_name || '',
          mother_dob: emp.mother_dob || '',
          spouse_name: emp.spouse_name || '',
          spouse_dob: emp.spouse_dob || '',
          contact_secondary: emp.contact_secondary || '',
          bank_name: emp.bank_name || '',
          ifsc_code: emp.ifsc_code || '',
          account_number: emp.account_number_encrypted || '',
          aadhar_number: emp.aadhar_number_encrypted || '',
          pan_number: emp.pan_number_encrypted || '',
          esi_no: emp.esi_no || '',
          uan_no: emp.uan_no || '',
          educations: Array.isArray(emp.educations) ? emp.educations.map(e => ({
            id: e.id || null,
            level: e.level || '',
            institution: e.institution || e.institution_name || '',
            board_or_university: e.board_or_university || e.board_university || '',
            from_year: e.from_year || '',
            to_year: e.to_year || '',
            passing_year: e.passing_year || '',
            percentage: typeof e.percentage !== 'undefined' && e.percentage !== null ? String(e.percentage) : '',
            notes: e.notes || '',
          })) : [],
          experiences: Array.isArray(emp.experiences) ? emp.experiences.map(x => ({
            id: x.id || null,
            company_name: x.company_name || '',
            from_date: x.from_date || '',
            to_date: x.to_date || '',
            designation: x.designation || '',
            responsibilities: x.responsibilities || '',
            is_current: !!x.is_current,
            reason_for_leaving: x.reason_for_leaving || '',
            last_drawn_ctc: typeof x.last_drawn_ctc !== 'undefined' && x.last_drawn_ctc !== null ? String(x.last_drawn_ctc) : '',
          })) : [],
          addresses: [
            present ? {
              id: present.id || null,
              address_type: 'current',
              type: 'current',
              address_1: present.address_1 || '',
              address_2: present.address_2 || '',
              landmark: present.landmark || '',
              city: present.city || '',
              state: present.state || '',
              district: present.district || '',
              pin_code: present.pin_code || '',
              country: present.country || 'India',
            } : {
              id: null,
              address_type: 'current',
              type: 'current',
              address_1: '',
              address_2: '',
              landmark: '',
              city: '',
              state: '',
              district: '',
              pin_code: '',
              country: 'India',
            },
            permanent ? {
              id: permanent.id || null,
              address_type: 'permanent',
              type: 'permanent',
              address_1: permanent.address_1 || '',
              address_2: permanent.address_2 || '',
              landmark: permanent.landmark || '',
              city: permanent.city || '',
              state: permanent.state || '',
              district: permanent.district || '',
              pin_code: permanent.pin_code || '',
              country: permanent.country || 'India',
            } : {
              id: null,
              address_type: 'permanent',
              type: 'permanent',
              address_1: '',
              address_2: '',
              landmark: '',
              city: '',
              state: '',
              district: '',
              pin_code: '',
              country: '',
            },
          ],
        })
      } catch {
        setError('Failed to load your details')
      } finally {
        setLoading(false)
      }
    }
    boot()
  }, [reset])

  useEffect(() => {
    if (!loading && canEdit === false) {
      navigate('/dashboard')
    }
  }, [canEdit, loading, navigate])

  const onSubmit = async (values) => {
    try {
      setLoading(true)
      setError(null)
      const user = { id: values.user.id, name: values.user.name, email: values.user.email }
      const employee = {
        dob: values.dob || null,
        gender: values.gender || null,
        blood_group: values.blood_group || null,
        marital_status: values.marital_status || null,
        date_of_marriage: values.date_of_marriage || null,
        nominee_name: values.nominee_name || null,
        nominee_dob: values.nominee_dob || null,
        nominee_relation: values.nominee_relation || null,
        father_name: values.father_name || null,
        father_dob: values.father_dob || null,
        mother_name: values.mother_name || null,
        mother_dob: values.mother_dob || null,
        spouse_name: values.spouse_name || null,
        spouse_dob: values.spouse_dob || null,
        contact_secondary: values.contact_secondary || null,
        bank_name: values.bank_name || null,
        ifsc_code: values.ifsc_code || null,
        account_number: values.account_number || null,
        aadhar_number: values.aadhar_number || null,
        pan_number: values.pan_number || null,
        esi_no: values.esi_no || null,
        uan_no: values.uan_no || null,
        educations: (values.educations || []).map(e => ({
          id: e.id || null,
          level: e.level || null,
          board_or_university: e.board_or_university || null,
          institution: e.institution || null,
          from_year: e.from_year || null,
          to_year: e.to_year || null,
          passing_year: e.passing_year || null,
          percentage: e.percentage ? Number(e.percentage) : null,
          notes: e.notes || null,
        })),
        experiences: (values.experiences || []).map(x => {
          const ctcStr = (x.last_drawn_ctc || '').toString().replace(/,/g, '')
          return {
            id: x.id || null,
            company_name: x.company_name || null,
            from_date: x.from_date || null,
            to_date: x.to_date || null,
            designation: x.designation || null,
            responsibilities: x.responsibilities || null,
            is_current: !!x.is_current,
            reason_for_leaving: x.reason_for_leaving || null,
            last_drawn_ctc: ctcStr ? Number(ctcStr) : null,
          }
        }),
      }
      const formAddresses = Array.isArray(values.addresses) ? values.addresses : []
      let present = formAddresses[0] || null
      let permanent = formAddresses[1] || null

      if (sameAsPresent && present) {
        permanent = { ...present }
      }

      const addressesPayload = []
      if (present) {
        addressesPayload.push({
          address_type: 'current',
          address_1: present.address_1 || null,
          address_2: present.address_2 || null,
          landmark: present.landmark || null,
          city: present.city || null,
          state: present.state || null,
          district: present.district || null,
          pin_code: present.pin_code || present.pincode || null,
          country: present.country || 'India',
          id: present.id || undefined,
        })
      }
      if (permanent) {
        const permHasAny = (
          (permanent.address_1 || '').trim() ||
          (permanent.address_2 || '').trim() ||
          (permanent.landmark || '').trim() ||
          (permanent.city || '').trim() ||
          (permanent.state || '').trim() ||
          (permanent.district || '').trim() ||
          (permanent.pin_code || permanent.pincode || '').toString().trim() ||
          (permanent.country || '').trim()
        )
        if (permHasAny) {
          addressesPayload.push({
            address_type: 'permanent',
            address_1: permanent.address_1 || null,
            address_2: permanent.address_2 || null,
            landmark: permanent.landmark || null,
            city: permanent.city || null,
            state: permanent.state || null,
            district: permanent.district || null,
            pin_code: permanent.pin_code || permanent.pincode || null,
            country: permanent.country || 'India',
            id: permanent.id || undefined,
          })
        }
      }

      employee.addresses = addressesPayload
      await api.post('/employees/create-or-update', { user, employee })
      if (myUserId) {
        try { await api.patch(`/employees/me/edit-enabled-off`) } catch (e) { void e }
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="m-6 space-y-6">
      <div className="px-6 py-4 bg-white shadow flex justify-between items-center sticky top-0 z-40">
        <h2>My Details</h2>
        <div className="flex items-center gap-2 bg-white">
          {canEdit ? null : <span className="text-sm text-gray-500">Edit mode disabled</span>}
        </div>
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>
      )}
      {loading && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded">Loading…</div>
      )}

      <Card style={{ display: step === 0 ? 'block' : 'none' }}>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="mb-1">Date of Birth</Label>
              {canEdit ? (
                <Input type="date" {...register('dob')} />
              ) : (
                <div className="text-sm text-gray-800">{getValues('dob') || '—'}</div>
              )}
            </div>
            <div>
              <Label className="mb-1">Gender</Label>
              {canEdit ? (
                <Controller name="gender" control={control} render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="select" /></SelectTrigger>
                    <SelectContent>
                      {genders.map(g => (<SelectItem key={g} value={g}>{g}</SelectItem>))}
                    </SelectContent>
                  </Select>
                )} />
              ) : (
                <div className="text-sm text-gray-800">{getValues('gender') || '—'}</div>
              )}
            </div>
            <div>
              <Label className="mb-1">Blood Group</Label>
              {canEdit ? (
                <Controller name="blood_group" control={control} render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="select" /></SelectTrigger>
                    <SelectContent>
                      {bloodGroups.map(b => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
                    </SelectContent>
                  </Select>
                )} />
              ) : (
                <div className="text-sm text-gray-800">{getValues('blood_group') || '—'}</div>
              )}
            </div>
          </div>
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="mb-1">Email</Label>
              {canEdit ? (
                <Input
                  type="email"
                  {...register('user.email', {
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                    onChange: (e) => {
                      const v = String(e.target.value || '').trim();
                      setValue('user.email', v, { shouldValidate: true, shouldDirty: true });
                    }
                  })}
                />
              ) : (
                <div className="text-sm text-gray-800">{getValues('user.email') || '—'}</div>
              )}
            </div>
          </div> */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="mb-1">Marital Status</Label>
              {canEdit ? (
                <Controller name="marital_status" control={control} render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="select" /></SelectTrigger>
                    <SelectContent>
                      {maritalStatuses.map(m => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                    </SelectContent>
                  </Select>
                )} />
              ) : (
                <div className="text-sm text-gray-800">{getValues('marital_status') || '—'}</div>
              )}
            </div>
            <div>
              <Label className="mb-1">Date of Marriage</Label>
              {canEdit ? <Input type="date" {...register('date_of_marriage')} /> : <div className="text-sm text-gray-800">{getValues('date_of_marriage') || '—'}</div>}
            </div>
            <div>
              <Label className="mb-1">Contact Secondary</Label>
              {canEdit ? (
                <Input
                  inputMode="numeric"
                  maxLength={10}
                  {...register('contact_secondary', {
                    pattern: { value: /^\d{10}$/, message: 'Must be 10 digits' },
                    onChange: (e) => {
                      const v = (e.target.value || '').replace(/[^0-9]/g, '').slice(0, 10);
                      setValue('contact_secondary', v, { shouldValidate: true, shouldDirty: true });
                    }
                  })}
                />
              ) : (
                <div className="text-sm text-gray-800">{getValues('contact_secondary') || '—'}</div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="mb-1">Nominee Name</Label>
              {canEdit ? (
                <Input
                  {...register('nominee_name', {
                    pattern: { value: /^[A-Za-z\s]+$/, message: 'Letters and spaces only' },
                    onChange: (e) => {
                      const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, '');
                      setValue('nominee_name', v, { shouldValidate: true, shouldDirty: true });
                    }
                  })}
                />
              ) : (
                <div className="text-sm text-gray-800">{getValues('nominee_name') || '—'}</div>
              )}
            </div>
            <div>
              <Label className="mb-1">Nominee DOB</Label>
              {canEdit ? <Input type="date" {...register('nominee_dob')} /> : <div className="text-sm text-gray-800">{getValues('nominee_dob') || '—'}</div>}
            </div>
            <div>
              <Label className="mb-1">Nominee Relation</Label>
              {canEdit ? (
                <Input
                  {...register('nominee_relation', {
                    pattern: { value: /^[A-Za-z\s]+$/, message: 'Letters and spaces only' },
                    onChange: (e) => {
                      const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, '');
                      setValue('nominee_relation', v, { shouldValidate: true, shouldDirty: true });
                    }
                  })}
                />
              ) : (
                <div className="text-sm text-gray-800">{getValues('nominee_relation') || '—'}</div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="mb-1">Father's Name</Label>
              {canEdit ? (
                <Input
                  {...register('father_name', {
                    pattern: { value: /^[A-Za-z\s]+$/, message: 'Letters and spaces only' },
                    onChange: (e) => {
                      const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, '');
                      setValue('father_name', v, { shouldValidate: true, shouldDirty: true });
                    }
                  })}
                />
              ) : (
                <div className="text-sm text-gray-800">{getValues('father_name') || '—'}</div>
              )}
            </div>
            <div>
              <Label className="mb-1">Father's DOB</Label>
              {canEdit ? <Input type="date" {...register('father_dob')} /> : <div className="text-sm text-gray-800">{getValues('father_dob') || '—'}</div>}
            </div>
            <div>
              <Label className="mb-1">Mother's Name</Label>
              {canEdit ? (
                <Input
                  {...register('mother_name', {
                    pattern: { value: /^[A-Za-z\s]+$/, message: 'Letters and spaces only' },
                    onChange: (e) => {
                      const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, '');
                      setValue('mother_name', v, { shouldValidate: true, shouldDirty: true });
                    }
                  })}
                />
              ) : (
                <div className="text-sm text-gray-800">{getValues('mother_name') || '—'}</div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="mb-1">Mother's DOB</Label>
              {canEdit ? <Input type="date" {...register('mother_dob')} /> : <div className="text-sm text-gray-800">{getValues('mother_dob') || '—'}</div>}
            </div>
            <div>
              <Label className="mb-1">Spouse Name</Label>
              {canEdit ? (
                <Input
                  {...register('spouse_name', {
                    pattern: { value: /^[A-Za-z\s]+$/, message: 'Letters and spaces only' },
                    onChange: (e) => {
                      const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, '');
                      setValue('spouse_name', v, { shouldValidate: true, shouldDirty: true });
                    }
                  })}
                />
              ) : (
                <div className="text-sm text-gray-800">{getValues('spouse_name') || '—'}</div>
              )}
            </div>
            <div>
              <Label className="mb-1">Spouse DOB</Label>
              {canEdit ? <Input type="date" {...register('spouse_dob')} /> : <div className="text-sm text-gray-800">{getValues('spouse_dob') || '—'}</div>}
            </div>
          </div>
        </CardContent>
      </Card>
      {canEdit && step === 0 && (
        <div className="flex justify-end gap-2">
          <Button onClick={() => setStep(1)}>Next</Button>
        </div>
      )}

      <Card style={{ display: step === 1 ? 'block' : 'none' }}>
        <CardHeader>
          <CardTitle>Bank & Payroll Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="mb-1">Bank Name</Label>
              {canEdit ? (
                <Input
                  {...register('bank_name', {
                    pattern: { value: /^[A-Za-z\s]+$/, message: 'Letters and spaces only' },
                    onChange: (e) => {
                      const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, '');
                      setValue('bank_name', v, { shouldValidate: true, shouldDirty: true });
                    }
                  })}
                />
              ) : (
                <div className="text-sm text-gray-800">{getValues('bank_name') || '—'}</div>
              )}
            </div>
            <div>
              <Label className="mb-1">IFSC Code</Label>
              {canEdit ? (
                <Input
                  {...register('ifsc_code', {
                    pattern: { value: /^[A-Za-z0-9]+$/, message: 'Alphanumeric only' },
                    onChange: (e) => {
                      const v = (e.target.value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                      setValue('ifsc_code', v, { shouldValidate: true, shouldDirty: true });
                    }
                  })}
                />
              ) : (
                <div className="text-sm text-gray-800">{getValues('ifsc_code') || '—'}</div>
              )}
            </div>
            <div>
              <Label className="mb-1">Account Number</Label>
              {canEdit ? (
                <Input
                  inputMode="numeric"
                  maxLength={20}
                  {...register('account_number', {
                    pattern: { value: /^[0-9]+$/, message: 'Digits only' },
                    onChange: (e) => {
                      const v = (e.target.value || '').replace(/[^0-9]/g, '').slice(0, 20);
                      setValue('account_number', v, { shouldValidate: true, shouldDirty: true });
                    }
                  })}
                />
              ) : (
                <div className="text-sm text-gray-800">{getValues('account_number') || '—'}</div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="mb-1">Aadhar Number</Label>
              {canEdit ? (
                <Input
                  inputMode="numeric"
                  maxLength={12}
                  {...register('aadhar_number', {
                    pattern: { value: /^[0-9]+$/, message: 'Digits only' },
                    onChange: (e) => {
                      const v = (e.target.value || '').replace(/[^0-9]/g, '').slice(0, 12);
                      setValue('aadhar_number', v, { shouldValidate: true, shouldDirty: true });
                    }
                  })}
                />
              ) : (
                <div className="text-sm text-gray-800">{getValues('aadhar_number') || '—'}</div>
              )}
            </div>
            <div>
              <Label className="mb-1">PAN Number</Label>
              {canEdit ? (
                <Input
                  maxLength={10}
                  {...register('pan_number', {
                    pattern: { value: /^[A-Za-z0-9]+$/, message: 'Alphanumeric only' },
                    onChange: (e) => {
                      const v = (e.target.value || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
                      setValue('pan_number', v, { shouldValidate: true, shouldDirty: true });
                    }
                  })}
                />
              ) : (
                <div className="text-sm text-gray-800">{getValues('pan_number') || '—'}</div>
              )}
            </div>
            <div>
              <Label className="mb-1">ESIC Number</Label>
              {canEdit ? (
                <Input
                  inputMode="numeric"
                  {...register('esi_no', {
                    pattern: { value: /^[0-9]+$/, message: 'Digits only' },
                    onChange: (e) => {
                      const v = (e.target.value || '').replace(/[^0-9]/g, '');
                      setValue('esi_no', v, { shouldValidate: true, shouldDirty: true });
                    }
                  })}
                />
              ) : (
                <div className="text-sm text-gray-800">{getValues('esi_no') || '—'}</div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-1">UAN Number</Label>
              {canEdit ? (
                <Input
                  inputMode="numeric"
                  {...register('uan_no', {
                    pattern: { value: /^[0-9]+$/, message: 'Digits only' },
                    onChange: (e) => {
                      const v = (e.target.value || '').replace(/[^0-9]/g, '');
                      setValue('uan_no', v, { shouldValidate: true, shouldDirty: true });
                    }
                  })}
                />
              ) : (
                <div className="text-sm text-gray-800">{getValues('uan_no') || '—'}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {canEdit && step === 1 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(0)}>Previous</Button>
          <Button onClick={() => setStep(2)}>Next</Button>
        </div>
      )}

      <Card style={{ display: step === 2 ? 'block' : 'none' }}>
        <CardHeader>
          <CardTitle>Educations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Add schooling / degrees. You can add multiple rows.</div>
            <div>
              {canEdit && (
              <Button
                type="button"
                onClick={() => {
                  appendEducation({
                    id: null,
                    level: '',
                    board_or_university: '',
                    institution: '',
                    from_year: '',
                    to_year: '',
                    passing_year: '',
                    percentage: '',
                    notes: '',
                  });
                }}
              >
                + Add Education
              </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {educationFields.length === 0 && (
              <div className="text-sm text-muted-foreground">No education records yet.</div>
            )}

            <div className="border rounded-md overflow-hidden">
              <div className="hidden xl:grid xl:grid-cols-12 bg-muted text-sm font-medium p-2 border-b">
                <div className="col-span-2">Level</div>
                <div className="col-span-2">Institution</div>
                <div className="col-span-2">Board / University</div>
                <div className="col-span-1 text-center">Passing Year</div>
                <div className="col-span-1 text-center">Percentage</div>
                <div className="col-span-3">Notes</div>
                {canEdit && <div className="col-span-1 text-right pr-2">Actions</div>}
              </div>

              {educationFields.map((field, index) => (
                <div
                  key={field.id || `edu-${index}`}
                  className="grid grid-cols-1 xl:grid-cols-12 gap-2 items-center border-b p-2 text-sm"
                >
                  <div className="xl:col-span-2">
                    {canEdit ? (
                      <input
                        {...register(`educations.${index}.level`)}
                        className="w-full border rounded px-2 py-1"
                        placeholder="10th / 12th / Graduation / PG / PhD"
                        onBlur={handleBlurSave}
                      />
                    ) : (
                      <div className="text-sm text-gray-800">{getValues(`educations.${index}.level`) || '—'}</div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    {canEdit ? (
                      <input
                        {...register(`educations.${index}.institution`)}
                        className="w-full border rounded px-2 py-1"
                        placeholder="Institution"
                        onBlur={handleBlurSave}
                      />
                    ) : (
                      <div className="text-sm text-gray-800">{getValues(`educations.${index}.institution`) || '—'}</div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    {canEdit ? (
                      <input
                        {...register(`educations.${index}.board_or_university`)}
                        className="w-full border rounded px-2 py-1"
                        placeholder="Board / University"
                        onBlur={handleBlurSave}
                      />
                    ) : (
                      <div className="text-sm text-gray-800">{getValues(`educations.${index}.board_or_university`) || '—'}</div>
                    )}
                  </div>

                  <div className="md:col-span-1">
                    {canEdit ? (
                      <input
                        {...register(`educations.${index}.passing_year`)}
                        type="number"
                        className="w-full border rounded px-2 py-1 text-center"
                        placeholder="YYYY"
                        onBlur={handleBlurSave}
                      />
                    ) : (
                      <div className="text-sm text-gray-800 text-center">{getValues(`educations.${index}.passing_year`) || '—'}</div>
                    )}
                  </div>

                  <div className="md:col-span-1">
                    {canEdit ? (
                      <input
                        inputMode="decimal"
                        {...register(`educations.${index}.percentage`, {
                          pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Enter a valid number (max 2 decimals)' },
                          onChange: (e) => {
                            let raw = (e.target.value || '').replace(/[^\d.]/g, '')
                            const firstDot = raw.indexOf('.')
                            if (firstDot !== -1) {
                              const intPart = raw.slice(0, firstDot).replace(/\./g, '')
                              const decPart = raw.slice(firstDot + 1).replace(/\./g, '').slice(0, 2)
                              raw = intPart + (decPart.length ? '.' + decPart : '.')
                            } else {
                              raw = raw.replace(/\./g, '')
                            }
                            setValue(`educations.${index}.percentage`, raw, { shouldValidate: true, shouldDirty: true })
                          }
                        })}
                        className="w-full border rounded px-2 py-1 text-center"
                        placeholder="%"
                        onBlur={handleBlurSave}
                      />
                    ) : (
                      <div className="text-sm text-gray-800 text-center">{getValues(`educations.${index}.percentage`) || '—'}</div>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    {canEdit ? (
                      <textarea
                        {...register(`educations.${index}.notes`)}
                        className="w-full border rounded px-2 py-1"
                        placeholder="Notes"
                        rows={1}
                        onBlur={handleBlurSave}
                      />
                    ) : (
                      <div className="text-sm text-gray-800">{getValues(`educations.${index}.notes`) || '—'}</div>
                    )}
                  </div>

                  {canEdit && (
                  <div className="md:col-span-1 flex justify-center">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <FiTrash2
                          className="text-lg text-gray-600 hover:text-red-600 cursor-pointer"
                        />
                      </AlertDialogTrigger>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete education entry?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. The education record will be permanently removed.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() => {
                              removeEducation(index);
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      {canEdit && step === 2 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(1)}>Previous</Button>
          <Button onClick={() => setStep(3)}>Next</Button>
        </div>
      )}

      <Card style={{ display: step === 3 ? 'block' : 'none' }}>
        <CardHeader>
          <CardTitle>Experiences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Add previous employments. Most recent first.</div>
            <div>
              {canEdit && (
              <Button
                type="button"
                onClick={() => {
                  appendExperience({
                    id: null,
                    company_name: '',
                    from_date: '',
                    to_date: '',
                    designation: '',
                    responsibilities: '',
                    is_current: false,
                    reason_for_leaving: '',
                    last_drawn_ctc: '',
                  });
                }}
              >
                + Add Experience
              </Button>
              )}
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
              <div className="hidden md:grid md:grid-cols-12 bg-muted text-sm font-medium p-2 border-b">
                <div className="col-span-3">Company</div>
                <div className="col-span-2">From</div>
                <div className="col-span-2">To</div>
                <div className="col-span-2">Designation</div>
                <div className="col-span-2">Last Drawn CTC</div>
                {canEdit && <div className="col-span-1 text-right pr-2">Actions</div>}
              </div>

            {experienceFields.map((field, index) => (
              <div key={field.id || `exp-${index}`} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center border-b p-2 text-sm">
              <div className="md:col-span-3">
                {canEdit ? (
                  <input
                    {...register(`experiences.${index}.company_name`)}
                    className="w-full border rounded px-2 py-1"
                    placeholder="Company name"
                    onBlur={handleBlurSave}
                  />
                ) : (
                  <div className="text-sm text-gray-800">{getValues(`experiences.${index}.company_name`) || '—'}</div>
                )}
              </div>

              <div className="md:col-span-2">
                {canEdit ? (
                  <input
                    {...register(`experiences.${index}.from_date`)}
                    type="date"
                    className="w-full border rounded px-2 py-1 text-center"
                    onBlur={handleBlurSave}
                  />
                ) : (
                  <div className="text-sm text-gray-800 text-center">{getValues(`experiences.${index}.from_date`) || '—'}</div>
                )}
              </div>

              <div className="md:col-span-2">
                {canEdit ? (
                  <input
                    {...register(`experiences.${index}.to_date`)}
                    type="date"
                    className="w-full border rounded px-2 py-1 text-center"
                    onBlur={handleBlurSave}
                  />
                ) : (
                  <div className="text-sm text-gray-800 text-center">{getValues(`experiences.${index}.to_date`) || '—'}</div>
                )}
              </div>

              <div className="md:col-span-2">
                {canEdit ? (
                  <input
                    {...register(`experiences.${index}.designation`)}
                    className="w-full border rounded px-2 py-1"
                    placeholder="Designation"
                    onBlur={handleBlurSave}
                  />
                ) : (
                  <div className="text-sm text-gray-800">{getValues(`experiences.${index}.designation`) || '—'}</div>
                )}
              </div>

              <div className="md:col-span-2">
                {canEdit ? (
                  <input
                    {...register(`experiences.${index}.last_drawn_ctc`, {
                      pattern: { value: /^$|^[0-9]+(\.[0-9]{1,2})?$/, message: 'Enter a valid amount' },
                      onChange: (e) => {
                        let v = (e.target.value || '').replace(/[^0-9.]/g, '');
                        const firstDot = v.indexOf('.');
                        if (firstDot !== -1) {
                          const intPart = v.slice(0, firstDot).replace(/\./g, '');
                          const decPart = v.slice(firstDot + 1).replace(/\./g, '').slice(0, 2);
                          v = intPart + (decPart.length ? '.' + decPart : '.');
                        } else {
                          v = v.replace(/\./g, '');
                        }
                        setValue(`experiences.${index}.last_drawn_ctc`, v, { shouldValidate: true, shouldDirty: true });
                      }
                    })}
                    className="w-full border rounded px-2 py-1 text-right"
                    placeholder="e.g. 50000.00"
                    onBlur={handleBlurSave}
                  />
                ) : (
                  <div className="text-sm text-gray-800 text-right">{getValues(`experiences.${index}.last_drawn_ctc`) || '—'}</div>
                )}
              </div>

                {canEdit && (
                <div className="md:col-span-1 flex justify-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <FiTrash2
                        className="text-lg text-gray-600 hover:text-red-600 cursor-pointer"
                      />
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete experience entry?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The experience record will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={() => {
                            removeExperience(index);
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                )}

                <div className="md:col-span-12 mt-2 md:mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {canEdit ? (
                    <textarea
                      {...register(`experiences.${index}.responsibilities`)}
                      className="w-full border rounded px-2 py-1"
                      placeholder="Responsibilities (brief)"
                      rows={2}
                      onBlur={handleBlurSave}
                    />
                    ) : (<div className="text-sm text-gray-800">{getValues(`experiences.${index}.responsibilities`) || '—'}</div>)}
                    {canEdit ? (
                    <textarea
                      {...register(`experiences.${index}.reason_for_leaving`)}
                      className="w-full border rounded px-2 py-1"
                      placeholder="Reason for leaving"
                      rows={2}
                      onBlur={handleBlurSave}
                    />
                    ) : (<div className="text-sm text-gray-800">{getValues(`experiences.${index}.reason_for_leaving`) || '—'}</div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {canEdit && step === 3 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(2)}>Previous</Button>
          <Button onClick={() => setStep(4)}>Next</Button>
        </div>
      )}

      <Card style={{ display: step === 4 ? 'block' : 'none' }}>
        <CardHeader>
          <CardTitle>Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Provide present and permanent addresses.</div>

            <div className="flex items-center gap-2">
              {canEdit && (
              <input
                id="same-as-present"
                type="checkbox"
                checked={sameAsPresent}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSameAsPresent(checked);

                  const present = getValues('addresses.0') || {};
                  if (checked) {
                    const perm = {
                      ...(present || {}),
                      address_type: 'permanent',
                      type: 'permanent',
                    };
                    setValue('addresses.1', perm, { shouldValidate: true, shouldDirty: true });
                    setValue('addresses.1.address_1', present.address_1 || '', { shouldValidate: true, shouldDirty: true });
                    setValue('addresses.1.address_2', present.address_2 || '', { shouldValidate: true, shouldDirty: true });
                    setValue('addresses.1.landmark', present.landmark || '', { shouldValidate: true, shouldDirty: true });
                    setValue('addresses.1.city', present.city || '', { shouldValidate: true, shouldDirty: true });
                    setValue('addresses.1.state', present.state || '', { shouldValidate: true, shouldDirty: true });
                    setValue('addresses.1.district', present.district || '', { shouldValidate: true, shouldDirty: true });
                    setValue('addresses.1.pin_code', present.pin_code || '', { shouldValidate: true, shouldDirty: true });
                    setValue('addresses.1.country', present.country || 'India', { shouldValidate: true, shouldDirty: true });
                    if (addressFields[1]) {
                      updateAddress(1, perm);
                    } else {
                      appendAddress({ ...perm, id: null });
                    }
                  } else {
                    const blankPerm = {
                      id: null,
                      address_type: 'permanent',
                      type: 'permanent',
                      address_1: '',
                      address_2: '',
                      landmark: '',
                      city: '',
                      state: '',
                      district: '',
                      pin_code: '',
                      country: '',
                    };
                    setValue('addresses.1', blankPerm, { shouldValidate: true, shouldDirty: true });
                    setValue('addresses.1.address_1', '', { shouldValidate: true, shouldDirty: true });
                    setValue('addresses.1.address_2', '', { shouldValidate: true, shouldDirty: true });
                    setValue('addresses.1.landmark', '', { shouldValidate: true, shouldDirty: true });
                    setValue('addresses.1.city', '', { shouldValidate: true, shouldDirty: true });
                    setValue('addresses.1.state', '', { shouldValidate: true, shouldDirty: true });
                    setValue('addresses.1.district', '', { shouldValidate: true, shouldDirty: true });
                    setValue('addresses.1.pin_code', '', { shouldValidate: true, shouldDirty: true });
                    setValue('addresses.1.country', '', { shouldValidate: true, shouldDirty: true });
                    if (addressFields[1]) {
                      updateAddress(1, blankPerm);
                    } else {
                      appendAddress({ ...blankPerm });
                    }
                  }
                }}
              />
              )}
              <label htmlFor="same-as-present" className="text-sm">Permanent same as Present</label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-2 font-medium">Present Address</div>

              <div className="space-y-2">
                {canEdit ? <input {...register(`addresses.0.address_1`)} placeholder="Line 1" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} /> : <div className="text-sm text-gray-800">{getValues('addresses.0.address_1') || '—'}</div>}
                {canEdit ? <input {...register(`addresses.0.address_2`)} placeholder="Line 2" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} /> : <div className="text-sm text-gray-800">{getValues('addresses.0.address_2') || '—'}</div>}
                {canEdit ? <input {...register(`addresses.0.landmark`)} placeholder="Landmark" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} /> : <div className="text-sm text-gray-800">{getValues('addresses.0.landmark') || '—'}</div>}
                <div className="grid grid-cols-2 gap-2">
                  {canEdit ? <input {...register(`addresses.0.city`, { pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' }, onChange: (e) => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setValue('addresses.0.city', v, { shouldValidate: true, shouldDirty: true }) } })} placeholder="City" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} /> : <div className="text-sm text-gray-800">{getValues('addresses.0.city') || '—'}</div>}
                  {canEdit ? <input {...register(`addresses.0.state`, { pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' }, onChange: (e) => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setValue('addresses.0.state', v, { shouldValidate: true, shouldDirty: true }) } })} placeholder="State" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} /> : <div className="text-sm text-gray-800">{getValues('addresses.0.state') || '—'}</div>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {canEdit ? <input {...register(`addresses.0.district`, { pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' }, onChange: (e) => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setValue('addresses.0.district', v, { shouldValidate: true, shouldDirty: true }) } })} placeholder="District" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} /> : <div className="text-sm text-gray-800">{getValues('addresses.0.district') || '—'}</div>}
                  {canEdit ? <input {...register(`addresses.0.pin_code`, {
                    pattern: { value: /^[0-9]+$/, message: 'Numbers only' },
                    maxLength: { value: 6, message: 'Maximum 6 digits' },
                    onChange: (e) => {
                      const v = (e.target.value || '').replace(/[^0-9]/g, '');
                      setValue('addresses.0.pin_code', v, { shouldValidate: true, shouldDirty: true });
                    }
                  })} inputMode="numeric" maxLength={6} placeholder="Pin code" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} /> : <div className="text-sm text-gray-800">{getValues('addresses.0.pin_code') || '—'}</div>}
                </div>
                {canEdit ? <input {...register(`addresses.0.country`, { pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' }, onChange: (e) => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setValue('addresses.0.country', v, { shouldValidate: true, shouldDirty: true }) } })} placeholder="Country" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} /> : <div className="text-sm text-gray-800">{getValues('addresses.0.country') || '—'}</div>}

              </div>
            </div>

            <div>
              <div className="mb-2 font-medium">Permanent Address</div>

              <div className="space-y-2">
                {canEdit ? <input {...register(`addresses.1.address_1`)} placeholder="Line 1" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} disabled={sameAsPresent} /> : <div className="text-sm text-gray-800">{getValues('addresses.1.address_1') || '—'}</div>}
                {canEdit ? <input {...register(`addresses.1.address_2`)} placeholder="Line 2" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} disabled={sameAsPresent} /> : <div className="text-sm text-gray-800">{getValues('addresses.1.address_2') || '—'}</div>}
                {canEdit ? <input {...register(`addresses.1.landmark`)} placeholder="Landmark" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} disabled={sameAsPresent} /> : <div className="text-sm text-gray-800">{getValues('addresses.1.landmark') || '—'}</div>}
                <div className="grid grid-cols-2 gap-2">
                  {canEdit ? <input {...register(`addresses.1.city`, { pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' }, onChange: (e) => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setValue('addresses.1.city', v, { shouldValidate: true, shouldDirty: true }) } })} placeholder="City" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} disabled={sameAsPresent} /> : <div className="text-sm text-gray-800">{getValues('addresses.1.city') || '—'}</div>}
                  {canEdit ? <input {...register(`addresses.1.state`, { pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' }, onChange: (e) => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setValue('addresses.1.state', v, { shouldValidate: true, shouldDirty: true }) } })} placeholder="State" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} disabled={sameAsPresent} /> : <div className="text-sm text-gray-800">{getValues('addresses.1.state') || '—'}</div>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {canEdit ? <input {...register(`addresses.1.district`, { pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' }, onChange: (e) => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setValue('addresses.1.district', v, { shouldValidate: true, shouldDirty: true }) } })} placeholder="District" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} disabled={sameAsPresent} /> : <div className="text-sm text-gray-800">{getValues('addresses.1.district') || '—'}</div>}
                  {canEdit ? <input {...register(`addresses.1.pin_code`, {
                    pattern: { value: /^[0-9]+$/, message: 'Numbers only' },
                    maxLength: { value: 6, message: 'Maximum 6 digits' },
                    onChange: (e) => {
                      const v = (e.target.value || '').replace(/[^0-9]/g, '');
                      setValue('addresses.1.pin_code', v, { shouldValidate: true, shouldDirty: true });
                    }
                  })} inputMode="numeric" maxLength={6} placeholder="Pin code" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} disabled={sameAsPresent} /> : <div className="text-sm text-gray-800">{getValues('addresses.1.pin_code') || '—'}</div>}
                </div>
                {canEdit ? <input {...register(`addresses.1.country`, { pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' }, onChange: (e) => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setValue('addresses.1.country', v, { shouldValidate: true, shouldDirty: true }) } })} placeholder="Country" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} disabled={sameAsPresent} /> : <div className="text-sm text-gray-800">{getValues('addresses.1.country') || '—'}</div>}

              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {canEdit && step === 4 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(3)}>Previous</Button>
          <Button onClick={() => setConfirmOpen(true)}>Submit</Button>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm submission</AlertDialogTitle>
            <AlertDialogDescription>
              You can’t edit this after saving. Do you want to submit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                setConfirmOpen(false)
                handleSubmit(onSubmit)()
              }}
            >
              Yes, submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}
