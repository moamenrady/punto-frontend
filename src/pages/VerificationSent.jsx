import React from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DarkLogo, LightLogo } from "../components/logo";

export default function VerificationSent({ isDarkMode, theme, user }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      if (user.company_id) {
        navigate(user.role === "manager" || user.role === "admin" ? "/control-panel" : "/tickets");
      }
    }
  }, [user, navigate]);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-500 ${theme.bg}`}>
      <button
        onClick={() => navigate("/login")}
        className={`fixed top-6 left-6 p-2.5 rounded-full border shadow-sm z-50 ${isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"}`}
      >
        <ArrowLeft size={20} style={{ color: theme.primary }} />
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[500px] text-center"
      >
        <div className="mb-10">
          {isDarkMode ? (
            <DarkLogo primary={theme.primary} accent={theme.accent} />
          ) : (
            <LightLogo />
          )}
        </div>

        <div className={`p-10 rounded-3xl border transition-all ${isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"} shadow-xl`}>
          <div className="w-20 h-20 bg-gradient-to-tr from-[#7F6FF5] to-[#3ECFAA] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#7F6FF533]">
            <Mail size={40} className="text-white" />
          </div>

          <h1 className="text-3xl font-bold mb-4" style={{ color: isDarkMode ? "#E2E0FF" : "#1E1B3A" }}>
            Check your email
          </h1>
          
          <p className={`text-[15px] mb-8 leading-relaxed ${theme.textM}`}>
            We've sent a verification link to your email address. Please click the link to verify your account and continue setting up your workspace.
          </p>

          <div className="space-y-4">
            <button
              onClick={() => {
                if (user) {
                  navigate("/setup");
                } else {
                  navigate("/login");
                }
              }}
              className={`w-full py-4 rounded-xl text-white font-bold text-[15px] bg-gradient-to-r ${theme.btn} shadow-lg hover:scale-[1.02] transition-transform`}
            >
              I've verified my email
            </button>
            
            <p className={`text-[13px] ${theme.textM}`}>
              Didn't receive the email?{" "}
              <button className="font-bold hover:underline" style={{ color: theme.primary }}>
                Resend link
              </button>
            </p>
          </div>
        </div>

        <p className={`mt-10 text-[13px] ${theme.textM}`}>
          Need help? <a href="#" className="font-bold hover:underline" style={{ color: theme.primary }}>Contact Support</a>
        </p>
      </motion.div>
    </div>
  );
}
