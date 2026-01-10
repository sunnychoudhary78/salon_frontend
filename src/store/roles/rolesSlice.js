// src/features/roles/rolesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'

// admin: list roles
export const fetchRoles = createAsyncThunk('roles/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/roles')
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message)
  }
})

export const createRole = createAsyncThunk('roles/create', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('/admin/roles', payload)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message)
  }
})

export const updateRole = createAsyncThunk('roles/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/admin/roles/${id}`, data)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message)
  }
})

export const deleteRole = createAsyncThunk('roles/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/admin/roles/${id}`)
    return id
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message)
  }
})

const slice = createSlice({
  name: 'roles',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (b) => {
    b
      .addCase(fetchRoles.pending, (s) => {
        s.loading = true
        s.error = null
      })
      .addCase(fetchRoles.fulfilled, (s, a) => {
        s.loading = false
        s.list = a.payload
      })
      .addCase(fetchRoles.rejected, (s, a) => {
        s.loading = false
        s.error = a.payload || a.error.message
      })
      .addCase(createRole.fulfilled, (s, a) => {
        s.list.push(a.payload)
      })
      .addCase(updateRole.fulfilled, (s, a) => {
        s.list = s.list.map((r) => (r.id === a.payload.id ? a.payload : r))
      })
      .addCase(deleteRole.fulfilled, (s, a) => {
        s.list = s.list.filter((r) => r.id !== a.payload)
      })
  },
})

export default slice.reducer
