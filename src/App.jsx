import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import LoginPage from "./pages/LoginPage";
import SignUpRole from "./pages/SignUpRole";
import UserRegister from "./pages/UserRegister";
import AdminRegister from "./pages/AdminRegister";
import SetupEnvironment from "./pages/SetupEnvironment";
import LandingPage from "./pages/LandingPage";
//import CreateCompanyPage from "./pages/CreateCompanyPage";
import CompanyControlPanel from "./pages/CompanyControlPanel";
import GoogleAuthHandler from "./pages/GoogleAuthHandler";
import VerificationSent from "./pages/VerificationSent";
import EmailVerificationHandler from "./pages/EmailVerificationHandler";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import TicketingPage from "./pages/TicketingPage";
import TicketDetailsPage from "./pages/TicketDetailsPage";
import StockManagementPage from "./pages/StockManagementPage";
import CreateTicketModal from "./components/CreateTicketModal";
import UserProfileModal from "./components/UserProfileModal";
import Settings from "./pages/Settings";
import TeamChat from "./pages/GroupChatPage"
import ReportsPage from "./pages/ReportsPage"

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

function MainApp({ themeObj, theme, setTheme, isDarkMode, setIsDarkMode, user, setUser }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [company, setCompany] = useState(null);
  const isAdmin =
    user?.role === "admin" ||
    user?.role === "manager" ||
    user?.dept?.toLowerCase() === "it" ||
    user?.dept?.toLowerCase() === "it department";
  const isManager = user?.role === "manager";

  const API_URL = "https://punto-production-21ed.up.railway.app/api/v1/tickets";

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("https://punto-production-21ed.up.railway.app/api/v1/companies/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.status === "success") {
          setCompany(response.data.data.company);
        }
      } catch (err) {
        console.error("Failed to fetch company data", err);
      }
    };
    if (user?.company_id) fetchCompany();
  }, [user?.company_id]);

  const refreshTicketList = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        // Backend returns { status: "success", data: { data: [...] } }
        setTickets(data.data?.data || data.tickets || (Array.isArray(data) ? data : []));
      }
    } catch (error) {
      console.error("Failed to refresh tickets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshTicketList();
  }, [API_URL]);

  const openProfile = (userData) => {
  setSelectedUser(userData && userData._id ? userData : user);
    setIsProfileOpen(true);
  };

  return (
    <div className={`app-container flex min-h-screen ${themeObj.bg}`}>
      <Sidebar isDarkMode={isDarkMode} theme={themeObj} user={user} company={company} />
      <main className="main-wrapper flex-1 flex flex-col relative overflow-hidden">
        <Header
          user={user}
          onProfileClick={() => openProfile(user)}
          theme={isDarkMode ? "dark" : "light"}
          setTheme={(val) => setIsDarkMode(val === "dark")}
          themeObj={themeObj}
        />
        <div className="p-4 flex-1 overflow-auto">
          <Routes>
            <Route
              path="/tickets"
              element={
                <TicketingPage
                  tickets={tickets}
                  user={user}
                  onProfileClick={openProfile}
                  isITUser={isAdmin}
                  onOpenCreate={() => setIsCreateOpen(true)}
                  onRefresh={refreshTicketList}
                  theme={themeObj}
                  isLoading={isLoading}
                />
              }
            />
            <Route path="/dashboard" element={<Dashboard theme={themeObj} user={user} />} />
            
            <Route
              path="/stock"
              element={
                <StockManagementPage
                  currentUserRole={user?.role}
                  theme={themeObj}
                />
              }
            />
            <Route path="/control-panel" element={<CompanyControlPanel theme={themeObj} company={company} />} />
            <Route
              path="/chatmodal"
              element={
                <TeamChat
                  user={user}
                  theme={themeObj}
                  onProfileClick={openProfile}
                />
              }
            />
            <Route
              path="/ticket/:id"
              element={
                <TicketDetailsPage
                  tickets={tickets}
                  isITUser={isAdmin}
                  theme={themeObj}
                  user={user}
                />
              }
            />
            <Route path="/reports" element={<ReportsPage theme={themeObj} user={user} isDarkMode={isDarkMode} />} />
            <Route path="/settings" element={<Settings refreshUser={(updated) => setUser({ ...user, ...updated })} isDarkMode={isDarkMode} />} />
            <Route path="/" element={<Navigate to={isManager ? "/control-panel" : "/tickets"} replace />} />
          </Routes>
        </div>
      </main>

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={selectedUser?._id ? selectedUser : user}
        
        setUser={setUser}
        currentUser={user}
        allTickets={tickets}
        theme={themeObj}
        
      />
      {isCreateOpen && (
        <CreateTicketModal
          user={user}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={refreshTicketList}
        />
      )}
    </div>
  );
}


