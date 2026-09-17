import React from 'react';
import { CheckCircle2, Clock, PackageCheck, Truck, ShieldCheck, XCircle } from 'lucide-react';

const STAGES = [
  { key: 'PLACED', label: 'Order Placed', desc: 'FEFO stock allocated', icon: Clock },
  { key: 'VERIFIED', label: 'Clinical Review', desc: 'Pharmacist verified', icon: ShieldCheck },
  { key: 'PACKED', label: 'Dispensed & Packed', desc: 'Shelf scanned & bagged', icon: PackageCheck },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Dispatched with courier', icon: Truck },
  { key: 'DELIVERED', label: 'Handover Complete', desc: 'Secure OTP verified', icon: CheckCircle2 },
];

export default function OrderStepper({ currentStatus, estimatedDispatch, estimatedDelivery }) {
  if (currentStatus === 'CANCELLED') {
    return (
      <div style={{
        background: 'rgba(244, 63, 94, 0.1)',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <XCircle size={36} color="#fb7185" />
        <div>
          <h4 style={{ color: '#fda4af', margin: 0, fontSize: '1.1rem' }}>Order Cancelled</h4>
          <p style={{ color: '#f43f5e', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            This order has been cancelled and unfulfilled items have been safely restocked back into active inventory batches.
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = STAGES.findIndex((s) => s.key === currentStatus);

  return (
    <div style={{ margin: '24px 0' }}>
      {/* Stepper Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        {/* Background Line */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '40px',
          right: '40px',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.08)',
          zIndex: 1,
        }} />

        {/* Progress Line */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '40px',
          width: currentIndex >= 0 ? `${(currentIndex / (STAGES.length - 1)) * 100}%` : '0%',
          height: '4px',
          background: 'linear-gradient(90deg, #10b981, #06b6d4)',
          transition: 'width 0.4s ease',
          zIndex: 1,
          maxWidth: 'calc(100% - 80px)'
        }} />

        {/* Steps */}
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          let iconBg = 'rgba(30, 41, 59, 0.9)';
          let iconColor = 'var(--text-muted)';
          let borderColor = 'var(--border-glass)';

          if (isCompleted) {
            iconBg = '#10b981';
            iconColor = '#ffffff';
            borderColor = '#10b981';
          } else if (isCurrent) {
            iconBg = 'linear-gradient(135deg, #059669 0%, #0d9488 100%)';
            iconColor = '#ffffff';
            borderColor = '#34d399';
          }

          return (
            <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, textAlign: 'center', minWidth: '90px' }}>
              <div
                className={isCurrent ? 'pulse-indicator' : ''}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: iconBg,
                  color: iconColor,
                  border: `2px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  transition: 'all 0.3s ease'
                }}
              >
                <Icon size={20} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#ffffff' : (isCompleted ? '#cbd5e1' : 'var(--text-muted)') }}>
                {stage.label}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '110px' }}>
                {stage.desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Dynamic Estimated Timestamps (T-04.4) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '28px',
        padding: '14px 20px',
        background: 'rgba(15, 23, 42, 0.4)',
        borderRadius: '12px',
        border: '1px solid var(--border-glass)',
        fontSize: '0.82rem'
      }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Estimated Dispatch: </span>
          <strong style={{ color: '#38bdf8' }}>
            {estimatedDispatch ? new Date(estimatedDispatch).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Within 4 hours'}
          </strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Expected Delivery: </span>
          <strong style={{ color: '#34d399' }}>
            {estimatedDelivery ? new Date(estimatedDelivery).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Within 24 hours'}
          </strong>
        </div>
      </div>
    </div>
  );
}
