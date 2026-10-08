/**
 * PharmacistDashboardPage — Clinical verification queue & review portal
 * IT25101923
 */

import React from 'react';
import { Link } from 'react-router-dom';
import './prescriptions.css';
import {
  FileText,
  Search,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Trash2,
  HardDrive,
  LogOut,
  UserCheck,
} from 'lucide-react';
import usePrescriptions from './hooks/usePrescriptions';
import StatusBadge from './components/StatusBadge';
import PrescriptionDetails from './components/PrescriptionDetails';
import StatsCards from './components/StatsCards';
import { formatDate } from './constants';

export default function PharmacistDashboardPage() {
  const {
    user,
    isAuthenticated,
    logout,
    records,
    visible,
    codes,
    loading,
    loadError,
    refresh,
    search,
    setSearch,
    filter,
    setFilter,
    countByStatus,
    notice,
    setNotice,
    modal,
    closeModal,
    selected,
    openDetails,
    openCleanup,
    performAction,
    runCleanup,
    confirmError,
    cleanup,
    busy,
  } = usePrescriptions({ isStaff: true });

  if (!isAuthenticated) {
    return (
      <div className="rx-page rx-auth">
        <h2>Pharmacist Clinical Console</h2>
        <p>Please log in with an authorized Pharmacist or Chief Pharmacist account.</p>
        <Link to="/admin/login" className="rx-button">Sign In as Clinical Staff</Link>
      </div>
    );
  }

  return (
    <div className="rx-page">
      {/* Sidebar Navigation */}
      <aside className="rx-sidebar">
        <div className="rx-brand">
          PHARMA <span>+</span> <small>CLINICAL VERIFICATION</small>
        </div>

        <div className="rx-nav-caption">VERIFICATION QUEUE</div>
        <button
          className={`rx-nav-link ${filter === 'PENDING' ? 'active' : ''}`}
          onClick={() => setFilter('PENDING')}
        >
          <FileText size={16} /> Pending Review ({countByStatus('PENDING')})
        </button>
        <button
          className={`rx-nav-link ${filter === 'CLARIFICATION_REQUIRED' ? 'active' : ''}`}
          onClick={() => setFilter('CLARIFICATION_REQUIRED')}
        >
          <AlertTriangle size={16} /> Clarification ({countByStatus('CLARIFICATION_REQUIRED')})
        </button>
        <button
          className={`rx-nav-link ${filter === 'APPROVED' ? 'active' : ''}`}
          onClick={() => setFilter('APPROVED')}
        >
          <CheckCircle2 size={16} /> Approved Rx ({countByStatus('APPROVED')})
        </button>

        <div className="rx-nav-caption" style={{ marginTop: '20px' }}>SYSTEM TOOLS</div>
        <button className="rx-nav-link" onClick={openCleanup}>
          <HardDrive size={16} /> Run Storage Cleanup
        </button>

        <div className="rx-sidebar-help">
          <strong>Need Clinical Policy Support?</strong>
          <p>Review SLMC prescriber verification guidelines and retention schedules.</p>
        </div>

        <div className="rx-user">
          <div className="rx-avatar">{user.fullName?.charAt(0) || 'P'}</div>
          <div>
            <strong>{user.fullName}</strong>
            <small>{user.role?.replace(/_/g, ' ')}</small>
          </div>
          <button className="rx-icon-button" onClick={logout} title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="rx-main">
        {/* Top bar */}
        <div className="rx-topbar">
          <div>
            <span>PHARMA Health System</span> / <strong>Prescription Review Queue</strong>
          </div>
          <div className="rx-secure">
            <ShieldCheck size={14} /> Certified Clinical Workspace
          </div>
        </div>

        <div className="rx-content">
          {notice && (
            <div className="rx-notice">
              <ShieldCheck size={18} />
              <span>{notice.message}</span>
              <button className="rx-icon-button" onClick={() => setNotice(null)}>×</button>
            </div>
          )}

          <div className="rx-heading">
            <div>
              <span className="rx-eyebrow">CLINICAL WORKSPACE</span>
              <h1>Prescription Verification Queue</h1>
              <p>Audit uploaded doctor prescriptions, verify SLMC authenticity, and authorize Rx orders.</p>
            </div>
            <div className="rx-heading-actions">
              <button className="rx-button secondary" onClick={refresh} disabled={loading}>
                <RefreshCw size={14} className={loading ? 'rx-spin' : ''} /> Refresh List
              </button>
              <button className="rx-button" onClick={openCleanup}>
                <HardDrive size={14} /> Storage Policy
              </button>
            </div>
          </div>

          {/* Metrics Header */}
          <StatsCards
            records={records}
            loading={loading}
            filter={filter}
            setFilter={setFilter}
            countByStatus={countByStatus}
          />

          {/* Records Table Section */}
          <section className="rx-records">
            <div className="rx-records-head">
              <div>
                <h2>Prescription Queue</h2>
                <p>Showing prescriptions filtered by clinical queue stage.</p>
              </div>
              <div className="rx-search">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search customer, ID, or doctor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Chips */}
            <div className="rx-filter-row">
              {['PENDING', 'CLARIFICATION_REQUIRED', 'APPROVED', 'REJECTED', 'CHRONIC', 'ALL'].map((f) => (
                <button
                  key={f}
                  className={filter === f ? 'active' : ''}
                  onClick={() => setFilter(f)}
                >
                  {f === 'ALL' ? 'All Records' : f === 'CHRONIC' ? 'Chronic Subscriptions' : f.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Table */}
            {loading ? (
              <div className="rx-loading">Loading prescription queue...</div>
            ) : loadError ? (
              <div className="rx-inline-error" style={{ margin: '20px' }}>{loadError}</div>
            ) : visible.length === 0 ? (
              <div className="rx-empty">
                <UserCheck size={42} />
                <h3>No prescriptions found</h3>
                <p>No prescription submissions match your selected filter criteria.</p>
              </div>
            ) : (
              <div className="rx-table-wrap">
                <table className="rx-table">
                  <thead>
                    <tr>
                      <th>Rx ID & Document</th>
                      <th>Patient / Customer</th>
                      <th>Prescribing Doctor</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((rx) => (
                      <tr key={rx.id}>
                        <td>
                          <div className="rx-file-cell">
                            <div className="rx-file-icon">
                              <FileText size={20} />
                            </div>
                            <div>
                              <strong>Rx #{rx.id}</strong>
                              <small>{rx.originalFileName}</small>
                              {rx.chronicSubscription && <span className="rx-chronic">Chronic ({rx.usedCount}/{rx.maxUses} used)</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <strong>{rx.customerName}</strong>
                          <small>{rx.customerEmail}</small>
                        </td>
                        <td>
                          <strong>{rx.doctorName || 'Not specified'}</strong>
                          <small>{rx.patientNotes || 'No notes'}</small>
                        </td>
                        <td>
                          <StatusBadge status={rx.status} />
                        </td>
                        <td>
                          <small>{formatDate(rx.createdAt)}</small>
                        </td>
                        <td>
                          <button className="rx-row-button" onClick={() => openDetails(rx)}>
                            <Eye size={14} /> Review & Verify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Modal Dialogs */}
      {modal === 'details' && selected && (
        <PrescriptionDetails
          prescription={selected}
          isStaff={true}
          reasonCodes={codes}
          onClose={closeModal}
          onVerify={(data) => performAction('verify', data)}
        />
      )}

      {modal === 'cleanup' && (
        <div className="rx-dialog">
          <div className="rx-dialog-head">
            <h2>Run Retention Cleanup Policy</h2>
            <button className="rx-icon-button" onClick={closeModal}>×</button>
          </div>
          <div className="rx-form">
            {confirmError && <div className="rx-inline-error">{confirmError}</div>}
            <p>
              Manually trigger automated retention cleanup:
            </p>
            <ul style={{ fontSize: '12px', color: 'var(--rx-muted)', paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>Purges physical document files of non-chronic rejected prescriptions older than retention threshold (7 days).</li>
              <li>Chronic subscriptions are preserved indefinitely until manually handled.</li>
              <li>Cleans up orphaned files in upload directory with no DB record.</li>
            </ul>

            {cleanup && (
              <div className="rx-callout" style={{ marginTop: '10px' }}>
                <div>
                  <strong>Cleanup Execution Results:</strong>
                  <p>
                    Purged Rejected Files: {cleanup.purgedRejectedFiles}<br />
                    Orphaned Files Removed: {cleanup.orphanedFilesCleaned}<br />
                    Retention Schedule: {cleanup.retentionDays} Days
                  </p>
                </div>
              </div>
            )}

            <div className="rx-form-foot">
              <button className="rx-button secondary" onClick={closeModal} disabled={busy}>Close</button>
              <button className="rx-button" onClick={runCleanup} disabled={busy}>
                {busy ? 'Running Cleanup...' : 'Execute Policy Cleanup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
