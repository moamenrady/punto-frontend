import React, { useState, useEffect, useCallback } from "react";
import { 
  Settings, 
  Plus, 
  LayoutDashboard, 
  ShieldCheck, 
  Loader2,
  Users,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Briefcase,
  ArrowRightLeft,
  Search
} from "lucide-react";
import axios from "axios";
import Avatar from "../components/Avatar";

const BASE = "https://punto-production-21ed.up.railway.app/api/v1";

export default function CompanyControlPanel({ theme, company: initialCompany }) {
  const [company, setCompany] = useState(initialCompany);
  const [departments, setDepartments] = useState([]);  // from company.departments
  const [users, setUsers] = useState([]);               // flat list of all company users
  const [fetchingCompany, setFetchingCompany] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState({});

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteModalDept, setInviteModalDept] = useState(null); // dept object { _id, name }
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  // Create Department Modal
  const [showCreateDeptModal, setShowCreateDeptModal] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  const [createDeptError, setCreateDeptError] = useState("");
  const [createDeptSuccessMsg, setCreateDeptSuccessMsg] = useState("");
  const [isCreatingDept, setIsCreatingDept] = useState(false);

  // Delete Confirmation Modal
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [isDeletingDeptConfirm, setIsDeletingDeptConfirm] = useState(false);
  const [deleteDeptError, setDeleteDeptError] = useState("");

  // ─── Fetch company (with departments) ───────────────────────────────────────
  const fetchCompany = useCallback(async () => {
    setFetchingCompany(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE}/companies/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === "success") {
        const c = res.data.data.company;

        setCompany(c);
        const depts = Array.isArray(c.departments) ? c.departments : [];
        setDepartments(depts);
        // Auto-expand all departments
        setExpandedDepts(prev => {
          const next = { ...prev };
          depts.forEach(d => {
            if (next[d._id] === undefined) next[d._id] = true;
          });
          return next;
        });
      }
    } catch (err) {
      console.error("Error fetching company:", err);
    } finally {
      setFetchingCompany(false);
    }
  }, []);

  // ─── Fetch all users (for member details) ───────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setFetchingUsers(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === "success") {
        setUsers(res.data.data.users || []);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setFetchingUsers(false);
    }
  }, []);

  const [authData, setAuthData] = useState(null);
  const [fetchingAuth, setFetchingAuth] = useState(false);
  const [activeTab, setActiveTab] = useState("systems");
  const [selectedAuthItem, setSelectedAuthItem] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authSearchQuery, setAuthSearchQuery] = useState("");

  const fetchAuthData = useCallback(async () => {
    setFetchingAuth(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${BASE}/companies/my-company/authorization-check`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.status === "success") {
        setAuthData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching authorization check data:", err);
    } finally {
      setFetchingAuth(false);
    }
  }, []);

  useEffect(() => {
    fetchCompany();
    fetchUsers();
    fetchAuthData();
  }, [fetchCompany, fetchUsers, fetchAuthData]);

  // ─── Resolve a member id → user object ──────────────────────────────────────
  const resolveUser = (memberId) => {
    const id = typeof memberId === "object" ? memberId._id || memberId : memberId;
    return users.find(u => u._id === id) || { _id: id, name: "Unknown", email: "" };
  };

  // ─── Create Department Handlers ──────────────────────────────────────────────
  const closeCreateDeptModal = () => {
    setShowCreateDeptModal(false);
    setNewDeptName("");
    setCreateDeptError("");
    setCreateDeptSuccessMsg("");
  };

  const handleCreateDeptSubmit = async (e) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setIsCreatingDept(true);
    setCreateDeptError("");
    setCreateDeptSuccessMsg("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${BASE}/companies/my-company/departments`,
        { name: newDeptName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCreateDeptSuccessMsg("Department created successfully!");
      if (res.data.status === "success" && res.data.data.company) {
        const c = res.data.data.company;
        setCompany(c);
        setDepartments(Array.isArray(c.departments) ? c.departments : []);
      }
      setTimeout(() => {
        closeCreateDeptModal();
      }, 1500);
    } catch (err) {
      setCreateDeptError(err.response?.data?.message || "Failed to create department");
    } finally {
      setIsCreatingDept(false);
    }
  };

  const handleDeleteDept = (dept) => {
    setDeptToDelete(dept);
    setDeleteDeptError("");
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteDept = async () => {
    if (!deptToDelete) return;
    setIsDeletingDeptConfirm(true);
    setDeleteDeptError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(
        `${BASE}/companies/my-company/departments/${deptToDelete._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.status === "success" && res.data.data.company) {
        const c = res.data.data.company;
        setCompany(c);
        setDepartments(Array.isArray(c.departments) ? c.departments : []);
      }
      setShowDeleteConfirmModal(false);
      setDeptToDelete(null);
    } catch (err) {
      setDeleteDeptError(err.response?.data?.message || "Failed to delete department");
    } finally {
      setIsDeletingDeptConfirm(false);
    }
  };

  // ─── Open invite modal for a specific department ─────────────────────────────
  const openInviteModal = (dept) => {
    setInviteModalDept(dept);
    setInviteEmail("");
    setInviteError("");
    setInviteSuccessMsg("");
    setShowInviteModal(true);
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setInviteModalDept(null);
    setInviteEmail("");
    setInviteError("");
    setInviteSuccessMsg("");
  };

  // ─── Add user to department ──────────────────────────────────────────────────
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteModalDept) return;
    setIsInviting(true);
    setInviteError("");
    setInviteSuccessMsg("");
    try {
      const token = localStorage.getItem("token");
      if (inviteModalDept._id && inviteModalDept._id !== "company") {
        await axios.post(
          `${BASE}/companies/my-company/departments/${inviteModalDept._id}/users`,
          { email: inviteEmail.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${BASE}/companies/add-user`,
          { email: inviteEmail.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setInviteSuccessMsg("User added successfully!");
      fetchUsers();
      fetchCompany();
      setTimeout(() => {
        closeInviteModal();
      }, 1500);
    } catch (err) {
      setInviteError(err.response?.data?.message || "Failed to add user");
    } finally {
      setIsInviting(false);
    }
  };

  // ─── Move user to another department ────────────────────────────────────────
  const handleMoveUser = async (userId, targetDeptId) => {
    try {
      const token = localStorage.getItem("token");
      if (targetDeptId) {
        await axios.post(
          `${BASE}/companies/my-company/departments/${targetDeptId}/users`,
          { userId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Unassign: update user dept to empty
        await axios.patch(
          `${BASE}/users/${userId}`,
          { dept: "" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      fetchCompany();
      fetchUsers();
    } catch (err) {
      console.error("Failed to move user:", err);
      alert(err.response?.data?.message || "Failed to move user");
    }
  };

  const isLoading = fetchingCompany || fetchingUsers;
  const totalMembers = users.length || company?.company_users?.length || 0;

  if (fetchingCompany && !company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-purple-600" size={40} />
          <p className="text-sm font-semibold text-gray-500">Loading control panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className={`text-3xl font-extrabold flex items-center gap-3 ${theme.textP}`}>
            <ShieldCheck size={32} className="text-purple-500" />
            {company?.name} Control Panel
          </h1>
          <p className={`${theme.textM} mt-2`}>Manage your organization, team members, and departments.</p>
        </div>
        <div className={`px-4 py-2 rounded-xl border ${theme.border}`} style={{ backgroundColor: `${theme.primary}20` }}>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.primary }}>
            {company?.plan_id?.name || "Active Plan"}
          </span>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

        {/* Total Members */}
        <div className={`p-6 rounded-3xl border ${theme.border} ${theme.input} shadow-sm flex flex-col justify-between`}>
          <div>
            <h4 className={`text-xs font-bold uppercase ${theme.textM} mb-4`}>Total Members</h4>
            <div className="flex items-end gap-2">
              <span className={`text-4xl font-black ${theme.textP}`}>{totalMembers}</span>
              <span className={`text-sm font-medium ${theme.textM} opacity-70 mb-1`}>Users registered</span>
            </div>
          </div>
          <button
            onClick={() => openInviteModal({ _id: "company", name: "Company" })}
            className="mt-4 w-full py-2.5 rounded-xl text-white font-bold bg-purple-600 hover:bg-purple-700 text-xs transition-all flex items-center justify-center gap-1 shadow-md"
          >
            <Plus size={14} />
            Add users to the company
          </button>
        </div>

        {/* Active Plan */}
        <div className={`p-6 rounded-3xl border ${theme.border} ${theme.input} shadow-sm`}>
          <h4 className={`text-xs font-bold uppercase ${theme.textM} mb-4`}>Active Plan</h4>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-green-500">${company?.plan_id?.value || 0}</span>
            <span className={`text-sm font-medium ${theme.textM} opacity-70 mb-1`}>/ month</span>
          </div>
        </div>

        {/* Active Features */}
        <div className={`p-6 rounded-3xl border ${theme.border} ${theme.input} shadow-sm`}>
          <h4 className={`text-xs font-bold uppercase ${theme.textM} mb-4`}>Active Features</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {company?.plan_id?.features?.map(f => (
              <span key={f} className="text-[10px] px-2 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 rounded-md font-bold uppercase">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Departments Panel */}
        <div className={`p-8 rounded-[40px] border ${theme.border} ${theme.input} shadow-xl lg:col-span-2`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className={`text-xl font-bold flex items-center gap-2 ${theme.textP}`}>
                <Users className="text-purple-500" size={24} />
                Departments & Team
              </h3>
              <p className={`text-xs ${theme.textM} mt-1`}>
                {departments.length} department{departments.length !== 1 ? "s" : ""} in your organisation.
              </p>
            </div>
            <button
              onClick={() => setShowCreateDeptModal(true)}
              className="py-2 px-4 rounded-xl text-white font-bold bg-purple-600 hover:bg-purple-700 text-xs transition-all flex items-center gap-1 shadow-md self-start sm:self-center"
            >
              <Plus size={14} />
              Add Department
            </button>
          </div>

          {/* Loading state */}
          {fetchingCompany && departments.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 className="animate-spin text-purple-600" size={32} />
              <p className="text-xs text-gray-500 font-medium">Loading departments…</p>
            </div>

          ) : departments.length === 0 ? (
            <div className="text-center py-16">
              <FolderPlus className="mx-auto text-purple-300 mb-4" size={48} />
              <p className={`text-sm font-semibold ${theme.textP}`}>No departments found</p>
              <p className={`text-xs ${theme.textM} mt-1 opacity-70`}>
                Departments will appear here once they are created in your company.
              </p>
            </div>

          ) : (
            <div className="space-y-4">
              {departments.map(dept => {
                const isExpanded = !!expandedDepts[dept._id];
                // API returns populated user objects in dept.users
                const members = Array.isArray(dept.users) ? dept.users : [];
                const memberCount = members.length;

                return (
                  <div key={dept._id} className={`border ${theme.border} rounded-2xl overflow-hidden`}>

                    {/* Department header row */}
                    <div
                      className="flex items-center justify-between px-6 py-4 cursor-pointer select-none"
                      style={{ backgroundColor: `${theme.primary}08` }}
                      onClick={() => setExpandedDepts(prev => ({ ...prev, [dept._id]: !prev[dept._id] }))}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded
                          ? <ChevronDown size={18} className="opacity-60" />
                          : <ChevronRight size={18} className="opacity-60" />
                        }
                        <Briefcase size={16} className="text-purple-500" />
                        <span className={`font-bold text-sm ${theme.textP}`}>{dept.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          {memberCount} {memberCount === 1 ? "member" : "members"}
                        </span>
                      </div>

                      {/* Add user button – stops propagation so click doesn't toggle collapse */}
                      <div onClick={e => e.stopPropagation()} className="flex items-center gap-2">
                        <button
                          onClick={() => openInviteModal(dept)}
                          className={`p-1.5 rounded-lg border ${theme.border} hover:bg-purple-500 hover:text-white transition-all ${theme.textP}`}
                          title={`Add user to ${dept.name}`}
                        >
                          <Plus size={14} />
                        </button>
                        {memberCount === 0 && (
                          <button
                            onClick={() => handleDeleteDept(dept)}
                            className={`p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-500 hover:text-white hover:border-transparent transition-all flex items-center justify-center`}
                            title={`Delete ${dept.name} department`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Department body */}
                    {isExpanded && (
                      <div className="px-6 py-4 border-t border-dashed" style={{ borderColor: `${theme.primary}20` }}>
                        {memberCount === 0 ? (
                          <p className={`text-xs ${theme.textM} opacity-60 py-2`}>
                            No members in this department yet. Click <strong>+</strong> to add someone.
                          </p>
                        ) : (
                          <div className="divide-y divide-gray-100 dark:divide-[#2E2B5A]">
                            {members.map((u, idx) => (
                              <div
                                key={u._id || idx}
                                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar 
                                    photo={u.photo} 
                                    name={u.name} 
                                    size={32} 
                                    className="border-2 border-purple-200 dark:border-purple-800" 
                                  />
                                  <div>
                                    <p className={`text-sm font-bold ${theme.textP}`}>{u.name}</p>
                                    <p className={`text-xs ${theme.textM} opacity-80 mt-0.5`}>{u.email}</p>
                                    {u.role && (
                                      <span className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 mt-1 rounded bg-gray-100 dark:bg-[#1E1B3A] ${theme.textM}`}>
                                        {u.role}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Move-to selector */}
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs ${theme.textM} opacity-60 flex items-center gap-1`}>
                                    <ArrowRightLeft size={12} />
                                    Move to:
                                  </span>
                                  <select
                                    defaultValue={dept._id}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val !== dept._id) handleMoveUser(u._id, val || null);
                                    }}
                                    className={`text-xs px-2 py-1.5 rounded-lg border outline-none bg-white dark:bg-[#1E1B3A] ${theme.border} !text-black dark:!text-white`}
                                  >
                                    {departments.map(d => (
                                      <option key={d._id} value={d._id}>{d.name}</option>
                                    ))}
                                    <option value="">— Unassigned —</option>
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Settings */}
        <div className="space-y-6 lg:col-span-1">
          <div className={`p-8 rounded-[40px] border ${theme.border} ${theme.input} shadow-xl`}>
            <h3 className={`text-xl font-bold mb-6 ${theme.textP}`}>Quick Settings</h3>
            <div className="space-y-4">
              <div className={`flex items-center p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-transparent hover:border-purple-200 cursor-pointer transition-all`}>
                <div className="flex items-center gap-4">
                  <LayoutDashboard className="text-purple-500" />
                  <div>
                    <p className={`font-bold ${theme.textP}`}>Organization Settings</p>
                    <p className={`text-xs ${theme.textM} opacity-70`}>Change name, logo, and website</p>
                  </div>
                </div>
              </div>
              <div className={`flex items-center p-4 rounded-2xl bg-white/40 dark:bg-white/5 border border-transparent hover:border-purple-200 cursor-pointer transition-all`}>
                <div className="flex items-center gap-4">
                  <Settings className="text-blue-500" />
                  <div>
                    <p className={`font-bold ${theme.textP}`}>Billing & Invoices</p>
                    <p className={`text-xs ${theme.textM} opacity-70`}>Manage your subscription</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Check Authorization Section ── */}
      <div className={`mt-12 p-8 rounded-[40px] border ${theme.border} ${theme.input} shadow-xl space-y-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6" style={{ borderColor: `${theme.primary}20` }}>
          <div>
            <h3 className={`text-2xl font-extrabold flex items-center gap-3 ${theme.textP}`}>
              <ShieldCheck className="text-emerald-500" size={28} />
              Check Authorization
            </h3>
            <p className={`text-xs ${theme.textM} mt-1 opacity-85`}>
              Verify access permissions and view who can access specific resources in the company.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap bg-gray-100/80 dark:bg-[#12102A] p-1.5 rounded-2xl border border-transparent dark:border-[#2E2B5A] gap-1 self-start sm:self-center shadow-inner">
            {[
              { id: "systems", label: "Systems", count: authData?.systems?.length || 0 },
              { id: "projects", label: "Projects", count: authData?.projects?.length || 0 },
              { id: "teams", label: "Teams", count: authData?.teams?.length || 0 },
              { id: "pages", label: "Pages/Sheets", count: authData?.pages?.length || 0 },
              { id: "groupChats", label: "Group Chats", count: authData?.groupChats?.length || 0 },
              { id: "chats", label: "Private Chats", count: authData?.chats?.length || 0 }
            ].map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    active
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20 scale-105"
                      : `${theme.textM} hover:text-purple-500 hover:bg-purple-500/10`
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-white/20 text-white" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resource Items Grid */}
        {fetchingAuth ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <Loader2 className="animate-spin text-purple-600" size={32} />
            <p className="text-xs text-gray-500 font-medium">Checking authorizations…</p>
          </div>
        ) : !authData || !authData[activeTab] || authData[activeTab].length === 0 ? (
          <div className="text-center py-16">
            <FolderPlus className="mx-auto text-purple-300/40 mb-4" size={48} />
            <p className={`text-sm font-semibold ${theme.textP}`}>No resources found</p>
            <p className={`text-xs ${theme.textM} mt-1 opacity-70`}>
              Resources in this category will appear here once they are created in your company.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {authData[activeTab].map(item => (
              <div
                key={item._id}
                className={`p-6 rounded-3xl border ${theme.border} bg-white/40 dark:bg-white/5 hover:border-purple-500/40 hover:shadow-lg transition-all duration-300 group flex items-center justify-between gap-4`}
              >
                <div className="min-w-0 flex-1">
                  <h4 className={`font-bold text-sm truncate ${theme.textP}`} title={item.name}>
                    {item.name}
                  </h4>
                  <p className={`text-xs ${theme.textM} mt-1 truncate opacity-70`}>
                    {item.description || "No description provided."}
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/5 px-2 py-1 rounded-lg w-max">
                    <Users size={12} />
                    <span>{item.authorizedUsers?.length || 0} users authorized</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedAuthItem({ ...item, resourceType: activeTab });
                    setShowAuthModal(true);
                  }}
                  className={`p-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 hover:scale-110 active:scale-95 transition-all flex items-center justify-center`}
                  title="Check authorized users"
                >
                  <Search size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Invite Modal ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className={`w-full max-w-md p-8 rounded-[40px] border ${theme.border} ${theme.input} shadow-2xl space-y-6`}>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xl font-bold ${theme.textP}`}>
                  {inviteModalDept && inviteModalDept._id !== "company"
                    ? `Add to "${inviteModalDept.name}"`
                    : "Add User to Company"}
                </h3>
                <p className={`text-xs ${theme.textM} mt-1 opacity-70`}>
                  Enter the email address of the user to add.
                </p>
              </div>
              <button
                onClick={closeInviteModal}
                className={`p-2 rounded-full border ${theme.border} hover:bg-gray-100 dark:hover:bg-[#1E1B3A] transition-all ${theme.textP}`}
              >
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className={`text-xs font-semibold ${theme.textM}`}>User Email Address</label>
                <input
                  type="email"
                  placeholder="Enter email to invite"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${theme.border} ${theme.input} text-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                  style={{ color: theme.textP?.includes('1E1B3A') ? '#1E1B3A' : '#E2E0FF' }}
                  required
                  autoFocus
                  disabled={isInviting || !!inviteSuccessMsg}
                />
              </div>

              {inviteError && (
                <p className="text-xs font-bold text-red-500 text-center">{inviteError}</p>
              )}
              {inviteSuccessMsg && (
                <p className="text-xs font-bold text-green-500 text-center">{inviteSuccessMsg}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeInviteModal}
                  disabled={isInviting || !!inviteSuccessMsg}
                  className={`flex-1 py-3 rounded-xl border ${theme.border} hover:bg-gray-100 dark:hover:bg-[#1E1B3A] text-xs font-bold transition-all ${theme.textP}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting || !!inviteSuccessMsg}
                  className="flex-1 py-3 rounded-xl text-white font-bold bg-purple-600 hover:bg-purple-700 text-xs transition-all flex justify-center items-center"
                >
                  {inviteSuccessMsg
                    ? "Added!"
                    : isInviting
                      ? <Loader2 className="animate-spin" size={16} />
                      : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Department Modal ── */}
      {showCreateDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className={`w-full max-w-md p-8 rounded-[40px] border ${theme.border} ${theme.input} shadow-2xl space-y-6`}>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xl font-bold ${theme.textP}`}>
                  Create New Department
                </h3>
                <p className={`text-xs ${theme.textM} mt-1 opacity-70`}>
                  Enter the name of the new department.
                </p>
              </div>
              <button
                onClick={closeCreateDeptModal}
                className={`p-2 rounded-full border ${theme.border} hover:bg-gray-100 dark:hover:bg-[#1E1B3A] transition-all ${theme.textP}`}
              >
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateDeptSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className={`text-xs font-semibold ${theme.textM}`}>Department Name</label>
                <input
                  type="text"
                  placeholder="e.g. Finance, Marketing, IT"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${theme.border} ${theme.input} text-sm placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                  style={{ color: theme.textP?.includes('1E1B3A') ? '#1E1B3A' : '#E2E0FF' }}
                  required
                  autoFocus
                  disabled={isCreatingDept || !!createDeptSuccessMsg}
                />
              </div>

              {createDeptError && (
                <p className="text-xs font-bold text-red-500 text-center">{createDeptError}</p>
              )}
              {createDeptSuccessMsg && (
                <p className="text-xs font-bold text-green-500 text-center">{createDeptSuccessMsg}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeCreateDeptModal}
                  disabled={isCreatingDept || !!createDeptSuccessMsg}
                  className={`flex-1 py-3 rounded-xl border ${theme.border} hover:bg-gray-100 dark:hover:bg-[#1E1B3A] text-xs font-bold transition-all ${theme.textP}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDept || !!createDeptSuccessMsg}
                  className="flex-1 py-3 rounded-xl text-white font-bold bg-purple-600 hover:bg-purple-700 text-xs transition-all flex justify-center items-center"
                >
                  {createDeptSuccessMsg
                    ? "Created!"
                    : isCreatingDept
                      ? <Loader2 className="animate-spin" size={16} />
                      : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirmModal && deptToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className={`w-full max-w-md p-8 rounded-[40px] border ${theme.border} ${theme.input} shadow-2xl space-y-6`}>

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-xl font-bold ${theme.textP} flex items-center gap-2`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                  Delete Department
                </h3>
                <p className={`text-xs ${theme.textM} mt-1 opacity-70`}>
                  This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => { setShowDeleteConfirmModal(false); setDeptToDelete(null); }}
                className={`p-2 rounded-full border ${theme.border} hover:bg-gray-100 dark:hover:bg-[#1E1B3A] transition-all ${theme.textP}`}
              >
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            <div className={`text-sm ${theme.textP}`}>
              Are you sure you want to delete the department <strong className="text-red-500 font-bold">"{deptToDelete.name}"</strong>?
            </div>

            {deleteDeptError && (
              <p className="text-xs font-bold text-red-500 text-center">{deleteDeptError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowDeleteConfirmModal(false); setDeptToDelete(null); }}
                disabled={isDeletingDeptConfirm}
                className={`flex-1 py-3 rounded-xl border ${theme.border} hover:bg-gray-100 dark:hover:bg-[#1E1B3A] text-xs font-bold transition-all ${theme.textP}`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDept}
                disabled={isDeletingDeptConfirm}
                className="flex-1 py-3 rounded-xl text-white font-bold bg-red-600 hover:bg-red-700 text-xs transition-all flex justify-center items-center gap-1 shadow-md shadow-red-500/10"
              >
                {isDeletingDeptConfirm ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Authorized Users Modal ── */}
      {showAuthModal && selectedAuthItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
          <div className={`w-full max-w-lg p-8 rounded-[40px] border ${theme.border} ${theme.input} shadow-2xl space-y-6 flex flex-col max-h-[90vh]`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: `${theme.primary}20` }}>
              <div>
                <h3 className={`text-xl font-bold flex items-center gap-2 ${theme.textP}`}>
                  <ShieldCheck className="text-emerald-500" size={24} />
                  Authorized Access List
                </h3>
                <p className={`text-xs ${theme.textM} mt-1 max-w-[360px] truncate`} title={selectedAuthItem.name}>
                  For: <strong className="text-purple-500">{selectedAuthItem.name}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setSelectedAuthItem(null);
                  setAuthSearchQuery("");
                }}
                className={`p-2 rounded-full border ${theme.border} hover:bg-gray-100 dark:hover:bg-[#1E1B3A] transition-all ${theme.textP}`}
              >
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            {/* User Search Input */}
            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${theme.border} ${theme.input}`}>
              <Search size={18} className={theme.textM} />
              <input
                type="text"
                placeholder="Search authorized users by name or email..."
                value={authSearchQuery}
                onChange={(e) => setAuthSearchQuery(e.target.value)}
                className={`bg-transparent outline-none flex-1 text-sm ${theme.textP}`}
                style={{ color: theme.textP?.includes('1E1B3A') ? '#1E1B3A' : '#E2E0FF' }}
              />
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {(() => {
                const filtered = (selectedAuthItem.authorizedUsers || []).filter(u =>
                  u.name?.toLowerCase().includes(authSearchQuery.toLowerCase()) ||
                  u.email?.toLowerCase().includes(authSearchQuery.toLowerCase())
                );

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-sm text-gray-500">
                      No authorized users match your search.
                    </div>
                  );
                }

                return filtered.map(u => (
                  <div
                    key={u._id}
                    className={`flex items-center justify-between gap-4 p-4 rounded-2xl border ${theme.border} bg-white/20 dark:bg-white/5 hover:bg-white/45 dark:hover:bg-white/10 transition-all`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar photo={u.photo} name={u.name} size={36} className="border border-purple-300" />
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${theme.textP}`}>{u.name}</p>
                        <p className={`text-xs ${theme.textM} truncate opacity-85`}>{u.email}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      {u.role && (
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400`}>
                          {u.role}
                        </span>
                      )}
                      <div className="flex flex-wrap gap-1 justify-end max-w-[140px]">
                        {u.reasons?.map((reason, idx) => (
                          <span
                            key={idx}
                            className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wide"
                            title={`Authorized because they are a ${reason}`}
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Footer */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  setSelectedAuthItem(null);
                  setAuthSearchQuery("");
                }}
                className={`w-full py-3 rounded-xl border ${theme.border} hover:bg-gray-100 dark:hover:bg-[#1E1B3A] text-xs font-bold transition-all ${theme.textP}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
