import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Sun, Moon, ArrowLeft, Loader2 } from "lucide-react";
import { DarkLogo, LightLogo } from "../components/logo";
import axios from "axios";

export default function AdminRegister({ isDarkMode, setIsDarkMode, theme, setUser }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    companyName: "",
    adminName: "",
    industry: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};
    if (!formData.companyName.trim()) newErrors.companyName = "Required";
    if (!formData.adminName.trim()) newErrors.adminName = "Required";
    if (!formData.industry.trim()) newErrors.industry = "Required";
    if (!formData.email.trim()) {
      newErrors.email = "Required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email";
    }
    if (!formData.password) {
      newErrors.password = "Required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Min 6 chars";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setApiError("");
    setSuccessMessage("");

    try {
      const payload = {
        name: formData.adminName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.password,
        role: "manager", // Since they registered via AdminRegister, they intend to be managers
      };

      const response = await axios.post(
        "https://punto-production-21ed.up.railway.app/api/v1/users/signup",
        payload
      );

      if (response.data.status === "success") {
        // Save the company name and industry for post-verification prefill
        localStorage.setItem("pending_company_name", formData.companyName.trim());
        localStorage.setItem("pending_company_industry", formData.industry.trim());

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
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border outline-none text-[13px] transition-all ${theme.input} ${theme.textP} ${errors[field] ? "border-red-500" : theme.border} focus:ring-1`;

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-500 ${theme.bg}`}
    >
      <button
        onClick={() => navigate("/signup")}
        className={`fixed top-6 left-6 p-2.5 rounded-full border shadow-sm ${isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"}`}
      >
        <ArrowLeft size={20} style={{ color: theme.primary }} />
      </button>

      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed top-6 right-6 p-2.5 rounded-full border shadow-sm ${isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"}`}
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
          <h1 className="text-3xl font-bold mb-2">
            <span style={{ color: isDarkMode ? "#E2E0FF" : "#1E1B3A" }}>
              Create{" "}
            </span>
            <span style={{ color: theme.primary }}> Campany </span>
            <span
              className={
                !isDarkMode
                  ? "bg-gradient-to-r from-[#7F6FF5] to-[#3ECFAA] bg-clip-text text-transparent"
                  : ""
              }
              style={{ color: isDarkMode ? "#3ECFAA" : "transparent" }}
            >
              Account
            </span>
          </h1>
          <p className={`text-[13px] ${theme.textM}`}>
            Your productivity journey begins here
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2
              className={`text-[15px] font-bold border-b pb-2 ${theme.border}`}
              style={{ color: isDarkMode ? "#E2E0FF" : "#1E1B3A" }}
            >
              Organization Details
            </h2>
            <div>
              <input
                type="text"
                placeholder="Company Name"
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
                className={inputClass("companyName")}
                style={{ "--tw-ring-color": theme.primary }}
              />
              {errors.companyName && (
                <p className="text-red-500 text-[10px] mt-1 ml-1">
                  {errors.companyName}
                </p>
              )}
            </div>
            <div>
              <input
                type="text"
                placeholder="Admin Name"
                value={formData.adminName}
                onChange={(e) =>
                  setFormData({ ...formData, adminName: e.target.value })
                }
                className={inputClass("adminName")}
                style={{ "--tw-ring-color": theme.primary }}
              />
              {errors.adminName && (
                <p className="text-red-500 text-[10px] mt-1 ml-1">
                  {errors.adminName}
                </p>
              )}
            </div>
          </div>
          <div>
              <input
                type="text"
                placeholder="Industry"
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                className={inputClass("industry")}
                style={{ "--tw-ring-color": theme.primary }}
              />
              {errors.industry && (
                <p className="text-red-500 text-[10px] mt-1 ml-1">
                  {errors.industry}
                </p>
              )}
            </div>

          <div className="space-y-4">
            <h2
              className={`text-[15px] font-bold border-b pb-2 ${theme.border}`}
              style={{ color: isDarkMode ? "#E2E0FF" : "#1E1B3A" }}
            >
              Account Information
            </h2>
            <div>
              <input
                type="email"
                placeholder="Email Work"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={inputClass("email")}
                style={{ "--tw-ring-color": theme.primary }}
              />
              {errors.email && (
                <p className="text-red-500 text-[10px] mt-1 ml-1">
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={inputClass("password")}
                style={{ "--tw-ring-color": theme.primary }}
              />
              {errors.password && (
                <p className="text-red-500 text-[10px] mt-1 ml-1">
                  {errors.password}
                </p>
              )}
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

          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 rounded-xl text-white font-bold text-[14px] bg-gradient-to-r ${theme.btn} shadow-lg mt-4 flex justify-center`}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Create Company Account"
            )}
          </motion.button>
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
