import React from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, User, Sun, Moon, ArrowLeft } from "lucide-react";
import { DarkLogo, LightLogo } from "../components/logo";

export default function SignUpRole({ isDarkMode, setIsDarkMode, theme }) {
  const navigate = useNavigate();

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-between p-6 transition-all duration-500 ${theme.bg}`}
    >
      <button
        onClick={() => navigate("/")}
        className={`fixed top-6 left-6 p-2.5 rounded-full border transition-all shadow-sm z-50 ${isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"}`}
      >
        <ArrowLeft
          size={20}
          style={{ color: isDarkMode ? "#E2E0FF" : "#534AB7" }}
        />
      </button>

      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed top-6 right-6 p-2.5 rounded-full border transition-all shadow-sm z-50 ${isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"}`}
      >
        {isDarkMode ? (
          <Sun size={20} className="text-[#E2E0FF]" />
        ) : (
          <Moon size={20} className="text-[#534AB7]" />
        )}
      </button>

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[500px] text-center"
        >
          <div className="mb-10">
            {isDarkMode ? (
              <DarkLogo primary={theme.primary} accent={theme.accent} />
            ) : (
              <LightLogo />
            )}
            <h1 className="text-3xl font-bold mb-2">
              <span style={{ color: isDarkMode ? "#7F6FF5" : "#534AB7" }}>
                Seconds{" "}
              </span>
              <span style={{ color: isDarkMode ? "#E2E0FF" : "#1E1B3A" }}>
                to{" "}
              </span>
              <span style={{ color: isDarkMode ? "#3ECFAA" : "#534AB7" }}>
                Sign{" "}
              </span>
              <span
                className={
                  !isDarkMode
                    ? "bg-gradient-to-r from-[#7F6FF5] to-[#3ECFAA] bg-clip-text text-transparent"
                    : ""
                }
                style={{ color: isDarkMode ? "#9D90F8" : "transparent" }}
              >
                up!
              </span>
            </h1>
            <p className={`text-[13px] ${theme.textM}`}>
              Choose your role to get started
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <motion.div
              onClick={() => navigate("/signup/admin")}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`cursor-pointer p-6 rounded-2xl border transition-all ${isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-[#EEEDFE] border-[#DDD9FF]"} hover:border-[#7F6FF5]`}
            >
              <ShieldCheck size={28} color="#7F6FF5" className="mx-auto mb-3" />
              <h3
                className="font-bold text-[15px] mb-1"
                style={{ color: isDarkMode ? "#E2E0FF" : "#1E1B3A" }}
              >
                Campany
              </h3>
              <p className={`text-[11px] leading-tight ${theme.textM}`}>
                Create and manage teams and projects
              </p>
            </motion.div>

            <motion.div
              onClick={() => navigate("/signup/user")}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`cursor-pointer p-6 rounded-2xl border transition-all ${isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-[#EEEDFE] border-[#DDD9FF]"} hover:border-[#3ECFAA]`}
            >
              <User size={28} color="#3ECFAA" className="mx-auto mb-3" />
              <h3
                className="font-bold text-[15px] mb-1"
                style={{ color: isDarkMode ? "#E2E0FF" : "#1E1B3A" }}
              >
                User (Team member)
              </h3>
              <p className={`text-[11px] leading-tight ${theme.textM}`}>
                Join your organization and collaborate
              </p>
            </motion.div>
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

          <motion.button
            whileHover={{
              y: -2,
              boxShadow: isDarkMode
                ? "0px 8px 20px rgba(0,0,0,0.4)"
                : "0px 8px 20px rgba(127, 119, 221, 0.15)",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = "https://punto-production-21ed.up.railway.app/api/v1/users/google"}
            className={`w-full flex items-center justify-center gap-2.5 py-3.5 border rounded-xl mb-8 transition-all ${theme.border} ${isDarkMode ? "text-[#E2E0FF] bg-[#1E1B3A]" : "text-[#1E1B3A] bg-white"} shadow-sm`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
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
            <span className="text-[14px] font-medium">
              Continue with Google
            </span>
          </motion.button>

          <p className={`text-[13px] ${theme.textM}`}>
            Already have an account?
            <Link
              to="/"
              className="font-bold hover:underline ml-1"
              style={{ color: theme.primary }}
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      <div className="w-full text-center pb-4">
        <a
          href="#"
          className={`text-[12px] ${theme.textM} transition-colors underline inline-block`}
        >
          Contact Us
        </a>
      </div>
    </div>
  );
}
