// src/store/users/usersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'

// Fetch all users
export const fetchUsers = createAsyncThunk(
  'users/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/users')
      console.log("log the users", res.data);
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

// Delete a user
export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/users/${id}`)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

// Toggle active/inactive status for a user
export const toggleUserActive = createAsyncThunk(
  'users/toggleActive',
  async ({ id, active }, { rejectWithValue }) => {
    try {
      // assume backend accepts PATCH /users/:id with { active: boolean }
      const res = await api.patch(`/users/${id}`, { active })
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

const slice = createSlice({
  name: 'users',
  initialState: {
    list: [],
    loading: false,
    error: null,
    deleting: [], // array of user IDs being deleted
    updating: [], // array of user IDs being updated (active status)
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || action.error.message
      })
      // Delete user
      .addCase(deleteUser.pending, (state, action) => {
        state.deleting.push(action.meta.arg) // arg is the user ID
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.list = state.list.filter(user => user.id !== action.payload)
        state.deleting = state.deleting.filter(id => id !== action.payload)
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deleting = state.deleting.filter(id => id !== action.meta.arg)
        state.error = action.payload || action.error.message
      })
      // Toggle active
      .addCase(toggleUserActive.pending, (state, action) => {
        state.updating.push(action.meta.arg.id)
      })
      .addCase(toggleUserActive.fulfilled, (state, action) => {
        // backend returns updated user (or wrapper) - try to extract
        const payload = action.payload?.user || action.payload?.data || action.payload
        const updated = Array.isArray(payload) ? payload[0] : payload
        if (updated && updated.id) {
          state.list = state.list.map(u => (u.id === updated.id ? { ...u, ...updated } : u))
        }
        state.updating = state.updating.filter(id => id !== (action.meta.arg && action.meta.arg.id))
      })
      .addCase(toggleUserActive.rejected, (state, action) => {
        state.updating = state.updating.filter(id => id !== (action.meta.arg && action.meta.arg.id))
        state.error = action.payload || action.error.message
      })
  },
})

// Selectors
// selector: normalize possible server shapes to an array of user objects
export const selectUsers = (state) => {
  const val = state.users.list
  if (!val) return []
  if (Array.isArray(val)) return val
  // common wrappers: { users: [...] } or { data: [...] } or { result: [...] }
  if (Array.isArray(val.users)) return val.users
  if (Array.isArray(val.data)) return val.data
  if (Array.isArray(val.result)) return val.result
  // if server returned an object with `rows` or similar
  if (Array.isArray(val.rows)) return val.rows
  return []
}
export const selectUsersLoading = (state) => state.users.loading
export const selectUsersError = (state) => state.users.error
export const selectIsDeleting = (userId) => (state) => 
  state.users.deleting.includes(userId)
export const selectIsUpdating = (userId) => (state) => 
  (state.users.updating || []).includes(userId)

export default slice.reducer