function AppContent() {
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem('theme') === 'dark'
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'light'
  );

  // Sync isDarkMode → document root class + localStorage on every change
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const [user, setUserState] = useState(() => {
    const savedUser = localStorage.getItem("vertex_user");
    const expiry = localStorage.getItem("vertex_expiry");
    if (savedUser && expiry && Date.now() < parseInt(expiry)) {
      return JSON.parse(savedUser);
    }
    localStorage.removeItem("vertex_user");
    localStorage.removeItem("vertex_expiry");
    return null;
  });

  const setUser = (userData) => {
    if (userData) {
      const tenHours = 10 * 60 * 60 * 1000;
      const expiryTime = Date.now() + tenHours;
      localStorage.setItem("vertex_user", JSON.stringify(userData));
      localStorage.setItem("vertex_expiry", expiryTime.toString());
      setUserState(userData);
    } else {
      localStorage.removeItem("vertex_user");
      localStorage.removeItem("vertex_expiry");
      localStorage.removeItem("token");
      setUserState(null);
    }
  };

  const themeObj = isDarkMode
    ? {
      bg: "bg-[#12102A]",
      textP: "text-[#E2E0FF]",
      textM: "text-[#8480B8]",
      border: "border-[#2E2B5A]",
      input: "bg-[#1E1B3A]",
      primary: "#7F6FF5",
      accent: "#3ECFAA",
      btn: "from-[#7F6FF5] to-[#3ECFAA]",
    }
    : {
      bg: "bg-[#F5F4FF]",
      textP: "text-[#1E1B3A]",
      textM: "text-[#7F77DD]",
      border: "border-[#DDD9FF]",
      input: "bg-white",
      primary: "#534AB7",
      accent: "#0F6E56",
      btn: "from-[#534AB7] to-[#7F77DD]",
    };

  const commonProps = { isDarkMode, setIsDarkMode, theme: themeObj, user, setUser };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage {...commonProps} />} />
      <Route path="/signup" element={<SignUpRole {...commonProps} />} />
      <Route path="/signup/admin" element={<AdminRegister {...commonProps} />} />
      <Route path="/signup/user" element={<UserRegister {...commonProps} />} />
      <Route path="/setup" element={<SetupEnvironment {...commonProps} />} />
      <Route path="/landing" element={<LandingPage {...commonProps} />} />
     

      
      <Route path="/auth/google/success" element={<GoogleAuthHandler {...commonProps} />} />
      <Route path="/verification-sent" element={<VerificationSent {...commonProps} />} />
      <Route path="/verify-email/:token" element={<EmailVerificationHandler {...commonProps} />} />

      <Route
        path="/*"
        element={
          user ? (
            <MainApp
              themeObj={themeObj}
              theme={theme}
              setTheme={setTheme}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              user={user}
              setUser={setUser}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/"
        element={
          user ? (
            user.company_id ? (
              <Navigate to={user.role === "manager" || user.role === "admin" ? "/control-panel" : "/tickets"} replace />
            ) : (
              <Navigate to="/setup" replace />
            )
          ) : (
            <Navigate to="/landing" replace />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
