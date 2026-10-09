import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const DEPARTMENTS = [
  { id: 'ALL', label: 'All Departments', icon: 'fa-layer-group' },
  { id: 'DELIVERY_MANAGEMENT', label: 'Delivery Management', icon: 'fa-truck-fast' },
  { id: 'CATALOG_MANAGEMENT', label: 'Catalog & Stocks', icon: 'fa-boxes-stacked' },
  { id: 'PRESCRIPTION_MANAGEMENT', label: 'Prescription Management', icon: 'fa-file-prescription' },
  { id: 'COLD_CHAIN_MANAGEMENT', label: 'Cold Chain Monitoring', icon: 'fa-snowflake' },
  { id: 'SUBSCRIPTION_MANAGEMENT', label: 'Refill Subscriptions', icon: 'fa-arrows-rotate' },
  { id: 'USER_SECURITY', label: 'User & Security Admin', icon: 'fa-shield-halved' },
  { id: 'FINANCE_MANAGEMENT', label: 'Finance & Orders', icon: 'fa-file-invoice-dollar' },
  { id: 'SYSTEM_ADMIN', label: 'System Infrastructure', icon: 'fa-server' }
];

const ROLES = [
  'SYSTEM_ADMIN',
  'CHIEF_PHARMACIST',
  'OPERATIONS_MANAGER',
  'DELIVERY_COORDINATOR',
  'DELIVERY_RIDER',
  'FINANCE_MANAGER',
  'IT_MANAGER',
  'CUSTOMER'
];

