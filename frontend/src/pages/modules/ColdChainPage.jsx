import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const CANONICAL_SECTIONS = [
  {
    section: 'AMBIENT',
    displayName: 'Ambient Storage',
    tempRange: '15°C to 25°C',
    color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    icon: 'thermostat',
    desc: 'Room temp for oral solid tablets, capsules, and dry syrups.',
    packaging: 'Standard corrugated shipper.'
  },
  {
    section: 'COOL_ROOM',
    displayName: 'Cool Room Storage',
    tempRange: '8°C to 15°C',
    color: 'bg-blue-50 text-blue-800 border-blue-300',
    icon: 'ac_unit',
    desc: 'Sensitive liquid suspensions, eye drops, dermal lotions.',
    packaging: 'Insulated foil bubble liner + cold pad.'
  },
  {
    section: 'REFRIGERATED',
    displayName: 'Refrigerated Cold Chain',
    tempRange: '2°C to 8°C',
    color: 'bg-indigo-50 text-indigo-800 border-indigo-300',
    icon: 'severe_cold',
    desc: 'Insulin, vaccines, biologics, reconstituted antibiotics.',
    packaging: 'EPS thermal cooler + validated phase gel packs.'
  },
  {
    section: 'FROZEN',
    displayName: 'Deep Frozen Storage',
    tempRange: '-25°C to -10°C',
    color: 'bg-cyan-50 text-cyan-800 border-cyan-300',
    icon: 'cloudy_snowing',
    desc: 'Cryo medications, specialty mRNA vaccines, laboratory biologics.',
    packaging: 'Vacuum Insulated Panel (VIP) + dry ice.'
  },
  {
    section: 'CONTROLLED_VAULT',
    displayName: 'Controlled / Secured Vault',
    tempRange: '15°C to 25°C (Locked)',
    color: 'bg-rose-50 text-rose-800 border-rose-300',
    icon: 'lock',
    desc: 'Schedule II-V narcotics, high-potency opioids, regulated drugs.',
    packaging: 'Tamper-evident security seal with serial barcode.'
  }
];

const ColdChainPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tagging'); // 'sections', 'tagging', 'telemetry', 'review'
  const [medicines, setMedicines] = useState([]);
  const [tags, setTags] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Modal / Tag Form State
  const [selectedMed, setSelectedMed] = useState(null);
  const [formSection, setFormSection] = useState('REFRIGERATED');
  const [formMinTemp, setFormMinTemp] = useState('2.00');
  const [formMaxTemp, setFormMaxTemp] = useState('8.00');
  const [formShelfLife, setFormShelfLife] = useState('730');
  const [formIntensity, setFormIntensity] = useState('HIGH');
  const [formSecurity, setFormSecurity] = useState('TAMPER_EVIDENT');
  const [formActions, setFormActions] = useState('Pack with EPS thermal cooler box and reusable gel ice packs. Digital temperature logger required.');
  const [savingTag, setSavingTag] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [medRes, tagRes, telemRes] = await Promise.all([
        client.get('/api/v1/medicines'),
        client.get('/api/v1/cold-chain/tags'),
        client.get('/api/v1/cold-chain'),
      ]);

      const medList = medRes.data?.data || medRes.data || [];
      const tagList = tagRes.data?.data || tagRes.data || [];
      const telemList = telemRes.data?.data || telemRes.data || [];

      setMedicines(medList);
      setTags(tagList);
      setTelemetry(telemList);
    } catch (err) {
      console.error('Failed to load cold chain data:', err);
      setFeedback({ type: 'error', message: 'Failed to load cold chain records.' });
    } finally {
      setLoading(false);
    }
  };

  const openTagModal = (med) => {
    setSelectedMed(med);
    const existingTag = tags.find((t) => t.medicine?.id === med.id);
    if (existingTag) {
      setFormSection(existingTag.section || 'REFRIGERATED');
      setFormMinTemp(existingTag.storageTempMin != null ? String(existingTag.storageTempMin) : '2.00');
      setFormMaxTemp(existingTag.storageTempMax != null ? String(existingTag.storageTempMax) : '8.00');
      setFormShelfLife(existingTag.shelfLifeDays != null ? String(existingTag.shelfLifeDays) : '730');
      setFormIntensity(existingTag.intensity || 'HIGH');
      setFormSecurity(existingTag.securityLevel || 'TAMPER_EVIDENT');
      setFormActions(existingTag.deliveryActions || 'Pack with EPS cooler box and gel packs');
    } else {
      setFormSection('REFRIGERATED');
      setFormMinTemp('2.00');
      setFormMaxTemp('8.00');
      setFormShelfLife('730');
      setFormIntensity('HIGH');
      setFormSecurity('TAMPER_EVIDENT');
      setFormActions('Pack with EPS thermal cooler box and reusable gel ice packs.');
    }
  };

  const handleSaveTag = async (e) => {
    e.preventDefault();
    if (!selectedMed) return;
    setSavingTag(true);
    setFeedback(null);

    try {
      const payload = {
        section: formSection,
        storageTempMin: parseFloat(formMinTemp) || null,
        storageTempMax: parseFloat(formMaxTemp) || null,
        shelfLifeDays: parseInt(formShelfLife, 10) || 730,
        intensity: formIntensity,
        securityLevel: formSecurity,
        deliveryActions: formActions,
      };

      await client.post(`/api/v1/cold-chain/tags/medicine/${selectedMed.id}`, payload);
      setFeedback({ type: 'success', message: `Cold chain protocol configured for "${selectedMed.name}".` });
      setSelectedMed(null);
      fetchData();
    } catch (err) {
      console.error('Error saving cold chain tag:', err);
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to save tag.' });
    } finally {
      setSavingTag(false);
    }
  };

  const handleReviewTag = async (tagId, action) => {
    try {
      await client.post(`/api/v1/cold-chain/tags/${tagId}/review?action=${action}`);
      setFeedback({ type: 'success', message: `Cold chain tag ${action.toLowerCase()}ed successfully.` });
      fetchData();
    } catch (err) {
      console.error('Error reviewing tag:', err);
      setFeedback({ type: 'error', message: 'Failed to review tag.' });
    }
  };

  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch =
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genericName?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (sectionFilter === 'ALL') return true;
    const medTag = tags.find((t) => t.medicine?.id === m.id);
    if (sectionFilter === 'UNTAGGED') return !medTag;
    return medTag?.section === sectionFilter;
  });

  const pendingReviewTags = tags.filter((t) => t.status === 'PENDING_DUAL_REVIEW');
  const breachedTelemetry = telemetry.filter((t) => t.breachFlag === true);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-neutral-800 pb-16 pt-20 px-4 sm:px-6 lg:px-8 max-w-[1536px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-100 text-blue-800">
              <span className="material-symbols-outlined text-2xl">severe_cold</span>
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
                Cold Chain &amp; Storage Protocols
              </h1>
              <p className="text-xs text-neutral-500 font-medium">
                5 Canonical Temperature Storage Sections, Dual-Pharmacist Verification &amp; IoT Telemetry Monitoring
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/catalog"
            className="px-4 py-2 rounded-full border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-white hover:border-black transition-all"
          >
            Catalog Ops
          </Link>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Sync Fleet</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`mt-4 p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-red-50 text-red-800 border-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">
              {feedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-neutral-400 hover:text-black">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* 5 Canonical Sections Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 my-6">
        {CANONICAL_SECTIONS.map((sec) => {
          const count = tags.filter((t) => t.section === sec.section).length;
          return (
            <div
              key={sec.section}
              className={`p-4 rounded-2xl border shadow-xs transition-all hover:shadow-md ${sec.color}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="material-symbols-outlined text-2xl">{sec.icon}</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white/80 border border-current shadow-2xs">
                  {count} SKUs
                </span>
              </div>
              <h3 className="text-xs font-black uppercase tracking-tight">{sec.displayName}</h3>
              <p className="text-[11px] font-bold mt-0.5 opacity-90">{sec.tempRange}</p>
              <p className="text-[10px] mt-2 leading-tight opacity-75 line-clamp-2">{sec.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('tagging')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 ${
            activeTab === 'tagging'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'bg-white border border-neutral-300 text-neutral-600 hover:text-black'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">label</span>
          <span>Medicine Tagging ({medicines.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('review')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 relative ${
            activeTab === 'review'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'bg-white border border-neutral-300 text-neutral-600 hover:text-black'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">verified_user</span>
          <span>Dual Review Queue</span>
          {pendingReviewTags.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
              {pendingReviewTags.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 ${
            activeTab === 'telemetry'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'bg-white border border-neutral-300 text-neutral-600 hover:text-black'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">sensors</span>
          <span>IoT Telemetry &amp; Breaches ({breachedTelemetry.length} Alerts)</span>
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 ${
            activeTab === 'sections'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'bg-white border border-neutral-300 text-neutral-600 hover:text-black'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">menu_book</span>
          <span>Section Architecture Guidelines</span>
        </button>
      </div>

      {/* TAB 1: MEDICINE TAGGING */}
      {activeTab === 'tagging' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU or medicine..."
                className="w-full h-10 pl-9 pr-3 rounded-full bg-neutral-100 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black border border-neutral-200"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider shrink-0">
                Filter:
              </span>
              {['ALL', 'AMBIENT', 'COOL_ROOM', 'REFRIGERATED', 'FROZEN', 'CONTROLLED_VAULT', 'UNTAGGED'].map(
                (sec) => (
                  <button
                    key={sec}
                    onClick={() => setSectionFilter(sec)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors shrink-0 ${
                      sectionFilter === sec
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {sec.replace('_', ' ')}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Medicines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMedicines.map((med) => {
              const tag = tags.find((t) => t.medicine?.id === med.id);
              const sectionInfo = CANONICAL_SECTIONS.find((s) => s.section === tag?.section);

              return (
                <div
                  key={med.id}
                  className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs flex flex-col justify-between hover:border-black transition-all group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-neutral-400 block">
                          {med.sku || 'SKU-' + med.id}
                        </span>
                        <h3 className="text-sm font-black text-neutral-900 group-hover:text-primary transition-colors">
                          {med.name}
                        </h3>
                      </div>
                      {tag ? (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            sectionInfo?.color || 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {tag.section}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Untagged
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-500 line-clamp-2 mb-3">
                      {med.genericName || med.description || 'No description available'}
                    </p>

                    {tag ? (
                      <div className="bg-neutral-50 rounded-xl p-2.5 border border-neutral-100 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between text-neutral-600">
                          <span>Target Range:</span>
                          <strong className="text-neutral-900">
                            {tag.storageTempMin != null ? tag.storageTempMin : '15'}°C to{' '}
                            {tag.storageTempMax != null ? tag.storageTempMax : '25'}°C
                          </strong>
                        </div>
                        <div className="flex items-center justify-between text-neutral-600">
                          <span>Security Level:</span>
                          <span className="font-bold uppercase text-[10px]">{tag.securityLevel || 'STANDARD'}</span>
                        </div>
                        <div className="flex items-center justify-between text-neutral-600">
                          <span>Status:</span>
                          <span
                            className={`font-black text-[10px] uppercase px-1.5 py-0.2 rounded ${
                              tag.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tag.status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50/50 rounded-xl p-2.5 border border-amber-100 text-amber-800 text-[11px]">
                        Requires cold chain storage classification.
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-neutral-400">
                      Stock: {med.stockQuantity || 0} units
                    </span>
                    <button
                      onClick={() => openTagModal(med)}
                      className="px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-900 hover:text-white text-xs font-bold text-neutral-800 transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      <span>{tag ? 'Modify Tag' : 'Set Protocol'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DUAL REVIEW QUEUE */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
            <h2 className="text-base font-black uppercase tracking-tight mb-1">
              Dual-Signoff Verification Queue
            </h2>
            <p className="text-xs text-neutral-500 mb-4">
              Controlled Vault, Frozen, and Critical-intensity drugs require dual pharmacist sign-off before active storage deployment.
            </p>

            {pendingReviewTags.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                <p className="text-xs font-bold">All cold chain tags are verified and approved.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-200">
                {pendingReviewTags.map((tag) => (
                  <div key={tag.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-neutral-900">
                          {tag.medicine?.name || 'Medicine #' + tag.medicine?.id}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          {tag.section}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        Tagged by: <strong>{tag.reviewedBy || 'Operations'}</strong> • Intensity:{' '}
                        <strong>{tag.intensity}</strong> • Security: <strong>{tag.securityLevel}</strong>
                      </p>
                      <p className="text-[11px] text-neutral-600 mt-1 italic">
                        "{tag.deliveryActions || 'No actions specified'}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReviewTag(tag.id, 'APPROVE')}
                        className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[15px]">check</span>
                        <span>Confirm Approval</span>
                      </button>
                      <button
                        onClick={() => handleReviewTag(tag.id, 'REJECT')}
                        className="px-4 py-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">close</span>
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TELEMETRY & BREACHES */}
      {activeTab === 'telemetry' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black uppercase tracking-tight">IoT Fleet Telemetry Stream</h2>
                <p className="text-xs text-neutral-500">
                  Continuous cold-chain temperature monitoring on active courier delivery routes.
                </p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300">
                {breachedTelemetry.length} Breaches Logged
              </span>
            </div>

            {telemetry.length === 0 ? (
              <div className="text-center py-12 text-neutral-400">
                <span className="material-symbols-outlined text-4xl mb-2">sensors_off</span>
                <p className="text-xs font-bold">No telemetry logs recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-neutral-400 font-bold uppercase tracking-wider text-[10px] border-b border-neutral-200">
                    <tr>
                      <th className="p-3">Sensor ID</th>
                      <th className="p-3">Delivery Ref</th>
                      <th className="p-3">Recorded Temp</th>
                      <th className="p-3">Humidity</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {telemetry.map((t) => (
                      <tr key={t.id} className={t.breachFlag ? 'bg-red-50/60 font-semibold' : ''}>
                        <td className="p-3 font-mono">{t.deviceId}</td>
                        <td className="p-3">Delivery #{t.delivery?.id || 'N/A'}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded font-black ${
                              t.breachFlag ? 'bg-red-600 text-white' : 'text-neutral-900'
                            }`}
                          >
                            {t.temperatureRecorded}°C
                          </span>
                        </td>
                        <td className="p-3">{t.humidityRecorded ? t.humidityRecorded + '%' : 'N/A'}</td>
                        <td className="p-3">
                          {t.breachFlag ? (
                            <span className="inline-flex items-center gap-1 text-red-700 font-bold uppercase text-[10px]">
                              <span className="material-symbols-outlined text-[14px]">warning</span>
                              <span>Temperature Breach</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold uppercase text-[10px]">
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              <span>Nominal (2-8°C)</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-neutral-500">{t.recordedAt || 'Recent'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SECTION ARCHITECTURE */}
      {activeTab === 'sections' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CANONICAL_SECTIONS.map((sec) => (
            <div key={sec.section} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-2xl text-neutral-700">{sec.icon}</span>
                  <h3 className="text-sm font-black uppercase tracking-tight">{sec.displayName}</h3>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-800">
                  {sec.tempRange}
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">{sec.desc}</p>
              <div className="pt-2 border-t border-neutral-100 text-[11px] space-y-1">
                <p>
                  <strong>Packaging:</strong> {sec.packaging}
                </p>
                <p className="text-neutral-500">
                  <strong>Verification:</strong> Required at intake, picking, and doorstep delivery handoff.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CONFIGURE COLD CHAIN TAG */}
      {selectedMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-neutral-900">
                  Cold Chain Tagging Protocol
                </h3>
                <p className="text-xs text-neutral-500 font-medium">
                  {selectedMed.name} ({selectedMed.sku || 'SKU-' + selectedMed.id})
                </p>
              </div>
              <button
                onClick={() => setSelectedMed(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveTag} className="space-y-3.5">
              {/* Canonical Section Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Canonical Storage Section (5 Tiers)
                </label>
                <select
                  value={formSection}
                  onChange={(e) => {
                    const sec = e.target.value;
                    setFormSection(sec);
                    if (sec === 'AMBIENT') {
                      setFormMinTemp('15.00');
                      setFormMaxTemp('25.00');
                    } else if (sec === 'COOL_ROOM') {
                      setFormMinTemp('8.00');
                      setFormMaxTemp('15.00');
                    } else if (sec === 'REFRIGERATED') {
                      setFormMinTemp('2.00');
                      setFormMaxTemp('8.00');
                    } else if (sec === 'FROZEN') {
                      setFormMinTemp('-25.00');
                      setFormMaxTemp('-10.00');
                    } else if (sec === 'CONTROLLED_VAULT') {
                      setFormMinTemp('15.00');
                      setFormMaxTemp('25.00');
                      setFormSecurity('CONTROLLED_SUBSTANCE');
                    }
                  }}
                  className="w-full h-11 px-3.5 rounded-xl bg-neutral-50 border border-neutral-300 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="AMBIENT">1. AMBIENT (15°C - 25°C Room Temp)</option>
                  <option value="COOL_ROOM">2. COOL ROOM (8°C - 15°C Specialized)</option>
                  <option value="REFRIGERATED">3. REFRIGERATED (2°C - 8°C Cold Chain)</option>
                  <option value="FROZEN">4. FROZEN (-25°C to -10°C Deep Cold)</option>
                  <option value="CONTROLLED_VAULT">5. CONTROLLED VAULT (Locked Narcotics)</option>
                </select>
              </div>

              {/* Min & Max Temp */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Min Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formMinTemp}
                    onChange={(e) => setFormMinTemp(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-neutral-50 border border-neutral-300 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Max Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formMaxTemp}
                    onChange={(e) => setFormMaxTemp(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-neutral-50 border border-neutral-300 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Intensity & Security */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Intensity
                  </label>
                  <select
                    value={formIntensity}
                    onChange={(e) => setFormIntensity(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-neutral-50 border border-neutral-300 text-xs font-semibold"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL (Dual Signoff)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Security Level
                  </label>
                  <select
                    value={formSecurity}
                    onChange={(e) => setFormSecurity(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-neutral-50 border border-neutral-300 text-xs font-semibold"
                  >
                    <option value="STANDARD">STANDARD</option>
                    <option value="TAMPER_EVIDENT">TAMPER_EVIDENT</option>
                    <option value="LOCKED">LOCKED</option>
                    <option value="CONTROLLED_SUBSTANCE">CONTROLLED_SUBSTANCE</option>
                  </select>
                </div>
              </div>

              {/* Delivery Handling Instructions */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Delivery Handling &amp; Packaging Directives
                </label>
                <textarea
                  rows={2}
                  value={formActions}
                  onChange={(e) => setFormActions(e.target.value)}
                  placeholder="e.g. Insulated EPS box, temperature sensor logger..."
                  className="w-full p-3 rounded-xl bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMed(null)}
                  className="px-4 py-2.5 rounded-full border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTag}
                  className="px-5 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 shadow-md"
                >
                  {savingTag ? 'Saving Protocol...' : 'Save & Enforce Protocol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColdChainPage;
