import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, selectAuth } from "../store/auth/authSlice";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Eye, EyeOff, Flower2, Home, Lock, Mail, Scissors, Smile } from "lucide-react";
import { appConfig } from "../config/appConfig";

const base = import.meta.env.BASE_URL;

const highlights = [
  {
    title: "Hair Styling",
    subtitle: "Trendy Looks",
    icon: Scissors,
  },
  {
    title: "Skin Care",
    subtitle: "Glowing Skin",
    icon: Smile,
  },
  {
    title: "Beauty Services",
    subtitle: "Feel Confident",
    icon: Flower2,
  },
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useSelector(selectAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await dispatch(
        login({
          email,
          password,
        })
      ).unwrap();

      navigate(from, {
        replace: true,
      });
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  useEffect(() => {
    document.title = "Login | Catchy Admin";
  }, []);

  if (auth.initialized && auth.user) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="relative min-h-screen w-screen overflow-hidden bg-black text-white">
      <img
        src={`${base}login.png`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[68%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/55" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 lg:justify-between lg:px-12">
      <section className="hidden max-w-xl flex-1 flex-col justify-between self-stretch py-6 lg:flex">
          <img
            src={`${base}${appConfig.logo}`}
            alt="Catchy Admin"
            className="h-24 w-auto object-contain object-left"
          />

          <div className="max-w-md">
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-[#f3e6c8]">
              Beauty Care
              <span className="block">For Everyone</span>
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-stone-300">
              Professional hair, skin & beauty services with a premium
              experience.
            </p>
          </div>

          <ul className="flex gap-8">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex flex-col items-center text-center">
                  <span className="flex size-14 items-center justify-center rounded-full border border-[#e8d2a2]/70 text-[#f3ddb0]">
                    <Icon className="size-5" strokeWidth={1.4} />
                  </span>
                  <span className="mt-3 text-sm font-medium text-white">
                    {item.title}
                  </span>
                  <span className="text-xs text-[#f3ddb0]/80">{item.subtitle}</span>
                </li>
              );
            })}
          </ul>
      </section>

      <section className="flex w-full max-w-[340px] shrink-0 items-center justify-center">
        <div className="relative w-full rounded-3xl border border-white/20 bg-black/25 p-5 shadow-2xl shadow-black/30 backdrop-blur-md">
          <Link
            to="/"
            aria-label="Home"
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#f3ddb0] hover:bg-white/20"
          >
            <Home className="size-4" />
          </Link>
          <div className="mb-4 flex flex-col items-center text-center">
            <img
              src={`${base}${appConfig.logo}`}
              alt="Catchy Admin"
              className="mb-2 h-14 w-auto object-contain"
            />
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Welcome Back
            </h2>
            <p className="mt-1 text-xs text-stone-300">
              Login to your salon management account
            </p>
          </div>

          {auth.error && (
            <div className="mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-3.5 py-3 text-[13px] text-red-200">
              {auth.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-2 text-xs text-stone-300">
                <Mail className="size-3.5 text-[#f3ddb0]" />
                Email Address
              </span>
              <input
                type="text"
                placeholder="Enter your email or employee ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-stone-400 focus:border-[#e8d2a2]/80"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-2 text-xs text-stone-300">
                <Lock className="size-3.5 text-[#f3ddb0]" />
                Password
              </span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 w-full rounded-xl border border-white/15 bg-white/10 px-3 pr-10 text-sm text-white outline-none placeholder:text-stone-400 focus:border-[#e8d2a2]/80"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-stone-300">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-3.5 accent-[#e8d2a2]"
                />
                Remember me
              </label>
              <a href="#contact-admin" className="text-[#f3ddb0] hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={auth.loading}
              className="flex h-10 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#f6e7c1] to-[#c6964a] text-sm font-semibold text-stone-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {auth.loading ? "Signing in..." : "Login →"}
            </button>
          </form>

          <p id="contact-admin" className="mt-4 text-center text-xs text-stone-300">
            Don't have an account?{" "}
            <a href="#contact-admin" className="font-medium text-[#e7b15a] hover:underline">
              Contact Admin
            </a>
          </p>
        </div>
      </section>
      </div>
    </div>
  );
}
