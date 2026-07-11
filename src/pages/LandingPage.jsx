// import React from "react";
// import { motion } from "framer-motion";
// import { useNavigate } from "react-router-dom";
// import { PlusCircle, Users, ArrowRight } from "lucide-react";
// import { DarkLogo, LightLogo } from "../components/logo";

// export default function LandingPage({ isDarkMode, theme, user, setUser }) {
//   const navigate = useNavigate();

//   React.useEffect(() => {
//     if (user?.company_id) {
//       if (user.role === "manager" || user.role === "admin") {
//         navigate("/control-panel");
//       } else {
//         navigate("/tickets");
//       }
//     }
//   }, [user, navigate]);

//   const handleLogout = () => {
//     setUser(null);
//     navigate("/login");
//   };

//   return (
//     <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-all duration-500 ${theme.bg}`}>
//       <motion.div
//         initial={{ opacity: 0, scale: 0.95 }}
//         animate={{ opacity: 1, scale: 1 }}
//         className="w-full max-w-[800px] text-center"
//       >
//         <div className="mb-12">
//           {isDarkMode ? <DarkLogo primary={theme.primary} accent={theme.accent} /> : <LightLogo />}
//           <h1 className="text-4xl font-extrabold mt-6 mb-4 tracking-tight" style={{ color: theme.primary }}>
//             Welcome to OmniSuite
//           </h1>
//           <p className={`text-lg ${theme.textM} max-w-[600px] mx-auto`}>
//             Your workspace is currently empty. Start by creating a new organization or joining an existing one.
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
//           {/* Create Company Card */}
//           <motion.div
//             whileHover={{ y: -8, boxShadow: "0px 20px 40px rgba(0,0,0,0.1)" }}
//             onClick={() => navigate("/create-company")}
//             className={`cursor-pointer p-10 rounded-3xl border transition-all ${isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"} group`}
//           >
//             <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${theme.btn} text-white shadow-lg`}>
//               <PlusCircle size={32} />
//             </div>
//             <h3 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: theme.textP }}>
//               Create Company
//               <ArrowRight size={20} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
//             </h3>
//             <p className={`${theme.textM} text-sm leading-relaxed`}>
//               Register a new organization and become the primary manager of your digital workspace.
//             </p>
//           </motion.div>

//           {/* Join Company Card */}
//           <motion.div
//             whileHover={{ y: -8, boxShadow: "0px 20px 40px rgba(0,0,0,0.05)" }}
//             className={`cursor-pointer p-10 rounded-3xl border transition-all ${isDarkMode ? "bg-[#1E1B3A] border-[#2E2B5A]" : "bg-white border-[#DDD9FF]"} opacity-60 grayscale hover:grayscale-0 hover:opacity-100`}
//           >
//             <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-gray-100 text-gray-400">
//               <Users size={32} />
//             </div>
//             <h3 className="text-2xl font-bold mb-3" style={{ color: theme.textP }}>
//               Join Organization
//             </h3>
//             <p className={`${theme.textM} text-sm leading-relaxed`}>
//               Have an invite? Enter your company code to join your team and start collaborating.
//               <span className="block mt-2 font-bold text-xs uppercase tracking-wider text-orange-500">(Coming Soon)</span>
//             </p>
//           </motion.div>
//         </div>

//         <button
//           onClick={handleLogout}
//           className={`text-sm font-bold underline opacity-60 hover:opacity-100 transition-all`}
//           style={{ color: theme.primary }}
//         >
//           Sign out and use another account
//         </button>
//       </motion.div>
//     </div>
//   );
// }





