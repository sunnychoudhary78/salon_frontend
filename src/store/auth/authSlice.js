// src/features/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../api/axios'
import { setPermissions } from '../permissions/permissionsSlice'

// normalize permission payloads
const normalizePermissions = (perms) => {
  if (!perms) return []
  if (Array.isArray(perms)) {
    return perms.map((p) => (typeof p === 'string' ? p : p?.name || p?.displayName || String(p)))
  }
  if (typeof perms === 'string') return [perms]
  if (perms?.name) return [perms.name]
  return [String(perms)]
}

// decode JWT safely (base64url)
const decodeJwt = (token) => {
  try {
    if (!token || typeof token !== 'string') return null
    const payload = token.split('.')[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=')
    const json = atob(padded)
    return JSON.parse(json)
  } catch (e) {
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

// Note: we do NOT persist permissions to localStorage anymore.

// --- NEW: robust token extractor: returns string token or null
const extractTokenString = (resData) => {
  if (!resData) return null
  // common server shapes
  if (typeof resData === 'string') return resData
  if (resData.token && typeof resData.token === 'string') return resData.token
  if (resData.accessToken && typeof resData.accessToken === 'string') return resData.accessToken
  // if server accidentally returns { token: { ... } } or whole object, bail out
  return null
}

// login thunk
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue, dispatch }) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      const data = res.data
      console.log('login response:', data)

      const token = extractTokenString(data)
      if (!token) {
        // if server didn't provide token string, but set cookie, we may still be able to fetch /auth/me
        console.warn('No access token found in login response. If your server uses cookies, this may be OK.')
      } else {
        // persist raw token string only
        console.log("local set token", token);
        // Update localStorage token key from 'accessToken' to 'LMS_accessToken'
        localStorage.setItem('LMS_accessToken', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }

      // user may be provided
      const user = data.user || (data?.data && data.data.user) || null

      // fetch permissions from backend (prefer explicit endpoint)
      try {
        const p = await api.get('/auth/permissions')
        const perms = p.data?.permissions || p.data || []
        console.log('Fetched permissions:', perms)
        const normalized = normalizePermissions(perms)
        dispatch(setPermissions(normalized))
      } catch (permErr) {
        console.error('Failed to fetch permissions endpoint after login:', permErr)
        // fallback to token claims
        const claimPerms = normalizePermissions(decodeJwt(localStorage.getItem('LMS_accessToken'))?.permissions || decodeJwt(localStorage.getItem('LMS_accessToken'))?.perms || [])
        dispatch(setPermissions(claimPerms))
      }

      return { user }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed'
      return rejectWithValue(msg)
    }
  }
)

// restoreSession thunk
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const token = localStorage.getItem('LMS_accessToken')
      if (!token) {
        // no token stored -> nothing to restore
        return null
      }

      // If token is expired, clear and bail
      if (isTokenExpired(token)) {
        console.warn('Stored access token is expired; clearing.')
        localStorage.removeItem('LMS_accessToken')
        return null
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // try to fetch user and permissions from backend
      try {
        const [userRes, permsRes] = await Promise.all([api.get('/auth/me'), api.get('/auth/permissions')])
        const userData = userRes.data?.user || userRes.data
        const permsData = permsRes.data?.permissions || permsRes.data || []
        const normalized = normalizePermissions(permsData)
        dispatch(setPermissions(normalized))

        // Accept user data if it contains at least one identifying field
        if (!userData || (!userData.email && !userData.id && !userData.name)) {
          throw new Error('Invalid user data received from /auth/me')
        }
        return userData
      } catch (backendErr) {
        console.warn('Failed to restore from backend endpoints, falling back to JWT claims:', backendErr)
        // fallback: try to read minimal info from token claims
        const claims = decodeJwt(token) || {}
        const claimPerms = normalizePermissions(claims.permissions || claims.perms || claims.roles || [])
        dispatch(setPermissions(claimPerms))

        // if token contains a user-like claim, use it
        const maybeUser = claims.user || claims.sub || claims.email ? {
          email: claims.email || claims.sub || null,
          name: claims.name || claims.username || null,
        } : null

        if (maybeUser && maybeUser.email) return maybeUser

        // otherwise we couldn't restore
        localStorage.removeItem('LMS_accessToken')
        return rejectWithValue(null)
      }
    } catch (err) {
      console.error('Failed to restore session (unexpected):', err)
      localStorage.removeItem('LMS_accessToken')
      return rejectWithValue(null)
    }
  }
)

// logout (unchanged)
export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  // Frontend-only logout: clear token and permissions, no backend call
  try { localStorage.removeItem('LMS_accessToken') } catch (_) { }
  if (api?.defaults?.headers?.common) {
    delete api.defaults.headers.common['Authorization']
  }
  dispatch(setPermissions([]))
  return null
})

// slice (mostly unchanged) ...
const slice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: true,
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
        state.user = action.payload.user || action.payload
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
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
      .addCase(restoreSession.rejected, (state) => {
        state.loading = false
        state.initialized = true
        state.user = null
        localStorage.removeItem('LMS_accessToken')
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.loading = false
        state.error = null
        localStorage.removeItem('LMS_accessToken')
      })
  },
})

export const { setUser } = slice.actions
export const selectAuth = (s) => s.auth
export const selectUser = (s) => s.auth.user
export const selectIsAuthenticated = (s) => !!s.auth.user
export default slice.reducer
