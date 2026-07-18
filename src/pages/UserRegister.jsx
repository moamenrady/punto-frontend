import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Sun, Moon, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react";
import { DarkLogo, LightLogo } from "../components/logo";
import axios from "axios";

export default function UserRegister({ isDarkMode, setIsDarkMode, theme, setUser }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    let e = {};
    if (!formData.name.trim()) e.name = "Required";
    if (!formData.email.trim()) e.email = "Required";
    if (!formData.password) e.password = "Required";
    if (formData.password !== formData.passwordConfirm)
      e.passwordConfirm = "Not matching";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setApiError("");
    setSuccessMessage("");

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.passwordConfirm,
      };

      const response = await axios.post(
        "https://punto-production-21ed.up.railway.app/api/v1/users/signup",
        payload,
      );

      if (response.data.status === "success") {
        // Auto-login the user immediately
        try {
          const loginRes = await axios.post(
            "https://punto-production-21ed.up.railway.app/api/v1/users/login",
            {
              email: formData.email.trim(),
              password: formData.password,
            }
          );

          if (loginRes.data.status === "success") {
            localStorage.setItem("token", loginRes.data.token);
            const userData = loginRes.data.data.user;
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
          }
        } catch (loginErr) {
          console.error("Auto-login failed after signup:", loginErr);
        }

        setSuccessMessage("Your account has been created! A verification email has been sent. Please check your inbox.");
        setTimeout(() => {
          navigate("/verification-sent");
        }, 3000);
      }
    } catch (err) {
  const msg = err.response?.data?.message || "";
  if (msg.includes("duplicate key") || msg.includes("E11000")) {
    setApiError("An account with this email already exists.");
  } else {
    setApiError(msg || "Something went wrong.");
  }
}finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-500 ${theme.bg}`}
    >
      <button
        onClick={() => navigate("/login")}
        className={`fixed top-6 left-6 p-2.5 rounded-full border shadow-sm z-50 ${isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"}`}
      >
        <ArrowLeft size={20} style={{ color: theme.primary }} />
      </button>

      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed top-6 right-6 p-2.5 rounded-full border shadow-sm z-50 ${isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"}`}
      >
        {isDarkMode ? (
          <Sun size={20} className="text-[#E2E0FF]" />
        ) : (
          <Moon size={20} className="text-[#534AB7]" />
        )}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px]"
      >
        <div className="text-center mb-10">
          {isDarkMode ? (
            <DarkLogo primary={theme.primary} accent={theme.accent} />
          ) : (
            <LightLogo />
          )}
          <h1 className="text-3xl font-bold mb-2 mt-4 text-[#534AB7]">
            Create Your Account
          </h1>
          <p className={`text-[13px] ${theme.textM}`}>
            Join our platform and start managing your workspace
          </p>
        </div>
        
        <div className="space-y-3 mb-8">
          <motion.button
            whileHover={{
              y: -2,
              boxShadow: isDarkMode
                ? "0px 8px 20px rgba(0,0,0,0.4)"
                : "0px 8px 20px rgba(127, 119, 221, 0.12)",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = "https://punto-production-21ed.up.railway.app/api/v1/users/google"}
            className={`w-full flex items-center justify-center gap-2.5 py-3.5 border rounded-xl transition-all ${theme.border} ${theme.textP} ${theme.input} shadow-sm`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-[14px] font-medium">Continue with Google</span>
          </motion.button>
        </div>

        <div className="flex items-center mb-8">
          <div className={`flex-grow border-t ${theme.border}`}></div>
          <span className={`px-4 text-[11px] font-medium lowercase ${theme.textM}`}>or</span>
          <div className={`flex-grow border-t ${theme.border}`}></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border outline-none text-[13px] ${theme.input} ${theme.textP} ${errors.name ? "border-red-500" : theme.border} focus:ring-1`}
            />
            {errors.name && <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.name}</p>}
          </div>

          <div>
            <input
              type="email"
              placeholder="Work Email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className={`w-full px-4 py-3 rounded-xl border outline-none text-[13px] ${theme.input} ${theme.textP} ${errors.email ? "border-red-500" : theme.border} focus:ring-1`}
            />
            {errors.email && <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={`w-full px-4 py-3 rounded-xl border outline-none text-[13px] ${theme.input} ${theme.textP} ${errors.password ? "border-red-500" : theme.border}`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className={`absolute right-3 top-3.5 ${theme.textM}`}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {errors.password && <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.password}</p>}
            </div>

            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm"
                value={formData.passwordConfirm}
                onChange={(e) =>
                  setFormData({ ...formData, passwordConfirm: e.target.value })
                }
                className={`w-full px-4 py-3 rounded-xl border outline-none text-[13px] ${theme.input} ${theme.textP} ${errors.passwordConfirm ? "border-red-500" : theme.border}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className={`absolute right-3 top-3.5 ${theme.textM}`}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              {errors.passwordConfirm && <p className="text-red-500 text-[10px] mt-1 ml-1">{errors.passwordConfirm}</p>}
            </div>
          </div>

          {apiError && (
            <p className="bg-red-50 text-red-500 text-[11px] p-3 rounded-xl text-center">
              {apiError}
            </p>
          )}

          {successMessage && (
            <p className="bg-green-50 text-green-600 text-[12px] font-medium p-3 rounded-xl text-center shadow-sm border border-green-100">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 rounded-xl text-white font-bold text-[14px] bg-gradient-to-r ${theme.btn} shadow-lg flex justify-center`}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className={`text-[13px] ${theme.textM}`}>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold hover:underline"
              style={{ color: theme.primary }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
