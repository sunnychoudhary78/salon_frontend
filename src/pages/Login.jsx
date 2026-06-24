import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { login, selectAuth } from '../store/auth/authSlice'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function LoginPage() {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const auth = useSelector(selectAuth)

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const from = location.state?.from?.pathname || '/dashboard'

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await dispatch(login({ email, password })).unwrap()
            navigate(from, { replace: true })
        } catch (err) {
            console.error('Login failed', err)
        }
    }

    useEffect(() => {
        document.title = "Login | Immortal LMS";
    }, []);

    if (auth.initialized && auth.user) {
        return <Navigate to={from} replace />
    }

    return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 relative overflow-hidden">
            
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-sky-200/30 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
            
            <style>{`
                @keyframes popup {
                    0% { opacity: 0; transform: scale(0.95) translateY(20px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-popup {
                    animation: popup 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
            `}</style>

            <div className="m-4 md:max-w-md w-full bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/50 animate-popup relative z-10">
                <div className="text-center mb-6">
                    <img 
                        src={`${import.meta.env.VITE_FRONTEND_BASE_PATH || '/'}impower_logo.jpg`} 
                        alt="logo" 
                        className='h-16 mx-auto mb-4 object-contain hover:scale-105 transition-transform duration-300' 
                    />
                    <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
                    <p className="text-gray-500 text-sm mt-1">Please sign in to continue</p>
                </div>

                {auth.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm mb-6 flex items-center animate-pulse">
                        <span className="mr-2">⚠️</span> {auth.error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 ml-1 uppercase tracking-wide">Email or ID</label>
                        <input
                            type="text"
                            placeholder="Enter your email or employee ID"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-xl focus:outline-none transition-all duration-200 placeholder:text-gray-400"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600 ml-1 uppercase tracking-wide">Password</label>
                        <div className='relative'>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 rounded-xl focus:outline-none transition-all duration-200 placeholder:text-gray-400"
                            />
                            <button
                                type="button"
                                className='absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-sky-600 transition-colors cursor-pointer rounded-full hover:bg-sky-50'
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="cursor-pointer w-full py-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-semibold shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
                            disabled={auth.loading}
                        >
                            {auth.loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : 'Sign in'}
                        </button>
                    </div>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-500">
                        Don't have an account? <a href="#" className="text-sky-600 font-medium hover:text-sky-700 hover:underline transition-all">Contact admin</a>
                    </p>
                </div>
            </div>
            
            <div className="absolute bottom-4 text-center w-full text-xs text-gray-400 z-10">
                &copy; {new Date().getFullYear()} Immortal Technovation. All rights reserved.
            </div>
        </div>
    )
}
