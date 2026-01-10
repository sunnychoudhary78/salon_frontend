// src/api/users.js
import api from './axios'

// Create a user account (backend: creates users table row)
// Expected backend route: POST /api/users
export async function createUser(payload) {
  // payload: { name, email, password, roleId, departmentId }
  const res = await api.post('/users', payload)
  return res.data
}

// optionally fetch a single user
export async function fetchUser(id) {
  const res = await api.get(`/users/${id}`)
  return res.data
}
