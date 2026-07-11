import React, { useState } from "react";
import { Eye, Sun, Moon, Mail, Loader2, EyeOff } from "lucide-react";
import { DarkLogo, LightLogo } from "../components/logo";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

export default function VertexLoginPage({
  isDarkMode,
  setIsDarkMode,
  theme,
  setUser,
}) {
  const navigate = useNavigate();
  const [view, setView] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    let e = {};
    if (!formData.email) e.email = "Email is required";
    if (!formData.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setApiError("");

    try {
      const response = await axios.post(
        "https://punto-production-21ed.up.railway.app/api/v1/users/login",
        {
          email: formData.email,
          password: formData.password,
        },
      );

      if (response.data.status === "success") {
        const token = response.data.token;
        const userData = response.data.data?.user || response.data.user;

        if (!userData) {
          throw new Error("User data missing from response.");
        }

        // 1. Save the token for API calls
        localStorage.setItem("token", token);

        // 2. Set user state
        setUser({
          _id: userData._id,
          name: userData.name ?? "",
          email: userData.email ?? "",
          role: userData.role ?? "",
          company_id: userData.company_id ?? null,
          phone: userData.phone ?? "+20 100 000 0000",
          dept: userData.dept ?? "IT Department",
          location: userData.location ?? "",
          isOnline: true,
          avatar: userData.photo ?? null,
        });

        // 3. Redirect based on company membership and role
        if (userData.company_id) {
          if (userData.role === "manager" || userData.role === "admin") {
            navigate("/control-panel");
          } else {
            navigate("/tickets");
          }
        } else {
          navigate("/setup");
        }
      }
    } catch (err) {
      setApiError(
        err.response?.data?.message || err.message || "Login failed.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError("");
    setApiSuccess("");
    try {
      const response = await axios.post(
        "https://punto-production-21ed.up.railway.app/api/v1/users/forgotPassword",
        {
          email: formData.email,
        },
      );
      if (response.data.status === "success") {
        setApiSuccess("Reset link sent to your email!");
      }
    } catch (err) {
      setApiError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const socialHover = {
    y: -2,
    boxShadow: isDarkMode
      ? "0px 8px 20px rgba(0,0,0,0.4)"
      : "0px 8px 20px rgba(127, 119, 221, 0.12)",
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-4 transition-all duration-500 ${theme.bg}`}
    >
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed top-4 right-4 p-2.5 rounded-full border transition-all shadow-sm z-50 ${isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"}`}
      >
        {isDarkMode ? (
          <Sun size={18} className="text-[#E2E0FF]" />
        ) : (
          <Moon size={18} className="text-[#534AB7]" />
        )}
      </button>

      <div className="w-full max-w-[420px]">
        <AnimatePresence mode="wait">
          {view === "login" ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="text-center mb-8">
                {isDarkMode ? (
                  <DarkLogo primary={theme.primary} accent={theme.accent} />
                ) : (
                  <LightLogo />
                )}
                <h2
                  className="text-[24px] font-bold mb-1"
                  style={{ color: theme.primary }}
                >
                  Welcome back!
                </h2>
                <p className={`text-[13px] ${theme.textM}`}>
                  Don't have an account?
                  <Link
                    to="/signup"
                    className="font-bold hover:underline ml-1"
                    style={{ color: theme.primary }}
                  >
                    Sign up
                  </Link>
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <motion.button
                  whileHover={socialHover}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.href = "https://punto-production-21ed.up.railway.app/api/v1/users/google"}
                  className={`w-full flex items-center justify-center gap-2.5 py-3 border rounded-xl transition-all ${theme.border} ${theme.textP} ${theme.input}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  
                  <span className="text-[13px] font-medium">
                    Continue with Google
                  </span>
                </motion.button>
              </div>

              <div className="flex items-center mb-8">
                <div className={`flex-grow border-t ${theme.border}`}></div>
                <span
                  className={`px-4 text-[11px] font-medium lowercase ${theme.textM}`}
                >
                  or
                </span>
                <div className={`flex-grow border-t ${theme.border}`}></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`w-full px-4 py-3 rounded-xl border outline-none text-[13px] transition-all ${theme.input} ${theme.textP} ${errors.email ? "border-red-500" : theme.border} focus:ring-1`}
                    style={{ "--tw-ring-color": theme.primary }}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-[10px] mt-1 ml-1">
                      {errors.email}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className={`w-full px-4 py-3 rounded-xl border outline-none text-[13px] transition-all ${theme.input} ${theme.textP} ${errors.password ? "border-red-500" : theme.border} focus:ring-1`}
                    style={{ "--tw-ring-color": theme.primary }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-3.5 ${theme.textM}`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {errors.password && (
                    <p className="text-red-500 text-[10px] mt-1 ml-1">
                      {errors.password}
                    </p>
                  )}
                </div>

                {apiError && (
                  <p className="text-red-500 text-[11px] text-center font-bold italic">
                    {apiError}
                  </p>
                )}
                <motion.button
                  whileHover={{
                    y: -2,
                    boxShadow: isDarkMode
                      ? "0px 10px 25px rgba(0,0,0,0.4)"
                      : "0px 10px 25px rgba(83, 74, 183, 0.2)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 rounded-xl text-white font-bold text-[13px] transition-all bg-gradient-to-r ${theme.btn}`}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin mx-auto" size={18} />
                  ) : (
                    "Log In"
                  )}
                </motion.button>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={() => {
                    setView("forgot");
                    setApiError("");
                    setApiSuccess("");
                  }}
                  className="text-[13px] font-medium hover:underline"
                  style={{ color: theme.primary }}
                >
                  Forgot Password?
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="text-center mb-12">
                {isDarkMode ? (
                  <DarkLogo primary={theme.primary} accent={theme.accent} />
                ) : (
                  <LightLogo />
                )}
                <h2
                  className="text-[32px] font-bold mb-2 mt-4"
                  style={{ color: isDarkMode ? "#E2E0FF" : "#1E1B3A" }}
                >
                  Forgot{" "}
                  <span
                    className={
                      isDarkMode
                        ? "bg-gradient-to-r from-[#7F6FF5] to-[#3ECFAA] bg-clip-text text-transparent"
                        : ""
                    }
                    style={{ color: !isDarkMode ? "#534AB7" : "transparent" }}
                  >
                    Password?
                  </span>
                </h2>
                <p className={`text-[14px] ${theme.textM}`}>
                  Enter your email to reset your account
                </p>
              </div>
              <form onSubmit={handleForgot} className="space-y-8 mt-16">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter work email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`w-full px-5 py-4 rounded-xl border outline-none text-[14px] ${theme.input} ${theme.textP} ${theme.border} focus:ring-1`}
                    style={{ "--tw-ring-color": theme.primary }}
                  />
                  <Mail
                    className={`absolute right-4 top-4.5 ${theme.textM}`}
                    size={20}
                  />
                </div>
                {apiError && (
                  <div className="bg-red-50 text-red-500 text-[12px] p-3 rounded-xl text-center border border-red-100">
                    {apiError}
                  </div>
                )}
                {apiSuccess && (
                  <div className="bg-green-50 text-green-600 text-[12px] p-4 rounded-xl text-center font-bold border border-green-100 shadow-sm">
                    {apiSuccess}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 rounded-xl text-white font-bold text-[16px] bg-gradient-to-r shadow-lg transition-all hover:scale-[1.01] ${theme.btn}`}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin mx-auto" size={24} />
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="text-sm font-bold opacity-70 hover:opacity-100"
                    style={{ color: theme.primary }}
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
