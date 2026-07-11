import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Loader2, AlertCircle } from "lucide-react";

export default function GoogleAuthHandler({ setUser, theme }) {
  const location = useLocation();
  const [error, setError] = useState(null);
  const hasRun = React.useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-invocation in development
    if (hasRun.current) return;
    hasRun.current = true;

    const handleAuth = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get("token");

        console.log("[GoogleAuthHandler] token present:", !!token);

        if (!token) {
          console.warn(
            "[GoogleAuthHandler] No token found, redirecting to login",
          );
          window.location.replace("/login");
          return;
        }

        // Save token first
        localStorage.setItem("token", token);

        // Fetch user data — add cache-busting param to avoid 304 responses
        const response = await axios.get(
          `https://punto-production-21ed.up.railway.app/api/v1/users/me/profile?_t=${Date.now()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          },
        );

        console.log(
          "[GoogleAuthHandler] /me response:",
          response.status,
          response.data,
        );

        const userData = response.data?.data?.user || response.data?.data?.doc;
        if (!userData) {
          console.error(
            "[GoogleAuthHandler] No user in response:",
            response.data,
          );
          setError("Failed to load your profile. Please try again.");
          return;
        }

        // New signup — account not yet verified, show verification page
        if (userData.isVerified === false) {
          console.log(
            "[GoogleAuthHandler] User not verified, redirecting to verification-sent",
          );
          window.location.replace("/verification-sent");
          return;
        }

        // Build the user state object
        const newState = {
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
        };

        // Persist to localStorage BEFORE navigating (setUser calls localStorage.setItem)
        setUser(newState);

        // Small delay so localStorage can settle before full reload
        await new Promise((r) => setTimeout(r, 100));

        // Determine destination
        let dest = "/landing";
        if (userData.company_id) {
          dest =
            userData.role === "manager" || userData.role === "admin"
              ? "/control-panel"
              : "/tickets";
        }

        console.log("[GoogleAuthHandler] Redirecting to:", dest);
        window.location.replace(dest);
      } catch (err) {
        console.error(
          "[GoogleAuthHandler] Error:",
          err?.response?.data || err.message,
        );
        const msg =
          err?.response?.data?.message ||
          "Authentication failed. Please try again.";
        setError(msg);
      }
    };

    handleAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center gap-4 ${theme.bg}`}
      >
        <AlertCircle className={`${theme.textP}`} size={48} />
        <h2 className={`text-xl font-bold ${theme.textP}`}>
          Something went wrong
        </h2>
        <p className={`${theme.textM} text-center max-w-sm`}>{error}</p>
        <button
          onClick={() => (window.location.href = "/login")}
          className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-[#534AB7] to-[#7F77DD] text-white font-semibold hover:opacity-90 transition"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center ${theme.bg}`}
    >
      <Loader2 className={`animate-spin mb-4 ${theme.textP}`} size={48} />
      <h2 className={`text-xl font-bold ${theme.textP}`}>
        Entering your workspace...
      </h2>
      <p className={`${theme.textM}`}>
        Almost there! Syncing your account info.
      </p>
    </div>
  );
}