const SystemAdminConsolePage = () => {
  const { user } = useAuth();
  const [activeModule, setActiveModule] = useState('rbac'); // rbac | audit | flags | subscriptions
  
  // Data states
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [flags, setFlags] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Filter & Search states for RBAC
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');

  // Filter & Search states for Audit Logs
  const [auditDeptFilter, setAuditDeptFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  // User CRUD Modal States
  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userForm, setUserForm] = useState({
    userId: null,
    fullName: '',
    email: '',
    password: '',
    role: 'SYSTEM_ADMIN',
    status: 'ACTIVE',
    phoneNumber: '',
    avatarUrl: ''
  });
  const [userDeleteConfirm, setUserDeleteConfirm] = useState(null);

  // Audit Log CRUD Modal States
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [isEditingAudit, setIsEditingAudit] = useState(false);
  const [auditForm, setAuditForm] = useState({
    id: null,
    department: 'DELIVERY_MANAGEMENT',
    action: 'MANUAL_OVERRIDE',
    entity: 'Delivery',
    entityId: '',
    beforeState: '',
    afterState: '',
    severity: 'INFO',
    notes: '',
    actorEmail: '',
    actorRole: 'SYSTEM_ADMIN'
  });
  const [auditDeleteConfirm, setAuditDeleteConfirm] = useState(null);

  // Load Data by active module
  const loadModuleData = async (mod = activeModule) => {
    setLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      if (mod === 'rbac') {
        const res = await client.get('/api/v1/users');
        setUsersList(res.data?.data || res.data || []);
      } else if (mod === 'audit') {
        const deptParam = auditDeptFilter !== 'ALL' ? `&department=${auditDeptFilter}` : '';
        const res = await client.get(`/api/v1/admin/audit?page=0&size=100${deptParam}`);
        setAuditLogs(res.data?.data?.content || res.data?.content || []);
      } else if (mod === 'flags') {
        const res = await client.get('/api/v1/admin/flags');
        setFlags(res.data?.data || res.data || []);
      } else if (mod === 'subscriptions') {
        const res = await client.get('/api/v1/subscriptions');
        setSubscriptions(res.data?.data || res.data || []);
      }
    } catch (err) {
      console.warn('Console module fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModuleData(activeModule);
  }, [activeModule, auditDeptFilter]);

  // ==========================================
  // RBAC User CRUD Handlers
  // ==========================================
  const handleOpenCreateUser = () => {
    setIsEditingUser(false);
    setUserForm({
      userId: null,
      fullName: '',
      email: '',
      password: '',
      role: 'SYSTEM_ADMIN',
      status: 'ACTIVE',
      phoneNumber: '',
      avatarUrl: ''
    });
    setShowUserModal(true);
  };

  const handleOpenEditUser = (u) => {
    setIsEditingUser(true);
    setUserForm({
      userId: u.userId || u.id,
      fullName: u.fullName || '',
      email: u.email || '',
      password: '', // leave empty unless resetting
      role: u.role || 'CUSTOMER',
      status: u.status || 'ACTIVE',
      phoneNumber: u.contactNumber || u.phoneNumber || '',
      avatarUrl: u.avatarUrl || ''
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userForm.fullName || !userForm.email) {
      setFeedback({ type: 'error', text: 'Full name and email are required' });
      return;
    }
    if (!isEditingUser && !userForm.password) {
      setFeedback({ type: 'error', text: 'Initial password is required for new profiles' });
      return;
    }

    try {
      if (isEditingUser) {
        const payload = {
          fullName: userForm.fullName,
          email: userForm.email,
          role: userForm.role,
          status: userForm.status,
          phoneNumber: userForm.phoneNumber,
          avatarUrl: userForm.avatarUrl
        };
        if (userForm.password && userForm.password.trim().length > 0) {
          payload.password = userForm.password.trim();
        }
        await client.put(`/api/v1/users/${userForm.userId}`, payload);
        setFeedback({ type: 'success', text: `Profile for ${userForm.email} updated successfully` });
      } else {
        await client.post('/api/v1/users', {
          fullName: userForm.fullName,
          email: userForm.email,
          password: userForm.password,
          role: userForm.role,
          status: userForm.status,
          phoneNumber: userForm.phoneNumber,
          avatarUrl: userForm.avatarUrl
        });
        setFeedback({ type: 'success', text: `Admin/User profile for ${userForm.email} created successfully` });
      }
      setShowUserModal(false);
      loadModuleData('rbac');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save user profile';
      setFeedback({ type: 'error', text: msg });
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await client.delete(`/api/v1/users/${userId}`);
      setFeedback({ type: 'success', text: `User account #${userId} deleted successfully` });
      setUserDeleteConfirm(null);
      loadModuleData('rbac');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete user account';
      setFeedback({ type: 'error', text: msg });
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await client.put(`/api/v1/users/${userId}/status`, { status: nextStatus });
      setFeedback({ type: 'success', text: `User ID #${userId} status set to ${nextStatus}` });
      loadModuleData('rbac');
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to update user status' });
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      await client.put(`/api/v1/users/${userId}/role`, { role: newRole });
      setFeedback({ type: 'success', text: `User ID #${userId} role updated to ${newRole}` });
      loadModuleData('rbac');
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to change user role' });
    }
  };

  // ==========================================
  // Audit Log CRUD Handlers
  // ==========================================
  const handleOpenCreateAudit = () => {
    setIsEditingAudit(false);
    setAuditForm({
      id: null,
      department: auditDeptFilter !== 'ALL' ? auditDeptFilter : 'DELIVERY_MANAGEMENT',
      action: 'MANUAL_OVERRIDE',
      entity: 'Delivery',
      entityId: '',
      beforeState: '',
      afterState: '',
      severity: 'INFO',
      notes: '',
      actorEmail: user?.email || 'admin@mediorder.com',
      actorRole: user?.role || 'SYSTEM_ADMIN'
    });
    setShowAuditModal(true);
  };

  const handleOpenEditAudit = (log) => {
    setIsEditingAudit(true);
    setAuditForm({
      id: log.id,
      department: log.department || 'SYSTEM_ADMIN',
      action: log.action || '',
      entity: log.entity || '',
      entityId: log.entityId || '',
      beforeState: log.beforeState || '',
      afterState: log.afterState || '',
      severity: log.severity || 'INFO',
      notes: log.afterState || '',
      actorEmail: log.actorEmail || user?.email || '',
      actorRole: log.actorRole || 'SYSTEM_ADMIN'
    });
    setShowAuditModal(true);
  };

  const handleSaveAudit = async (e) => {
    e.preventDefault();
    if (!auditForm.department || !auditForm.action || !auditForm.entity) {
      setFeedback({ type: 'error', text: 'Department, action, and entity are required' });
      return;
    }

    try {
      if (isEditingAudit) {
        await client.put(`/api/v1/admin/audit/${auditForm.id}`, {
          department: auditForm.department,
          action: auditForm.action,
          entity: auditForm.entity,
          entityId: auditForm.entityId,
          beforeState: auditForm.beforeState,
          afterState: auditForm.afterState,
          severity: auditForm.severity,
          notes: auditForm.notes
        });
        setFeedback({ type: 'success', text: `Audit log record #${auditForm.id} updated successfully` });
      } else {
        await client.post('/api/v1/admin/audit', {
          department: auditForm.department,
          action: auditForm.action,
          entity: auditForm.entity,
          entityId: auditForm.entityId,
          beforeState: auditForm.beforeState,
          afterState: auditForm.afterState || auditForm.notes,
          severity: auditForm.severity,
          notes: auditForm.notes,
          actorEmail: auditForm.actorEmail || user?.email,
          actorRole: auditForm.actorRole || user?.role
        });
        setFeedback({ type: 'success', text: `Department audit log for [${auditForm.department}] created successfully` });
      }
      setShowAuditModal(false);
      loadModuleData('audit');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save audit log';
      setFeedback({ type: 'error', text: msg });
    }
  };

  const handleDeleteAudit = async (auditId) => {
    try {
      await client.delete(`/api/v1/admin/audit/${auditId}`);
      setFeedback({ type: 'success', text: `Audit log entry #${auditId} deleted` });
      setAuditDeleteConfirm(null);
      loadModuleData('audit');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete audit log';
      setFeedback({ type: 'error', text: msg });
    }
  };

  // ==========================================
  // Feature Flag Toggle
  // ==========================================
  const handleToggleFlag = async (flagKey, currentVal) => {
    try {
      await client.put(`/api/v1/admin/flags/${flagKey}`, {
        enabled: !currentVal,
        reason: `Manual switch by ${user?.email || 'admin'}`,
      });
      setFeedback({ type: 'success', text: `Emergency switch ${flagKey} updated to ${!currentVal ? 'ENABLED' : 'DISABLED'}` });
      loadModuleData('flags');
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to update feature flag' });
    }
  };

  // Filtered lists
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch = !userSearch || 
      (u.fullName && u.fullName.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.contactNumber && u.contactNumber.includes(userSearch));
    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'ALL' || u.status === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredAudits = auditLogs.filter((l) => {
    const matchesDept = auditDeptFilter === 'ALL' || 
      (l.department && l.department.toUpperCase() === auditDeptFilter.toUpperCase());
    const matchesSearch = !auditSearch ||
      (l.action && l.action.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (l.entity && l.entity.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (l.actorEmail && l.actorEmail.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (l.afterState && l.afterState.toLowerCase().includes(auditSearch.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  // Master Active Modules List (As explicitly requested by user)
  const masterModules = [
    { id: 'rbac', label: '1. RBAC Authority Grid', subtitle: 'User & Admin Profile CRUD', icon: 'fa-users-gear' },
    { id: 'audit', label: '2. Audit Log & Department Ledger', subtitle: 'Departmental Audit CRUD', icon: 'fa-list-check' },
    { id: 'flags', label: '3. Emergency Kill Switches', subtitle: 'Circuit Breakers & Controls', icon: 'fa-toggle-on' },
    { id: 'subscriptions', label: '4. Refill Subscriptions', subtitle: 'Chronic Care & Refill Engine', icon: 'fa-arrows-rotate' },
  ];

  // Coming Soon Modules
  const comingSoonModules = [
    { label: 'Server Telemetry & JVM Cluster', desc: 'Real-time multi-node cluster metrics' },
    { label: 'Crash & Error AI Telemetry', desc: 'Predictive exception diagnosis & telemetry' },
    { label: 'Fleet Telemetry & GIS Drone Routing', desc: 'Live GIS geofencing & courier dispatch AI' },
    { label: 'Cold Storage Deep Archives', desc: 'Regulatory cold chain archival storage' },
  ];

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-10 max-w-[1600px] mx-auto min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 mb-6">
        <Link to="/" className="hover:text-black transition-colors">Home</Link>
        <span>/</span>
        <span className="text-black">Master Administration Console</span>
      </div>

      {/* Header Banner */}
      <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl border border-neutral-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              System Admin Master Console
            </h1>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Authority Level 0
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            RBAC Authority Management, Departmental Audit Trails, Emergency Kill Switches, and Chronic Care Refills.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Oversight shortcuts: System Admin can act inside other modules */}
          <Link
            to="/pharmacist_dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
          >
            <i className="fa-solid fa-file-prescription" />
            <span>Prescription Review</span>
          </Link>
          <Link
            to="/modules/delivery"
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold uppercase tracking-wider rounded-xl border border-neutral-700 transition-colors"
          >
            <i className="fa-solid fa-truck-fast" />
            <span>Deliveries</span>
          </Link>
          <button
            onClick={() => loadModuleData(activeModule)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold uppercase tracking-wider rounded-xl border border-neutral-700 transition-colors"
          >
            <i className={`fa-solid fa-rotate ${loading ? 'fa-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback.text && (
        <div className={`mb-6 p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback({ type: '', text: '' })} className="text-neutral-400 hover:text-black">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {/* Main Master Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Module Selector Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Active Master Modules */}
          <div className="space-y-1 bg-white rounded-3xl p-4 border border-neutral-200 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-wider text-neutral-400 px-3 py-2">Master Modules</p>
            {masterModules.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                  activeModule === item.id
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <i className={`fa-solid ${item.icon} w-5 text-center text-sm ${activeModule === item.id ? 'text-emerald-400' : 'text-neutral-400'}`} />
                <div className="truncate">
                  <span className="block">{item.label}</span>
                  <span className={`text-[10px] font-normal normal-case block ${activeModule === item.id ? 'text-neutral-300' : 'text-neutral-400'}`}>
                    {item.subtitle}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Coming Soon Modules Box */}
          <div className="bg-neutral-50 rounded-3xl p-5 border border-dashed border-neutral-300 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500">Upcoming Modules</span>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                Coming Soon
              </span>
            </div>
            <div className="space-y-2">
              {comingSoonModules.map((mod, idx) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-neutral-200/80 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-700">{mod.label}</span>
                    <span className="text-[9px] font-bold text-neutral-400">v2.1</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{mod.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Module Content Area */}
        <div className="lg:col-span-3 space-y-6">

          {/* ========================================================================= */}
          {/* MODULE 1: RBAC Authority Grid & User Profile CRUD */}
          {/* ========================================================================= */}
          {activeModule === 'rbac' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              
              {/* Header & Create Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                    <i className="fa-solid fa-users-gear text-emerald-700" />
                    <span>Module 1: RBAC Authority Grid &amp; Profile Management</span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Create admin profiles, assign emails, set initial passwords, and govern roles across the 8 security tiers.
                  </p>
                </div>

                <button
                  onClick={handleOpenCreateUser}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm shrink-0"
                >
                  <i className="fa-solid fa-user-plus" />
                  <span>Create Admin Profile</span>
                </button>
              </div>

              {/* Statistics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <span className="text-[10px] font-black uppercase text-neutral-400 block">Total Profiles</span>
                  <span className="text-xl font-black text-neutral-900 mt-0.5 block">{usersList.length}</span>
                </div>
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                  <span className="text-[10px] font-black uppercase text-purple-700 block">System Admins</span>
                  <span className="text-xl font-black text-purple-900 mt-0.5 block">
                    {usersList.filter(u => u.role === 'SYSTEM_ADMIN' || u.role === 'ADMIN').length}
                  </span>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <span className="text-[10px] font-black uppercase text-blue-700 block">Clinical &amp; Ops</span>
                  <span className="text-xl font-black text-blue-900 mt-0.5 block">
                    {usersList.filter(u => u.role === 'CHIEF_PHARMACIST' || u.role === 'OPERATIONS_MANAGER').length}
                  </span>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] font-black uppercase text-emerald-700 block">Active Status</span>
                  <span className="text-xl font-black text-emerald-900 mt-0.5 block">
                    {usersList.filter(u => u.status === 'ACTIVE').length}
                  </span>
                </div>
              </div>

              {/* Search and Filters Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                <div className="relative flex-1 w-full">
                  <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by user name, email, or contact number..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 focus:outline-none"
                  >
                    <option value="ALL">All Roles</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-bold text-neutral-700 focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Profiles Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 text-neutral-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 rounded-l-xl">User Profile</th>
                      <th className="p-3.5">Assigned Email</th>
                      <th className="p-3.5">Security Role</th>
                      <th className="p-3.5">Account Status</th>
                      <th className="p-3.5">Contact / Created</th>
                      <th className="p-3.5 rounded-r-xl text-right">Actions (CRUD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-400 font-bold">
                          No profiles found matching search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const uid = u.userId || u.id;
                        return (
                          <tr key={uid} className="hover:bg-neutral-50/80 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-black flex items-center justify-center text-xs">
                                  {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <span className="font-bold text-neutral-900 block">{u.fullName}</span>
                                  <span className="text-[10px] text-neutral-400">ID #{uid}</span>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5 font-mono text-neutral-700">{u.email}</td>

                            <td className="p-3.5">
                              <select
                                value={u.role}
                                onChange={(e) => handleChangeUserRole(uid, e.target.value)}
                                className="px-2.5 py-1 bg-white border border-neutral-300 rounded-lg text-[11px] font-extrabold uppercase focus:ring-1 focus:ring-black"
                              >
                                {ROLES.map(r => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            </td>

                            <td className="p-3.5">
                              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                u.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-red-100 text-red-800 border border-red-300'
                              }`}>
                                {u.status || 'ACTIVE'}
                              </span>
                            </td>

                            <td className="p-3.5 text-neutral-500 text-[11px]">
                              <div>{u.contactNumber || 'No Phone'}</div>
                              <div className="text-[10px] text-neutral-400">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                              </div>
                            </td>

                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleToggleUserStatus(uid, u.status || 'ACTIVE')}
                                  title={u.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                                  className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[10px] font-bold uppercase rounded-lg transition-colors"
                                >
                                  {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                                </button>

                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  title="Edit Profile & Password"
                                  className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors"
                                >
                                  <i className="fa-solid fa-pen-to-square w-3.5 h-3.5 flex items-center justify-center text-xs" />
                                </button>

                                <button
                                  onClick={() => setUserDeleteConfirm(uid)}
                                  title="Delete Account"
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                                >
                                  <i className="fa-solid fa-trash-can w-3.5 h-3.5 flex items-center justify-center text-xs" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 2: Audit Log & Department Ledger CRUD */}
          {/* ========================================================================= */}
          {activeModule === 'audit' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              
              {/* Header & Create Audit Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                    <i className="fa-solid fa-list-check text-emerald-700" />
                    <span>Module 2: Department Audit Log &amp; Regulatory Ledger</span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Immutable append-only ledger and CRUD tools for delivery, catalog, cold-chain, prescription, and system audits.
                  </p>
                </div>

                <button
                  onClick={handleOpenCreateAudit}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm shrink-0"
                >
                  <i className="fa-solid fa-plus" />
                  <span>Create Department Audit</span>
                </button>
              </div>

              {/* Department Tabs Selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {DEPARTMENTS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setAuditDeptFilter(d.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-2 ${
                      auditDeptFilter === d.id
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    <i className={`fa-solid ${d.icon} text-xs`} />
                    <span>{d.label}</span>
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search audit records by action, entity, actor email, or state changes..."
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Audit Records Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 text-neutral-700 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5 rounded-l-xl">Timestamp</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Actor / Email</th>
                      <th className="p-3.5">Action &amp; Severity</th>
                      <th className="p-3.5">Target Entity</th>
                      <th className="p-3.5">Audit Trail Details</th>
                      <th className="p-3.5 rounded-r-xl text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredAudits.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-neutral-400 font-bold">
                          No audit records found for the selected department.
                        </td>
                      </tr>
                    ) : (
                      filteredAudits.map((log) => (
                        <tr key={log.id} className="hover:bg-neutral-50/80 transition-colors">
                          <td className="p-3.5 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>

                          <td className="p-3.5">
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-neutral-200 text-neutral-800">
                              {log.department || 'SYSTEM_ADMIN'}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-bold text-neutral-900 block">{log.actorEmail || 'system'}</span>
                            <span className="text-[10px] text-neutral-400 uppercase font-mono">{log.actorRole || 'SYSTEM'}</span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-mono font-bold text-emerald-800 block">{log.action}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                              log.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              log.severity === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                              'bg-neutral-100 text-neutral-700'
                            }`}>
                              {log.severity || 'INFO'}
                            </span>
                          </td>

                          <td className="p-3.5 font-medium text-neutral-800">
                            {log.entity} {log.entityId ? `#${log.entityId}` : ''}
                          </td>

                          <td className="p-3.5 text-neutral-600 text-[11px] max-w-xs">
                            <div className="truncate" title={log.afterState || log.beforeState || ''}>
                              {log.afterState || log.beforeState || '-'}
                            </div>
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditAudit(log)}
                                title="Edit Audit Notes"
                                className="p-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors"
                              >
                                <i className="fa-solid fa-pen text-xs" />
                              </button>
                              <button
                                onClick={() => setAuditDeleteConfirm(log.id)}
                                title="Delete Log Record"
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors"
                              >
                                <i className="fa-solid fa-trash-can text-xs" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 3: Emergency Kill Switches */}
          {/* ========================================================================= */}
          {activeModule === 'flags' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                  <i className="fa-solid fa-toggle-on text-emerald-700" />
                  <span>Module 3: Emergency Kill Switches &amp; Circuit Breakers</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Instant circuit breaker controls to isolate failing operations without bringing down unaffected modules.
                </p>
              </div>

              <div className="space-y-4">
                {flags.map((flag) => (
                  <div key={flag.id || flag.flagKey} className="p-5 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-50/50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-neutral-900">{flag.flagKey}</span>
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          flag.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {flag.enabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">{flag.reason || 'Standard operational control flag.'}</p>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Updated by: {flag.setBy || 'SYSTEM'} • Scope: {flag.scope || 'GLOBAL'}</p>
                    </div>

                    <button
                      onClick={() => handleToggleFlag(flag.flagKey, flag.enabled)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm shrink-0 ${
                        flag.enabled
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      }`}
                    >
                      {flag.enabled ? 'Trigger Kill Switch' : 'Enable Subsystem'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODULE 4: Refill Subscriptions */}
          {/* ========================================================================= */}
          {activeModule === 'subscriptions' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                  <i className="fa-solid fa-arrows-rotate text-emerald-700" />
                  <span>Module 4: Recurring Refill Subscriptions &amp; Chronic Care</span>
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Manage automated recurring refill scheduler, chronic care regimens, and delivery dispatch cadence.
                </p>
              </div>

              <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-neutral-900">Active Refill Regimens</span>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {subscriptions.length} active customer recurring prescriptions in auto-dispense schedule.
                  </p>
                </div>
                <Link
                  to="/modules/subscriptions"
                  className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-black transition-all shadow-sm shrink-0"
                >
                  Open Full Subscription Engine
                </Link>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL: Create / Edit User & Admin Profile */}
      {/* ========================================================================= */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-neutral-900">
                  {isEditingUser ? 'Edit User / Admin Profile' : 'Create New Admin / Staff Profile'}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {isEditingUser ? 'Update role, contact details, or reset initial password.' : 'Assign system permissions, email, and set initial credentials.'}
                </p>
              </div>
              <button onClick={() => setShowUserModal(false)} className="text-neutral-400 hover:text-black">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 pt-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  placeholder="e.g. Dr. Alex Morgan"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="e.g. admin@mediorder.com"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Security Role *
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Account Status
                  </label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  {isEditingUser ? 'Reset Password (Leave blank to keep current)' : 'Initial Password *'}
                </label>
                <input
                  type="password"
                  required={!isEditingUser}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={isEditingUser ? 'Enter new password if resetting...' : 'Min. 6 characters'}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={userForm.phoneNumber}
                  onChange={(e) => setUserForm({ ...userForm, phoneNumber: e.target.value })}
                  placeholder="e.g. +94 77 123 4567"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                >
                  {isEditingUser ? 'Save Profile Changes' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Create / Edit Department Audit Log */}
      {/* ========================================================================= */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-neutral-900">
                  {isEditingAudit ? 'Edit Department Audit Entry' : 'Create Department Audit Log'}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Log regulatory events, supervisory overrides, warehouse counts, or disciplinary holds.
                </p>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="text-neutral-400 hover:text-black">
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveAudit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Department *
                  </label>
                  <select
                    value={auditForm.department}
                    onChange={(e) => setAuditForm({ ...auditForm, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {DEPARTMENTS.filter(d => d.id !== 'ALL').map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={auditForm.severity}
                    onChange={(e) => setAuditForm({ ...auditForm, severity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="INFO">INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Action Type *
                  </label>
                  <input
                    type="text"
                    required
                    value={auditForm.action}
                    onChange={(e) => setAuditForm({ ...auditForm, action: e.target.value })}
                    placeholder="e.g. MANUAL_OVERRIDE"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Target Entity *
                  </label>
                  <input
                    type="text"
                    required
                    value={auditForm.entity}
                    onChange={(e) => setAuditForm({ ...auditForm, entity: e.target.value })}
                    placeholder="e.g. Delivery, Medicine, Batch"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Target Entity ID / Reference
                </label>
                <input
                  type="text"
                  value={auditForm.entityId}
                  onChange={(e) => setAuditForm({ ...auditForm, entityId: e.target.value })}
                  placeholder="e.g. DEL-1002 or MED-001"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Audit Notes / State Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={auditForm.afterState}
                  onChange={(e) => setAuditForm({ ...auditForm, afterState: e.target.value, notes: e.target.value })}
                  placeholder="Detailed description of the change, supervisory sign-off reason, or department note..."
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                  className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                >
                  {isEditingAudit ? 'Update Audit Entry' : 'Log Department Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Delete User Confirmation */}
      {/* ========================================================================= */}
      {userDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <h3 className="text-base font-black uppercase tracking-tight text-neutral-900">
              Confirm Account Deletion
            </h3>
            <p className="text-xs text-neutral-600">
              Are you sure you want to delete user account <span className="font-bold font-mono">#{userDeleteConfirm}</span>? This action is permanent and will be logged in the immutable audit trail.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUserDeleteConfirm(null)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(userDeleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Delete Audit Log Confirmation */}
      {/* ========================================================================= */}
      {auditDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <h3 className="text-base font-black uppercase tracking-tight text-neutral-900">
              Delete Audit Record
            </h3>
            <p className="text-xs text-neutral-600">
              Are you sure you want to delete audit log entry <span className="font-bold font-mono">#{auditDeleteConfirm}</span>?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setAuditDeleteConfirm(null)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAudit(auditDeleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SystemAdminConsolePage;
