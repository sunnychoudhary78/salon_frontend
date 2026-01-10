// src/components/EmployeeForm.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '@/api/axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast'; // optional
import { useForm, useFieldArray } from 'react-hook-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Controller } from 'react-hook-form';
import { Edit2 as FiEdit2, Trash2 as FiTrash2 } from "lucide-react";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

const FORM_KEY = 'employees';

const normalizeDesignations = (res) => {
    const d = res?.data;
    const arr = Array.isArray(d)
        ? d
        : Array.isArray(d?.data)
        ? d.data
        : Array.isArray(d?.designations)
        ? d.designations
        : [];
    return arr.map((x) => {
        const rawName = x?.name ?? x?.title ?? x?.label ?? (typeof x === 'string' ? x : '');
        const name = String(rawName).trim();
        const id = x?.id ?? x?._id ?? name;
        return { id, name };
    });
};

function sanitizeMoney(val) {
    let raw = String(val || '').replace(/[^\d.]/g, '');
    const firstDot = raw.indexOf('.');
    if (firstDot !== -1) {
        const intPart = raw.slice(0, firstDot).replace(/\./g, '');
        const decPart = raw.slice(firstDot + 1).replace(/\./g, '').slice(0, 2);
        raw = intPart + (decPart.length ? '.' + decPart : '.');
    } else {
        raw = raw.replace(/\./g, '');
    }
    return raw;
}

function formatINR(val) {
    const s = String(val || '');
    if (!s) return '';
    const parts = s.split('.');
    let x = parts[0].replace(/[^0-9]/g, '');
    if (!x) return '';
    const last3 = x.slice(-3);
    const other = x.slice(0, -3);
    const formatted = (other ? other.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + last3;
    return parts[1] ? formatted + '.' + parts[1] : formatted;
}

function stripCommas(s) {
    return String(s || '').replace(/,/g, '');
}

function addDaysToDateString(dateStr, days) {
    if (!dateStr || !days) return '';
    const [y, m, d] = String(dateStr).split('-').map(x => parseInt(x, 10));
    if (!y || !m || !d) return '';
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + Number(days));
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
}

