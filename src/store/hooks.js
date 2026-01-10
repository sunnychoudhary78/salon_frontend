// src/store/hooks.js
// Small convenience hooks so components import from one place
import { useDispatch, useSelector } from 'react-redux'
import { bindActionCreators } from 'redux'

// plain typed-style helpers (if you later migrate to TS, this file is a single place to convert)
export const useAppDispatch = () => useDispatch()
export const useAppSelector = useSelector

// optional helper to bind actions in components
export const useActions = (actions) => {
  const dispatch = useAppDispatch()
  return bindActionCreators(actions, dispatch)
}
