import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function EmailVerificationHandler({ setUser, theme }) {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const hasRun = React.useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-invocation:
    // The first call deletes the token from DB (success), the second call
    // finds no token and returns "Token is invalid or has expired".
    if (hasRun.current) return;
    hasRun.current = true;

    const verify = async () => {
      try {
        const response = await axios.get(`https://punto-production-21ed.up.railway.app/api/v1/users/verifyEmail/${token}`);

        if (response.data.status === "success") {
          const { token: jwtToken, data } = response.data;
          
          // 1. Save token
          localStorage.setItem("token", jwtToken);
          
          // 2. Set user
          const userData = data.user;
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

          setStatus("success");
          
          // 3. Redirect: users without a company go to /setup to complete onboarding
          setTimeout(() => {
            if (userData.company_id) {
              navigate(userData.role === "manager" || userData.role === "admin" ? "/control-panel" : "/tickets");
            } else {
              navigate("/setup");
            }
          }, 2000);
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage(err.response?.data?.message || "Verification failed. The link may be invalid or expired.");
      }
    };

    verify();
  }, [token, navigate, setUser]);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-500 ${theme.bg}`}>
      <div className={`p-10 rounded-3xl border text-center transition-all ${theme.input} ${theme.border} shadow-xl max-w-[450px] w-full`}>
        {status === "verifying" && (
          <>
            <Loader2 className={`animate-spin mb-6 mx-auto ${theme.textP}`} size={48} />
            <h2 className={`text-2xl font-bold mb-2 ${theme.textP}`}>Verifying your email...</h2>
            <p className={`${theme.textM}`}>Please wait while we confirm your account.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="text-green-500 mb-6 mx-auto" size={64} />
            <h2 className={`text-2xl font-bold mb-2 ${theme.textP}`}>Email Verified!</h2>
            <p className={`${theme.textM}`}>Your account has been successfully verified. Redirecting you to your workspace...</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="text-red-500 mb-6 mx-auto" size={64} />
            <h2 className={`text-2xl font-bold mb-2 ${theme.textP}`}>Verification Failed</h2>
            <p className="text-red-500 mb-8">{errorMessage}</p>
            <button
              onClick={() => navigate("/login")}
              className={`w-full py-3.5 rounded-xl text-white font-bold text-[15px] bg-gradient-to-r ${theme.btn} shadow-lg`}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