export default function EmployeeForm({ initialData = null, onSaved = () => { }, onCreated = () => { } }) {

    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = Boolean(userId);
    const bootingRef = useRef(false);
    useEffect(() => {
        document.title = isEdit ? "Edit Employee | Immortal LMS" : "Create Employee | Immortal LMS";
    }, []);

    const { register, handleSubmit, reset, watch, setValue, trigger, control, getValues, unregister, formState: { errors }, } = useForm({
        defaultValues: {
            id: null,
            // MAIN SECTION
            name: '',
            email: '',
            roleId: '',
            payroll_code: '',
            contact_primary: '',
            contact_secondary: '',
            work_location: '',
            associates_name: '',
            // PERSONAL SECTION
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
            // JOB / EMPLOYMENT SECTION (new)
            designation: '',
            company_id: '',
            department_id: '',
            department_name: '',
            doj: '',
            dol: '',
            manager_id: '',
            department_head_id: '',
            total_experience: '',
            client_name: '',
            client_code: '',
            is_on_probation: 'true',
            probation_end_date: '',

            // add into defaultValues
            bank_name: '',
            ifsc_code: '',
            account_number: '',        // frontend stores plain - backend should encrypt into account_number_encrypted
            aadhar_number: '',         // frontend stores plain - backend should encrypt into aadhar_number_encrypted
            pan_number: '',
            esi_no: '',
            uan_no: '',
            basic: '',
            hra: '',
            conveyance: '',
            other_allowance: '',
            bonus: '',
            gross: '',
            ctc: '',

            // Work mode
            work_mode: 'OFFICE',
            hybrid_office_days: [],


            address_same_as_present: false,

            educations: [],
            experiences: [],
            addresses: [],

            // placeholders for future
            ...initialData,
        },
    });

    const {
        fields: addressFields,
        append: appendAddress,
        remove: removeAddress,
        update: updateAddress,
        replace: replaceAddresses,
    } = useFieldArray({ control, name: 'addresses', });

    const {
        fields: educationFields,
        append: appendEducation,
        remove: removeEducation,
        update: updateEducation,
        replace: replaceEducations,
    } = useFieldArray({ control, name: 'educations', });

    const {
        fields: experienceFields,
        append: appendExperience,
        remove: removeExperience,
        update: updateExperience,
        replace: replaceExperiences,
    } = useFieldArray({ control, name: 'experiences', });


    const [sameAsPresent, setSameAsPresent] = useState(false);
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [allDepartments, setAllDepartments] = useState([]);
    const [managerCandidates, setManagerCandidates] = useState([])
    const [savedManagerUser, setSavedManagerUser] = useState(null)
    const [departmentHeads, setDepartmentHeads] = useState([])
    const [departmentHeadOptions, setDepartmentHeadOptions] = useState([])
    const [designations, setDesignations] = useState([])
    const [bloodGroups, setBloodGroups] = useState([])
    const [maritalStatuses, setMaritalStatuses] = useState([])
    const [genders, setGenders] = useState([])
    const [companies, setCompanies] = useState([])
    const allDepartmentsRef = useRef([])
    const initialCompanyIdRef = useRef(null);
    const initialDesignationRef = useRef(null);
    const [defaultProbationDays, setDefaultProbationDays] = useState(null);

    // draft/local storage helpers removed

    // fetch lists (roles, departments, users)
    // removed separate fetch lists effect; lists are fetched in boot effect to avoid race conditions

    // Coerce select values to strings and normalize enums so Shadcn Selects render consistently
    useEffect(() => {
        const toIdStr = (val) => (val == null || val === '') ? '' : (typeof val === 'number' ? String(val) : String(val));
        const roleInit = getValues('roleId');
        setValue('roleId', toIdStr(roleInit), { shouldDirty: false, shouldValidate: false });
        setValue('department_id', toIdStr(getValues('department_id')), { shouldDirty: false, shouldValidate: false });
        setValue('manager_id', toIdStr(getValues('manager_id')), { shouldDirty: false, shouldValidate: false });
        setValue('department_head_id', toIdStr(getValues('department_head_id')), { shouldDirty: false, shouldValidate: false });

        const canonByList = (val, list) => {
            const s = String(val || '');
            if (!s) return '';
            const match = Array.isArray(list) ? list.find(it => String(it.name || '').toLowerCase() === s.toLowerCase()) : null;
            return match ? match.name : s;
        };
        setValue('gender', canonByList(getValues('gender'), genders), { shouldDirty: false, shouldValidate: false });
        setValue('marital_status', canonByList(getValues('marital_status'), maritalStatuses), { shouldDirty: false, shouldValidate: false });
        setValue('blood_group', canonByList(getValues('blood_group'), bloodGroups), { shouldDirty: false, shouldValidate: false });
        const prob = getValues('is_on_probation');
        setValue('is_on_probation', typeof prob === 'boolean' ? String(prob) : (prob ?? 'true'), { shouldDirty: false, shouldValidate: false });
    }, [initialData, getValues, setValue, genders, maritalStatuses, bloodGroups]);

    useEffect(() => {
        if (!isEdit) {
            const cid = getValues('company_id') || '';
            const params = cid ? { params: { companyId: cid } } : undefined;
            api.get('/employees/next-payroll-code', params).then(res => {
                const code = res?.data?.nextCode;
                if (code && !getValues('payroll_code')) {
                    setValue('payroll_code', code, { shouldDirty: true, shouldValidate: true });
                }
            }).catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEdit]);

    // Subscribe to roleId changes and ensure it stays a string
    useEffect(() => {
        const sub = watch((value, { name }) => {
            const namesToCoerce = ['roleId', 'department_id', 'manager_id', 'department_head_id'];
            if (namesToCoerce.includes(name)) {
                const v = value[name];
                if (typeof v === 'number') {
                    setValue(name, String(v), { shouldDirty: false, shouldValidate: false });
                }
            }
            if (name === 'gender') {
                const s = String(value.gender || '').toLowerCase();
                const match = genders.find(g => String(g.name || '').toLowerCase() === s);
                const canonical = match ? match.name : value.gender;
                if (canonical !== value.gender) {
                    setValue('gender', canonical || '', { shouldDirty: false, shouldValidate: false });
                }
            }
            if (name === 'marital_status') {
                const s = String(value.marital_status || '').toLowerCase();
                const match = maritalStatuses.find(m => String(m.name || '').toLowerCase() === s);
                const canonical = match ? match.name : value.marital_status;
                if (canonical !== value.marital_status) {
                    setValue('marital_status', canonical || '', { shouldDirty: false, shouldValidate: false });
                }
                if (String(canonical || '').toLowerCase() === 'single') {
                    setValue('date_of_marriage', '', { shouldDirty: false, shouldValidate: false });
                }
            }
            if (name === 'blood_group') {
                const s = String(value.blood_group || '').toUpperCase();
                const match = bloodGroups.find(b => String(b.name || '').toUpperCase() === s);
                const canonical = match ? match.name : value.blood_group;
                if (canonical !== value.blood_group) {
                    setValue('blood_group', canonical || '', { shouldDirty: false, shouldValidate: false });
                }
            }
        });
        return () => sub.unsubscribe();
    }, [watch, setValue, genders, maritalStatuses, bloodGroups]);



    // ensure there are always two slot entries (index 0 => current/present, index 1 => permanent)
    useEffect(() => {
        // if already present, do nothing
        if (addressFields.length === 0) {
            appendAddress({
                id: null,
                address_type: 'current',
                address_1: '',
                address_2: '',
                landmark: '',
                city: '',
                state: '',
                district: '',
                pin_code: '',
                country: 'India',
            });
            appendAddress({
                id: null,
                address_type: 'permanent',
                address_1: '',
                address_2: '',
                landmark: '',
                city: '',
                state: '',
                district: '',
                pin_code: '',
                country: 'India',
            });
        } else if (addressFields.length === 1) {
            // if only one exists, append permanent
            const existingType = addressFields[0].address_type || 'current';
            if (existingType === 'permanent') {
                // ensure present slot first then permanent
                appendAddress({
                    id: null,
                    address_type: 'current',
                    address_1: '',
                    address_2: '',
                    landmark: '',
                    city: '',
                    state: '',
                    district: '',
                    pin_code: '',
                    country: 'India',
                    notes: '',
                });
            } else {
                appendAddress({
                    id: null,
                    address_type: 'permanent',
                    address_1: '',
                    address_2: '',
                    landmark: '',
                    city: '',
                    state: '',
                    district: '',
                    pin_code: '',
                    country: 'India',
                    notes: '',
                });
            }
        }

        // if addresses are both present and identical right now, set sameAsPresent true
        // run a small check:
        if (addressFields.length >= 2) {
            const a0 = addressFields[0];
            const a1 = addressFields[1];
            const equal = (
                (a0?.address_1 || '') === (a1?.address_1 || '') &&
                (a0?.address_2 || '') === (a1?.address_2 || '') &&
                (a0?.landmark || '') === (a1?.landmark || '') &&
                (a0?.city || '') === (a1?.city || '') &&
                (a0?.state || '') === (a1?.state || '') &&
                (a0?.district || '') === (a1?.district || '') &&
                (a0?.pin_code || '') === (a1?.pin_code || '') &&
                (a0?.country || '') === (a1?.country || '') &&
                (a0?.notes || '') === (a1?.notes || '')
            );
            setSameAsPresent(equal);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount

    // keep associates_name in sync with name
    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === 'name') {
                setValue('associates_name', value.name || '', { shouldValidate: false, shouldDirty: true });

            }
        });
        return () => subscription.unsubscribe();
    }, [watch, setValue]);

    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (bootingRef.current) return;
            if (name === 'department_id') {
                const id = value.department_id;
                const depList = Array.isArray(allDepartments) ? allDepartments : [];
                const dep = depList.find((d) => String(d.id) === String(id));
                setValue('department_name', dep ? dep.name : '', { shouldValidate: false, shouldDirty: true });
                const head = dep && dep.department_head_id ? String(dep.department_head_id) : '';
                const currentHead = String(getValues('department_head_id') || '');
                const nextHead = currentHead || head;
                if (!currentHead && head) {
                    setValue('department_head_id', head, { shouldValidate: false, shouldDirty: true });
                    const list = Array.isArray(departmentHeads) ? departmentHeads : [];
                    const exists = list.find(u => String(u.id) === head);
                    const nextOpts = exists ? list : (head ? [{ id: head, name: 'Selected Department Head', email: '' }, ...list] : list);
                    setDepartmentHeadOptions(nextOpts);
                }

            }
            if (name === 'company_id' && !isEdit) {
                const cid = value.company_id || '';
                if (cid) {
                    api.get('/employees/next-payroll-code', { params: { companyId: cid } })
                        .then((res) => {
                            const code = res?.data?.nextCode;
                            if (code) {
                                setValue('payroll_code', code, { shouldDirty: true, shouldValidate: true });
                            }
                        })
                        .catch(() => { });
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, setValue, departmentHeads, allDepartments, isEdit]);

    useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (bootingRef.current) {
                return;
            }
            if (name === 'company_id') {
                const cid = value.company_id;
                const depList = Array.isArray(allDepartments) ? allDepartments : [];
                // If we have no departments loaded yet, do not attempt to validate or clear fields
                if (depList.length === 0 && cid) {
                    // We might want to fetch departments if they are missing, but for now just return
                    // to avoid clearing fields prematurely.
                }

                const filtered = cid ? depList.filter(d => String(d.company_id || d.companyId || '') === String(cid)) : depList;
                setDepartments(filtered);
                
                if (cid) {
                    api.get('/company-settings/designations', { params: { companyId: cid } })
                        .then((res) => {
                            let list = normalizeDesignations(res);
                            const rawCur = getValues('designation') || '';
                            const cur = rawCur.trim();
                            const match = cur ? list.find(d => String(d.name).trim().toLowerCase() === cur.toLowerCase()) : null;

                            if (match) {
                                setDesignations(list);
                                if (match.name !== rawCur) {
                                    setValue('designation', match.name, { shouldValidate: false, shouldDirty: true });
                                }
                            } else if (cur) {
                                const isInitialCompany = String(cid) === String(initialCompanyIdRef.current || '');
                                const isInitialDesignation = cur.toLowerCase() === (initialDesignationRef.current || '').trim().toLowerCase();

                                if (isEdit && isInitialCompany && isInitialDesignation) {
                                    list = [...list, { id: 'preserved-init', name: rawCur }];
                                    setDesignations(list);
                                } else {
                                    setDesignations(list);
                                    setValue('designation', '', { shouldValidate: false, shouldDirty: true });
                                }
                            } else {
                                setDesignations(list);
                            }
                        })
                        .catch(() => { setDesignations([]); });
                    
                    api.get('/company-settings', { params: { companyId: cid } })
                        .then((res) => {
                            const s = res?.data || {};
                            const days = s?.default_probation_days;
                            setDefaultProbationDays(typeof days === 'number' ? days : (days ? Number(days) : null));
                            const doj = getValues('doj') || '';
                            const ped = getValues('probation_end_date') || '';
                            const onProb = getValues('is_on_probation');
                            const isProb = typeof onProb === 'boolean' ? onProb : String(onProb).toLowerCase() === 'true';
                            if (isProb && doj && !ped && days) {
                                // check valid date
                                const isValidDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);
                                if (isValidDate(doj)) {
                                    const next = addDaysToDateString(doj, days);
                                    if (next) setValue('probation_end_date', next, { shouldDirty: true, shouldValidate: false });
                                }
                            }
                        })
                        .catch(() => { setDefaultProbationDays(null); });
                } else {
                    setDesignations([]);
                    setValue('designation', '', { shouldValidate: false, shouldDirty: true });
                    setDefaultProbationDays(null);
                }
                
                const currentDeptId = getValues('department_id');
                const isDeptValid = currentDeptId && filtered.find(d => String(d.id) === String(currentDeptId));

                if (!isDeptValid && depList.length > 0) {
                     // Only clear department if we are sure the list is loaded and it's invalid
                    setValue('department_id', '', { shouldValidate: false, shouldDirty: true });
                    setValue('department_name', '', { shouldValidate: false, shouldDirty: true });
                    // User requested to remove logic that clears manager field
                    // setValue('manager_id', '', { shouldValidate: false, shouldDirty: true });
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, allDepartments, setValue]);

    useEffect(() => {
        if (bootingRef.current) return;
        const doj = watch('doj');
        const onProb = watch('is_on_probation');
        const isProb = typeof onProb === 'boolean' ? onProb : String(onProb).toLowerCase() === 'true';

        // User requirement: "when i add the full date in joing date then update the probation end date and also update it whenever i change the date in joining date"
        // Valid date check: yyyy-mm-dd
        const isValidDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(new Date(d).getTime());

        if (defaultProbationDays && isProb && doj && isValidDate(doj)) {
            const next = addDaysToDateString(doj, defaultProbationDays);
            if (next) {
                // We update it ALWAYS if the date changes, as per user request.
                // However, to avoid fighting with user if they are manually editing the END date,
                // we could check if the current end date is what we expect from the *previous* DOJ... 
                // BUT the user said "update it whenever i change the date in joining date".
                // Simplest robust way: Just set it.
                setValue('probation_end_date', next, { shouldDirty: true, shouldValidate: false });
            }
        }
    }, [watch('doj'), watch('is_on_probation'), defaultProbationDays]);

    // Dedicated effect to fetch manager candidates based on Role, Department, and Company
    // This implements the user's rule: "check the role and department filter all the employees... with role hierarchy same or lower"
    const currentRoleId = watch('roleId');
    const currentDeptId = watch('department_id');
    const currentCompanyId = watch('company_id');

    useEffect(() => {
        // We do NOT check bootingRef.current here because we want this to run after boot sets the values
        // to ensure manager list is populated based on the booted values.

        const fetchManagers = async () => {
            try {
                const params = {};
                if (currentRoleId) params.roleId = currentRoleId;
                if (currentDeptId) params.departmentId = currentDeptId;
                if (currentCompanyId) params.companyId = currentCompanyId;

                const res = await api.get('/employees/manager-candidates', { params });
                const arr = Array.isArray(res.data) ? res.data : [];
                
                let finalCandidates = [...arr];

                // Ensure saved manager is in the list if they are missing (Fallback logic)
                if (savedManagerUser && savedManagerUser.id) {
                    const exists = arr.find(u => String(u.id) === String(savedManagerUser.id));
                    if (!exists) {
                         finalCandidates = [savedManagerUser, ...arr];
                    }
                }
                setManagerCandidates(finalCandidates);
            } catch (err) {
                // If fetch fails, at least show the saved manager if available
                if (savedManagerUser) {
                    setManagerCandidates([savedManagerUser]);
                } else {
                    setManagerCandidates([]);
                }
            }
        };

        // Debounce slightly or just call
        const timeoutId = setTimeout(fetchManagers, 100);
        return () => clearTimeout(timeoutId);
    }, [currentRoleId, currentDeptId, currentCompanyId, savedManagerUser]);




    // boot: edit vs add (now includes job fields)
    useEffect(() => {
        let mounted = true;

        // Auto-select company from navigation state if present (and not editing existing user)
        if (!isEdit && location.state?.company_id) {
            setValue('company_id', String(location.state.company_id), { shouldDirty: true, shouldValidate: false });
        }

        // fetch lists first to ensure SelectItems exist before we set form values
        const fetchListsFirst = async () => {
            try {
                const [rRes, dRes, desRes, bgRes, msRes, gRes, cRes] = await Promise.all([
                    api.get('/roles'),
                    api.get('/departments'),
                    api.get('/company-settings/designations'),
                    api.get('/variables/blood-groups'),
                    api.get('/variables/marital-statuses'),
                    api.get('/variables/genders'),
                    api.get('/companies', { params: { active: true } }),
                ]);
                if (!mounted) return;
                setRoles(Array.isArray(rRes.data) ? rRes.data : rRes.data?.roles || []);
                const depList = Array.isArray(dRes.data) ? dRes.data : dRes.data?.departments || [];
                setAllDepartments(depList);
                allDepartmentsRef.current = depList;
                const currentCompanyId = getValues('company_id') || '';
                const filtered = currentCompanyId ? depList.filter(d => String(d.company_id || d.companyId || '') === String(currentCompanyId)) : depList;
                setDepartments(filtered);
                setDesignations(normalizeDesignations(desRes));
                setBloodGroups(Array.isArray(bgRes.data) ? bgRes.data : []);
                setMaritalStatuses(Array.isArray(msRes.data) ? msRes.data : []);
                setGenders(Array.isArray(gRes.data) ? gRes.data : []);
                setCompanies(Array.isArray(cRes.data) ? cRes.data : cRes.data?.companies || []);
                try {
                    const params = currentCompanyId ? { companyId: currentCompanyId } : {};
                    const mRes = await api.get('/employees/manager-candidates', { params })
                    const arr = Array.isArray(mRes.data) ? mRes.data : []
                    setManagerCandidates(arr)
                } catch { }
                try {
                    const dhRes = await api.get('/employees/department-heads')
                    const list = Array.isArray(dhRes.data) ? dhRes.data : []
                    setDepartmentHeads(list)
                    setDepartmentHeadOptions(list)
                } catch { }
            } catch (err) {
                console.warn('Failed to load lists', err);
            }
        };

        const bootForEdit = async () => {
            try {
                const res = await api.get(`/employees/by-user/${userId}`);
                // console.log("fetched data from the bootForEdit", res.data.data);

                if (res?.data?.data) {
                    let { user, employee } = res.data.data;
                    // Fallback if employee is nested in user
                    if (!employee && user?.employee_detail) {
                        employee = user.employee_detail;
                    }
                    
                    const pickId = (...candidates) => candidates.find((v) => v != null);
                    const roleIdCandidate = [
                        user?.role?.id,
                        user?.role_id,
                        user?.roleId,
                        employee?.role_id,
                        employee?.roleId,
                    ].find((v) => v != null);
                    const deptIdCandidate = pickId(employee?.department_id, employee?.departmentId, employee?.department?.id);
                    const managerIdCandidate = pickId(employee?.manager_id, employee?.managerId, employee?.manager?.id);
                    // console.log("manager id", managerIdCandidate);

                    const managerObjCandidate = employee?.manager;
                    const deptHeadIdCandidate = pickId(employee?.department_head_id, employee?.departmentHeadId, employee?.department_head?.id);

                    const formInit = {
                        id: user?.id || null,
                        name: user?.name || '',
                        email: user?.email || '',
                        roleId: roleIdCandidate != null ? String(roleIdCandidate) : '',
                        payroll_code: employee?.payroll_code || '',
                        contact_primary: employee?.contact_primary || '',
                        contact_secondary: employee?.contact_secondary || '',
                        work_location: employee?.work_location || '',
                        associates_name: employee?.associates_name || user?.name || '',
                        // personal
                        dob: employee?.dob || '',
                        gender: employee?.gender || '',
                        blood_group: employee?.blood_group || '',
                        marital_status: employee?.marital_status || '',
                        date_of_marriage: employee?.date_of_marriage || '',
                        nominee_name: employee?.nominee_name || '',
                        nominee_dob: employee?.nominee_dob || '',
                        nominee_relation: employee?.nominee_relation || '',
                        father_name: employee?.father_name || '',
                        father_dob: employee?.father_dob || '',
                        mother_name: employee?.mother_name || '',
                        mother_dob: employee?.mother_dob || '',
                        spouse_name: employee?.spouse_name || '',
                        spouse_dob: employee?.spouse_dob || '',
                        // job
                        designation: employee?.designation || '',
                        company_id: employee?.company_id ? String(employee.company_id) : (employee?.department?.company_id ? String(employee.department.company_id) : ''),
                        department_id: deptIdCandidate != null ? String(deptIdCandidate) : '',
                        department_name: employee?.department_name || '',
                        doj: employee?.doj || '',
                        dol: employee?.dol || '',
                        manager_id: managerIdCandidate != null ? String(managerIdCandidate) : '',
                        department_head_id: deptHeadIdCandidate != null ? String(deptHeadIdCandidate) : '',
                        total_experience: employee?.total_experience || '',
                        client_name: employee?.client_name || '',
                        client_code: employee?.client_code || '',
                        work_mode: employee?.work_mode || 'OFFICE',
                        hybrid_office_days: Array.isArray(employee?.hybrid_office_days) ? employee.hybrid_office_days : [],
                        is_on_probation: typeof employee?.is_on_probation === 'boolean' ? String(employee.is_on_probation) : (employee?.is_on_probation ?? 'true'),
                        probation_end_date: employee?.probation_end_date || '',
                        // bank
                        bank_name: employee?.bank_name || '',
                        ifsc_code: employee?.ifsc_code || '',
                        account_number: employee?.account_number_encrypted || '', // we don't send decrypted account to client; leave blank or use placeholder if you support secure read
                        aadhar_number: employee?.aadhar_number_encrypted || '',  // don't prefill sensitive numbers unless you decrypt server-side (recommended not to)
                        pan_number: employee?.pan_number_encrypted || '', // if you store plain, otherwise blank
                        esi_no: employee?.esi_no || '',
                        uan_no: employee?.uan_no || '',
                        basic: employee?.basic || '',
                        hra: employee?.hra || '',
                        conveyance: employee?.conveyance || '',
                        other_allowance: employee?.other_allowance || '',
                        bonus: employee?.bonus || '',
                        gross: employee?.gross || '',
                        ctc: employee?.ctc || '',

                        // inside formInit
                        educations: Array.isArray(employee?.educations) ? employee.educations.map(e => ({
                            id: e.id,                       // existing DB id
                            level: e.level || '',
                            board_or_university: e.board_or_university || e.board_university || '',
                            institution: e.institution || e.institution_name || '',
                            from_year: e.from_year || '',
                            to_year: e.to_year || '',
                            passing_year: e.passing_year || '',
                            percentage: e.percentage != null ? String(e.percentage) : '', // strings are fine
                            notes: e.notes || '',
                        })) : [],

                        experiences: Array.isArray(employee?.experiences) ? employee.experiences.map(x => ({
                            id: x.id || null,
                            company_name: x.company_name || '',
                            from_date: x.from_date || '',
                            to_date: x.to_date || '',
                            designation: x.designation || '',
                            responsibilities: x.responsibilities || '',
                            is_current: !!x.is_current,
                            reason_for_leaving: x.reason_for_leaving || '',
                            last_drawn_ctc: x.last_drawn_ctc != null ? String(x.last_drawn_ctc) : '',
                        })) : [],

                        addresses: Array.isArray(employee?.addresses) ? employee.addresses.map(a => ({
                            id: a.id || null,
                            address_type: a.address_type || '',
                            address_1: a.address_1 || '',
                            address_2: a.address_2 || '',
                            landmark: a.landmark || '',
                            city: a.city || '',
                            state: a.state || '',
                            district: a.district || '',
                            pin_code: a.pin_code || '',
                            country: a.country || 'India',
                        })) : [],
                    };
                    if (mounted) {
                        initialCompanyIdRef.current = formInit.company_id;
                        initialDesignationRef.current = formInit.designation;

                        // Store designation to set it LATER after fetching the list
                        const intendedDesignation = formInit.designation;
                        // We reset with empty designation to avoid race conditions where the field is set before options exist
                        const initPayload = { ...formInit, designation: '' };
                        
                        reset(initPayload);

                        // 1. Fetch Designations
                        try {
                            const depList = Array.isArray(allDepartmentsRef.current) ? allDepartmentsRef.current : [];
                            const cid = formInit.company_id || '';
                            const filteredDeps = cid ? depList.filter(d => String(d.company_id || d.companyId || '') === String(cid)) : depList;
                            setDepartments(filteredDeps);
                            if (cid) {
                                // AWAIT the designations fetch
                                const res = await api.get('/company-settings/designations', { params: { companyId: cid } });
                                if (mounted) {
                                    let dList = normalizeDesignations(res);
                                    // Ensure current designation is in the list
                                    const rawCur = (intendedDesignation || '').trim();
                                    
                                    // Check if it exists in the list (case-insensitive)
                                    const existing = rawCur ? dList.find(d => String(d.name).trim().toLowerCase() === rawCur.toLowerCase()) : null;
                                    
                                    let valToSet = rawCur;
                                    
                                    if (rawCur) {
                                        if (existing) {
                                            // Use the existing one from the list to ensure case match
                                            valToSet = existing.name;
                                        } else {
                                            // If not found, add it to the list so it can be selected
                                            dList = [...dList, { id: 'current-desig', name: rawCur }];
                                        }
                                    }

                                    setDesignations(dList);
                                    
                                    // FORCE Set Value after list is populated
                                    // We use a small timeout to allow React to render the options first
                                    setTimeout(() => {
                                        setValue('designation', valToSet, { shouldDirty: false, shouldValidate: false });
                                    }, 100);
                                }
                            }
                        } catch (err) { console.error("Designation fetch error", err); }

                        // 2. Set Saved Manager User (Fetcher is handled by useEffect watcher)
                        setSavedManagerUser(managerObjCandidate || null);
                        
                        // 3. Department Head
                        const headObjCandidate = employee?.department_head || null;
                        const headIdCandidateStr = deptHeadIdCandidate != null ? String(deptHeadIdCandidate) : (headObjCandidate ? String(headObjCandidate.id) : '');
                        const list = Array.isArray(departmentHeads) ? departmentHeads : [];
                        const exists = headIdCandidateStr && list.find(u => String(u.id) === headIdCandidateStr);
                        const nextOpts = exists
                            ? list
                            : (headIdCandidateStr ? [{ id: headIdCandidateStr, name: (headObjCandidate && headObjCandidate.name) || 'Selected Department Head', email: (headObjCandidate && headObjCandidate.email) || '' }, ...list] : list);
                        setDepartmentHeadOptions(nextOpts);
                        if (!formInit.department_head_id && headIdCandidateStr) {
                            setValue('department_head_id', headIdCandidateStr, { shouldValidate: false, shouldDirty: true });
                        }
                    }
                }
            } catch (err) {
                console.warn('Failed to load employee for edit', err);
            }

            // draft code removed
        };

        const bootForAdd = async () => {
            reset({
                id: null,
                name: '',
                email: '',
                roleId: null,
                payroll_code: '',
                contact_primary: '',
                work_location: '',
                associates_name: '',
                // personal
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
                // job
                designation: '',
                department_id: null,
                department_name: '',
                doj: '',
                dol: '',
                manager_id: null,
                department_head_id: null,
                total_experience: '',
                client_name: '',
                client_code: '',
                work_mode: 'OFFICE',
                hybrid_office_days: [],
                is_on_probation: true,
                probation_end_date: '',

                //bank
                bank_name: '',
                ifsc_code: '',
                account_number: '',
                aadhar_number: '',
                pan_number: '',
                esi_no: '',
                uan_no: '',
                basic: '',
                hra: '',
                conveyance: '',
                other_allowance: '',
                bonus: '',
                gross: '',
                ctc: '',

                // educations
                educations: [],
                experiences: [],
                addresses: [],
            });
            // draft state removed
        };

        (async () => {
            bootingRef.current = true;
            await fetchListsFirst();
            if (!mounted) return;
            if (isEdit) await bootForEdit();
            else await bootForAdd();
            setTimeout(() => {
                bootingRef.current = false;
            }, 1000);
        })();

        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEdit, userId, reset]);

    // Simplified manager fetching: removed the watcher that filtered by role/dept.
    // Now we rely on initial fetch and company changes.


    // subscribe to form changes for autosave
    // useEffect(() => {
    //     const subscription = watch(() => {
    //         scheduleSave(800);
    //     });
    //     return () => subscription.unsubscribe();
    // }, [watch, scheduleSave]);

    // no-op blur handler to keep existing onBlur bindings harmless
    const handleBlurSave = () => { };
    const exitAfterSaveRef = useRef(false);
    const submitAndExit = (e) => {
        e?.preventDefault?.();
        exitAfterSaveRef.current = true;
        // trigger normal submit
        handleSubmit(onSubmit)(e);
    };
    const keepAfterSaveRef = useRef(false);
    const submitAndKeep = (e) => {
        e?.preventDefault?.();
        keepAfterSaveRef.current = true;
        handleSubmit(onSubmit)(e);
    };

    // final submit
    const onSubmit = async (values) => {
        if (!values?.name) {
            toast?.error?.('Personal Details (name) must be filled before final submit.');
            return;
        }
        if (!values.roleId) {
            toast?.error?.('Please select a Role');
            return;
        }

        try {

            // Robust roleId mapping: send number if numeric, else send UUID string
            const roleIdOut = (values.roleId === '' || values.roleId == null)
                ? null
                : (/^[0-9]+$/.test(String(values.roleId)) ? Number(values.roleId) : String(values.roleId));

            const userPayload = {
                name: values.name,
                email: values.email,
                roleId: roleIdOut,
            };
            if (isEdit && userId) userPayload.id = userId;

            const employeePayload = {
                payroll_code: values.payroll_code,
                associates_name: values.associates_name || values.name,
                contact_primary: values.contact_primary,
                contact_secondary: values.contact_secondary,
                work_location: values.work_location,
                // personal
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
                // job
                designation: values.designation || null,
                company_id: values.company_id || null,
                department_id: values.department_id || null,
                doj: values.doj || null,
                dol: values.dol || null,
                // manager and department head are user IDs (UUID strings), do not coerce to Number
                manager_id: values.manager_id || null,
                department_head_id: values.department_head_id || null,
                total_experience: values.total_experience || null,
                client_name: values.client_name || null,
                client_code: values.client_code || null,
                work_mode: values.work_mode || 'OFFICE',
                hybrid_office_days: Array.isArray(values.hybrid_office_days) ? values.hybrid_office_days : [],
                is_on_probation: typeof values.is_on_probation === 'boolean' ? values.is_on_probation : (values.is_on_probation === 'true'),
                probation_end_date: values.probation_end_date || null,
                //bank
                // inside employeePayload in onSubmit
                bank_name: values.bank_name || null,
                ifsc_code: values.ifsc_code || null,
                account_number: values.account_number || null,      // backend should encrypt into account_number_encrypted
                aadhar_number: values.aadhar_number || null,        // backend should encrypt into aadhar_number_encrypted
                pan_number: values.pan_number || null,              // if you encrypt on backend, handle accordingly
                esi_no: values.esi_no || null,
                uan_no: values.uan_no || null,
                basic: stripCommas(values.basic) || null,
                hra: stripCommas(values.hra) || null,
                conveyance: stripCommas(values.conveyance) || null,
                other_allowance: stripCommas(values.other_allowance) || null,
                bonus: stripCommas(values.bonus) || null,
                gross: stripCommas(values.gross) || null,
                ctc: stripCommas(values.ctc) || null,


                educations: values.educations || [],
                experiences: [],

                // addresses
                addresses: [],

            };
            // build addresses payload for backend
            const formAddresses = getValues('addresses') || []; // or values.addresses if you have values param

            // build experiences payload: allow all fields optional; skip if all empty
            const rawExperiences = values.experiences || [];
            const experiencesPayload = rawExperiences
                .map((x) => {
                    const company_name = String(x?.company_name || '').trim();
                    const from_date = String(x?.from_date || '').trim();
                    const to_date = String(x?.to_date || '').trim();
                    const designation = String(x?.designation || '').trim();
                    const responsibilities = String(x?.responsibilities || '').trim();
                    const reason_for_leaving = String(x?.reason_for_leaving || '').trim();
                    const ctcRaw = String(x?.last_drawn_ctc ?? '').trim();
                    const ctcStr = ctcRaw ? stripCommas(ctcRaw) : '';
                    const hasAny = company_name || from_date || to_date || designation || responsibilities || reason_for_leaving || ctcStr;
                    if (!hasAny) return null;
                    return {
                        id: x?.id || undefined,
                        company_name: company_name || null,
                        from_date: from_date || null,
                        to_date: to_date || null,
                        designation: designation || null,
                        responsibilities: responsibilities || null,
                        is_current: !!x?.is_current,
                        reason_for_leaving: reason_for_leaving || null,
                        last_drawn_ctc: ctcStr ? Number(ctcStr) : null,
                    };
                })
                .filter(Boolean);
            employeePayload.experiences = experiencesPayload;

            // find present (current) and permanent entries by type if available
            let present = formAddresses.find(a => (a.type || a.address_type) === 'current' || (a.type || a.address_type) === 'present') || formAddresses[0] || null;
            let permanent = formAddresses.find(a => (a.type || a.address_type) === 'permanent') || formAddresses[1] || null;

            // if sameAsPresent is checked, copy present into permanent
            if (sameAsPresent && present) {
                permanent = { ...present };
            }

            // normalize fields and ensure address_type keys for DB
            const addressesPayload = [];
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
                    id: present.id || undefined, // pass id when updating
                });
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
                );
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
                    });
                }
            }

            // then include addressesPayload in employee payload you send to server:
            // e.g.
            employeePayload.addresses = addressesPayload;


            const payload = { user: userPayload, employee: employeePayload };
            const res = await api.post('/employees/create-or-update', payload);
            if (res?.data?.ok) {
                const selectedRole = roles.find(r => String(r.id) === String(values.roleId));
                const isDeptHeadRole = selectedRole && /head/i.test(String(selectedRole.name || '')) && /depart/i.test(String(selectedRole.name || ''));
                if (isDeptHeadRole && values.department_id) {
                    const userIdToSet = (res?.data?.user?.id) || userId;
                    if (userIdToSet) {
                        try { await api.put(`/departments/${values.department_id}`, { department_head_id: String(userIdToSet) }); } catch { }
                        setValue('department_head_id', String(userIdToSet), { shouldDirty: true, shouldValidate: false });
                    }
                }
                toast?.success?.(isEdit ? 'Employee Details Updated Successfully' : 'Employee Details Saved Successfully');
                onCreated(res.data);
                if (exitAfterSaveRef.current) {
                    exitAfterSaveRef.current = false;
                    if (location.state?.from) {
                        navigate(location.state.from);
                    } else {
                        navigate('/employees');
                    }
                    return; // skip reset when exiting
                }
                if (keepAfterSaveRef.current) {
                    const newId = res?.data?.user?.id;
                    keepAfterSaveRef.current = false;
                    if (newId) {
                        navigate(`/employees/${newId}/edit`);
                        return;
                    }
                }
                if (!isEdit && !keepAfterSaveRef.current) {
                    reset({
                        id: null,
                        name: '',
                        email: '',
                        roleId: '',
                        payroll_code: '',
                        contact_primary: '',
                        work_location: '',
                        associates_name: '',
                        company_id: '',
                        // personal
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
                        // job
                        designation: '',
                        department_id: '',
                        department_name: '',
                        doj: '',
                        dol: '',
                        manager_id: '',
                        department_head_id: '',
                        total_experience: '',
                        client_name: '',
                        client_code: '',
                        is_on_probation: true,
                        probation_end_date: '',

                        //bank
                        bank_name: '',
                        ifsc_code: '',
                        account_number: '',
                        aadhar_number: '',
                        pan_number: '',
                        esi_no: '',
                        uan_no: '',
                        basic: '',
                        hra: '',
                        conveyance: '',
                        other_allowance: '',
                        bonus: '',
                        gross: '',
                        ctc: '',

                        educations: [],
                    });
                    // draft state removed
                }
                keepAfterSaveRef.current = false;
            } else {
                toast?.error?.('Failed to create/update employee');
            }
        } catch (err) {
            console.error('submit error', err);
            toast?.error?.(err?.response?.data?.message || err.message || 'Submit failed');
        }
    };

    // beforeunload attempt to flush
    // useEffect(() => {
    //     const handler = () => {
    //         if (!pendingSaveRef.current) return;
    //         const current = watch();
    //         try {
    //             const url = draftId ? `/drafts/${draftId}` : '/drafts';
    //             const payload = draftId ? { data: current, version: draftVersion } : { form_key: FORM_KEY, target_id: isEdit ? userId : null, data: current };
    //             const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    //             if (navigator.sendBeacon) navigator.sendBeacon(url, blob);
    //             else {
    //                 const xhr = new XMLHttpRequest();
    //                 xhr.open('POST', url, false);
    //                 xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    //                 xhr.send(JSON.stringify(payload));
    //             }
    //         } catch (e) {
    //             saveLocal(current);
    //         }
    //     };
    //     window.addEventListener('beforeunload', handler);
    //     return () => window.removeEventListener('beforeunload', handler);
    // }, [draftId, draftVersion, watch, isEdit, userId]);

    // SaveStatus component removed

    return (
        <form onSubmit={handleSubmit(onSubmit)} className=" bg-gray-50 min-h-screen">

            <div className='px-6 py-4 bg-white  shadow flex justify-between items-center sticky top-0 z-40'>
                <div className="flex items-center gap-4">
                    {location.state?.from && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(location.state.from)}
                        >
                            Back
                        </Button>
                    )}
                    <h2>{isEdit ? 'Edit Employee' : 'Add Employee'}</h2>
                </div>
                <div className="flex items-center gap-2 bg-white ">
                    {isEdit ? (
                        <>
                            <Button type="submit" className="mr-2">Save Changes</Button>
                            <Button type="button" variant="outline" onClick={submitAndExit}>Save and Exit</Button>
                        </>
                    ) : (
                        <>
                            <Button type="button" className="mr-2" onClick={submitAndKeep}>Save</Button>
                            <Button type="submit" variant="outline">Save and New</Button>
                            <Button type="button" variant="outline" onClick={submitAndExit}>Save and Exit</Button>
                        </>
                    )}
                </div>
            </div>

            <main className='space-y-6 m-6'>

                {/* MAIN SECTION */}
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* auto-save UI removed */}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <Label className="mb-1">Role <span className="text-red-500">*</span></Label>
                                <Controller
                                    name="roleId"
                                    control={control}
                                    rules={{ required: 'Role is required' }}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ''}
                                            onValueChange={(v) => {
                                                field.onChange(v);
                                                handleBlurSave();
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="select role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {roles.filter(r => !(typeof r?.hierarchy_level === 'number' && r.hierarchy_level <= 200)).map((r) => (
                                                    <SelectItem key={r.id} value={String(r.id)}>
                                                        {r.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.roleId && (
                                    <p className="text-red-500 text-sm mt-1">{errors.roleId.message}</p>
                                )}
                            </div>

                            <div>
                                <Label className="mb-1">Company <span className="text-red-500">*</span></Label>

                                <Controller
                                    name="company_id"
                                    control={control}
                                    rules={{ required: 'Company is required' }}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || "none"}
                                            onValueChange={(val) => {
                                                field.onChange(val === "none" ? "" : val);
                                                handleBlurSave();
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="select company" />
                                            </SelectTrigger>

                                            <SelectContent position="popper" disableScrollLock>
                                                <SelectItem value="none">select company</SelectItem>
                                                {companies.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.company_id && (
                                    <p className="text-red-500 text-sm mt-1">{errors.company_id.message}</p>
                                )}
                            </div>

                            <div>
                                <Label className="mb-1">Name <span className="text-red-500">*</span></Label>
                                <Input
                                    {...register('name', {
                                        required: 'Name is required',
                                        minLength: { value: 2, message: 'Minimum 2 characters' },
                                        maxLength: { value: 100, message: 'Maximum 100 characters' },
                                        pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' },
                                        onChange: (e) => {
                                            const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, '')
                                            setValue('name', v, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                    placeholder="Full name"
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                                )}
                            </div>

                            <div>
                                <Label className="mb-1">Email <span className="text-red-500">*</span></Label>
                                <Input
                                    type="email"
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: { value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, message: 'Enter a valid email' }
                                    })}
                                    onBlur={handleBlurSave}
                                    placeholder="email@example.com"
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                                )}
                            </div>



                            <div>
                                <Label className="mb-1">Contact Primary <span className="text-red-500">*</span></Label>
                                <Input
                                    inputMode="numeric"
                                    {...register("contact_primary", {
                                        required: "Contact number is required",
                                        pattern: { value: /^[0-9]{10}$/, message: "Enter a valid 10-digit phone number" },
                                        onChange: (e) => {
                                            const v = (e.target.value || '').replace(/\D/g, '').slice(0, 10)
                                            setValue('contact_primary', v, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                    placeholder="Phone number"
                                />

                                {errors.contact_primary && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.contact_primary.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label className="mb-1">Department <span className="text-red-500">*</span></Label>

                                <Controller
                                    name="department_id"
                                    control={control}
                                    rules={{ required: 'Department is required' }}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || "none"} // <default to "none" if empty
                                            onValueChange={(val) => {
                                                field.onChange(val === "none" ? "" : val); // convert back to empty string
                                                handleBlurSave();
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="select department" />
                                            </SelectTrigger>

                                            <SelectContent position="popper" disableScrollLock>
                                                <SelectItem value="none">select department</SelectItem>
                                                {departments.map((d) => (
                                                    <SelectItem key={d.id} value={String(d.id)}>
                                                        {d.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.department_id && (
                                    <p className="text-red-500 text-sm mt-1">{errors.department_id.message}</p>
                                )}
                            </div>

                            <div>
                                <Label className="mb-1">Work Location <span className="text-red-500">*</span></Label>
                                <Input
                                    {...register('work_location', { required: 'Work Location is required' })}
                                    onBlur={handleBlurSave}
                                    placeholder="City"
                                />
                                {errors.work_location && (
                                    <p className="text-red-500 text-sm mt-1">{errors.work_location.message}</p>
                                )}
                            </div>

                            <div>
                                <Label className="mb-1">Department Head </Label>

                                <Controller
                                    name="department_head_id"
                                    control={control}
                                    // rules={{ required: 'Department Head is required' }}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || "none"} // <default to "none" if empty
                                            onValueChange={(val) => {
                                                field.onChange(val === "none" ? "" : val); // convert back to empty string
                                                handleBlurSave();
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="select dept head" />
                                            </SelectTrigger>

                                            <SelectContent position="popper" disableScrollLock>
                                                <SelectItem value="none">select dept head</SelectItem>
                                                {departmentHeadOptions.map((u) => (
                                                    <SelectItem key={u.id} value={String(u.id)}>
                                                        {u.name} ({u.email})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.department_head_id && (
                                    <p className="text-red-500 text-sm mt-1">{errors.department_head_id.message}</p>
                                )}
                            </div>

                        </div>
                    </CardContent>
                </Card>

                {/* JOB / EMPLOYMENT DETAILS */}
                <Card>
                    <CardHeader>
                        <CardTitle>Job / Employment Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

                            <div>
                                <Label className="mb-1">Payroll Code (Auto Generate)</Label>
                                <Input {...register('payroll_code')} onBlur={handleBlurSave} placeholder="ITPL000001" />
                            </div>

                            <div>
                                <Label className="mb-1">Manager</Label>

                                <Controller
                                    name="manager_id"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || "none"} // <default to "none" if empty
                                            onValueChange={(val) => {
                                                field.onChange(val === "none" ? "" : val); // convert back to empty string
                                                handleBlurSave();
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="select manager" />
                                            </SelectTrigger>

                                            <SelectContent position="popper" disableScrollLock>
                                                <SelectItem value="none">select manager</SelectItem>
                                                {managerCandidates.map((u) => (
                                                    <SelectItem key={u.id} value={String(u.id)}>
                                                        {u.name} ({u.email})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            <div>
                                <Label className="mb-1">Designation</Label>
                                <Controller
                                    name="designation"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ''}
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                handleBlurSave();
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="select designation" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {designations.map((d) => (
                                                    <SelectItem key={d.id} value={String(d.name || '')}>
                                                        {d.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            <div>
                                <Label className="mb-1">Date of Joining (DOJ)</Label>
                                <Input type="date" {...register("doj")} onBlur={handleBlurSave} />
                            </div>

                            <div>
                                <Label className="mb-1">Total Experience (years)</Label>
                                <Input {...register("total_experience")} onBlur={handleBlurSave} placeholder="e.g. 3" />
                            </div>

                            <div>
                                <Label className="mb-1">Client Name</Label>
                                <Input {...register("client_name")} onBlur={handleBlurSave} />
                            </div>

                            <div>
                                <Label className="mb-1">Client Code</Label>
                                <Input {...register("client_code")} onBlur={handleBlurSave} />
                            </div>

                            <div>
                                <Label className="mb-1">On Probation</Label>

                                <Controller
                                    name="is_on_probation"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={typeof field.value === 'boolean' ? String(field.value) : (field.value ?? "")}
                                            onValueChange={(val) => {
                                                field.onChange(val || "");
                                                handleBlurSave();
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="select" />
                                            </SelectTrigger>

                                            <SelectContent position="popper" disableScrollLock>
                                                <SelectItem value="true">Yes</SelectItem>
                                                <SelectItem value="false">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            <div>
                                <Label className="mb-1">Probation End Date</Label>
                                <Input type="date" {...register("probation_end_date")} onBlur={handleBlurSave} />
                            </div>

                            <div>
                                <Label className="mb-1">Date of Leaving (DOL)</Label>
                                <Input type="date" {...register("dol")} onBlur={handleBlurSave} />
                            </div>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <Label className="mb-1">Work Mode</Label>
                                <Controller
                                    name="work_mode"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || 'OFFICE'}
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                handleBlurSave();
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select work mode" />
                                            </SelectTrigger>
                                            <SelectContent position="popper" disableScrollLock>
                                                <SelectItem value="OFFICE">Office</SelectItem>
                                                <SelectItem value="REMOTE">Remote (Permanent WFH)</SelectItem>
                                                <SelectItem value="HYBRID">Hybrid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            {watch('work_mode') === 'HYBRID' && (
                                <div className="md:col-span-2">
                                    <Label className="mb-2">Hybrid Office Days</Label>
                                    <div className="flex flex-wrap gap-3">
                                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                                            const selected = Array.isArray(watch('hybrid_office_days')) && watch('hybrid_office_days').includes(day);
                                            return (
                                                <label key={day} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!selected}
                                                        onChange={(e) => {
                                                            const list = Array.isArray(getValues('hybrid_office_days')) ? [...getValues('hybrid_office_days')] : [];
                                                            const has = list.includes(day);
                                                            const next = e.target.checked ? (has ? list : [...list, day]) : list.filter(d => d !== day);
                                                            setValue('hybrid_office_days', next, { shouldDirty: true, shouldValidate: false });
                                                            handleBlurSave();
                                                        }}
                                                    />
                                                    <span>{day}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* PERSONAL DETAILS SECTION */}
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <Label className="mb-1">Date of Birth</Label>
                                <Input type="date" {...register("dob")} onBlur={handleBlurSave} />
                            </div>

                            {/* -Gender (Shadcn Select) -*/}
                            <div>
                                <Label className="mb-1">Gender</Label>
                                <Controller
                                    name="gender"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                handleBlurSave();
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {genders.map((g) => (
                                                    <SelectItem key={g.id} value={String(g.name || "")}>{g.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            <div>
                                <Label className="mb-1">Blood Group</Label>
                                <Controller
                                    name="blood_group"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                handleBlurSave();
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {bloodGroups.map((b) => (
                                                    <SelectItem key={b.id} value={String(b.name || "")}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            
                            {/* -Marital Status (Shadcn Select) -*/}
                            <div>
                                <Label className="mb-1">Marital Status</Label>
                                <Controller
                                    name="marital_status"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            value={field.value || ""}
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                handleBlurSave();
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {maritalStatuses.map((m) => (
                                                    <SelectItem key={m.id} value={String(m.name || "")}>{m.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>

                            <div>
                                <Label className="mb-1">Date of Marriage</Label>
                                <Input type="date" {...register("date_of_marriage")} onBlur={handleBlurSave} disabled={String(watch('marital_status') || '').toLowerCase() === 'single'} />
                            </div>

                            <div>
                                <Label className="mb-1">Nominee Name</Label>
                                <Input
                                    {...register("nominee_name", {
                                        minLength: { value: 2, message: 'Minimum 2 characters' },
                                        maxLength: { value: 100, message: 'Maximum 100 characters' },
                                        pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' },
                                        onChange: (e) => {
                                            const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, '')
                                            setValue('nominee_name', v, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                />
                            </div>
                            
                            <div>
                                <Label className="mb-1">Nominee DOB</Label>
                                <Input type="date" {...register("nominee_dob")} onBlur={handleBlurSave} />
                            </div>

                            <div>
                                <Label className="mb-1">Nominee Relation</Label>
                                <Input
                                    {...register("nominee_relation", {
                                        minLength: { value: 2, message: 'Minimum 2 characters' },
                                        maxLength: { value: 50, message: 'Maximum 50 characters' },
                                        pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' },
                                        onChange: (e) => {
                                            const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, '')
                                            setValue('nominee_relation', v, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                />
                            </div>

                            <div>
                                <Label className="mb-1">Father's Name</Label>
                                <Input
                                    {...register("father_name", {
                                        minLength: { value: 2, message: 'Minimum 2 characters' },
                                        maxLength: { value: 100, message: 'Maximum 100 characters' },
                                        pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' },
                                        onChange: (e) => {
                                            const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, '')
                                            setValue('father_name', v, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                />
                            </div>
                            
                            <div>
                                <Label className="mb-1">Father's DOB</Label>
                                <Input type="date" {...register("father_dob")} onBlur={handleBlurSave} />
                            </div>

                            <div>
                                <Label className="mb-1">Mother's Name</Label>
                                <Input
                                    {...register("mother_name", {
                                        minLength: { value: 2, message: 'Minimum 2 characters' },
                                        maxLength: { value: 100, message: 'Maximum 100 characters' },
                                        pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' },
                                        onChange: (e) => {
                                            const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, '')
                                            setValue('mother_name', v, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                />
                            </div>

                            <div>
                                <Label className="mb-1">Mother's DOB</Label>
                                <Input type="date" {...register("mother_dob")} onBlur={handleBlurSave} />
                            </div>
                            
                            <div>
                                <Label className="mb-1">Spouse Name</Label>
                                <Input
                                    {...register("spouse_name", {
                                        minLength: { value: 2, message: 'Minimum 2 characters' },
                                        maxLength: { value: 100, message: 'Maximum 100 characters' },
                                        pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' },
                                        onChange: (e) => {
                                            const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, '')
                                            setValue('spouse_name', v, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                />
                            </div>

                            <div>
                                <Label className="mb-1">Spouse DOB</Label>
                                <Input type="date" {...register("spouse_dob")} onBlur={handleBlurSave} />
                            </div>

                            <div>
                                <Label className="mb-1">Contact Secondary</Label>
                                <Input
                                    inputMode="numeric"
                                    {...register("contact_secondary", {
                                        pattern: { value: /^[0-9]{10}$/, message: "Enter a valid 10-digit phone number" },
                                        onChange: (e) => {
                                            const v = (e.target.value || '').replace(/\D/g, '').slice(0, 10)
                                            setValue('contact_secondary', v, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                    placeholder="Alternate phone number"
                                />
                                {errors.contact_secondary && (
                                    <p className="text-red-500 text-sm mt-1">{errors.contact_secondary.message}</p>
                                )}
                            </div>

                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payroll & Bank Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <Label className="mb-1">Bank Name</Label>
                                <Input {...register('bank_name')} onBlur={handleBlurSave} />
                            </div>

                            <div>
                                <Label className="mb-1">IFSC Code</Label>
                                <Input {...register('ifsc_code')} onBlur={handleBlurSave} />
                            </div>

                            <div>
                                <Label className="mb-1">Account Number</Label>
                                <Input
                                    inputMode="numeric"
                                    {...register('account_number', {
                                        pattern: { value: /^[0-9]+$/, message: 'Numbers only' },
                                        onChange: (e) => {
                                            const v = (e.target.value || '').replace(/\D/g, '')
                                            setValue('account_number', v, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                    placeholder="Enter account number"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Account number will be stored securely.</p>
                            </div>

                            <div>
                                <Label className="mb-1">AADHAR Number</Label>
                                <Input
                                    inputMode="numeric"
                                    {...register('aadhar_number', {
                                        // required: 'Aadhaar number is required',
                                        pattern: { value: /^[0-9]{12}$/, message: 'Enter a valid 12-digit Aadhaar number' },
                                        onChange: (e) => {
                                            const v = (e.target.value || '').replace(/\D/g, '').slice(0, 12)
                                            setValue('aadhar_number', v, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                    placeholder="Aadhaar number"
                                />
                                {errors.aadhar_number && (
                                    <p className="text-red-500 text-sm mt-1">{errors.aadhar_number.message}</p>
                                )}
                            </div>

                            <div>
                                <Label className="mb-1">PAN Number</Label>
                                <Input {...register('pan_number')} onBlur={handleBlurSave} placeholder="Optional" />
                            </div>

                            <div>
                                <Label className="mb-1">ESI No</Label>
                                <Input
                                    inputMode="decimal"
                                    {...register('esi_no', {
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
                                            setValue('esi_no', raw, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                />
                            </div>
                            
                            <div>
                                <Label className="mb-1">UAN No</Label>
                                <Input
                                    inputMode="numeric"
                                    {...register('uan_no', {
                                        pattern: { value: /^[0-9]+$/, message: 'Numbers only' },
                                        onChange: (e) => {
                                            const v = (e.target.value || '').replace(/\D/g, '')
                                            setValue('uan_no', v, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                />
                            </div>

                            <div>
                                <Label className="mb-1">Basic</Label>
                                <Input
                                    inputMode="decimal"
                                    {...register('basic', {
                                        pattern: { value: /^[0-9,]+(\.[0-9]{1,2})?$/, message: 'Enter a valid number (max 2 decimals)' },
                                        onChange: (e) => {
                                            const raw = sanitizeMoney(e.target.value);
                                            const fmt = formatINR(raw);
                                            setValue('basic', fmt, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                />
                            </div>

                            <div>
                                <Label className="mb-1">HRA</Label>
                                <Input
                                    inputMode="decimal"
                                    {...register('hra', {
                                        pattern: { value: /^[0-9,]+(\.[0-9]{1,2})?$/, message: 'Enter a valid number (max 2 decimals)' },
                                        onChange: (e) => {
                                            const raw = sanitizeMoney(e.target.value);
                                            const fmt = formatINR(raw);
                                            setValue('hra', fmt, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                />
                            </div>
                            
                            <div>
                                <Label className="mb-1">Conveyance</Label>
                                <Input
                                    inputMode="decimal"
                                    {...register('conveyance', {
                                        pattern: { value: /^[0-9,]+(\.[0-9]{1,2})?$/, message: 'Enter a valid number (max 2 decimals)' },
                                        onChange: (e) => {
                                            const raw = sanitizeMoney(e.target.value);
                                            const fmt = formatINR(raw);
                                            setValue('conveyance', fmt, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                />
                            </div>

                            <div>
                                <Label className="mb-1">Other Allowance</Label>
                                <Input
                                    inputMode="decimal"
                                    {...register('other_allowance', {
                                        pattern: { value: /^[0-9,]+(\.[0-9]{1,2})?$/, message: 'Enter a valid number (max 2 decimals)' },
                                        onChange: (e) => {
                                            const raw = sanitizeMoney(e.target.value);
                                            const fmt = formatINR(raw);
                                            setValue('other_allowance', fmt, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                />
                            </div>

                            <div>
                                <Label className="mb-1">Bonus</Label>
                                <Input
                                    inputMode="decimal"
                                    {...register('bonus', {
                                        pattern: { value: /^[0-9,]+(\.[0-9]{1,2})?$/, message: 'Enter a valid number (max 2 decimals)' },
                                        onChange: (e) => {
                                            const raw = sanitizeMoney(e.target.value);
                                            const fmt = formatINR(raw);
                                            setValue('bonus', fmt, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                />
                            </div>
                            
                            <div>
                                <Label className="mb-1">Gross</Label>
                                <Input
                                    inputMode="decimal"
                                    {...register('gross', {
                                        pattern: { value: /^[0-9,]+(\.[0-9]{1,2})?$/, message: 'Enter a valid number (max 2 decimals)' },
                                        onChange: (e) => {
                                            const raw = sanitizeMoney(e.target.value);
                                            const fmt = formatINR(raw);
                                            setValue('gross', fmt, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                />
                            </div>

                            <div>
                                <Label className="mb-1">CTC</Label>
                                <Input
                                    inputMode="decimal"
                                    {...register('ctc', {
                                        pattern: { value: /^[0-9,]+(\.[0-9]{1,2})?$/, message: 'Enter a valid number (max 2 decimals)' },
                                        onChange: (e) => {
                                            const raw = sanitizeMoney(e.target.value);
                                            const fmt = formatINR(raw);
                                            setValue('ctc', fmt, { shouldValidate: true, shouldDirty: true })
                                        }
                                    })}
                                    onBlur={handleBlurSave}
                                />
                            </div>

                        </div>
                    </CardContent>
                </Card>   

                <Card>
                    <CardHeader>
                        <CardTitle>Educations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">Add schooling / degrees. You can add multiple rows.</div>
                            <div>
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
                                        // schedule quick save after append
                                        // scheduleSave(300);
                                    }}
                                >
                                    + Add Education
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {educationFields.length === 0 && (
                                <div className="text-sm text-muted-foreground">No education records yet.</div>
                            )}

                            <div className="border rounded-md overflow-hidden">
                                {/* Header Row */}
                                <div className="hidden xl:grid xl:grid-cols-12 bg-muted text-sm font-medium p-2 border-b">
                                    <div className="col-span-2">Level</div>
                                    <div className="col-span-2">Institution</div>
                                    <div className="col-span-2">Board / University</div>
                                    <div className="col-span-1 text-center">Passing Year</div>
                                    <div className="col-span-1 text-center">Percentage</div>
                                    <div className="col-span-3">Notes</div>
                                    <div className="col-span-1 text-right pr-2">Actions</div>
                                </div>

                                {/* Data Rows */}
                                {educationFields.map((field, index) => (
                                    <div
                                        key={field.id || `edu-${index}`}
                                        className="grid grid-cols-1 xl:grid-cols-12 gap-2 items-center border-b p-2 text-sm"
                                    >
                                        <div className="xl:col-span-2">
                                            <input
                                                {...register(`educations.${index}.level`)}
                                                className="w-full border rounded px-2 py-1"
                                                placeholder="10th / 12th / Graduation / PG / PhD"
                                                onBlur={handleBlurSave}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <input
                                                {...register(`educations.${index}.institution`)}
                                                className="w-full border rounded px-2 py-1"
                                                placeholder="Institution"
                                                onBlur={handleBlurSave}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <input
                                                {...register(`educations.${index}.board_or_university`)}
                                                className="w-full border rounded px-2 py-1"
                                                placeholder="Board / University"
                                                onBlur={handleBlurSave}
                                            />
                                        </div>

                                        <div className="md:col-span-1">
                                            <input
                                                {...register(`educations.${index}.passing_year`)}
                                                type="number"
                                                className="w-full border rounded px-2 py-1 text-center"
                                                placeholder="YYYY"
                                                onBlur={handleBlurSave}
                                            />
                                        </div>

                                        <div className="md:col-span-1">
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
                                        </div>

                                        <div className="md:col-span-3">
                                            <textarea
                                                {...register(`educations.${index}.notes`)}
                                                className="w-full border rounded px-2 py-1"
                                                placeholder="Notes"
                                                rows={1}
                                                onBlur={handleBlurSave}
                                            />
                                        </div>

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
                                                                // scheduleSave(300);
                                                            }}
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Experiences</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">Add previous employments. Most recent first.</div>
                            <div>
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
                                        // scheduleSave(300);
                                    }}
                                >
                                    + Add Experience
                                </Button>
                            </div>
                        </div>

                        <div className="border rounded-md overflow-hidden">
                            {/* header row (hidden on small screens) */}
                            <div className="hidden md:grid md:grid-cols-12 bg-muted text-sm font-medium p-2 border-b">
                                <div className="col-span-3">Company</div>
                                <div className="col-span-2">From</div>
                                <div className="col-span-2">To</div>
                                <div className="col-span-2">Designation</div>
                                <div className="col-span-2">Last Drawn CTC</div>
                                <div className="col-span-1 text-right pr-2">Actions</div>
                            </div>

                            {experienceFields.map((field, index) => (
                                <div key={field.id || `exp-${index}`} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center border-b p-2 text-sm">
                                    <div className="md:col-span-3">
                                        <input
                                            {...register(`experiences.${index}.company_name`)}
                                            className="w-full border rounded px-2 py-1"
                                            placeholder="Company name"
                                            onBlur={handleBlurSave}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <input
                                            {...register(`experiences.${index}.from_date`)}
                                            type="date"
                                            className="w-full border rounded px-2 py-1 text-center"
                                            onBlur={handleBlurSave}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <input
                                            {...register(`experiences.${index}.to_date`)}
                                            type="date"
                                            className="w-full border rounded px-2 py-1 text-center"
                                            onBlur={handleBlurSave}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <input
                                            {...register(`experiences.${index}.designation`)}
                                            className="w-full border rounded px-2 py-1"
                                            placeholder="Designation"
                                            onBlur={handleBlurSave}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
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
                                    </div>

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
                                                            // scheduleSave(300);
                                                        }}
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>

                                    {/* stacked area for responsibilities & reason on small screens */}
                                    <div className="md:col-span-12 mt-2 md:mt-0">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <textarea
                                                {...register(`experiences.${index}.responsibilities`)}
                                                className="w-full border rounded px-2 py-1"
                                                placeholder="Responsibilities (brief)"
                                                rows={2}
                                                onBlur={handleBlurSave}
                                            />
                                            <textarea
                                                {...register(`experiences.${index}.reason_for_leaving`)}
                                                className="w-full border rounded px-2 py-1"
                                                placeholder="Reason for leaving"
                                                rows={2}
                                                onBlur={handleBlurSave}
                                            />
                                        </div>

                                        {/* <div className="mt-2 flex items-center gap-3">
                                            <label className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    {...register(`experiences.${index}.is_current`)}
                                                    onBlur={handleBlurSave}
                                                />
                                                <span>Currently working here</span>
                                            </label>
                                        </div> */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Addresses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-3 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">Provide present and permanent addresses.</div>

                            <div className="flex items-center gap-2">
                                <input
                                    id="same-as-present"
                                    type="checkbox"
                                    checked={sameAsPresent}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setSameAsPresent(checked);

                                        // copy present -> permanent if checked
                                        const present = getValues('addresses.0') || {};
                                        if (checked) {
                                            const perm = {
                                                ...(present || {}),
                                                address_type: 'permanent',
                                                type: 'permanent',
                                            };
                                            // set full permanent object in form state
                                            setValue('addresses.1', perm, { shouldValidate: true, shouldDirty: true });
                                            setValue('addresses.1.address_1', present.address_1 || '', { shouldValidate: true, shouldDirty: true });
                                            setValue('addresses.1.address_2', present.address_2 || '', { shouldValidate: true, shouldDirty: true });
                                            setValue('addresses.1.landmark', present.landmark || '', { shouldValidate: true, shouldDirty: true });
                                            setValue('addresses.1.city', present.city || '', { shouldValidate: true, shouldDirty: true });
                                            setValue('addresses.1.state', present.state || '', { shouldValidate: true, shouldDirty: true });
                                            setValue('addresses.1.district', present.district || '', { shouldValidate: true, shouldDirty: true });
                                            setValue('addresses.1.pin_code', present.pin_code || '', { shouldValidate: true, shouldDirty: true });
                                            setValue('addresses.1.country', present.country || 'India', { shouldValidate: true, shouldDirty: true });
                                            // ensure field array reflects it
                                            if (addressFields[1]) {
                                                updateAddress(1, perm);
                                            } else {
                                                appendAddress({ ...perm, id: null });
                                            }
                                        } else {
                                            // when unchecked, clear the permanent address visually (leave a blank object)
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
                                        // schedule autosave
                                        // scheduleSave(200);
                                    }}
                                />
                                <label htmlFor="same-as-present" className="text-sm">Permanent same as Present</label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Present Address (index 0) */}
                            <div>
                                <div className="mb-2 font-medium">Present Address</div>

                                <div className="space-y-2">
                                    <input {...register(`addresses.0.address_1`)} placeholder="Line 1" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} />
                                    <input {...register(`addresses.0.address_2`)} placeholder="Line 2" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} />
                                    <input {...register(`addresses.0.landmark`)} placeholder="Landmark" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input {...register(`addresses.0.city`, { pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' }, onChange: (e) => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setValue('addresses.0.city', v, { shouldValidate: true, shouldDirty: true }) } })} placeholder="City" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} />
                                        <input {...register(`addresses.0.state`, { pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' }, onChange: (e) => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setValue('addresses.0.state', v, { shouldValidate: true, shouldDirty: true }) } })} placeholder="State" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input {...register(`addresses.0.district`, { pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' }, onChange: (e) => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setValue('addresses.0.district', v, { shouldValidate: true, shouldDirty: true }) } })} placeholder="District" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} />
                                        <input {...register(`addresses.0.pin_code`, {
                                            pattern: { value: /^[0-9]+$/, message: 'Numbers only' },
                                            maxLength: { value: 6, message: 'Maximum 6 digits' },
                                            onChange: (e) => {
                                                const v = (e.target.value || '').replace(/[^0-9]/g, '');
                                                setValue('addresses.0.pin_code', v, { shouldValidate: true, shouldDirty: true });
                                            }
                                        })} inputMode="numeric" maxLength={6} placeholder="Pin code" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} />
                                    </div>
                                    <input {...register(`addresses.0.country`, { pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' }, onChange: (e) => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setValue('addresses.0.country', v, { shouldValidate: true, shouldDirty: true }) } })} placeholder="Country" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} />

                                </div>
                            </div>

                            {/* Permanent Address (index 1) */}
                            <div>
                                <div className="mb-2 font-medium">Permanent Address</div>

                                <div className="space-y-2">
                                    <input {...register(`addresses.1.address_1`)} placeholder="Line 1" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} disabled={sameAsPresent} />
                                    <input {...register(`addresses.1.address_2`)} placeholder="Line 2" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} disabled={sameAsPresent} />
                                    <input {...register(`addresses.1.landmark`)} placeholder="Landmark" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} disabled={sameAsPresent} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <input {...register(`addresses.1.city`, { pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' }, onChange: (e) => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setValue('addresses.1.city', v, { shouldValidate: true, shouldDirty: true }) } })} placeholder="City" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} disabled={sameAsPresent} />
                                        <input {...register(`addresses.1.state`, { pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' }, onChange: (e) => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setValue('addresses.1.state', v, { shouldValidate: true, shouldDirty: true }) } })} placeholder="State" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} disabled={sameAsPresent} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input {...register(`addresses.1.district`, { pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' }, onChange: (e) => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setValue('addresses.1.district', v, { shouldValidate: true, shouldDirty: true }) } })} placeholder="District" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} disabled={sameAsPresent} />
                                        <input {...register(`addresses.1.pin_code`, {
                                            pattern: { value: /^[0-9]+$/, message: 'Numbers only' },
                                            maxLength: { value: 6, message: 'Maximum 6 digits' },
                                            onChange: (e) => {
                                                const v = (e.target.value || '').replace(/[^0-9]/g, '');
                                                setValue('addresses.1.pin_code', v, { shouldValidate: true, shouldDirty: true });
                                            }
                                        })} inputMode="numeric" maxLength={6} placeholder="Pin code" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} disabled={sameAsPresent} />
                                    </div>
                                    <input {...register(`addresses.1.country`, { pattern: { value: /^[A-Za-z\s]+$/, message: 'Only letters and spaces allowed' }, onChange: (e) => { const v = (e.target.value || '').replace(/[^A-Za-z\s]/g, ''); setValue('addresses.1.country', v, { shouldValidate: true, shouldDirty: true }) } })} placeholder="Country" className="w-full border rounded px-2 py-1" onBlur={handleBlurSave} disabled={sameAsPresent} />

                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </main>


        </form>
    );
}
