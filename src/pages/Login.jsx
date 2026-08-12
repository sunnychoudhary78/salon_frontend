import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, selectAuth } from "../store/auth/authSlice";
import {
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useSelector(selectAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const from =
    location.state?.from?.pathname || "/dashboard";

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
    <div
      className="
        relative
        flex
        min-h-screen
        w-screen
        items-center
        justify-center
        overflow-hidden
        bg-gradient-to-br
        from-slate-50
        via-white
        to-indigo-50
        px-4
        py-8
      "
    >
      {/* =====================================================
          BACKGROUND DECORATION
          ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          -left-32
          -top-32
          h-96
          w-96
          rounded-full
          bg-indigo-200/20
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-32
          -right-32
          h-96
          w-96
          rounded-full
          bg-purple-200/20
          blur-3xl
        "
      />

      <style>{`
        @keyframes popup {
          0% {
            opacity: 0;
            transform: scale(0.96) translateY(18px);
          }

          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-popup {
          animation:
            popup
            0.55s
            cubic-bezier(0.16, 1, 0.3, 1)
            forwards;
        }
      `}</style>

      {/* =====================================================
          LOGIN CARD
          ===================================================== */}

      <div
        className="
          relative
          z-10
          w-full
          max-w-[450px]
          animate-popup
          overflow-hidden
          rounded-[24px]
          border
          border-slate-200/70
          bg-white/90
          p-7
          shadow-[0_25px_70px_rgba(15,23,42,0.10)]
          backdrop-blur-xl
          sm:p-9
        "
      >
        {/* ===================================================
            LOGO
            =================================================== */}

        <div
          className="
            mb-7
            flex
            flex-col
            items-center
            text-center
          "
        >
          <div
            className="
              mb-5
              flex
              h-[105px]
              w-[180px]
              items-center
              justify-center
            "
          >
            <img
              src="/logo.jpg"
              alt="Catchy Admin"
              className="
                max-h-[105px]
                max-w-[180px]
                object-contain
                transition-transform
                duration-300
                hover:scale-[1.03]
              "
            />
          </div>

          <h1
            className="
              text-[26px]
              font-bold
              tracking-[-0.04em]
              text-slate-900
            "
          >
            Welcome Back
          </h1>

          <p
            className="
              mt-1
              text-[13px]
              font-medium
              text-slate-500
            "
          >
            Please sign in to continue
          </p>
        </div>

        {/* ===================================================
            ERROR
            =================================================== */}

        {auth.error && (
          <div
            className="
              mb-5
              flex
              items-start
              gap-2.5
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-3.5
              py-3
              text-[13px]
              text-red-700
            "
          >
            <span>⚠️</span>

            <span className="leading-5">
              {auth.error}
            </span>
          </div>
        )}

        {/* ===================================================
            FORM
            =================================================== */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* EMAIL */}

          <div className="space-y-1.5">
            <label
              className="
                ml-1
                text-[11px]
                font-bold
                uppercase
                tracking-[0.06em]
                text-slate-600
              "
            >
              Email or ID
            </label>

            <input
              type="text"
              placeholder="Enter your email or employee ID"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              className="
                h-[52px]
                w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-4
                text-[14px]
                text-slate-900
                outline-none
                transition-all
                duration-200
                placeholder:text-slate-400
                focus:border-indigo-400
                focus:bg-white
                focus:ring-4
                focus:ring-indigo-500/10
              "
            />
          </div>

          {/* PASSWORD */}

          <div className="space-y-1.5">
            <label
              className="
                ml-1
                text-[11px]
                font-bold
                uppercase
                tracking-[0.06em]
                text-slate-600
              "
            >
              Password
            </label>

            <div className="relative">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
                className="
                  h-[52px]
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-4
                  pr-12
                  text-[14px]
                  text-slate-900
                  outline-none
                  transition-all
                  duration-200
                  placeholder:text-slate-400
                  focus:border-indigo-400
                  focus:bg-white
                  focus:ring-4
                  focus:ring-indigo-500/10
                "
              />

              <button
                type="button"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="
                  absolute
                  right-2
                  top-1/2
                  flex
                  h-9
                  w-9
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-400
                  transition-all
                  duration-200
                  hover:bg-indigo-50
                  hover:text-indigo-600
                "
              >
                {showPassword ? (
                  <FaEyeSlash size={15} />
                ) : (
                  <FaEye size={15} />
                )}
              </button>
            </div>
          </div>

          {/* =================================================
              SIGN IN BUTTON
              ================================================= */}

          <div className="pt-1">
            <button
              type="submit"
              disabled={auth.loading}
              className="
                flex
                h-[52px]
                w-full
                cursor-pointer
                items-center
                justify-center
                rounded-xl
                bg-gradient-to-r
                from-sky-600
                to-indigo-600
                text-[14px]
                font-bold
                text-white
                shadow-[0_10px_25px_rgba(79,70,229,0.22)]
                transition-all
                duration-200
                hover:-translate-y-[1px]
                hover:shadow-[0_14px_30px_rgba(79,70,229,0.28)]
                active:translate-y-0
                disabled:cursor-not-allowed
                disabled:opacity-60
                disabled:shadow-none
              "
            >
              {auth.loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="
                      h-5
                      w-5
                      animate-spin
                    "
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="
                        M4 12a8 8 0 018-8V0
                        C5.373 0 0 5.373 0 12h4
                        zm2 5.291A7.962 7.962 0 014 12H0
                        c0 3.042 1.135 5.824 3 7.938
                        l3-2.647z
                      "
                    />
                  </svg>

                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>

        {/* ===================================================
            CONTACT ADMIN
            =================================================== */}

        <div
          className="
            mt-7
            border-t
            border-slate-100
            pt-5
            text-center
          "
        >
          <p
            className="
              text-[13px]
              text-slate-500
            "
          >
            Don't have an account?{" "}
            <a
              href="#"
              className="
                font-semibold
                text-indigo-600
                transition-colors
                hover:text-indigo-700
                hover:underline
              "
            >
              Contact admin
            </a>
          </p>
        </div>
      </div>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <div
        className="
          absolute
          bottom-3
          left-0
          z-10
          w-full
          px-4
          text-center
          text-[11px]
          font-medium
          text-slate-400
        "
      >
        &copy; {new Date().getFullYear()} Immortal
        Technovation. All rights reserved.
      </div>
    </div>
  );
}