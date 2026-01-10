// src/features/permissions/permissionsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'

// fetch all permissions (admin page)
export const fetchAllPermissions = createAsyncThunk(
  'permissions/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/auth/permissions')
      console.log("permissions from permissions slice", res.data);
      return res.data

    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

// We intentionally don't persist permissions to localStorage anymore.
// Permissions are fetched each session from the backend or derived from a token.

const slice = createSlice({
  name: 'permissions',
  initialState: {
    list: [], // all permissions metadata (for admin)
    myPermissions: [], // flattened permissions for current user
    loading: false,
    error: null,
  },
  reducers: {
    setPermissions: (state, action) => {
      let permissions = action.payload || []
      if (!Array.isArray(permissions)) {
        if (Array.isArray(permissions.permissions)) permissions = permissions.permissions
        else if (Array.isArray(permissions.data)) permissions = permissions.data
        else permissions = []
      }
      // Normalize to an array of permission name strings
      state.myPermissions = permissions
        .map((p) => (typeof p === 'string' ? p : p?.name || p?.displayName || ''))
        .filter(Boolean)
    },
    clearPermissions: (state) => {
      state.myPermissions = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllPermissions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllPermissions.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchAllPermissions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
  },
})

export const { setPermissions, clearPermissions } = slice.actions

// selectors
export const selectAllPermissions = (s) => s.permissions.list
export const selectMyPermissions = (s) => s.permissions.myPermissions
export const selectHasPermission = (perm) => (s) => s.permissions.myPermissions.includes(perm)

// selector factory: returns a selector that checks if the user has ANY of the given permissions
export const selectHasAnyPermission = (perms = []) => (s) => {
  if (!Array.isArray(perms) || perms.length === 0) return false
  const mine = s.permissions.myPermissions || []
  return perms.some((p) => mine.includes(p))
}

export default slice.reducer
