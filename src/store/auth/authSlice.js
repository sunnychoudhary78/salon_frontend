import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'
import { setPermissions } from '../permissions/permissionsSlice'

const normalizePermissions = (perms) => {
  if (!perms) return []
  if (Array.isArray(perms)) {
    return perms.map((p) => (typeof p === 'string' ? p : p?.name || p?.displayName || String(p)))
  }
  if (typeof perms === 'string') return [perms]
  if (perms?.name) return [perms.name]
  return [String(perms)]
}

const decodeJwt = (token) => {
  try {
    if (!token || typeof token !== 'string') return null
    const payload = token.split('.')[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

const isTokenExpired = (token) => {
  const data = decodeJwt(token)
  if (!data) return true
  if (typeof data.exp === 'number') {
    return data.exp * 1000 < Date.now()
  }
  return false
}

const extractTokenString = (resData) => {
  if (!resData) return null
  if (typeof resData === 'string') return resData
  if (resData.token && typeof resData.token === 'string') return resData.token
  if (resData.accessToken && typeof resData.accessToken === 'string') return resData.accessToken
  return null
}

const applyPermissionsFromUser = (user, dispatch) => {
  const perms = normalizePermissions(user?.permissions || [])
  dispatch(setPermissions(perms))
  return perms
}

const persistToken = (token) => {
  localStorage.setItem('LMS_accessToken', token)
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

const clearStoredAuth = () => {
  try {
    localStorage.removeItem('LMS_accessToken')
  } catch (_) { /* ignore */ }
  delete api.defaults.headers.common['Authorization']
}

let sessionRestorePromise = null

const fetchCurrentUser = async () => {
  const res = await api.get('/auth/me')
  const user = res.data?.user || res.data
  if (!user?.id && !user?.email) {
    throw new Error('Invalid user profile')
  }
  return user
}

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      const data = res.data

      const token = extractTokenString(data)
      if (!token) {
        return rejectWithValue('Login succeeded but no access token was returned')
      }

      persistToken(token)

      const user = data.user || null
      if (!user) {
        return rejectWithValue('Login succeeded but user profile was missing')
      }

      applyPermissionsFromUser(user, dispatch)
      return { user }
    } catch (err) {
      clearStoredAuth()
      const msg = err.response?.data?.message || err.message || 'Login failed'
      return rejectWithValue(msg)
    }
  }
)

export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue, dispatch, getState }) => {
    if (getState().auth.initialized) {
      return getState().auth.user
    }

    if (!sessionRestorePromise) {
      sessionRestorePromise = (async () => {
        const token = localStorage.getItem('LMS_accessToken')
        if (!token || isTokenExpired(token)) {
          clearStoredAuth()
          return null
        }

        persistToken(token)

        try {
          const user = await fetchCurrentUser()
          applyPermissionsFromUser(user, dispatch)
          return user
        } catch {
          clearStoredAuth()
          dispatch(setPermissions([]))
          return null
        }
      })().finally(() => {
        sessionRestorePromise = null
      })
    }

    try {
      return await sessionRestorePromise
    } catch (err) {
      clearStoredAuth()
      return rejectWithValue(err.message || 'Failed to restore session')
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  clearStoredAuth()
  dispatch(setPermissions([]))
  return null
})

const slice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    initialized: false,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.error = null
        state.initialized = true
        state.user = action.payload.user
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.initialized = true
        state.user = null
        state.error = action.payload || action.error.message
      })
      .addCase(restoreSession.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.loading = false
        state.initialized = true
        state.user = action.payload
      })
      .addCase(restoreSession.rejected, (state, action) => {
        state.loading = false
        state.initialized = true
        state.user = null
        state.error = action.payload || null
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.loading = false
        state.error = null
        state.initialized = true
      })
  },
})

export const { setUser } = slice.actions
export const selectAuth = (s) => s.auth
export const selectUser = (s) => s.auth.user
export const selectIsAuthenticated = (s) => !!s.auth.user
export default slice.reducer
