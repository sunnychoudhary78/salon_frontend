// src/api/employee.js
import api from './axios'

// Create a blank employee master row for a user (backend route we defined earlier)
export async function createEmployeeForUser(userId) {
  // POST /api/employees { user_id }
  const res = await api.post('/employees', { user_id: userId })
  return res.data
}

// Get full profile (includes children)
export async function fetchEmployeeDetails(employeeId) {
  const res = await api.get(`/employees/${employeeId}`)
  return res.data
}

// Partial master update
export async function updateEmployeeMaster(employeeId, payload) {
  const res = await api.patch(`/employees/${employeeId}`, payload)
  return res.data
}

// Section create/update (dynamic). section = 'addresses' | 'educations' | 'contacts' | etc.
export async function upsertSection(employeeId, section, payload) {
  // POST creates or updates by id if payload.id present
  const res = await api.post(`/employees/${employeeId}/${section}`, payload)
  return res.data
}

// update a specific child
export async function updateSectionItem(employeeId, section, childId, payload) {
  const res = await api.patch(`/employees/${employeeId}/${section}/${childId}`, payload)
  return res.data
}

// delete child
export async function deleteSectionItem(employeeId, section, childId) {
  const res = await api.delete(`/employees/${employeeId}/${section}/${childId}`)
  return res.data
}

// Toggle edit mode for employee details (manager/admin)
export async function setEmployeeEditEnabled(userId, enabled) {
  const res = await api.patch(`/employees/${userId}/edit-enabled`, { enabled })
  return res.data
}
