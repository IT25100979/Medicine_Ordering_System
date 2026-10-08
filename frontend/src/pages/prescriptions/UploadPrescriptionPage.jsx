/**
 * UploadPrescriptionPage — Dedicated upload page for customers
 * IT25101923
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './prescriptions.css';
import { ArrowLeft, CheckCircle2, ShieldCheck, FileCheck, Lock } from 'lucide-react';
import SubmissionForm from './components/SubmissionForm';
import usePrescriptions from './hooks/usePrescriptions';
import { CUSTOMER_PRESCRIPTIONS } from '../../utils/prescriptionRoutes';

export default function UploadPrescriptionPage() {
  const navigate = useNavigate();
  const { saveSubmission, busy } = usePrescriptions({ isStaff: false });

  return (
    <div className="rx-page rx-customer-page">
      {/* Top Header */}
      <header className="rx-customer-header">
        <Link to="/" className="rx-customer-brand">
          PHARMA <span>+</span>
        </Link>
        <nav aria-label="Main Navigation">
          <Link to="/catalog">Medicine Catalog</Link>
          <Link to={CUSTOMER_PRESCRIPTIONS}>My Prescriptions</Link>
          <Link to="/orders">My Orders</Link>
        </nav>
        <div className="rx-customer-account">
          <Link to={CUSTOMER_PRESCRIPTIONS} className="rx-button secondary">
            <ArrowLeft size={16} /> Back to List
          </Link>
        </div>
      </header>

      <main className="rx-content" style={{ maxWidth: '1100px' }}>
        <div className="rx-heading">
          <div>
            <span className="rx-eyebrow">NEW PRESCRIPTION SUBMISSION</span>
            <h1>Upload Doctor's Prescription</h1>
            <p>Upload a clear photo or PDF document of your valid medical prescription.</p>
          </div>
        </div>

        <div className="rx-upload-layout">
          {/* Left Checklist Panel */}
          <div className="rx-upload-checklist">
            <h2>Requirements for Fast Approval</h2>
            <ul>
              <li>
                <CheckCircle2 size={18} />
                <div>
                  <strong>Clear & Readable</strong>
                  <p>Ensure patient name, medicine names, dosages, and doctor info are legible.</p>
                </div>
              </li>
              <li>
                <FileCheck size={18} />
                <div>
                  <strong>Doctor Seal or Signature</strong>
                  <p>Prescription must display doctor signature, seal, or SLMC registration number.</p>
                </div>
              </li>
              <li>
                <Lock size={18} />
                <div>
                  <strong>HIPAA Privacy & Data Protection</strong>
                  <p>Your document is encrypted, securely stored, and only accessible by authorized pharmacists.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Right Upload Card */}
          <div className="rx-upload-card">
            <SubmissionForm
              onSubmit={saveSubmission}
              onCancel={() => navigate(CUSTOMER_PRESCRIPTIONS)}
              busy={busy}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
