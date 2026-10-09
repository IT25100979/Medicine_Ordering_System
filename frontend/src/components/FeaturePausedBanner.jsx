import React from 'react';

/** Shown when the System Admin has paused a workflow with a kill switch. */
const FeaturePausedBanner = ({ title, info }) => {
  if (!info || info.enabled !== false) return null;
  return (
    <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3" role="alert">
      <i className="fa-solid fa-circle-pause text-red-600 text-lg mt-0.5" />
      <div className="text-xs">
        <p className="font-black uppercase tracking-wider">{title} is temporarily unavailable</p>
        {info.reason && <p className="mt-0.5">{info.reason}</p>}
        {info.resumeAt && <p className="mt-0.5 text-red-700">Expected back: {new Date(info.resumeAt).toLocaleString()}</p>}
      </div>
    </div>
  );
};

export default FeaturePausedBanner;
