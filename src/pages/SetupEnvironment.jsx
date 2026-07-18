import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import {
  Building2,
  Globe,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sun,
  Moon,
  Sparkles,
  CreditCard,
  CheckCircle,
  HelpCircle,
  Clock,
  Briefcase,
  Layers,
  Search,
  UserPlus,
  Phone,
  Lock,
  Wallet,
  Smartphone,
  Hash,
} from "lucide-react";

export default function SetupEnvironment({ isDarkMode, setIsDarkMode, theme, user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [forceShowWizard, setForceShowWizard] = useState(
    () => location.state?.forceWizard || false
  );
  const [step, setStep] = useState(1);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plans, setPlans] = useState([]);
  
  // Manager Wizard details
  const [companyName, setCompanyName] = useState(
    () => localStorage.getItem("pending_company_name") || ""
  );
  const [industry, setIndustry] = useState(
    () => localStorage.getItem("pending_company_industry") || ""
  );
  const [website, setWebsite] = useState("");
  
  // Selected features for configurator
  const [selectedFeatures, setSelectedFeatures] = useState([
    "Project Management",
    "Chat System",
  ]);

  // Selected Plan Object
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [viewMode, setViewMode] = useState("configurator"); // configurator or all-plans

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState("vodafone_cash"); // vodafone_cash, visa, instapay, fawry
  
  // Vodafone Cash Inputs
  const [vodafoneNumber, setVodafoneNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [userEnteredOtp, setUserEnteredOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  
  // Visa Inputs
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  
  // Instapay / Fawry Inputs
  const [instapayAddress, setInstapayAddress] = useState("");
  const [fawryCode, setFawryCode] = useState(() => Math.floor(1000000 + Math.random() * 9000000).toString());

  // Submission / Error state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Regular user state
  const [companies, setCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [listLoading, setListLoading] = useState(false);

  const isManager = user?.role === "manager" || user?.role === "admin" || forceShowWizard;

  // Fetch plans (for managers) and companies (for users)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    if (isManager) {
      setLoadingPlans(true);
      axios
        .get("https://punto-production-21ed.up.railway.app/api/v1/plans", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const fetchedPlans = res.data.data?.plans || [];
          fetchedPlans.sort((a, b) => a.value - b.value);
          setPlans(fetchedPlans);
          setLoadingPlans(false);
        })
        .catch((err) => {
          console.error("Failed to load plans:", err);
          setLoadingPlans(false);
        });
    } else {
      setListLoading(true);
      axios
        .get("https://punto-production-21ed.up.railway.app/api/v1/companies/list", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setCompanies(res.data.data?.companies || []);
          setListLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load companies:", err);
          setJoinError("Failed to load company list.");
          setListLoading(false);
        });
    }
  }, [isManager, navigate]);

  // Sync selected features to find matching plan in real-time
  useEffect(() => {
    if (plans.length > 0 && viewMode === "configurator") {
      const sortedSelected = [...selectedFeatures].sort();
      const match = plans.find((p) => {
        if (p.features.length !== sortedSelected.length) return false;
        const sortedPlanFeatures = [...p.features].sort();
        return sortedPlanFeatures.every((f, idx) => f === sortedSelected[idx]);
      });
      setSelectedPlan(match || null);
    }
  }, [selectedFeatures, plans, viewMode]);

  // Reset OTP states when switching payment methods
  useEffect(() => {
    setOtpSent(false);
    setGeneratedOtp("");
    setUserEnteredOtp("");
    setOtpMessage("");
  }, [paymentMethod]);

  // Handle return callback from Paymob
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment_status");
    const paymentId = params.get("payment_id");

    if (paymentStatus === "success" && paymentId) {
      const verifyAndCreateCompany = async () => {
        setVerifyingPayment(true);
        setSubmitError("");
        const token = localStorage.getItem("token");

        try {
          // 1. Call verification endpoint
          const res = await axios.post(
            "https://punto-production-21ed.up.railway.app/api/v1/payments/verify-status",
            { paymentId },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.data.data.status === "paid") {
            // 2. Fetch wizard details from local storage
            const name = localStorage.getItem("pending_company_name");
            const ind = localStorage.getItem("pending_company_industry");
            const web = localStorage.getItem("pending_company_website") || "";
            const featsStr = localStorage.getItem("pending_company_features");

            if (!name || !ind || !featsStr) {
              throw new Error("Missing company profile details in cache.");
            }

            const feats = JSON.parse(featsStr);

            // 3. Create the company workspace
            const companyRes = await axios.post(
              "https://punto-production-21ed.up.railway.app/api/v1/companies",
              {
                name,
                industry: ind,
                website: web,
                selectedFeatures: feats,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (companyRes.data.status === "success") {
              // Clear localStorage cache keys
              localStorage.removeItem("pending_company_name");
              localStorage.removeItem("pending_company_industry");
              localStorage.removeItem("pending_company_website");
              localStorage.removeItem("pending_company_features");

              // 4. Update user object
              const userRes = await axios.get("https://punto-production-21ed.up.railway.app/api/v1/users/me", {
                headers: { Authorization: `Bearer ${token}` },
              });

              if (userRes.data.status === "success") {
                const freshUser = userRes.data.data.user;
                setUser({
                  _id: freshUser._id,
                  name: freshUser.name ?? "",
                  email: freshUser.email ?? "",
                  role: freshUser.role ?? "",
                  company_id: freshUser.company_id ?? null,
                  phone: freshUser.phone ?? "+20 100 000 0000",
                  dept: freshUser.dept ?? "IT Department",
                  location: freshUser.location ?? "",
                  isOnline: true,
                  avatar: freshUser.photo ?? null,
                });
              }

              // Redirect
              navigate("/control-panel");
            }
          } else {
            setSubmitError("Your payment is still pending. Please complete transaction or try again.");
          }
        } catch (err) {
          console.error("Verification error:", err);
          setSubmitError(
            err.response?.data?.message || err.message || "Failed to verify transaction or activate company."
          );
        } finally {
          setVerifyingPayment(false);
        }
      };

      verifyAndCreateCompany();
    }
  }, [navigate, setUser]);

  const toggleFeature = (feature) => {
    setSelectedFeatures((prev) => {
      const next = prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature];
      return next.length > 0 ? next : prev;
    });
  };

  const selectPlanDirect = (plan) => {
    setSelectedPlan(plan);
    setSelectedFeatures(plan.features);
  };

  const handleContinueToPlans = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!companyName.trim()) newErrors.companyName = "Company name is required";
    if (!industry.trim()) newErrors.industry = "Industry is required";
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setStep(2);
    }
  };

  const handleContinueToPayment = () => {
    if (!selectedPlan) {
      setSubmitError("Please choose a plan or select at least one feature.");
      return;
    }
    setStep(3);
  };

  const handleCreateCompanyAndPay = async (e) => {
    e.preventDefault();
    
    // Simple frontend validation for payment inputs
    const pErrors = {};
    if (paymentMethod === "vodafone_cash") {
      if (!vodafoneNumber.trim()) {
        pErrors.vodafoneNumber = "Phone number is required";
      } else if (!/^01[0125]\d{8}$/.test(vodafoneNumber)) {
        pErrors.vodafoneNumber = "Invalid Egyptian mobile wallet number";
      }
    } else if (paymentMethod === "visa") {
      if (!cardNumber.replace(/\s/g, "")) pErrors.cardNumber = "Card number is required";
      if (!cardHolder.trim()) pErrors.cardHolder = "Cardholder name is required";
      if (!cardExpiry) pErrors.cardExpiry = "Expiry date is required";
      if (!cardCvv) pErrors.cardCvv = "CVV is required";
    } else if (paymentMethod === "instapay") {
      if (!instapayAddress.trim()) pErrors.instapayAddress = "Instapay IPA Address is required";
    }

    setErrors(pErrors);
    if (Object.keys(pErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError("");
    const token = localStorage.getItem("token");

    try {
      // Save all current wizard details to localStorage to reload them upon return callback
      localStorage.setItem("pending_company_name", companyName.trim());
      localStorage.setItem("pending_company_industry", industry.trim());
      localStorage.setItem("pending_company_website", website.trim());
      localStorage.setItem("pending_company_features", JSON.stringify(selectedPlan.features));

      // 1. Submit checkout request to backend API
      const checkoutRes = await axios.post(
        "https://punto-production-21ed.up.railway.app/api/v1/payments/checkout",
        {
          features: selectedPlan.features,
          paymentMethod: paymentMethod,
          walletNumber: paymentMethod === "vodafone_cash" ? vodafoneNumber : undefined,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { redirectUrl } = checkoutRes.data.data;
      if (redirectUrl) {
        // Redirect to Paymob secure hosted checkout
        window.location.href = redirectUrl;
      } else {
        throw new Error("Redirection URL was not returned by the payment service.");
      }
    } catch (err) {
      console.error(err);
      setSubmitError(err.response?.data?.message || "Payment verification or Company creation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinCompany = async () => {
    if (!selectedCompany) return;
    setJoinLoading(true);
    setJoinError("");
    const token = localStorage.getItem("token");

    try {
      const res = await axios.post(
        "https://punto-production-21ed.up.railway.app/api/v1/companies/join",
        { companyId: selectedCompany._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.status === "success") {
        const userData = res.data.data.user;
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
        navigate("/tickets");
      }
    } catch (err) {
      console.error(err);
      setJoinError(err.response?.data?.message || "Failed to join company.");
    } finally {
      setJoinLoading(false);
    }
  };

  const filteredCompanies = companies.filter((c) =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Formatting utility for CC number
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  if (verifyingPayment) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-500 ${theme.bg}`}>
        <div className="flex flex-col items-center gap-3 max-w-[400px] text-center">
          <Loader2 className="animate-spin text-[#7F6FF5]" size={48} />
          <h2 className="text-xl font-bold mt-2" style={{ color: isDarkMode ? "#E2E0FF" : "#1E1B3A" }}>
            Verifying Transaction...
          </h2>
          <p className={`text-sm mt-1 ${theme.textM}`}>
            Please wait while we verify your subscription payment with Paymob and prepare your company workspace.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // REGULAR USER VIEW (Join Company)
  // ─────────────────────────────────────────────
  if (!isManager) {
    const handleLogout = () => {
      setUser(null);
      navigate("/login");
    };

    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-500 ${theme.bg}`}>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`fixed top-6 right-6 p-2.5 rounded-full border shadow-sm z-50 ${isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"}`}
        >
          {isDarkMode ? <Sun size={20} className="text-[#E2E0FF]" /> : <Moon size={20} className="text-[#534AB7]" />}
        </button>

        <div className="w-full max-w-[480px]">
          <div className={`p-8 rounded-[32px] border shadow-2xl text-center flex flex-col items-center justify-center ${isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-purple-50 text-purple-600 border border-purple-100"}`}>
              <Building2 size={32} className="animate-pulse" />
            </div>

            <h1 className="text-2xl font-bold mb-3" style={{ color: isDarkMode ? "#E2E0FF" : "#1E1B3A" }}>
              Not in a Company Yet
            </h1>
            
            <p className={`text-sm mb-8 leading-relaxed px-2 ${theme.textM}`}>
              You are not associated with any company workspace yet. Please ask your administrator to add you to their company organization to access the dashboard.
            </p>

            <div className="w-full space-y-3">
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setForceShowWizard(true)}
                className={`w-full py-3.5 rounded-xl text-white font-bold text-[14px] bg-gradient-to-r ${theme.btn} shadow-lg flex items-center justify-center gap-2`}
              >
                Create a New Company
              </motion.button>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/landing")}
                  className={`py-3 rounded-xl font-bold text-[13px] border ${isDarkMode ? "border-[#2E2B5A] text-[#E2E0FF] hover:bg-[#2E2B5A]/30" : "border-[#DDD9FF] text-[#534AB7] hover:bg-[#DDD9FF]/20"} transition-all flex items-center justify-center gap-1.5`}
                >
                  Landing Page
                </motion.button>

                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogout}
                  className={`py-3 rounded-xl font-bold text-[13px] border ${isDarkMode ? "border-[#2E2B5A] text-[#E2E0FF] hover:bg-[#2E2B5A]/30" : "border-[#DDD9FF] text-[#534AB7] hover:bg-[#DDD9FF]/20"} transition-all flex items-center justify-center gap-1.5`}
                >
                  Log Out
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // MANAGER / ADMIN VIEW
  // ─────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex flex-col items-center p-6 transition-all duration-500 ${theme.bg}`}>
      {/* Dark Mode toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`fixed top-6 right-6 p-2.5 rounded-full border shadow-sm z-50 ${isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"}`}
      >
        {isDarkMode ? <Sun size={20} className="text-[#E2E0FF]" /> : <Moon size={20} className="text-[#534AB7]" />}
      </button>

      {/* Header */}
      <div className="text-center mt-8 mb-6">
        <h1 className="text-3xl font-bold mb-2">
          <span style={{ color: isDarkMode ? "#E2E0FF" : "#1E1B3A" }}>Setup Your </span>
          <span
            className={!isDarkMode ? "bg-gradient-to-r from-[#7F6FF5] to-[#3ECFAA] bg-clip-text text-transparent" : ""}
            style={{ color: isDarkMode ? "#7F6FF5" : "transparent" }}
          >
            Company
          </span>
        </h1>
        <p className={`text-[13px] ${theme.textM}`}>
          {step === 1 && "Provide information to identify and link your workspace"}
          {step === 2 && "Review pricing models and select features for your workspace"}
          {step === 3 && "Complete your subscription payment using popular Egyptian payment services"}
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 md:gap-4 mb-8 w-full max-w-[560px] px-4">
        {[1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  step >= i ? "bg-[#7F6FF5] text-white shadow-lg" : "bg-gray-200 dark:bg-[#2E2B5A] text-gray-400"
                }`}
              >
                {step > i ? <Check size={18} /> : i}
              </div>
              <span className={`text-[10px] font-bold ${step === i ? "text-[#7F6FF5]" : "text-gray-400 dark:text-gray-500"}`}>
                {i === 1 ? "Organization" : i === 2 ? "Plan" : "Payment"}
              </span>
            </div>
            {i < 3 && (
              <div
                className={`h-[2px] flex-1 min-w-[40px] md:min-w-[80px] transition-all duration-300 ${
                  step > i ? "bg-[#7F6FF5]" : "bg-gray-200 dark:bg-[#2E2B5A]"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="w-full max-w-[680px]">
        <AnimatePresence mode="wait">
          {/* STEP 1: Company Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`w-full rounded-[24px] p-8 md:p-10 shadow-xl border ${
                isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"
              }`}
            >
              <div className="flex items-center gap-3 mb-6">
                <Building2 size={24} style={{ color: isDarkMode ? "#E2E0FF" : "#1E1B3A" }} />
                <h2 className="text-xl font-bold" style={{ color: isDarkMode ? "#E2E0FF" : "#1E1B3A" }}>
                  Company Details
                </h2>
              </div>

              <form onSubmit={handleContinueToPlans} className="space-y-5">
                <div className="space-y-1">
                  <p className={`text-[12px] font-bold ${theme.textM}`}>Company Name *</p>
                  <input
                    type="text"
                    placeholder="Enter company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border outline-none text-[13px] ${theme.input} ${theme.textP} ${
                      errors.companyName ? "border-red-500" : theme.border
                    } focus:ring-1 focus:ring-[#7F6FF5]`}
                  />
                  {errors.companyName && <p className="text-red-500 text-[10px] mt-1">{errors.companyName}</p>}
                </div>

                <div className="space-y-1">
                  <p className={`text-[12px] font-bold ${theme.textM}`}>Industry *</p>
                  <input
                    type="text"
                    placeholder="e.g. Technology, Retail, Finance"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border outline-none text-[13px] ${theme.input} ${theme.textP} ${
                      errors.industry ? "border-red-500" : theme.border
                    } focus:ring-1 focus:ring-[#7F6FF5]`}
                  />
                  {errors.industry && <p className="text-red-500 text-[10px] mt-1">{errors.industry}</p>}
                </div>

                <div className="space-y-1">
                  <p className={`text-[12px] font-bold ${theme.textM}`}>Website (Optional)</p>
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${theme.input} ${theme.border}`}>
                    <Globe size={16} className={theme.textM} />
                    <input
                      type="text"
                      placeholder="e.g. https://company.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className={`flex-1 bg-transparent outline-none text-[13px] ${theme.textP}`}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className={`flex items-center gap-2 px-10 py-3.5 rounded-xl text-white font-bold bg-gradient-to-r ${theme.btn} shadow-lg`}
                  >
                    Continue to Plans <ArrowRight size={18} />
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 2: Plan Selection */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`w-full rounded-[24px] p-8 md:p-10 shadow-xl border ${
                isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <CreditCard size={24} style={{ color: isDarkMode ? "#E2E0FF" : "#1E1B3A" }} />
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: isDarkMode ? "#E2E0FF" : "#1E1B3A" }}>
                      Select a Plan
                    </h2>
                    <p className={`text-[11px] ${theme.textM}`}>Find a model that matches your needs</p>
                  </div>
                </div>

                {/* View switcher */}
                <div className="flex bg-gray-100 dark:bg-[#12102A] p-1 rounded-xl border border-transparent dark:border-[#2E2B5A]">
                  <button
                    onClick={() => setViewMode("configurator")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      viewMode === "configurator"
                        ? "bg-[#7F6FF5] text-white shadow-sm"
                        : theme.textM
                    }`}
                  >
                    Configurator
                  </button>
                  <button
                    onClick={() => setViewMode("all-plans")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      viewMode === "all-plans"
                        ? "bg-[#7F6FF5] text-white shadow-sm"
                        : theme.textM
                    }`}
                  >
                    All Plans ({plans.length})
                  </button>
                </div>
              </div>

              {loadingPlans ? (
                <div className="flex flex-col items-center py-16">
                  <Loader2 className="animate-spin text-[#7F6FF5] mb-3" size={36} />
                  <p className={`text-[13px] ${theme.textM}`}>Fetching subscription models...</p>
                </div>
              ) : (
                <>
                  {viewMode === "configurator" && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      <div className="md:col-span-7 space-y-4">
                        <p className={`text-[12px] font-bold uppercase tracking-wider mb-2 ${theme.textM}`}>
                          Select Features
                        </p>
                        <div className="space-y-2">
                          {[
                            "Ticketing System",
                            "Stock Management",
                            "Chat System",
                            "Project Management",
                          ].map((feat) => {
                            const active = selectedFeatures.includes(feat);
                            return (
                              <div
                                key={feat}
                                onClick={() => toggleFeature(feat)}
                                className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all ${
                                  active
                                    ? isDarkMode ? "border-[#3ECFAA] bg-[#3ECFAA]/5" : "border-[#7F6FF5] bg-[#7F6FF5]/5"
                                    : `${theme.border} hover:border-[#7F6FF5]/30`
                                }`}
                              >
                                <span className={`text-[13px] font-bold ${theme.textP}`}>{feat}</span>
                                <div
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                    active
                                      ? "bg-[#7F6FF5] border-transparent text-white"
                                      : isDarkMode ? "border-[#2E2B5A]" : "border-gray-300"
                                  }`}
                                >
                                  {active && <Check size={14} />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Match display */}
                      <div className="md:col-span-5 flex flex-col">
                        <p className={`text-[12px] font-bold uppercase tracking-wider mb-2 ${theme.textM}`}>
                          Matched Plan Details
                        </p>
                        <div
                          className={`flex-1 rounded-2xl border p-5 flex flex-col justify-between shadow-md relative overflow-hidden ${
                            isDarkMode ? "bg-[#12102A]/50 border-[#2E2B5A]" : "bg-[#F9FAFF] border-[#DDD9FF]"
                          }`}
                        >
                          {selectedPlan ? (
                            <>
                              <div>
                                <div className="flex items-center gap-1.5 text-xs text-[#7F6FF5] font-bold mb-2">
                                  <Sparkles size={14} />
                                  <span>Automated Match</span>
                                </div>
                                <h3 className={`text-[15px] font-extrabold mb-1 leading-tight ${theme.textP}`}>
                                  {selectedPlan.name}
                                </h3>
                                <p className={`text-[11px] mb-4 ${theme.textM}`}>
                                  ID: {selectedPlan.custom_id}
                                </p>

                                <div className="space-y-1.5">
                                  {selectedPlan.features.map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[11px]">
                                      <CheckCircle size={12} className="text-[#3ECFAA] flex-shrink-0" />
                                      <span className={theme.textP}>{f}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="mt-6 pt-4 border-t border-dashed border-[#DDD9FF] dark:border-[#2E2B5A]">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-3xl font-black" style={{ color: isDarkMode ? "#3ECFAA" : "#534AB7" }}>
                                    ${selectedPlan.value}
                                  </span>
                                  <span className={`text-[11px] font-bold ${theme.textM}`}>/ month</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                              <HelpCircle size={28} className={theme.textM} />
                              <p className={`text-xs mt-2 ${theme.textM}`}>
                                No exact plan combination exists for current feature selection.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {viewMode === "all-plans" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[360px] overflow-y-auto pr-1">
                      {plans.map((p) => {
                        const isChosen = selectedPlan?._id === p._id;
                        return (
                          <div
                            key={p._id}
                            onClick={() => selectPlanDirect(p)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                              isChosen
                                ? isDarkMode ? "border-[#3ECFAA] bg-[#3ECFAA]/5 ring-1 ring-[#3ECFAA]" : "border-[#7F6FF5] bg-[#7F6FF5]/5 ring-1 ring-[#7F6FF5]"
                                : `${theme.border} hover:border-[#7F6FF5]/50`
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-2 mb-1.5">
                                <h3 className={`text-[13px] font-bold truncate ${theme.textP}`} title={p.name}>
                                  {p.name}
                                </h3>
                                {isChosen && (
                                  <span className="bg-[#7F6FF5] text-white text-[9px] px-1.5 py-0.5 rounded-full">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <p className={`text-[10px] mb-3 ${theme.textM}`}>{p.custom_id}</p>

                              <div className="space-y-1">
                                {p.features.map((f, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                                    <CheckCircle size={10} className="text-[#3ECFAA]" />
                                    <span className={theme.textP}>{f}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="mt-4 pt-2.5 border-t border-gray-100 dark:border-[#2E2B5A] flex justify-between items-baseline">
                              <span className={`text-[10px] ${theme.textM}`}>Monthly Value</span>
                              <span className="text-lg font-black" style={{ color: isDarkMode ? "#3ECFAA" : "#534AB7" }}>
                                ${p.value}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {submitError && <p className="text-red-500 text-[12px] mt-6 text-center">{submitError}</p>}

                  {/* Navigation footer */}
                  <div className="mt-8 pt-4 flex justify-between items-center border-t border-gray-100 dark:border-[#2E2B5A]">
                    <button
                      onClick={() => setStep(1)}
                      className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors ${theme.textM} hover:text-[#7F6FF5]`}
                    >
                      <ArrowLeft size={16} /> Back to Details
                    </button>

                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleContinueToPayment}
                      disabled={!selectedPlan}
                      className={`flex items-center gap-2 px-10 py-3.5 rounded-xl text-white font-bold bg-gradient-to-r ${theme.btn} shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Continue to Payment <ArrowRight size={18} />
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* STEP 3: Secure Egyptian Payment */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`w-full rounded-[24px] p-8 md:p-10 shadow-xl border ${
                isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"
              }`}
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2E2B5A] pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <Lock size={22} className="text-[#3ECFAA]" />
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: isDarkMode ? "#E2E0FF" : "#1E1B3A" }}>
                      Payment Checkout
                    </h2>
                    <p className={`text-[11px] ${theme.textM}`}>Powered by secure Egyptian payment networks</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[11px] ${theme.textM}`}>Total Amount</p>
                  <p className="text-xl font-black" style={{ color: isDarkMode ? "#3ECFAA" : "#534AB7" }}>
                    ${selectedPlan?.value} <span className="text-xs font-normal">/mo</span>
                  </p>
                </div>
              </div>

              {/* Local payment method tabs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { id: "vodafone_cash", n: "V-Cash / Wallet", desc: "Vodafone, Etisalat, Orange Wallet" },
                  { id: "visa", n: "Visa / Card", desc: "Credit or Debit card" },
                  { id: "instapay", n: "Instapay", desc: "IPN Instant Payment" },
                  { id: "fawry", n: "Fawry Pay", desc: "Fawry Reference code" },
                ].map((pm) => {
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <div
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                        isSelected
                          ? isDarkMode ? "border-[#3ECFAA] bg-[#3ECFAA]/5" : "border-[#7F6FF5] bg-[#7F6FF5]/5"
                          : `${theme.border} hover:border-[#7F6FF5]/30`
                      }`}
                    >
                      <p className={`text-[11px] font-extrabold ${theme.textP}`}>{pm.n}</p>
                      <p className="text-[9px] opacity-40 leading-tight mt-1">{pm.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Payment Fields */}
              <form onSubmit={handleCreateCompanyAndPay} className="space-y-4">
                {paymentMethod === "vodafone_cash" && (
                  <div className="space-y-4">
                    <div className="bg-[#FF0000]/5 border border-[#FF0000]/20 rounded-2xl p-4 flex items-start gap-3">
                      <Wallet className="text-[#FF0000] mt-0.5 flex-shrink-0" size={18} />
                      <div>
                        <p className="text-xs font-bold text-[#FF0000]">Vodafone Cash / Mobile Wallet</p>
                        <p className={`text-[10px] mt-1 ${theme.textM}`}>
                          Enter your mobile wallet phone number below. We will request a secure payment token from Paymob, and you will be redirected to complete authorization with a real OTP sent to your phone.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className={`text-[12px] font-bold ${theme.textM}`}>Mobile Wallet Number *</p>
                      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${theme.input} ${theme.border} ${errors.vodafoneNumber ? "border-red-500" : ""}`}>
                        <Smartphone size={16} className={theme.textM} />
                        <input
                          type="text"
                          maxLength={11}
                          placeholder="e.g. 01023002455"
                          value={vodafoneNumber}
                          onChange={(e) => setVodafoneNumber(e.target.value)}
                          className={`flex-1 bg-transparent outline-none text-[13px] ${theme.textP}`}
                        />
                      </div>
                      {errors.vodafoneNumber && <p className="text-red-500 text-[10px] mt-1">{errors.vodafoneNumber}</p>}
                    </div>
                  </div>
                )}

                {paymentMethod === "visa" && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className={`text-[12px] font-bold ${theme.textM}`}>Cardholder Name *</p>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border outline-none text-[13px] ${theme.input} ${theme.textP} ${
                          errors.cardHolder ? "border-red-500" : theme.border
                        } focus:ring-1 focus:ring-[#7F6FF5]`}
                      />
                      {errors.cardHolder && <p className="text-red-500 text-[10px] mt-1">{errors.cardHolder}</p>}
                    </div>

                    <div className="space-y-1">
                      <p className={`text-[12px] font-bold ${theme.textM}`}>Card Number *</p>
                      <input
                        type="text"
                        placeholder="4000 1234 5678 9010"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        className={`w-full px-4 py-3 rounded-xl border outline-none text-[13px] ${theme.input} ${theme.textP} ${
                          errors.cardNumber ? "border-red-500" : theme.border
                        } focus:ring-1 focus:ring-[#7F6FF5]`}
                      />
                      {errors.cardNumber && <p className="text-red-500 text-[10px] mt-1">{errors.cardNumber}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className={`text-[12px] font-bold ${theme.textM}`}>Expiry Date *</p>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border outline-none text-[13px] ${theme.input} ${theme.textP} ${
                            errors.cardExpiry ? "border-red-500" : theme.border
                          } focus:ring-1 focus:ring-[#7F6FF5]`}
                        />
                        {errors.cardExpiry && <p className="text-red-500 text-[10px] mt-1">{errors.cardExpiry}</p>}
                      </div>

                      <div className="space-y-1">
                        <p className={`text-[12px] font-bold ${theme.textM}`}>CVV *</p>
                        <input
                          type="password"
                          placeholder="123"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border outline-none text-[13px] ${theme.input} ${theme.textP} ${
                            errors.cardCvv ? "border-red-500" : theme.border
                          } focus:ring-1 focus:ring-[#7F6FF5]`}
                        />
                        {errors.cardCvv && <p className="text-red-500 text-[10px] mt-1">{errors.cardCvv}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "instapay" && (
                  <div className="space-y-4">
                    <div className="bg-[#4C2E91]/5 border border-[#4C2E91]/20 rounded-2xl p-4 flex items-start gap-3">
                      <Sparkles className="text-[#4C2E91] mt-0.5 flex-shrink-0" size={18} />
                      <div>
                        <p className="text-xs font-bold text-[#4C2E91]">Instapay Egypt (IPN)</p>
                        <p className={`text-[10px] mt-1 ${theme.textM}`}>
                          Pay instantly from any local bank using your IPN payment address. A transaction notification will be pushed to your Instapay app.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className={`text-[12px] font-bold ${theme.textM}`}>Instapay Address (IPA) *</p>
                      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${theme.input} ${theme.border} ${errors.instapayAddress ? "border-red-500" : ""}`}>
                        <Hash size={16} className={theme.textM} />
                        <input
                          type="text"
                          placeholder="e.g. name@instapay"
                          value={instapayAddress}
                          onChange={(e) => setInstapayAddress(e.target.value)}
                          className={`flex-1 bg-transparent outline-none text-[13px] ${theme.textP}`}
                        />
                      </div>
                      {errors.instapayAddress && <p className="text-red-500 text-[10px] mt-1">{errors.instapayAddress}</p>}
                    </div>
                  </div>
                )}

                {paymentMethod === "fawry" && (
                  <div className="space-y-4">
                    <div className="bg-[#EFA71C]/5 border border-[#EFA71C]/20 rounded-2xl p-4 flex items-start gap-3">
                      <Smartphone className="text-[#EFA71C] mt-0.5 flex-shrink-0" size={18} />
                      <div>
                        <p className="text-xs font-bold text-[#EFA71C]">Fawry Pay Reference Code</p>
                        <p className={`text-[10px] mt-1 ${theme.textM}`}>
                          Use this reference code to pay at any Fawry retail outlet, Fawry Plus branch, or local banking app within 48 hours.
                        </p>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl border bg-gray-50 dark:bg-[#12102A] text-center border-dashed border-[#DDD9FF] dark:border-[#2E2B5A]">
                      <p className={`text-[11px] ${theme.textM}`}>Fawry Payment Reference</p>
                      <p className="text-3xl font-black tracking-wider text-[#EFA71C] my-2">{fawryCode}</p>
                      <p className={`text-[9px] ${theme.textM}`}>Your workspace will be activated automatically once payment is received.</p>
                    </div>
                  </div>
                )}

                {submitError && <p className="text-red-500 text-[12px] mt-4 text-center">{submitError}</p>}

                {/* Checkout Actions */}
                <div className="mt-8 pt-4 flex justify-between items-center border-t border-gray-100 dark:border-[#2E2B5A]">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors ${theme.textM} hover:text-[#7F6FF5]`}
                  >
                    <ArrowLeft size={16} /> Back to Plan
                  </button>

                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className={`flex items-center gap-2 px-10 py-3.5 rounded-xl text-white font-bold bg-gradient-to-r ${theme.btn} shadow-lg disabled:opacity-50`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} /> Validating Payment...
                      </>
                    ) : (
                      <>Pay & Activate Workspace</>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
