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

const ADMIN_ROLES = [
  'SYSTEM_ADMIN',
  'ADMIN',
  'CHIEF_PHARMACIST',
  'OPERATIONS_MANAGER',
  'DELIVERY_COORDINATOR',
  'FINANCE_MANAGER',
  'IT_MANAGER',
  'DELIVERY_RIDER'
];

const ROLE_BADGES = {
  SYSTEM_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
  CHIEF_PHARMACIST: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  OPERATIONS_MANAGER: 'bg-blue-100 text-blue-800 border-blue-200',
  DELIVERY_COORDINATOR: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DELIVERY_RIDER: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  FINANCE_MANAGER: 'bg-amber-100 text-amber-800 border-amber-200',
  IT_MANAGER: 'bg-teal-100 text-teal-800 border-teal-200',
  CUSTOMER: 'bg-neutral-100 text-neutral-700 border-neutral-200'
};

const STATUS_BADGES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
  SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
  BANNED: 'bg-rose-100 text-rose-800 border-rose-300 font-black'
};

const SystemAdminConsolePage = () => {
  const { user } = useAuth();
  
  // Top Level Module: 'rbac' | 'audit'
  const [activeModule, setActiveModule] = useState('rbac');
  
  // RBAC Sub-Tag: 'admin-users' | 'regular-users'
  const [rbacTag, setRbacTag] = useState('admin-users');

  // Data states
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Filter & Search states
  const [userSearch, setUserSearch] = useState('');
  const [adminRoleFilter, setAdminRoleFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [auditDeptFilter, setAuditDeptFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');

  // User Modals
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [adminForm, setAdminForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'SYSTEM_ADMIN',
    status: 'ACTIVE',
    phoneNumber: ''
  });
  const [editUserForm, setEditUserForm] = useState({
    userId: null,
    fullName: '',
    email: '',
    password: '',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    phoneNumber: ''
  });
  const [userDeleteConfirm, setUserDeleteConfirm] = useState(null);
  const [userBanConfirm, setUserBanConfirm] = useState(null);

  // Audit Modals
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [isEditingAudit, setIsEditingAudit] = useState(false);
  const [auditForm, setAuditForm] = useState({
    id: null,
    department: 'USER_SECURITY',
    action: 'USER_ROLE_CHANGED',
    entity: 'User',
    entityId: '',
    beforeState: '',
    afterState: '',
    severity: 'INFO',
    notes: '',
    actorEmail: user?.email || 'admin@mediorder.com',
    actorRole: user?.role || 'SYSTEM_ADMIN'
  });
  const [auditDeleteConfirm, setAuditDeleteConfirm] = useState(null);

  // Fetch data
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

  // Derived filtered users
  const adminUsers = usersList.filter((u) => u.role && u.role !== 'CUSTOMER');
  const regularUsers = usersList.filter((u) => !u.role || u.role === 'CUSTOMER');

  const filteredAdminUsers = adminUsers.filter((u) => {
    const q = userSearch.toLowerCase();
    const matchSearch =
      !q ||
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.contactNumber && u.contactNumber.toLowerCase().includes(q));
    const matchRole = adminRoleFilter === 'ALL' || u.role === adminRoleFilter;
    const matchStatus = userStatusFilter === 'ALL' || u.status === userStatusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const filteredRegularUsers = regularUsers.filter((u) => {
    const q = userSearch.toLowerCase();
    const matchSearch =
      !q ||
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.contactNumber && u.contactNumber.toLowerCase().includes(q));
    const matchStatus = userStatusFilter === 'ALL' || u.status === userStatusFilter;
    return matchSearch && matchStatus;
  });

  // Filtered Audit logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const q = auditSearch.toLowerCase();
    return (
      !q ||
      (log.actorEmail && log.actorEmail.toLowerCase().includes(q)) ||
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.entity && log.entity.toLowerCase().includes(q)) ||
      (log.notes && log.notes.toLowerCase().includes(q))
    );
  });

  // =========================================================================
  // RBAC Actions: Create Admin, Edit, Ban, Remove
  // =========================================================================
  const handleOpenCreateAdmin = () => {
    setAdminForm({
      fullName: '',
      email: '',
      password: '',
      role: 'SYSTEM_ADMIN',
      status: 'ACTIVE',
      phoneNumber: ''
    });
    setShowCreateAdminModal(true);
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.fullName.trim() || !adminForm.email.trim() || !adminForm.password.trim()) {
      setFeedback({ type: 'error', text: 'Full Name, Email, and Password are required.' });
      return;
    }
    if (adminForm.password.length < 6) {
      setFeedback({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    try {
      await client.post('/api/v1/users', {
        fullName: adminForm.fullName.trim(),
        email: adminForm.email.trim(),
        password: adminForm.password.trim(),
        role: adminForm.role,
        status: adminForm.status || 'ACTIVE',
        phoneNumber: adminForm.phoneNumber.trim() || null
      });
      setFeedback({
        type: 'success',
        text: `Admin account for ${adminForm.email} (${adminForm.role}) created and saved to DB successfully.`
      });
      setShowCreateAdminModal(false);
      loadModuleData('rbac');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to create admin account';
      setFeedback({ type: 'error', text: msg });
    }
  };

  const handleOpenEditUser = (u) => {
    setEditUserForm({
      userId: u.userId || u.id,
      fullName: u.fullName || '',
      email: u.email || '',
      password: '',
      role: u.role || 'CUSTOMER',
      status: u.status || 'ACTIVE',
      phoneNumber: u.contactNumber || u.phoneNumber || ''
    });
    setShowEditUserModal(true);
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        fullName: editUserForm.fullName.trim(),
        email: editUserForm.email.trim(),
        role: editUserForm.role,
        status: editUserForm.status,
        phoneNumber: editUserForm.phoneNumber.trim() || null
      };
      if (editUserForm.password && editUserForm.password.trim().length > 0) {
        payload.password = editUserForm.password.trim();
      }
      await client.put(`/api/v1/users/${editUserForm.userId}`, payload);
      setFeedback({ type: 'success', text: `User account #${editUserForm.userId} updated successfully in database.` });
      setShowEditUserModal(false);
      loadModuleData('rbac');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update user profile';
      setFeedback({ type: 'error', text: msg });
    }
  };

  // Ban or Unban / Reactivate user
  const handleBanToggleUser = async (u) => {
    const isCurrentlyBanned = u.status === 'BANNED' || u.status === 'SUSPENDED';
    const nextStatus = isCurrentlyBanned ? 'ACTIVE' : 'BANNED';
    try {
      await client.put(`/api/v1/users/${u.userId || u.id}/status`, { status: nextStatus });
      setFeedback({
        type: 'success',
        text: `User ${u.email} has been ${isCurrentlyBanned ? 'unbanned (ACTIVE)' : 'banned (BANNED)'} in database.`
      });
      setUserBanConfirm(null);
      loadModuleData('rbac');
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to update user ban status in database.' });
    }
  };

  // Permanently delete / remove user from database
  const handleDeleteUser = async (userId) => {
    try {
      await client.delete(`/api/v1/users/${userId}`);
      setFeedback({ type: 'success', text: `User ID #${userId} permanently removed from database.` });
      setUserDeleteConfirm(null);
      loadModuleData('rbac');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to remove user account';
      setFeedback({ type: 'error', text: msg });
    }
  };

  // =========================================================================
  // Audit Trail Actions
  // =========================================================================
  const handleOpenCreateAudit = () => {
    setIsEditingAudit(false);
    setAuditForm({
      id: null,
      department: auditDeptFilter !== 'ALL' ? auditDeptFilter : 'USER_SECURITY',
      action: 'MANUAL_AUDIT_ENTRY',
      entity: 'SecurityAudit',
      entityId: String(Date.now()).slice(-6),
      beforeState: '',
      afterState: '',
      severity: 'INFO',
      notes: '',
      actorEmail: user?.email || 'systemadmin1@gmail.com',
      actorRole: user?.role || 'SYSTEM_ADMIN'
    });
    setShowAuditModal(true);
  };

  const handleOpenEditAudit = (log) => {
    setIsEditingAudit(true);
    setAuditForm({
      id: log.id,
      department: log.department || 'USER_SECURITY',
      action: log.action || 'AUDIT_UPDATE',
      entity: log.entity || 'System',
      entityId: log.entityId || '',
      beforeState: log.beforeState || '',
      afterState: log.afterState || '',
      severity: log.severity || 'INFO',
      notes: log.notes || '',
      actorEmail: log.actorEmail || user?.email || 'admin',
      actorRole: log.actorRole || 'SYSTEM_ADMIN'
    });
    setShowAuditModal(true);
  };

  const handleSaveAudit = async (e) => {
    e.preventDefault();
    try {
      if (isEditingAudit) {
        await client.put(`/api/v1/admin/audit/${auditForm.id}`, auditForm);
        setFeedback({ type: 'success', text: `Audit log #${auditForm.id} updated in database` });
      } else {
        await client.post('/api/v1/admin/audit', auditForm);
        setFeedback({ type: 'success', text: 'New audit log entry recorded in database' });
      }
      setShowAuditModal(false);
      loadModuleData('audit');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save audit log';
      setFeedback({ type: 'error', text: msg });
    }
  };

  const handleDeleteAudit = async (id) => {
    try {
      await client.delete(`/api/v1/admin/audit/${id}`);
      setFeedback({ type: 'success', text: `Audit log #${id} deleted from database` });
      setAuditDeleteConfirm(null);
      loadModuleData('audit');
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to delete audit log entry' });
    }
  };

  const exportAuditLogs = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Timestamp,Department,Action,Entity,EntityID,Actor,Role,Severity,Notes\n' +
      auditLogs
        .map(
          (l) =>
            `"${l.id}","${l.timestamp}","${l.department}","${l.action}","${l.entity}","${l.entityId || ''}","${l.actorEmail || ''}","${l.actorRole || ''}","${l.severity || 'INFO'}","${(l.notes || '').replace(/"/g, '""')}"`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mediorder_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto min-h-screen">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 mb-6">
        <Link to="/" className="hover:text-black transition-colors">Home</Link>
        <span>/</span>
        <span className="text-black">System Administration</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-black uppercase tracking-wider mb-2">
            <i className="fa-solid fa-server text-purple-600" />
            <span>Core Administration &amp; Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
            System Administration Console
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl">
            Enterprise role-based access control (RBAC), administrator provisioning, regular user account governance, and system-wide audit verification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadModuleData(activeModule)}
            disabled={loading}
            className="px-4 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <i className={`fa-solid fa-arrows-rotate text-xs ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback.text && (
        <div
          className={`mb-6 p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 animate-slideDown ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <i className={`fa-solid ${feedback.type === 'success' ? 'fa-circle-check text-emerald-600' : 'fa-triangle-exclamation text-red-600'} text-base`} />
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: '', text: '' })}
            className="text-neutral-400 hover:text-neutral-700"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>
      )}

      {/* Main Module Tabs: RBAC Authority & Audit Trail Only */}
      <div className="flex items-center gap-3 mb-6 pb-2 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setActiveModule('rbac')}
          className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeModule === 'rbac'
              ? 'bg-neutral-900 text-white shadow-md'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          <i className="fa-solid fa-shield-halved text-xs text-purple-400" />
          <span>RBAC Authority</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeModule === 'rbac' ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-700'}`}>
            {usersList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveModule('audit')}
          className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeModule === 'audit'
              ? 'bg-neutral-900 text-white shadow-md'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          <i className="fa-solid fa-clipboard-list text-xs text-emerald-400" />
          <span>Audit Trail</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeModule === 'audit' ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-700'}`}>
            {auditLogs.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODULE 1: RBAC AUTHORITY (WITH ADMIN USERS & REGULAR USERS TAGS)          */}
      {/* ========================================================================= */}
      {activeModule === 'rbac' && (
        <div className="space-y-6">
          {/* Sub-Tabs / Tags */}
          <div className="bg-white rounded-2xl p-2 border border-neutral-200 shadow-xs inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRbacTag('admin-users');
                setUserSearch('');
                setUserStatusFilter('ALL');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                rbacTag === 'admin-users'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <i className="fa-solid fa-user-shield text-xs" />
              <span>Admin Users</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rbacTag === 'admin-users' ? 'bg-purple-800 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                {adminUsers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRbacTag('regular-users');
                setUserSearch('');
                setUserStatusFilter('ALL');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                rbacTag === 'regular-users'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <i className="fa-solid fa-users text-xs" />
              <span>Regular Users</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rbacTag === 'regular-users' ? 'bg-purple-800 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                {regularUsers.length}
              </span>
            </button>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* TAG A: ADMIN USERS VIEW                                               */}
          {/* --------------------------------------------------------------------- */}
          {rbacTag === 'admin-users' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                    <i className="fa-solid fa-user-gear text-purple-700" />
                    <span>Administrator &amp; Staff Directory</span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Authorized system administrators, pharmacists, coordinators, and operations managers with platform access.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenCreateAdmin}
                  className="px-5 py-2.5 rounded-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-user-plus text-xs" />
                  <span>+ Create New Admin</span>
                </button>
              </div>

              {/* Filters Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative sm:col-span-2">
                  <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search admins by name, email, or phone..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={adminRoleFilter}
                    onChange={(e) => setAdminRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="ALL">All Admin Roles</option>
                    {ADMIN_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>

                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING_APPROVAL">PENDING</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="BANNED">BANNED</option>
                  </select>
                </div>
              </div>

              {/* Admin Users Table */}
              <div className="overflow-x-auto rounded-2xl border border-neutral-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-[10px] font-black uppercase text-neutral-500 border-b border-neutral-200">
                    <tr>
                      <th className="p-4">Admin Staff</th>
                      <th className="p-4">Email Address</th>
                      <th className="p-4">Assigned Role</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4">Contact Phone</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {filteredAdminUsers.length > 0 ? (
                      filteredAdminUsers.map((u) => {
                        const isSelf = user?.email && u.email && user.email.toLowerCase() === u.email.toLowerCase();
                        return (
                          <tr key={u.userId || u.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="p-4 font-bold text-neutral-900 flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs shrink-0">
                                {(u.fullName || 'A').slice(0, 1).toUpperCase()}
                              </div>
                              <div>
                                <span className="block">{u.fullName}</span>
                                {isSelf && (
                                  <span className="text-[9px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                    Your Account
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 font-mono font-medium text-neutral-700">
                              <a href={`mailto:${u.email}`} className="text-purple-800 hover:underline flex items-center gap-1.5">
                                <i className="fa-solid fa-envelope text-neutral-400 text-[10px]" />
                                <span>{u.email}</span>
                              </a>
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${ROLE_BADGES[u.role] || 'bg-neutral-100 text-neutral-800'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${STATUS_BADGES[u.status] || 'bg-neutral-100'}`}>
                                {u.status || 'ACTIVE'}
                              </span>
                            </td>
                            <td className="p-4 text-neutral-500">
                              {u.contactNumber || u.phoneNumber || '—'}
                            </td>
                            <td className="p-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditUser(u)}
                                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-black transition-colors"
                                  title="Edit Admin Profile & Role"
                                >
                                  <i className="fa-solid fa-pen-to-square text-xs" />
                                </button>

                                <button
                                  type="button"
                                  disabled={isSelf}
                                  onClick={() => setUserBanConfirm(u)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    u.status === 'BANNED' || u.status === 'SUSPENDED'
                                      ? 'hover:bg-emerald-50 text-emerald-600'
                                      : 'hover:bg-amber-50 text-amber-600'
                                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                                  title={u.status === 'BANNED' || u.status === 'SUSPENDED' ? 'Unban / Activate Admin' : 'Suspend / Ban Admin'}
                                >
                                  <i className={`fa-solid ${u.status === 'BANNED' || u.status === 'SUSPENDED' ? 'fa-user-check' : 'fa-user-slash'} text-xs`} />
                                </button>

                                <button
                                  type="button"
                                  disabled={isSelf}
                                  onClick={() => setUserDeleteConfirm(u)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Delete Admin Account from DB"
                                >
                                  <i className="fa-solid fa-trash text-xs" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-neutral-400 font-medium">
                          No administrator accounts found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------------------- */}
          {/* TAG B: REGULAR USERS VIEW                                             */}
          {/* --------------------------------------------------------------------- */}
          {rbacTag === 'regular-users' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                    <i className="fa-solid fa-users text-purple-700" />
                    <span>Customer &amp; Regular User Directory</span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Registered pharmacy patients and customers. System admins can inspect records, ban accounts, or permanently delete users from the database.
                  </p>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative sm:col-span-2">
                  <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users by name, email, or contact number..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div>
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="ALL">All Account Statuses</option>
                    <option value="ACTIVE">ACTIVE Only</option>
                    <option value="BANNED">BANNED Only</option>
                    <option value="SUSPENDED">SUSPENDED Only</option>
                  </select>
                </div>
              </div>

              {/* Regular Users Table */}
              <div className="overflow-x-auto rounded-2xl border border-neutral-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-[10px] font-black uppercase text-neutral-500 border-b border-neutral-200">
                    <tr>
                      <th className="p-4">User ID</th>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Email Address</th>
                      <th className="p-4">Contact Phone</th>
                      <th className="p-4">Account Standing</th>
                      <th className="p-4">Registration Date</th>
                      <th className="p-4 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {filteredRegularUsers.length > 0 ? (
                      filteredRegularUsers.map((u) => {
                        const isBanned = u.status === 'BANNED' || u.status === 'SUSPENDED';
                        return (
                          <tr key={u.userId || u.id} className="hover:bg-neutral-50 transition-colors">
                            <td className="p-4 font-mono font-bold text-neutral-500">
                              #USR-{u.userId || u.id}
                            </td>
                            <td className="p-4 font-bold text-neutral-900">
                              {u.fullName || 'Registered Customer'}
                            </td>
                            <td className="p-4 font-mono font-medium text-neutral-700">
                              <a href={`mailto:${u.email}`} className="text-neutral-800 hover:text-purple-700 hover:underline flex items-center gap-1.5">
                                <i className="fa-solid fa-envelope text-neutral-400 text-[10px]" />
                                <span>{u.email}</span>
                              </a>
                            </td>
                            <td className="p-4 text-neutral-600">
                              {u.contactNumber || u.phoneNumber || '—'}
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${STATUS_BADGES[u.status] || 'bg-neutral-100'}`}>
                                {u.status || 'ACTIVE'}
                              </span>
                            </td>
                            <td className="p-4 text-neutral-500">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="p-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                {/* Ban / Unban Button */}
                                <button
                                  type="button"
                                  onClick={() => setUserBanConfirm(u)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                                    isBanned
                                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                                  }`}
                                  title={isBanned ? 'Unban and reactivate user' : 'Ban and block user from login'}
                                >
                                  <i className={`fa-solid ${isBanned ? 'fa-unlock' : 'fa-ban'} text-xs`} />
                                  <span>{isBanned ? 'Unban User' : 'Ban User'}</span>
                                </button>

                                {/* Remove / Delete Button */}
                                <button
                                  type="button"
                                  onClick={() => setUserDeleteConfirm(u)}
                                  className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                                  title="Permanently remove user from DB"
                                >
                                  <i className="fa-solid fa-trash-can text-xs" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-neutral-400 font-medium">
                          No regular customer accounts found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODULE 2: AUDIT TRAIL                                                     */}
      {/* ========================================================================= */}
      {activeModule === 'audit' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
                <i className="fa-solid fa-clipboard-check text-emerald-700" />
                <span>Enterprise Audit &amp; Compliance Trail</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Tamper-evident logs of administrative actions, role transitions, delivery overrides, and catalog edits.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportAuditLogs}
                className="px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
              >
                <i className="fa-solid fa-file-arrow-down text-xs" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreateAudit}
                className="px-4 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
              >
                <i className="fa-solid fa-plus text-xs" />
                <span>+ Record Entry</span>
              </button>
            </div>
          </div>

          {/* Department Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.id}
                type="button"
                onClick={() => setAuditDeptFilter(dept.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  auditDeptFilter === dept.id
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                <i className={`fa-solid ${dept.icon} text-xs`} />
                <span>{dept.label}</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Search audit logs by actor, action type, entity, or notes..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Audit Logs Table */}
          <div className="overflow-x-auto rounded-2xl border border-neutral-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 text-[10px] font-black uppercase text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Entity</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Notes &amp; Details</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {filteredAuditLogs.length > 0 ? (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="p-4 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                      </td>
                      <td className="p-4 font-bold text-neutral-800 text-[11px]">
                        {log.department}
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-800">
                        {log.action}
                      </td>
                      <td className="p-4 text-neutral-600 font-medium">
                        {log.entity} {log.entityId ? `#${log.entityId}` : ''}
                      </td>
                      <td className="p-4">
                        <span className="block font-bold text-neutral-900">{log.actorEmail || 'System'}</span>
                        <span className="text-[10px] text-neutral-400 font-semibold">{log.actorRole || 'SYSTEM'}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            log.severity === 'CRITICAL'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : log.severity === 'WARN'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {log.severity || 'INFO'}
                        </span>
                      </td>
                      <td className="p-4 text-neutral-600 max-w-xs truncate" title={log.notes}>
                        {log.notes || '—'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditAudit(log)}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-black transition-colors"
                            title="Edit Audit Entry"
                          >
                            <i className="fa-solid fa-pen-to-square text-xs" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setAuditDeleteConfirm(log)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Delete Audit Entry"
                          >
                            <i className="fa-solid fa-trash text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-neutral-400 font-medium">
                      No audit log entries recorded for this selection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW ADMIN (SYSTEM_ADMIN ONLY)                             */}
      {/* ========================================================================= */}
      {showCreateAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center">
                  <i className="fa-solid fa-user-shield text-lg" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-neutral-900">
                    Create New Administrator
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Provision new administrative credentials directly to MySQL DB.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateAdminModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors"
              >
                <i className="fa-solid fa-xmark text-xs" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={adminForm.fullName}
                  onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  placeholder="e.g. newadmin@mediorder.com"
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                  Initial Password * (min 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                    Admin Role *
                  </label>
                  <select
                    value={adminForm.role}
                    onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    {ADMIN_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                    Contact Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={adminForm.phoneNumber}
                    onChange={(e) => setAdminForm({ ...adminForm, phoneNumber: e.target.value })}
                    placeholder="0771234567"
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowCreateAdminModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                >
                  Create &amp; Save Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT USER PROFILE & ROLE                                         */}
      {/* ========================================================================= */}
      {showEditUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
              <h3 className="text-base font-black uppercase text-neutral-900">
                Edit User Account #{editUserForm.userId}
              </h3>
              <button
                type="button"
                onClick={() => setShowEditUserModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark text-xs" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editUserForm.fullName}
                  onChange={(e) => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                    Role
                  </label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    {ADMIN_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                    Account Status
                  </label>
                  <select
                    value={editUserForm.status}
                    onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="BANNED">BANNED</option>
                    <option value="PENDING_APPROVAL">PENDING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                  Reset Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={editUserForm.password}
                  onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                  placeholder="New password..."
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs uppercase tracking-wider shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM MODAL: BAN USER                                                   */}
      {/* ========================================================================= */}
      {userBanConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 text-2xl">
              <i className={`fa-solid ${userBanConfirm.status === 'BANNED' || userBanConfirm.status === 'SUSPENDED' ? 'fa-unlock' : 'fa-ban'}`} />
            </div>

            <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900">
              {userBanConfirm.status === 'BANNED' || userBanConfirm.status === 'SUSPENDED'
                ? 'Unban & Reactivate User?'
                : 'Ban User Account?'}
            </h3>
            <p className="text-xs text-neutral-600 mt-2 mb-6 leading-relaxed">
              {userBanConfirm.status === 'BANNED' || userBanConfirm.status === 'SUSPENDED' ? (
                <>
                  Are you sure you want to reactivate <strong>{userBanConfirm.email}</strong>? They will regain access to login and make orders.
                </>
              ) : (
                <>
                  Are you sure you want to ban <strong>{userBanConfirm.email}</strong>? This user will be immediately blocked from signing in and placing orders.
                </>
              )}
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setUserBanConfirm(null)}
                className="px-5 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleBanToggleUser(userBanConfirm)}
                className={`px-6 py-2.5 rounded-full text-white font-black text-xs uppercase tracking-wider shadow-md ${
                  userBanConfirm.status === 'BANNED' || userBanConfirm.status === 'SUSPENDED'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {userBanConfirm.status === 'BANNED' || userBanConfirm.status === 'SUSPENDED' ? 'Confirm Unban' : 'Confirm Ban'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM MODAL: DELETE USER                                                */}
      {/* ========================================================================= */}
      {userDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl">
              <i className="fa-solid fa-triangle-exclamation" />
            </div>

            <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900">
              Permanently Remove User?
            </h3>
            <p className="text-xs text-neutral-600 mt-2 mb-6 leading-relaxed">
              Are you sure you want to delete <strong>{userDeleteConfirm.email}</strong> (ID #{userDeleteConfirm.userId || userDeleteConfirm.id})? This will permanently delete the user row from the SQL database.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setUserDeleteConfirm(null)}
                className="px-5 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(userDeleteConfirm.userId || userDeleteConfirm.id)}
                className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: AUDIT ENTRY MODAL                                                */}
      {/* ========================================================================= */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
              <h3 className="text-base font-black uppercase text-neutral-900">
                {isEditingAudit ? `Edit Audit Entry #${auditForm.id}` : 'Record Manual Audit Entry'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center"
              >
                <i className="fa-solid fa-xmark text-xs" />
              </button>
            </div>

            <form onSubmit={handleSaveAudit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                    Department
                  </label>
                  <select
                    value={auditForm.department}
                    onChange={(e) => setAuditForm({ ...auditForm, department: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold"
                  >
                    {DEPARTMENTS.filter((d) => d.id !== 'ALL').map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                    Severity
                  </label>
                  <select
                    value={auditForm.severity}
                    onChange={(e) => setAuditForm({ ...auditForm, severity: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-bold"
                  >
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                    Action Type
                  </label>
                  <input
                    type="text"
                    required
                    value={auditForm.action}
                    onChange={(e) => setAuditForm({ ...auditForm, action: e.target.value })}
                    placeholder="e.g. USER_ROLE_CHANGED"
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                    Entity &amp; ID
                  </label>
                  <input
                    type="text"
                    value={auditForm.entity}
                    onChange={(e) => setAuditForm({ ...auditForm, entity: e.target.value })}
                    placeholder="e.g. User"
                    className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                  Audit Notes &amp; Rationale
                </label>
                <textarea
                  rows="3"
                  value={auditForm.notes}
                  onChange={(e) => setAuditForm({ ...auditForm, notes: e.target.value })}
                  placeholder="Describe the administrative action taken and context..."
                  className="w-full px-3 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider shadow-md"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM MODAL: DELETE AUDIT                                               */}
      {/* ========================================================================= */}
      {auditDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 text-center animate-scaleUp">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl">
              <i className="fa-solid fa-trash text-xl" />
            </div>

            <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900">
              Delete Audit Entry?
            </h3>
            <p className="text-xs text-neutral-600 mt-2 mb-6">
              Delete audit log #{auditDeleteConfirm.id} ({auditDeleteConfirm.action}) permanently from database?
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setAuditDeleteConfirm(null)}
                className="px-5 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAudit(auditDeleteConfirm.id)}
                className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-md"
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