import React, { useEffect, useState, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { Link, useNavigate } from "react-router-dom";
import "./LandingPage.css";

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage({ isDarkMode, setIsDarkMode, theme, user, setUser }) {
  const containerRef = useRef(null);
  const visualRef = useRef(null);
  const panelsRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate("/login");
  };

  // Redirect if already in a company
  useEffect(() => {
    if (user?.company_id) {
      if (user.role === "manager" || user.role === "admin") {
        navigate("/control-panel");
      } else {
        navigate("/tickets");
      }
    }
  }, [user, navigate]);

  // إعدادات الشاشات الـ 3D
  const positions = [
    {
      el: ".panel-1",
      x: -180,
      y: -120,
      z: 50,
      rotX: 15,
      rotY: 20,
      rotZ: -5,
      baseZ: 50,
    },
    {
      el: ".panel-2",
      x: 100,
      y: -150,
      z: -50,
      rotX: -10,
      rotY: -25,
      rotZ: 8,
      baseZ: -50,
    },
    {
      el: ".panel-3",
      x: -220,
      y: 100,
      z: 80,
      rotX: -5,
      rotY: 15,
      rotZ: -10,
      baseZ: 80,
    },
    {
      el: ".panel-4",
      x: 180,
      y: 120,
      z: 120,
      rotX: 10,
      rotY: -15,
      rotZ: 5,
      baseZ: 120,
    },
    {
      el: ".panel-5",
      x: 0,
      y: -30,
      z: 220,
      rotX: -5,
      rotY: 5,
      rotZ: 0,
      baseZ: 220,
    },
  ];

  useEffect(() => {
    let ctx = gsap.context(() => {
      // 1. تشغيل أنيميشن الشاشات العائمة
      positions.forEach((pos) => {
        const panel = document.querySelector(pos.el);
        if (!panel) return;

        gsap.set(panel, {
          x: pos.x,
          y: pos.y,
          z: pos.z,
          rotationX: pos.rotX,
          rotationY: pos.rotY,
          rotationZ: pos.rotZ,
        });

        gsap.to(panel, {
          y: pos.y - 20,
          rotationX: pos.rotX + 4,
          rotationY: pos.rotY - 4,
          duration: 2.5 + Math.random(),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      // Big Checkmark Animation
      gsap.to(".p-big-check", {
        z: 60,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // 2. الخلفية (Particles)
      gsap.to(".particle", {
        y: "-110vh",
        opacity: 0.6,
        duration: () => 15 + Math.random() * 10,
        repeat: -1,
        stagger: { amount: 10, from: "random" },
        ease: "none",
      });

      // 3. أنيميشن النصوص في البداية
      const htl = gsap.timeline({ delay: 0.15 });
      htl
        .to("#hero-badge", { opacity: 1, duration: 0.7, ease: "power2.out" })
        .to(
          "#hero-h1",
          { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" },
          "-=.3",
        )
        .to(
          "#hero-sub",
          { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
          "-=.4",
        )
        .to(
          "#hero-ctas",
          { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" },
          "-=.3",
        )
        .to("#hero-meta", { opacity: 1, duration: 0.5 }, "-=.2");

      // 4. Scroll Triggers
      gsap.to("#preview-window", {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: "#preview-window", start: "top 85%" },
      });

      gsap.utils.toArray(".feat-card").forEach((el, i) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.65,
          delay: i * 0.08,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });

      gsap.utils.toArray(".stat-card").forEach((el, i) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: i * 0.09,
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
        const numEl = el.querySelector(".stat-val");
        if (numEl) {
          const target = +numEl.dataset.target;
          const suffix = numEl.dataset.suffix || "";
          ScrollTrigger.create({
            trigger: el,
            start: "top 85%",
            once: true,
            onEnter: () => {
              gsap.to(
                { n: 0 },
                {
                  n: target,
                  duration: 1.8,
                  ease: "power2.out",
                  onUpdate: function () {
                    numEl.textContent =
                      Math.round(this.targets()[0].n).toLocaleString() + suffix;
                  },
                },
              );
            },
          });
        }
      });

      gsap.utils.toArray(".int-item, .int-more").forEach((el, i) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: i * 0.04,
          scrollTrigger: { trigger: el, start: "top 90%" },
        });
      });

      gsap.utils.toArray(".how-step").forEach((el, i) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          delay: i * 0.12,
          ease: "back.out(1.5)",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });

      gsap.to("#compare-wrap", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: "#compare-wrap", start: "top 85%" },
      });

      gsap.utils.toArray(".price-card").forEach((el, i) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          delay: i * 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });

      gsap.utils.toArray(".testi-card").forEach((el, i) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: i * 0.1,
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });

      gsap.utils.toArray(".faq-item").forEach((el, i) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: i * 0.06,
          scrollTrigger: { trigger: el, start: "top 90%" },
        });
      });

      gsap.to("#cta-box", {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "back.out(1.5)",
        scrollTrigger: { trigger: "#cta-box", start: "top 85%" },
      });
    }, containerRef);

    // Navbar Scroll & Float CTA
    let lastY = 0;
    const handleScroll = () => {
      const y = window.scrollY;
      const nb = document.getElementById("navbar");
      const floatCta = document.getElementById("float-cta");

      if (nb) {
        if (y > lastY && y > 100)
          gsap.to(nb, { y: -80, duration: 0.3, ease: "power2.out" });
        else gsap.to(nb, { y: 0, duration: 0.3, ease: "power2.out" });
      }
      if (floatCta) {
        if (y > 600) floatCta.classList.add("visible");
        else floatCta.classList.remove("visible");
      }
      lastY = y;
    };
    window.addEventListener("scroll", handleScroll);

    // Toast notification
    const toastTimer1 = setTimeout(
      () => document.getElementById("toast")?.classList.add("show"),
      3000,
    );
    const toastTimer2 = setTimeout(
      () => document.getElementById("toast")?.classList.remove("show"),
      8000,
    );

    // Typing effect
    const phrases = [
      "Project Management",
      "Smart Ticketing",
      "Stock Control",
      "Team Collaboration",
      "AI Automation",
    ];
    let pi = 0,
      ci = 0,
      del = false;
    const tEl = document.getElementById("typing-text");
    let typingTimer;

    const type = () => {
      if (!tEl) return;
      const ph = phrases[pi];
      if (!del) {
        tEl.textContent = ph.slice(0, ++ci);
        if (ci === ph.length) {
          del = true;
          typingTimer = setTimeout(type, 2000);
          return;
        }
      } else {
        tEl.textContent = ph.slice(0, --ci);
        if (ci === 0) {
          del = false;
          pi = (pi + 1) % phrases.length;
          typingTimer = setTimeout(type, 400);
          return;
        }
      }
      typingTimer = setTimeout(type, del ? 45 : 75);
    };
    typingTimer = setTimeout(type, 1200);

    return () => {
      ctx.revert();
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(toastTimer1);
      clearTimeout(toastTimer2);
      clearTimeout(typingTimer);
    };
  }, []);

  // تفاعل الماوس مع الـ 3D
  const handleMouseMove = (e) => {
    if (!visualRef.current || !panelsRef.current) return;
    const visual = visualRef.current;

    // Parallax
    const xOffset = (visual.offsetWidth / 2 - e.nativeEvent.offsetX) / 40;
    const yOffset = (visual.offsetHeight / 2 - e.nativeEvent.offsetY) / 40;
    gsap.to(panelsRef.current, {
      rotationX: yOffset,
      rotationY: -xOffset,
      duration: 1,
      ease: "power2.out",
    });

    // Magnetic Panels
    const rect = visual.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    visual.querySelectorAll(".floating-panel").forEach((panel) => {
      const pRect = panel.getBoundingClientRect();
      const pX = pRect.left - rect.left + pRect.width / 2;
      const pY = pRect.top - rect.top + pRect.height / 2;
      const dist = Math.hypot(mouseX - pX, mouseY - pY);
      const maxDist = 250;

      let baseZ = 0;
      panel.classList.forEach((c) => {
        const match = positions.find((p) => p.el === `.${c}`);
        if (match) baseZ = match.baseZ;
      });

      if (dist < maxDist) {
        const intensity = 1 - dist / maxDist;
        gsap.to(panel, {
          z: baseZ + intensity * 60,
          scale: 1 + intensity * 0.05,
          duration: 0.3,
          overwrite: "auto",
        });
        panel.style.borderColor = `rgba(${isDarkMode ? "62,207,170" : "15,110,86"}, ${0.3 + intensity * 0.7})`;
        panel.style.boxShadow = `0 10px 30px rgba(0,0,0,0.5), inset 0 0 ${20 + intensity * 25}px rgba(${isDarkMode ? "62,207,170" : "15,110,86"}, ${0.15 + intensity * 0.35})`;
      } else {
        gsap.to(panel, {
          z: baseZ,
          scale: 1,
          duration: 0.6,
          overwrite: "auto",
        });
        panel.style.borderColor = `rgba(${isDarkMode ? "62,207,170" : "15,110,86"}, 0.3)`;
        panel.style.boxShadow = `0 10px 30px rgba(0,0,0,0.05), inset 0 0 20px rgba(${isDarkMode ? "62,207,170" : "15,110,86"}, 0.15)`;
      }
    });
  };

  const handleMouseLeave = () => {
    if (!panelsRef.current || !visualRef.current) return;
    gsap.to(panelsRef.current, { rotationX: 0, rotationY: 0, duration: 1 });

    visualRef.current.querySelectorAll(".floating-panel").forEach((panel) => {
      let baseZ = 0;
      panel.classList.forEach((c) => {
        const match = positions.find((p) => p.el === `.${c}`);
        if (match) baseZ = match.baseZ;
      });
      gsap.to(panel, { z: baseZ, scale: 1, duration: 0.6, overwrite: "auto" });
      panel.style.borderColor = `rgba(${isDarkMode ? "62,207,170" : "15,110,86"}, 0.3)`;
      panel.style.boxShadow = `0 10px 30px rgba(0,0,0,0.05), inset 0 0 20px rgba(${isDarkMode ? "62,207,170" : "15,110,86"}, 0.15)`;
    });
  };

  const toggleAccordion = (e) => {
    const item = e.currentTarget.parentElement;
    const isOpen = item.classList.contains("open");
    document
      .querySelectorAll(".faq-item.open")
      .forEach((x) => x.classList.remove("open"));
    if (!isOpen) item.classList.add("open");
  };

  return (
    <div
      className={`vertex-landing ${isDarkMode ? "dark" : ""}`}
      ref={containerRef}
    >
      {/* Particles */}
      <div className="particles" id="particles">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0,
            }}
          ></div>
        ))}
      </div>

      {/* FLOATING CTA */}
      <div className="float-cta" id="float-cta">
        <Link
          to="/signup"
          className="btn-cta-p flex items-center justify-center"
        >
          Start Free Trial
        </Link>
      </div>

      {/* TOAST */}
      <div className="toast" id="toast">
        <div className="toast-icon">
          <svg viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <div className="toast-body">
          <div className="toast-title">Ahmed just signed up from Cairo</div>
          <div className="toast-sub">2 minutes ago · Join 500+ teams</div>
        </div>
        <button
          className="toast-close"
          onClick={() =>
            document.getElementById("toast").classList.remove("show")
          }
        >
          ✕
        </button>
      </div>

      {/* NAV */}
      <nav id="navbar">
        <div className="nav-logo">Vertex</div>
        <ul className="nav-links">
          <li>
            <a href="#features">Features</a>
          </li>
          <li>
            <a href="#preview">Preview</a>
          </li>
          <li>
            <a href="#pricing">Pricing</a>
          </li>
          <li>
            <a href="#faq">FAQ</a>
          </li>
        </ul>
        <div className="nav-btns">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="relative flex items-center justify-center w-10 h-10 rounded-full border border-[var(--border-subtle)] text-[var(--text-main)] hover:bg-[var(--bg-elevated)] transition-all duration-300 hover:scale-105"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {/* Sun icon */}
            <svg
              className={`absolute w-5 h-5 transition-all duration-500 ease-in-out ${isDarkMode ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"}`}
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            {/* Moon icon */}
            <svg
              className={`absolute w-5 h-5 transition-all duration-500 ease-in-out ${!isDarkMode ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}`}
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>

          {user && !user.company_id ? (
            /* Logged in but no company yet — guide them to create one */
            <>
              <span
                className="hidden md:flex items-center gap-1.5 text-sm font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" opacity="0.2"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                Hi, {user.name?.split(" ")[0]}
              </span>
              <button
                onClick={handleLogout}
                className="btn-sm-outline flex items-center justify-center"
              >
                Log Out
              </button>
              <Link
                to="/setup"
                state={{ forceWizard: true }}
                className="btn-sm-primary flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
                Create Company
              </Link>
            </>
          ) : !user ? (
            /* Not logged in — show Sign In + Get Started */
            <>
              <Link
                to="/login"
                className="btn-sm-outline hidden md:flex items-center justify-center"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="btn-sm-primary flex items-center justify-center"
              >
                Get Started Free
              </Link>
            </>
          ) : null}
        </div>
      </nav>


      {/* HERO SECTION */}
      <section className="hero" id="home">
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>

        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge" id="hero-badge">
              <span className="hero-badge-dot"></span>
              Trusted by 500+ teams worldwide — and growing
            </div>
            <h1 id="hero-h1">
              <span className="hero-line1">All-in-One</span>
              <span className="hero-typing-wrap">
                <span id="typing-text"></span>
                <span className="cursor"></span>
              </span>
            </h1>
            <p className="hero-sub" id="hero-sub">
              Vertex unifies project management, ticketing, Stock, team chat,
              and AI into one seamless platform. Stop switching tabs. Start
              shipping faster.
            </p>
            <div className="hero-ctas" id="hero-ctas">
              <Link
                to="/signup"
                className="btn-sm-primary flex items-center justify-center"
              >
                Get Started Free
              </Link>
            </div>
            <div className="hero-meta" id="hero-meta">
              <div className="hero-meta-item">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                14-day free trial
              </div>
              <div className="hero-meta-item">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                No credit card
              </div>
              <div className="hero-meta-item">
                <svg viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Cancel anytime
              </div>
            </div>
          </div>

          {/* 3D FLOATING PANELS */}
          <div
            className="hero-visual"
            ref={visualRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="panels-container" ref={panelsRef}>
              <div className="floating-panel panel-1">
                <div className="p-head"></div>
                <div className="p-line"></div>
                <div className="p-line short"></div>
                <div className="p-chart-bars">
                  <div className="p-bar b1"></div>
                  <div className="p-bar b2"></div>
                  <div className="p-bar b3"></div>
                  <div className="p-bar b4"></div>
                </div>
              </div>

              <div className="floating-panel panel-2">
                <div className="p-head"></div>
                <div className="p-check-item">
                  <div className="p-checkbox checked">
                    <svg viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  </div>
                  <div className="p-line"></div>
                </div>
                <div className="p-check-item">
                  <div className="p-checkbox">
                    <svg viewBox="0 0 12 12"></svg>
                  </div>
                  <div className="p-line"></div>
                </div>
                <div className="p-check-item">
                  <div className="p-checkbox checked">
                    <svg viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  </div>
                  <div className="p-line short"></div>
                </div>
                <div className="p-check-item">
                  <div className="p-checkbox">
                    <svg viewBox="0 0 12 12"></svg>
                  </div>
                  <div className="p-line"></div>
                </div>
                <div className="p-big-check">
                  <svg viewBox="0 0 24 24">
                    <path d="M4 12l5 5 11-11" />
                  </svg>
                </div>
              </div>

              <div className="floating-panel panel-3">
                <div className="p-head" style={{ width: "60%" }}></div>
                <div className="p-line"></div>
                <div className="p-line"></div>
                <div className="p-line short"></div>
              </div>

              <div className="floating-panel panel-4">
                <div className="p-head"></div>
                <div className="p-check-item">
                  <div className="p-checkbox checked">
                    <svg viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  </div>
                  <div className="p-line"></div>
                </div>
                <div
                  className="p-line short"
                  style={{ marginLeft: "22px" }}
                ></div>
                <div className="p-check-item" style={{ marginTop: "15px" }}>
                  <div className="p-checkbox">
                    <svg viewBox="0 0 12 12"></svg>
                  </div>
                  <div className="p-line"></div>
                </div>
              </div>

              <div className="floating-panel panel-5">
                <div className="p-line"></div>
                <div className="p-line"></div>
                <div className="p-line short"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="trust">
        <div className="trust-inner">
          <div className="trust-label">
            Trusted by teams at leading companies
          </div>
          <div className="trust-logos">
            <div className="trust-logo">Shopify</div>
            <div className="trust-logo">Notion</div>
            <div className="trust-logo">Stripe</div>
            <div className="trust-logo">Vercel</div>
            <div className="trust-logo">Linear</div>
            <div className="trust-logo">Figma</div>
            <div className="trust-logo">Supabase</div>
          </div>
        </div>
      </section>

      {/* PREVIEW */}
      <section className="preview" id="preview">
        <div className="preview-wrap">
          <div className="section-header" style={{ marginBottom: "2.5rem" }}>
            <h2>See it in action</h2>
            <p>
              A unified workspace that brings every tool your team needs under
              one roof.
            </p>
          </div>
          <div className="preview-window" id="preview-window">
            <div className="preview-topbar">
              <div className="preview-dot red"></div>
              <div className="preview-dot yellow"></div>
              <div className="preview-dot green"></div>
              <div className="preview-url">app.vertex.io/dashboard</div>
            </div>
            <div className="preview-body">
              <div className="preview-sidebar">
                <div className="preview-sidebar-logo">Vertex</div>
                <div className="sidebar-nav-item active">
                  <svg viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                  Dashboard
                </div>
                <div className="sidebar-nav-item">
                  <svg viewBox="0 0 24 24">
                    <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Projects
                </div>
                <div className="sidebar-nav-item">
                  <svg viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Tickets
                </div>
                <div className="sidebar-nav-item">
                  <svg viewBox="0 0 24 24">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Stock
                </div>
                <div className="sidebar-nav-item">
                  <svg viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  Chat
                </div>
                <div className="sidebar-nav-item">
                  <svg viewBox="0 0 24 24">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Assistant
                </div>
                <div style={{ marginTop: "auto", paddingTop: "2rem" }}>
                  <div className="sidebar-nav-item">
                    <svg viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M20 21a8 8 0 10-16 0" />
                    </svg>
                    Ahmed Hassan
                  </div>
                </div>
              </div>
              <div className="preview-main">
                <div className="preview-header">
                  <div className="preview-title">Good morning, Ahmed 👋</div>
                  <button className="preview-btn">+ New Project</button>
                </div>
                <div className="preview-stats-row">
                  <div className="preview-stat">
                    <div className="preview-stat-val">24</div>
                    <div className="preview-stat-lbl">Active Projects</div>
                    <div className="preview-stat-chg">↑ 12% this week</div>
                  </div>
                  <div className="preview-stat">
                    <div className="preview-stat-val">8</div>
                    <div className="preview-stat-lbl">Open Tickets</div>
                    <div
                      className="preview-stat-chg"
                      style={{ color: "#f87171" }}
                    >
                      ↑ 3 urgent
                    </div>
                  </div>
                  <div className="preview-stat">
                    <div className="preview-stat-val">1.2k</div>
                    <div className="preview-stat-lbl">Items in Stock</div>
                    <div className="preview-stat-chg">✓ All levels OK</div>
                  </div>
                  <div className="preview-stat">
                    <div className="preview-stat-val">94%</div>
                    <div className="preview-stat-lbl">Team Velocity</div>
                    <div className="preview-stat-chg">↑ Best quarter</div>
                  </div>
                </div>
                <div className="preview-cards">
                  <div className="preview-card">
                    <div className="preview-card-title">
                      Sprint Board — Q2 Launch
                    </div>
                    <div className="kanban-col">
                      <div className="kanban-item">
                        <div
                          className="kanban-dot"
                          style={{ background: "var(--accent)" }}
                        ></div>
                        Design system complete
                      </div>
                      <div className="kanban-item">
                        <div
                          className="kanban-dot"
                          style={{ background: "#fbbf24" }}
                        ></div>
                        API integration — in review
                      </div>
                      <div className="kanban-item">
                        <div
                          className="kanban-dot"
                          style={{ background: "var(--primary)" }}
                        ></div>
                        Dashboard UI — in progress
                      </div>
                      <div className="kanban-item">
                        <div
                          className="kanban-dot"
                          style={{ background: "#6b7280" }}
                        ></div>
                        QA testing — pending
                      </div>
                    </div>
                  </div>
                  <div className="preview-card">
                    <div className="preview-card-title">AI Assistant</div>
                    <div className="ai-chat-line bot">
                      Hi! I noticed Sprint 4 might be delayed by 2 days based on
                      current velocity.
                    </div>
                    <div className="ai-chat-line user">
                      What should I prioritize?
                    </div>
                    <div className="ai-chat-line bot">
                      Reassign UI tasks to Sara — she's 40% underloaded this
                      week. That should fix it!
                    </div>
                  </div>
                </div>
                <div className="preview-card">
                  <div className="preview-card-title">Project Progress</div>
                  <div className="progress-bar-wrap">
                    <div className="progress-label">
                      <span>Alpha Launch</span>
                      <span style={{ color: "var(--accent)" }}>87%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: "87%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="progress-bar-wrap">
                    <div className="progress-label">
                      <span>Mobile App</span>
                      <span style={{ color: "#fbbf24" }}>54%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: "54%" }}
                      ></div>
                    </div>
                  </div>
                  <div className="progress-bar-wrap">
                    <div className="progress-label">
                      <span>API v2</span>
                      <span>32%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: "32%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="section-header">
          <h2>Everything your team needs</h2>
          <p>
            Five battle-tested tools unified into one seamless platform — no
            integrations, no context-switching.
          </p>
        </div>
        <div className="features-grid">
          <div className="feat-card">
            <div className="feat-icon">
              <svg viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3>Project Management</h3>
            <p>
              Kanban boards, Gantt charts, sprint planning, milestones, and
              resource allocation. Everything your PM team dreams of.
            </p>
            <div className="feat-tag">Kanban · Gantt · Sprints</div>
          </div>
          <div className="feat-card">
            <div className="feat-icon">
              <svg viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>Smart Ticketing</h3>
            <p>
              Automated workflows, SLA tracking, priority queues, and customer
              support integration. Resolve issues 3x faster.
            </p>
            <div className="feat-tag">SLA · Auto-routing · Priority</div>
          </div>
          <div className="feat-card">
            <div className="feat-icon">
              <svg viewBox="0 0 24 24">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3>Stock Control</h3>
            <p>
              Real-time stock tracking, automated reordering, multi-warehouse
              support, and supplier management in one place.
            </p>
            <div className="feat-tag">
              Real-time · Auto-reorder · Multi-site
            </div>
          </div>
          <div className="feat-card">
            <div className="feat-icon">
              <svg viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h3>Team Chat</h3>
            <p>
              Threads, channels, DMs, file sharing, and @mentions — with
              built-in video calls and screen sharing baked in.
            </p>
            <div className="feat-tag">Threads · Video · Files</div>
          </div>
          <div className="feat-card">
            <div className="feat-icon">
              <svg viewBox="0 0 24 24">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3>AI Assistant</h3>
            <p>
              Auto-generates reports, predicts delays, suggests task
              assignments, and answers any question about your projects
              instantly.
            </p>
            <div className="feat-tag">GPT-4 · Predictions · Auto-reports</div>
          </div>
          <div className="feat-card">
            <div className="feat-icon">
              <svg viewBox="0 0 24 24">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3>Advanced Analytics</h3>
            <p>
              Real-time dashboards, custom KPI tracking, team velocity reports,
              and executive summaries generated automatically.
            </p>
            <div className="feat-tag">Dashboards · KPIs · Reports</div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="stats-line"></div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-val" data-target="500" data-suffix="+">
              0
            </div>
            <div className="stat-lbl">Teams worldwide</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" data-target="25000" data-suffix="+">
              0
            </div>
            <div className="stat-lbl">Projects delivered</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" data-target="3" data-suffix="x">
              0
            </div>
            <div className="stat-lbl">Faster resolution</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" data-target="99" data-suffix=".9%">
              0
            </div>
            <div className="stat-lbl">Uptime SLA</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" data-target="40" data-suffix="hrs">
              0
            </div>
            <div className="stat-lbl">Saved per team/month</div>
          </div>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="integrations" id="integrations">
        <div className="section-header">
          <h2>Works with your stack</h2>
          <p>
            Connect Vertex to 100+ tools your team already uses — in one click.
          </p>
        </div>
        <div className="int-grid">
          <div className="int-item">
            <div
              className="int-logo"
              style={{ background: "#4a154b", color: "#fff" }}
            >
              Sl
            </div>
            <div className="int-name">Slack</div>
          </div>
          <div className="int-item">
            <div
              className="int-logo"
              style={{ background: "#0052cc", color: "#fff" }}
            >
              Ji
            </div>
            <div className="int-name">Jira</div>
          </div>
          <div className="int-item">
            <div
              className="int-logo"
              style={{ background: "#000", color: "#fff" }}
            >
              Gh
            </div>
            <div className="int-name">GitHub</div>
          </div>
          <div className="int-item">
            <div
              className="int-logo"
              style={{ background: "#2188ff", color: "#fff" }}
            >
              Gl
            </div>
            <div className="int-name">GitLab</div>
          </div>
          <div className="int-item">
            <div
              className="int-logo"
              style={{ background: "#635bff", color: "#fff" }}
            >
              St
            </div>
            <div className="int-name">Stripe</div>
          </div>
          <div className="int-item">
            <div
              className="int-logo"
              style={{ background: "#00a1e0", color: "#fff" }}
            >
              Sf
            </div>
            <div className="int-name">Salesforce</div>
          </div>
          <div className="int-item">
            <div
              className="int-logo"
              style={{ background: "#34a853", color: "#fff" }}
            >
              Gd
            </div>
            <div className="int-name">Google Drive</div>
          </div>
          <div className="int-item">
            <div
              className="int-logo"
              style={{ background: "#2088ff", color: "#fff" }}
            >
              No
            </div>
            <div className="int-name">Notion</div>
          </div>
          <div className="int-item">
            <div
              className="int-logo"
              style={{ background: "#f25533", color: "#fff" }}
            >
              Zn
            </div>
            <div className="int-name">Zendesk</div>
          </div>
          <div className="int-item">
            <div
              className="int-logo"
              style={{ background: "#ff6b35", color: "#fff" }}
            >
              Za
            </div>
            <div className="int-name">Zapier</div>
          </div>
          <div className="int-item">
            <div
              className="int-logo"
              style={{ background: "#06b6d4", color: "#fff" }}
            >
              Fi
            </div>
            <div className="int-name">Figma</div>
          </div>
          <div className="int-more">
            <div className="int-more-icon">+</div>
            <div className="int-name">90+ more</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how">
        <div className="section-header">
          <h2>Up and running in minutes</h2>
          <p>
            No onboarding calls. No IT setup. Just sign up and your team is
            live.
          </p>
        </div>
        <div className="how-steps">
          <div className="how-step">
            <div className="how-step-num">01</div>
            <h3>Create your workspace</h3>
            <p>
              Sign up, invite your team, and connect your existing tools. Vertex
              imports your data from Jira, Trello, or Asana automatically.
            </p>
          </div>
          <div className="how-step">
            <div className="how-step-num">02</div>
            <h3>Set up your first project</h3>
            <p>
              Pick a template or start from scratch. AI will suggest task
              breakdowns, deadlines, and resource assignments based on your team
              size.
            </p>
          </div>
          <div className="how-step">
            <div className="how-step-num">03</div>
            <h3>Execute with full visibility</h3>
            <p>
              Track progress in real-time, get AI alerts before deadlines slip,
              and keep your team aligned across every project — always.
            </p>
          </div>
        </div>
      </section>

      {/* COMPARE */}
      <section className="compare">
        <div className="section-header">
          <h2>Vertex vs the rest</h2>
          <p>Why pay for 5 tools when one does it all — better?</p>
        </div>
        <div className="compare-wrap" id="compare-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th className="vertex-col">Vertex</th>
                <th>Jira</th>
                <th>Monday</th>
                <th>Asana</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Project Management</td>
                <td className="vertex-col-cell">
                  <span className="check-yes">✓</span>
                </td>
                <td>
                  <span className="check-yes">✓</span>
                </td>
                <td>
                  <span className="check-yes">✓</span>
                </td>
                <td>
                  <span className="check-yes">✓</span>
                </td>
              </tr>
              <tr>
                <td>Smart Ticketing</td>
                <td className="vertex-col-cell">
                  <span className="check-yes">✓</span>
                </td>
                <td>
                  <span className="check-yes">✓</span>
                </td>
                <td>
                  <span className="check-partial">Partial</span>
                </td>
                <td>
                  <span className="check-no">—</span>
                </td>
              </tr>
              <tr>
                <td>Stock Control</td>
                <td className="vertex-col-cell">
                  <span className="check-yes">✓</span>
                </td>
                <td>
                  <span className="check-no">—</span>
                </td>
                <td>
                  <span className="check-no">—</span>
                </td>
                <td>
                  <span className="check-no">—</span>
                </td>
              </tr>
              <tr>
                <td>Built-in Team Chat</td>
                <td className="vertex-col-cell">
                  <span className="check-yes">✓</span>
                </td>
                <td>
                  <span className="check-no">—</span>
                </td>
                <td>
                  <span className="check-no">—</span>
                </td>
                <td>
                  <span className="check-no">—</span>
                </td>
              </tr>
              <tr>
                <td>AI Assistant</td>
                <td className="vertex-col-cell">
                  <span className="check-yes">✓</span>
                </td>
                <td>
                  <span className="check-partial">Add-on</span>
                </td>
                <td>
                  <span className="check-partial">Limited</span>
                </td>
                <td>
                  <span className="check-partial">Beta</span>
                </td>
              </tr>
              <tr>
                <td>Starting Price</td>
                <td
                  className="vertex-col-cell"
                  style={{ color: "var(--accent)", fontWeight: 700 }}
                >
                  $29/user
                </td>
                <td>$8.15/user</td>
                <td>$9/user</td>
                <td>$10.99/user</td>
              </tr>
              <tr>
                <td>Tools Replaced</td>
                <td
                  className="vertex-col-cell"
                  style={{ color: "var(--accent)", fontWeight: 700 }}
                >
                  5 tools in 1
                </td>
                <td>1 tool</td>
                <td>1 tool</td>
                <td>1 tool</td>
              </tr>
            </tbody>
          </table>
          <p
            style={{
              textAlign: "center",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: "1rem",
            }}
          >
            * Vertex replaces 5 tools at a fraction of the combined cost.
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div className="pricing-glow"></div>
        <div
          className="section-header"
          style={{ position: "relative", zIndex: 1 }}
        >
          <h2>Simple, honest pricing</h2>
          <p>All features included. No hidden tiers. No surprise bills.</p>
        </div>
        <div className="pricing-grid">
          <div className="price-card">
            <div className="price-name">Starter</div>
            <div className="price-desc">
              Perfect for small teams getting started with unified project
              management.
            </div>
            <div className="price-amount">
              $0<sub>/user/mo</sub>
            </div>
            <ul className="price-features">
              <li>
                <div className="pf-check">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </div>
                Up to 5 team members
              </li>
              <li>
                <div className="pf-check">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </div>
                3 active projects
              </li>
              <li>
                <div className="pf-check">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </div>
                Basic ticketing
              </li>
              <li>
                <div className="pf-check">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </div>
                Team chat
              </li>
            </ul>
            <button className="btn-price-o">Get Started Free</button>
          </div>
          <div className="price-card featured">
            <div className="price-glow"></div>
            <div className="price-badge">Most Popular</div>
            <div className="price-name">Pro</div>
            <div className="price-desc">
              Everything your growing team needs — projects, tickets, inventory,
              AI, and more.
            </div>
            <div className="price-amount">
              $29<sub>/user/mo</sub>
            </div>
            <ul className="price-features">
              <li>
                <div className="pf-check">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </div>
                Unlimited team members
              </li>
              <li>
                <div className="pf-check">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </div>
                Unlimited projects
              </li>
              <li>
                <div className="pf-check">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </div>
                Full inventory control
              </li>
              <li>
                <div className="pf-check">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </div>
                AI Assistant included
              </li>
              <li>
                <div className="pf-check">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </div>
                Priority 24/7 support
              </li>
              <li>
                <div className="pf-check">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </div>
                Advanced analytics
              </li>
            </ul>
            <button className="btn-price-p">Start 14-Day Free Trial</button>
          </div>
          <div className="price-card">
            <div className="price-name">Enterprise</div>
            <div className="price-desc">
              Custom security, SLAs, and dedicated support for large-scale
              organizations.
            </div>
            <div className="price-amount" style={{ fontSize: "2.2rem" }}>
              Custom
            </div>
            <ul className="price-features">
              <li>
                <div className="pf-check">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </div>
                Everything in Pro
              </li>
              <li>
                <div className="pf-check">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </div>
                SSO & SAML
              </li>
              <li>
                <div className="pf-check">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </div>
                Custom integrations
              </li>
              <li>
                <div className="pf-check">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </div>
                Dedicated CSM
              </li>
              <li>
                <div className="pf-check">
                  <svg viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                </div>
                99.99% uptime SLA
              </li>
            </ul>
            <button className="btn-price-o">Contact Sales</button>
          </div>
        </div>
        <div className="pricing-note">
          All plans include a 14-day free trial · No credit card required ·
          Cancel anytime
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials">
        <div className="section-header">
          <h2>Loved by teams worldwide</h2>
          <p>Don't take our word for it — here's what real teams are saying.</p>
        </div>
        <div className="testi-grid">
          <div className="testi-card">
            <div className="testi-quote-icon">"</div>
            <p className="testi-text">
              Vertex replaced 5 different tools for us. The AI assistant alone
              saves us 20 hours per week. I can't imagine going back.
            </p>
            <div className="testi-author">
              <div className="testi-avatar">JD</div>
              <div>
                <div className="testi-name">Jordan Doe</div>
                <div className="testi-role">CTO, ScaleUp Inc.</div>
                <div className="stars">
                  <svg className="star-icon" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="star-icon" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="star-icon" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="star-icon" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="star-icon" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="testi-card">
            <div className="testi-quote-icon">"</div>
            <p className="testi-text">
              Stock management used to be our biggest headache. Vertex fixed
              it overnight. Our stock accuracy went from 78% to 99.2%.
            </p>
            <div className="testi-author">
              <div className="testi-avatar">SM</div>
              <div>
                <div className="testi-name">Sarah Mitchell</div>
                <div className="testi-role">Operations Lead, TechFlow</div>
                <div className="stars">
                  <svg className="star-icon" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="star-icon" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="star-icon" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="star-icon" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="star-icon" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div className="testi-card">
            <div className="testi-quote-icon">"</div>
            <p className="testi-text">
              We cut our tool spending by $4,200/month and our team's
              productivity doubled in the first two weeks. Genuinely magical
              product.
            </p>
            <div className="testi-author">
              <div className="testi-avatar">MK</div>
              <div>
                <div className="testi-name">Mike Kim</div>
                <div className="testi-role">Founder, NextGen Labs</div>
                <div className="stars">
                  <svg className="star-icon" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="star-icon" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="star-icon" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="star-icon" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="star-icon" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq" id="faq">
        <div className="section-header">
          <h2>Common questions</h2>
          <p>Everything you need to know before getting started.</p>
        </div>
        <div className="faq-list">
          <div className="faq-item">
            <button className="faq-q" onClick={toggleAccordion}>
              How does the 14-day trial work?
              <div className="faq-icon">
                <svg viewBox="0 0 12 12">
                  <path d="M6 2v8M2 6h8" />
                </svg>
              </div>
            </button>
            <div className="faq-a">
              <div className="faq-a-inner">
                Sign up with your email — no credit card required. You get full
                Pro access for 14 days. If you love it, add your payment info.
                If not, your account simply pauses with no charges.
              </div>
            </div>
          </div>
          <div className="faq-item">
            <button className="faq-q" onClick={toggleAccordion}>
              Can I import data from Jira, Trello, or Asana?
              <div className="faq-icon">
                <svg viewBox="0 0 12 12">
                  <path d="M6 2v8M2 6h8" />
                </svg>
              </div>
            </button>
            <div className="faq-a">
              <div className="faq-a-inner">
                Yes — we have one-click importers for Jira, Trello, Asana,
                Monday.com, and ClickUp. Your projects, tasks, comments, and
                attachments migrate automatically in minutes.
              </div>
            </div>
          </div>
          <div className="faq-item">
            <button className="faq-q" onClick={toggleAccordion}>
              Is my data secure?
              <div className="faq-icon">
                <svg viewBox="0 0 12 12">
                  <path d="M6 2v8M2 6h8" />
                </svg>
              </div>
            </button>
            <div className="faq-a">
              <div className="faq-a-inner">
                Absolutely. Vertex is SOC 2 Type II certified, GDPR compliant,
                and uses AES-256 encryption at rest and in transit. Enterprise
                plans include SSO, SAML, and dedicated infrastructure.
              </div>
            </div>
          </div>
          <div className="faq-item">
            <button className="faq-q" onClick={toggleAccordion}>
              How many team members can I invite?
              <div className="faq-icon">
                <svg viewBox="0 0 12 12">
                  <path d="M6 2v8M2 6h8" />
                </svg>
              </div>
            </button>
            <div className="faq-a">
              <div className="faq-a-inner">
                Starter plans support up to 5 members. Pro plans are unlimited —
                invite your entire company if you need to. Enterprise plans
                include custom user management and SSO.
              </div>
            </div>
          </div>
          <div className="faq-item">
            <button className="faq-q" onClick={toggleAccordion}>
              Does Vertex work offline?
              <div className="faq-icon">
                <svg viewBox="0 0 12 12">
                  <path d="M6 2v8M2 6h8" />
                </svg>
              </div>
            </button>
            <div className="faq-a">
              <div className="faq-a-inner">
                Vertex has a Progressive Web App (PWA) mode that lets you view
                and edit tasks offline. Changes sync automatically when you
                reconnect. Mobile apps for iOS and Android are coming Q3 2025.
              </div>
            </div>
          </div>
          <div className="faq-item">
            <button className="faq-q" onClick={toggleAccordion}>
              Can I cancel anytime?
              <div className="faq-icon">
                <svg viewBox="0 0 12 12">
                  <path d="M6 2v8M2 6h8" />
                </svg>
              </div>
            </button>
            <div className="faq-a">
              <div className="faq-a-inner">
                Yes, cancel anytime from your account settings — no questions
                asked, no cancellation fees. Your data is exportable at any time
                in JSON, CSV, or PDF format.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta-final">
        <div className="cta-glow-1"></div>
        <div className="cta-box" id="cta-box">
          <h2>Ready to ship faster?</h2>
          <p>
            Join 500+ teams that replaced their entire tool stack with Vertex.
            Start free today — no credit card, no commitment.
          </p>
          <div className="cta-btns">
            <Link
              to="/signup"
              className="btn-cta-p flex items-center justify-center"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-grid">
          <div>
            <div className="footer-brand">Vertex</div>
            <p className="footer-desc">
              All-in-one project management for modern teams that demand
              excellence and speed.
            </p>
            <div className="social-row">
              <div className="social-btn">
                <svg viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </div>
              <div className="social-btn">
                <svg viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </div>
              <div className="social-btn">
                <svg viewBox="0 0 24 24">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li>
                <a href="#">Features</a>
              </li>
              <li>
                <a href="#">Pricing</a>
              </li>
              <li>
                <a href="#">Changelog</a>
              </li>
              <li>
                <a href="#">Roadmap</a>
              </li>
              <li>
                <a href="#">Integrations</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li>
                <a href="#">About</a>
              </li>
              <li>
                <a href="#">Blog</a>
              </li>
              <li>
                <a href="#">Careers</a>
              </li>
              <li>
                <a href="#">Press</a>
              </li>
              <li>
                <a href="#">Contact</a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <ul>
              <li>
                <a href="#">Documentation</a>
              </li>
              <li>
                <a href="#">API Reference</a>
              </li>
              <li>
                <a href="#">Help Center</a>
              </li>
              <li>
                <a href="#">Status</a>
              </li>
              <li>
                <a href="#">Community</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 Vertex, Inc. All rights reserved.</span>
          <div className="footer-bottom-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Security</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}