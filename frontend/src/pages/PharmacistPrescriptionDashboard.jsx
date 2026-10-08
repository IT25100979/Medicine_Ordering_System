import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDateDDMMYYYY, getShelfLifeStatus } from './OperationsCatalogDashboard';

const REJECTION_TAGS = [
  'Not clear photo',
  'Outdated Prescription',
  "Doctor's seal not available",
  'Medical Institute / Medical Personal Information is not true',
];

const CANONICAL_SECTIONS = [
  {
    key: 'AMBIENT',
    displayName: 'Ambient Storage',
    tempRange: '15°C to 25°C',
    minTemp: 15.0,
    maxTemp: 25.0,
    defaultShelfDays: 730,
    defaultIntensity: 'LOW',
    defaultSecurity: 'STANDARD',
    color: 'emerald',
    icon: 'shelves',
    description: 'Standard controlled room temperature for oral solid doses, tablets, capsules, and OTC formulations.',
    packaging: 'Standard corrugated cardboard shipper or bubble mailer.',
  },
  {
    key: 'COOL_ROOM',
    displayName: 'Cool Room Storage',
    tempRange: '8°C to 15°C',
    minTemp: 8.0,
    maxTemp: 15.0,
    defaultShelfDays: 365,
    defaultIntensity: 'MEDIUM',
    defaultSecurity: 'STANDARD',
    color: 'teal',
    icon: 'device_thermostat',
    description: 'Dedicated climate-controlled zone for sensitive liquid suspensions, dermal ointments, and ocular drops.',
    packaging: 'Thermal bubble-insulated pouch with single chilled buffer pack.',
  },
  {
    key: 'REFRIGERATED',
    displayName: 'Refrigerated Cold Chain',
    tempRange: '2°C to 8°C',
    minTemp: 2.0,
    maxTemp: 8.0,
    defaultShelfDays: 180,
    defaultIntensity: 'HIGH',
    defaultSecurity: 'TAMPER_EVIDENT',
    color: 'cyan',
    icon: 'ac_unit',
    description: 'Strict 2–8°C refrigerated cold-chain for insulin pens, biologics, vaccines, and reconstituted injectables.',
    packaging: 'Expanded Polystyrene (EPS) thermal cooler box with validated gel ice packs & continuous temp logger.',
  },
  {
    key: 'FROZEN',
    displayName: 'Deep Frozen Storage',
    tempRange: '-25°C to -10°C',
    minTemp: -25.0,
    maxTemp: -10.0,
    defaultShelfDays: 90,
    defaultIntensity: 'CRITICAL',
    defaultSecurity: 'LOCKED',
    color: 'blue',
    icon: 'severe_cold',
    description: 'Ultra-low sub-zero freezer for cryo-preservatives, specialized mRNA biologics, and lab reagents.',
    packaging: 'Vacuum-insulated panel (VIP) shipper with dry ice / phase-change material. Dual sign-off required.',
  },
  {
    key: 'CONTROLLED_VAULT',
    displayName: 'Controlled / Secured Vault',
    tempRange: '15°C to 25°C (Locked)',
    minTemp: 15.0,
    maxTemp: 25.0,
    defaultShelfDays: 730,
    defaultIntensity: 'CRITICAL',
    defaultSecurity: 'CONTROLLED_SUBSTANCE',
    color: 'purple',
    icon: 'lock',
    description: 'High-security double-locked biometric vault for Schedule II-V controlled narcotics and high-potency opioids.',
    packaging: 'Tamper-evident serial-numbered security bag, dual pharmacist verification seal, chain-of-custody tracking.',
  },
];

const PharmacistPrescriptionDashboard = () => {
  const { user, logout } = useAuth();

  // Navigation: 'prescriptions' (Rx Verification Queue) | 'condition_tagging' (Cold Chain & Shelf Tagging)
  const [activeNavTab, setActiveNavTab] = useState('prescriptions');

  // Single Moving Side Panel Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // =============================================================
  // 1. PRESCRIPTIONS QUEUE STATE & LOGIC
  // =============================================================
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // PENDING, CHRONIC, APPROVED, REJECTED
  const [searchQuery, setSearchQuery] = useState('');

  // Unified View & Review Modal State
  const [selectedRx, setSelectedRx] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('APPROVED');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState(REJECTION_TAGS[0]);
  const [deleteFileImmediately, setDeleteFileImmediately] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchPrescriptions = async () => {
    setLoadingPrescriptions(true);
    try {
      const res = await client.get('/api/v1/prescriptions');
      setPrescriptions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch prescriptions', err);
      showToast('Failed to load prescriptions from clinical server.', 'error');
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const statusCounts = useMemo(() => {
    return {
      PENDING: prescriptions.filter((rx) => rx.status === 'PENDING').length,
      CHRONIC: prescriptions.filter((rx) => Boolean(rx.chronicSubscription)).length,
      APPROVED: prescriptions.filter((rx) => rx.status === 'APPROVED').length,
      REJECTED: prescriptions.filter((rx) => rx.status === 'REJECTED').length,
      TOTAL: prescriptions.length,
    };
  }, [prescriptions]);

  const handleOpenUnifiedModal = (rx) => {
    setSelectedRx(rx);
    setVerificationStatus('APPROVED');
    setVerificationNotes('');
    setRejectionReason(REJECTION_TAGS[0]);
    setDeleteFileImmediately(false);
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRx) return;

    if (selectedRx.status !== 'PENDING') {
      showToast('This prescription has already been finalized and cannot be reviewed again.', 'error');
      return;
    }

    setSubmittingVerification(true);
    try {
      const payload = {
        status: verificationStatus,
        verificationNotes: verificationNotes.trim(),
        rejectionReason: verificationStatus === 'REJECTED' ? rejectionReason : null,
        deleteFileImmediately: verificationStatus === 'REJECTED' && deleteFileImmediately,
      };

      await client.put(`/api/v1/prescriptions/${selectedRx.id}/verify`, payload);
      showToast(`Prescription #${selectedRx.id} successfully marked as ${verificationStatus}! Notification dispatched.`);
      setSelectedRx(null);
      await fetchPrescriptions();
    } catch (err) {
      console.error('Verification failed', err);
      showToast(err.response?.data?.message || 'Failed to update prescription status.', 'error');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleDeletePrescription = async (rxId) => {
    if (!window.confirm(`Are you sure you want to permanently delete prescription #${rxId}? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(rxId);
    try {
      await client.delete(`/api/v1/prescriptions/${rxId}`);
      showToast(`Prescription #${rxId} deleted permanently.`);
      if (selectedRx && selectedRx.id === rxId) {
        setSelectedRx(null);
      }
      await fetchPrescriptions();
    } catch (err) {
      console.error('Delete failed', err);
      showToast(err.response?.data?.message || 'Failed to delete prescription.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredPrescriptions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      return prescriptions.filter((rx) => {
        const matchRxId = String(rx.id || '').includes(q);
        const matchPatientId = String(rx.customerId || '').includes(q);
        const matchEmail = (rx.customerEmail || '').toLowerCase().includes(q);
        const matchName = (rx.customerName || '').toLowerCase().includes(q);
        const matchDoctor = (rx.doctorName || '').toLowerCase().includes(q);
        const matchStatus = (rx.status || '').toLowerCase().includes(q);
        return matchRxId || matchPatientId || matchEmail || matchName || matchDoctor || matchStatus;
      });
    }

    if (statusFilter === 'CHRONIC') {
      return prescriptions.filter((rx) => Boolean(rx.chronicSubscription));
    }
    return prescriptions.filter((rx) => rx.status === statusFilter);
  }, [prescriptions, searchQuery, statusFilter]);

  // =============================================================
  // 2. CONDITION & COLD-CHAIN TAGGING STATE & LOGIC
  // =============================================================
  const [tags, setTags] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loadingTagging, setLoadingTagging] = useState(false);

  // Tagging Sub-Views: 'queue' (Item & Batch Tagging Console) | 'shelves' (5-Section Shelf Arrangement View)
  const [taggingSubView, setTaggingSubView] = useState('queue');

  // Tagging Filters
  const [tagStatusFilter, setTagStatusFilter] = useState('ALL'); // ALL, AWAITING_REVIEW, PENDING_DUAL_REVIEW, APPROVED, REJECTED
  const [tagSectionFilter, setTagSectionFilter] = useState('ALL'); // ALL, AMBIENT, COOL_ROOM, REFRIGERATED, FROZEN, CONTROLLED_VAULT
  const [tagProductSearch, setTagProductSearch] = useState('');
  const [tagExpiryFilter, setTagExpiryFilter] = useState('ALL'); // ALL, GOOD, NEAR_EXPIRY, EXPIRED

  // Tag Editor Modal State
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [editingTag, setEditingTag] = useState(null);
  const [savingTag, setSavingTag] = useState(false);

  // Tag Form Fields
  const [tagForm, setTagForm] = useState({
    section: 'AMBIENT',
    storageTempMin: 15.0,
    storageTempMax: 25.0,
    shelfLifeDays: 730,
    intensity: 'LOW',
    securityLevel: 'STANDARD',
    deliveryActions: {
      insulatedBox: false,
      icePack: false,
      keepUpright: false,
      avoidSunlight: false,
      signatureRequired: false,
      idAgeCheck: false,
      maxTransitHours: '12',
      noLeaveAtDoor: false,
      customNotes: '',
    },
  });

  // Dual-Confirmation Dialog State
  const [showDualModal, setShowDualModal] = useState(false);
  const [dualTargetTag, setDualTargetTag] = useState(null);
  const [dualTargetMedicine, setDualTargetMedicine] = useState(null);
  const [dualSecondReviewer, setDualSecondReviewer] = useState('Dr. Sarah Pharmacist (Reg #SLMC-8492)');
  const [dualNotes, setDualNotes] = useState('Validated cold chain integrity & biometric security protocols.');
  const [submittingDual, setSubmittingDual] = useState(false);

  // Fetch all Tagging and Catalog Data
  const fetchTaggingData = async () => {
    setLoadingTagging(true);
    try {
      const [resTags, resMeds, resBatches] = await Promise.all([
        client.get('/api/v1/cold-chain/tags').catch(() => ({ data: { data: [] } })),
        client.get('/api/v1/medicines').catch(() => ({ data: [] })),
        client.get('/api/v1/batches/grouped').catch(() => ({ data: { data: [] } })),
      ]);

      const tagData = resTags.data?.data || (Array.isArray(resTags.data) ? resTags.data : []);
      setTags(Array.isArray(tagData) ? tagData : []);
      setMedicines(Array.isArray(resMeds.data) ? resMeds.data : []);
      const batchData = resBatches.data?.data || (Array.isArray(resBatches.data) ? resBatches.data : []);
      setBatches(Array.isArray(batchData) ? batchData : []);
    } catch (err) {
      console.error('Failed to load cold chain tags:', err);
      showToast('Error loading cold chain condition tagging data.', 'error');
    } finally {
      setLoadingTagging(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    fetchTaggingData();
  }, []);

  // Tag Metrics Summary
  const tagMetrics = useMemo(() => {
    let totalItems = medicines.length;
    let awaitingReviewCount = 0;
    let pendingDualCount = 0;
    let approvedCount = 0;
    let coldChainCount = 0;
    let vaultCount = 0;

    medicines.forEach((m) => {
      const tag = tags.find((t) => t.medicine?.id === m.id || t.medicineId === m.id);
      const isReview = tag ? (tag.status === 'PENDING_REVIEW' || tag.status === 'DRAFT') : Boolean(m.isTemperatureSensitive);
      const isDual = tag ? tag.status === 'PENDING_DUAL_REVIEW' : false;
      const isAppr = tag ? tag.status === 'APPROVED' : true;

      if (isDual) pendingDualCount++;
      else if (isReview) awaitingReviewCount++;
      else if (isAppr) approvedCount++;

      if (tag) {
        if (tag.section === 'REFRIGERATED' || tag.section === 'COOL_ROOM' || tag.section === 'FROZEN') coldChainCount++;
        if (tag.section === 'CONTROLLED_VAULT' || tag.securityLevel === 'CONTROLLED_SUBSTANCE') vaultCount++;
      } else if (m.isTemperatureSensitive) {
        coldChainCount++;
      }
    });

    return {
      totalItems,
      awaitingReviewCount,
      pendingDualCount,
      approvedCount,
      coldChainCount,
      vaultCount,
    };
  }, [medicines, tags]);

  // Combined Tagged Catalog Items with Expiry and Batch Details
  const combinedTaggedItems = useMemo(() => {
    return medicines.map((m) => {
      const tag = tags.find((t) => t.medicine?.id === m.id || t.medicineId === m.id);
      const shelfLife = getShelfLifeStatus(m.expiryDate);

      // Extract delivery actions checklist
      const actionsStr = tag?.deliveryActions || '';
      const hasInsulated = actionsStr.toLowerCase().includes('insulated');
      const hasIcePack = actionsStr.toLowerCase().includes('ice pack') || actionsStr.toLowerCase().includes('gel pad');
      const hasUpright = actionsStr.toLowerCase().includes('upright');
      const hasSunlight = actionsStr.toLowerCase().includes('sunlight');
      const hasSignature = actionsStr.toLowerCase().includes('signature');
      const hasIdCheck = actionsStr.toLowerCase().includes('id') || actionsStr.toLowerCase().includes('age');
      const hasNoLeave = actionsStr.toLowerCase().includes('no leave');

      return {
        medicine: m,
        tag: tag || null,
        tagId: tag?.id || null,
        medicineId: m.id,
        name: m.name,
        genericName: m.genericName,
        sku: m.sku,
        barcode: m.barcode,
        batchNumber: m.batchNumber || 'LOT-UNASSIGNED',
        stockQuantity: m.stockQuantity || 0,
        unitPrice: m.unitPrice,
        cogs: m.cogs,
        shelfLocation: m.shelfLocation || 'Shelf A-01',
        storageRequirement: m.storageRequirement,
        expiryDate: m.expiryDate,
        shelfLifeStatus: shelfLife,
        section: tag?.section || (m.isTemperatureSensitive ? 'REFRIGERATED' : 'AMBIENT'),
        storageTempMin: tag?.storageTempMin !== undefined ? tag.storageTempMin : (m.isTemperatureSensitive ? 2.0 : 15.0),
        storageTempMax: tag?.storageTempMax !== undefined ? tag.storageTempMax : (m.isTemperatureSensitive ? 8.0 : 25.0),
        shelfLifeDays: tag?.shelfLifeDays || 730,
        intensity: tag?.intensity || (m.requiresPrescription ? 'HIGH' : 'LOW'),
        securityLevel: tag?.securityLevel || 'STANDARD',
        deliveryActions: actionsStr,
        status: tag?.status || (m.isTemperatureSensitive ? 'PENDING_REVIEW' : 'APPROVED'),
        reviewedBy: tag?.reviewedBy,
        reviewedAt: tag?.reviewedAt,
        dualConfirmedBy: tag?.dualConfirmedBy,
        actionsObj: {
          insulatedBox: hasInsulated,
          icePack: hasIcePack,
          keepUpright: hasUpright,
          avoidSunlight: hasSunlight,
          signatureRequired: hasSignature,
          idAgeCheck: hasIdCheck,
          noLeaveAtDoor: hasNoLeave,
        },
      };
    });
  }, [medicines, tags]);

  // Filtered Tagged Items for Queue View
  const filteredTaggedItems = useMemo(() => {
    let list = [...combinedTaggedItems];

    // Status Filter
    if (tagStatusFilter !== 'ALL') {
      if (tagStatusFilter === 'AWAITING_REVIEW') {
        list = list.filter((item) => item.status === 'PENDING_REVIEW' || item.status === 'COLD_CHAIN_REVIEW' || item.status === 'DRAFT');
      } else if (tagStatusFilter === 'PENDING_DUAL_REVIEW') {
        list = list.filter((item) => item.status === 'PENDING_DUAL_REVIEW');
      } else if (tagStatusFilter === 'APPROVED') {
        list = list.filter((item) => item.status === 'APPROVED' || item.status === 'LIVE');
      } else if (tagStatusFilter === 'REJECTED') {
        list = list.filter((item) => item.status === 'REJECTED');
      }
    }

    // Section Filter
    if (tagSectionFilter !== 'ALL') {
      list = list.filter((item) => item.section === tagSectionFilter);
    }

    // Product Search Filter
    if (tagProductSearch.trim()) {
      const q = tagProductSearch.toLowerCase().trim();
      list = list.filter((item) => {
        const matchName = (item.name || '').toLowerCase().includes(q);
        const matchGen = (item.genericName || '').toLowerCase().includes(q);
        const matchSku = (item.sku || '').toLowerCase().includes(q);
        const matchBatch = (item.batchNumber || '').toLowerCase().includes(q);
        const matchShelf = (item.shelfLocation || '').toLowerCase().includes(q);
        return matchName || matchGen || matchSku || matchBatch || matchShelf;
      });
    }

    // Expiry Filter
    if (tagExpiryFilter !== 'ALL') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      list = list.filter((item) => {
        if (!item.expiryDate) return false;
        const exp = new Date(item.expiryDate);
        exp.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (tagExpiryFilter === 'EXPIRED') return diffDays < 0;
        if (tagExpiryFilter === 'NEAR_EXPIRY') return diffDays >= 0 && diffDays <= 60;
        if (tagExpiryFilter === 'GOOD') return diffDays > 60;
        return true;
      });
    }

    return list;
  }, [combinedTaggedItems, tagStatusFilter, tagSectionFilter, tagProductSearch, tagExpiryFilter]);

  // Open Tag Editor Modal
  const handleOpenTagEditor = (item) => {
    setEditingMedicine(item.medicine || item);
    setEditingTag(item.tag || null);

    const sectionMeta = CANONICAL_SECTIONS.find((s) => s.key === item.section) || CANONICAL_SECTIONS[0];
    const act = item.actionsObj || {};

    setTagForm({
      section: item.section || sectionMeta.key,
      storageTempMin: item.storageTempMin !== undefined ? Number(item.storageTempMin) : sectionMeta.minTemp,
      storageTempMax: item.storageTempMax !== undefined ? Number(item.storageTempMax) : sectionMeta.maxTemp,
      shelfLifeDays: item.shelfLifeDays || sectionMeta.defaultShelfDays,
      intensity: item.intensity || sectionMeta.defaultIntensity,
      securityLevel: item.securityLevel || sectionMeta.defaultSecurity,
      deliveryActions: {
        insulatedBox: act.insulatedBox || (item.section === 'REFRIGERATED' || item.section === 'FROZEN'),
        icePack: act.icePack || (item.section === 'REFRIGERATED' || item.section === 'COOL_ROOM'),
        keepUpright: act.keepUpright || false,
        avoidSunlight: act.avoidSunlight || false,
        signatureRequired: act.signatureRequired || (item.intensity === 'HIGH' || item.intensity === 'CRITICAL'),
        idAgeCheck: act.idAgeCheck || (item.securityLevel === 'CONTROLLED_SUBSTANCE'),
        maxTransitHours: '12',
        noLeaveAtDoor: act.noLeaveAtDoor || (item.securityLevel === 'CONTROLLED_SUBSTANCE'),
        customNotes: item.deliveryActions || '',
      },
    });

    setShowTagModal(true);
  };

  // Section Change in Tag Editor: Auto-fills temp range & defaults
  const handleSectionChange = (newSecKey) => {
    const meta = CANONICAL_SECTIONS.find((s) => s.key === newSecKey) || CANONICAL_SECTIONS[0];
    setTagForm((prev) => ({
      ...prev,
      section: newSecKey,
      storageTempMin: meta.minTemp,
      storageTempMax: meta.maxTemp,
      shelfLifeDays: meta.defaultShelfDays,
      intensity: meta.defaultIntensity,
      securityLevel: meta.defaultSecurity,
      deliveryActions: {
        ...prev.deliveryActions,
        insulatedBox: (newSecKey === 'REFRIGERATED' || newSecKey === 'FROZEN'),
        icePack: (newSecKey === 'REFRIGERATED' || newSecKey === 'COOL_ROOM'),
        signatureRequired: (newSecKey === 'CONTROLLED_VAULT' || newSecKey === 'FROZEN'),
        idAgeCheck: (newSecKey === 'CONTROLLED_VAULT'),
      },
    }));
  };

  // Save Tag Configuration
  const handleSaveTag = async (e, forceApprove = false) => {
    if (e) e.preventDefault();
    if (!editingMedicine) return;

    // Check if dual confirmation is required
    const isCritical = tagForm.intensity === 'CRITICAL';
    const isControlled = tagForm.securityLevel === 'CONTROLLED_SUBSTANCE' || tagForm.section === 'CONTROLLED_VAULT';
    const isFrozen = tagForm.section === 'FROZEN';

    if ((isCritical || isControlled || isFrozen) && forceApprove) {
      setShowTagModal(false);
      setDualTargetMedicine(editingMedicine);
      setDualTargetTag(editingTag);
      setShowDualModal(true);
      return;
    }

    setSavingTag(true);
    try {
      // Build delivery actions comma-separated string
      const actionsList = [];
      if (tagForm.deliveryActions.insulatedBox) actionsList.push('Insulated Thermal Box');
      if (tagForm.deliveryActions.icePack) actionsList.push('Ice Pack / Chilled Cold Gel Pad');
      if (tagForm.deliveryActions.keepUpright) actionsList.push('Keep Upright');
      if (tagForm.deliveryActions.avoidSunlight) actionsList.push('Avoid Direct Sunlight');
      if (tagForm.deliveryActions.signatureRequired) actionsList.push('Signature Required Upon Delivery');
      if (tagForm.deliveryActions.idAgeCheck) actionsList.push('ID & Age Verification Required');
      if (tagForm.deliveryActions.maxTransitHours) actionsList.push(`Max Transit ${tagForm.deliveryActions.maxTransitHours} Hours`);
      if (tagForm.deliveryActions.noLeaveAtDoor) actionsList.push('No Leave At Door');
      if (tagForm.deliveryActions.customNotes?.trim()) actionsList.push(tagForm.deliveryActions.customNotes.trim());

      const payload = {
        section: tagForm.section,
        storageTempMin: parseFloat(tagForm.storageTempMin),
        storageTempMax: parseFloat(tagForm.storageTempMax),
        shelfLifeDays: parseInt(tagForm.shelfLifeDays, 10) || 730,
        intensity: tagForm.intensity,
        securityLevel: tagForm.securityLevel,
        deliveryActions: actionsList.join(', '),
      };

      await client.post(`/api/v1/cold-chain/tags/medicine/${editingMedicine.id}`, payload);
      showToast(`Cold chain condition tag configured for "${editingMedicine.name}"! Synced to Catalog & Delivery.`);
      setShowTagModal(false);
      await fetchTaggingData();
    } catch (err) {
      console.error('Failed to save tag', err);
      showToast(err.response?.data?.message || 'Failed to save cold chain tag.', 'error');
    } finally {
      setSavingTag(false);
    }
  };

  // Dual-Confirmation Submit
  const handleDualConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!dualTargetMedicine && !dualTargetTag) return;

    setSubmittingDual(true);
    try {
      const tagId = dualTargetTag?.id || (tags.find(t => t.medicine?.id === dualTargetMedicine?.id)?.id);
      
      if (tagId) {
        await client.post(`/api/v1/cold-chain/tags/${tagId}/dual-confirm`, {
          secondReviewer: dualSecondReviewer.trim(),
          notes: dualNotes.trim(),
        });
      } else if (dualTargetMedicine) {
        // Save and approve directly
        const payload = {
          section: tagForm.section,
          storageTempMin: parseFloat(tagForm.storageTempMin),
          storageTempMax: parseFloat(tagForm.storageTempMax),
          shelfLifeDays: parseInt(tagForm.shelfLifeDays, 10) || 730,
          intensity: tagForm.intensity,
          securityLevel: tagForm.securityLevel,
          deliveryActions: 'Tamper-Evident Bag, Dual Pharmacist Seal, Signature Required',
        };
        const res = await client.post(`/api/v1/cold-chain/tags/medicine/${dualTargetMedicine.id}`, payload);
        if (res.data?.data?.id) {
          await client.post(`/api/v1/cold-chain/tags/${res.data.data.id}/dual-confirm`, {
            secondReviewer: dualSecondReviewer.trim(),
            notes: dualNotes.trim(),
          });
        }
      }

      showToast(`Dual-confirmation signed by ${dualSecondReviewer}! Item & batch marked LIVE.`);
      setShowDualModal(false);
      await fetchTaggingData();
    } catch (err) {
      console.error('Dual confirm error:', err);
      showToast(err.response?.data?.message || 'Failed to record dual confirmation', 'error');
    } finally {
      setSubmittingDual(false);
    }
  };

  // Move Item to Shelf Section (Interactive Shelf Arrangement with Audit Logging)
  const handleMoveSection = async (tagId, medicineId, newSectionKey) => {
    try {
      if (tagId) {
        await client.post(`/api/v1/cold-chain/tags/${tagId}/move-section?section=${newSectionKey}`);
      } else {
        // Auto create and move
        const meta = CANONICAL_SECTIONS.find(s => s.key === newSectionKey);
        await client.post(`/api/v1/cold-chain/tags/medicine/${medicineId}`, {
          section: newSectionKey,
          storageTempMin: meta.minTemp,
          storageTempMax: meta.maxTemp,
          shelfLifeDays: meta.defaultShelfDays,
          intensity: meta.defaultIntensity,
          securityLevel: meta.defaultSecurity,
          deliveryActions: `Assigned to ${meta.displayName}`,
        });
      }
      showToast(`Item relocated to ${newSectionKey.replace('_', ' ')}! Audit event recorded.`);
      await fetchTaggingData();
    } catch (err) {
      console.error('Move section error:', err);
      showToast(err.response?.data?.message || 'Failed to relocate item', 'error');
    }
  };

  // Direct Approve Tag
  const handleDirectApprove = async (item) => {
    const isCritical = item.intensity === 'CRITICAL';
    const isControlled = item.securityLevel === 'CONTROLLED_SUBSTANCE' || item.section === 'CONTROLLED_VAULT' || item.section === 'FROZEN';

    if (isCritical || isControlled) {
      setDualTargetMedicine(item.medicine || item);
      setDualTargetTag(item.tag || { id: item.tagId });
      setShowDualModal(true);
      return;
    }

    try {
      if (item.tagId) {
        await client.post(`/api/v1/cold-chain/tags/${item.tagId}/review?action=APPROVE`);
      } else {
        await client.post(`/api/v1/cold-chain/tags/medicine/${item.medicineId}`, {
          section: item.section || 'AMBIENT',
          storageTempMin: item.storageTempMin || 15.0,
          storageTempMax: item.storageTempMax || 25.0,
          shelfLifeDays: item.shelfLifeDays || 730,
          intensity: item.intensity || 'LOW',
          securityLevel: item.securityLevel || 'STANDARD',
          deliveryActions: item.deliveryActions || 'Standard Packaging',
        });
      }
      showToast(`"${item.name}" approved LIVE! Synced to Catalog & Delivery.`);
      await fetchTaggingData();
    } catch (err) {
      console.error('Approve tag error:', err);
      showToast(err.response?.data?.message || 'Failed to approve item', 'error');
    }
  };

  // Format Helper for Dates
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '—';
    }
  };

  return (
    <div className="bg-[#fcfbf9] min-h-screen text-neutral-900 pb-16 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold border transition-all ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-zinc-900 text-white border-zinc-800'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] text-amber-400">
            {toast.type === 'error' ? 'error' : 'verified'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* SINGLE MOVING SIDE PANEL DRAWER                           */}
      {/* ========================================================= */}
      {/* Floating Modern Pill Button (Fixed on Top-Left) */}
      <div className="fixed top-4 left-4 z-40">
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider shadow-lg hover:bg-black hover:scale-105 active:scale-95 transition-all cursor-pointer border border-zinc-700"
          title="Open Clinical Navigation Drawer"
        >
          <span className="material-symbols-outlined text-[18px]">menu_open</span>
          <span className="hidden sm:inline">Pharma Console</span>
        </button>
      </div>

      {/* Backdrop */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-80 sm:w-96 bg-white z-50 shadow-2xl border-r border-neutral-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-1 font-black text-xl tracking-tight uppercase text-black">
            <span>PHARMA</span>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-black shadow-sm">
              +
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Drawer Content / Nav Tabs */}
        <div className="flex-1 p-6 space-y-3 overflow-y-auto">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mb-2">
            Clinical Workspaces
          </div>

          {/* Nav Item 1: Rx Verification Queue */}
          <button
            type="button"
            onClick={() => {
              setActiveNavTab('prescriptions');
              setIsDrawerOpen(false);
            }}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeNavTab === 'prescriptions'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">prescriptions</span>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">Rx Verification Queue</div>
                <div className={`text-[10px] ${activeNavTab === 'prescriptions' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  Review patient uploaded prescriptions
                </div>
              </div>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              activeNavTab === 'prescriptions' ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
            }`}>
              {statusCounts.PENDING}
            </span>
          </button>

          {/* Nav Item 2: Condition & Cold-Chain Tagging */}
          <button
            type="button"
            onClick={() => {
              setActiveNavTab('condition_tagging');
              setIsDrawerOpen(false);
            }}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              activeNavTab === 'condition_tagging'
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px]">ac_unit</span>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">Condition Tagging</div>
                <div className={`text-[10px] ${activeNavTab === 'condition_tagging' ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  5-Section Cold Chain &amp; Shelf Life
                </div>
              </div>
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              activeNavTab === 'condition_tagging' ? 'bg-cyan-500 text-white' : 'bg-cyan-100 text-cyan-900'
            }`}>
              {tagMetrics.awaitingReviewCount + tagMetrics.pendingDualCount}
            </span>
          </button>

          {/* Switch to Operations Link */}
          <div className="pt-6 border-t border-neutral-100">
            <Link
              to="/admin/stocks"
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                <span>Operations Stocks Console</span>
              </div>
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </Link>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-6 border-t border-neutral-100 flex items-center justify-between">
          <div className="text-xs text-neutral-500">
            Logged in as <strong className="text-neutral-800">{user?.fullName || 'Chief Pharmacist'}</strong>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TOP HEADER: Pharma + Logo (left) & Logout Button (right)  */}
      {/* ========================================================= */}
      <header className="w-full bg-white border-b border-neutral-200/80 px-4 sm:px-6 lg:px-12 py-3.5 mb-6 shadow-xs">
        <div className="max-w-[1536px] mx-auto flex items-center justify-between">
          
          {/* Top Left: Pharma + Logo and Active Status Queue Badge below it */}
          <div className="pl-12 sm:pl-0">
            <Link
              to="/pharmacist_dashboard"
              className="flex items-center gap-1 font-sans font-black text-xl sm:text-2xl tracking-tight uppercase text-black hover:opacity-90 transition-opacity"
            >
              <span>PHARMA</span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-black shadow-sm">
                +
              </span>
            </Link>

            {/* Active Status Badge placed just below the Pharma + logo */}
            <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-bold tracking-wide shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{activeNavTab === 'prescriptions' ? 'Prescription Verification Queue' : 'Cold-Chain & Condition Tagging Console'}</span>
            </div>
          </div>

          {/* Top Right: Header Workspace Switcher Pills & Logout Button */}
          <div className="flex items-center gap-3">
            
            {/* Direct Switcher Pills */}
            <div className="hidden md:flex items-center gap-1.5 bg-neutral-100 p-1 rounded-full border border-neutral-200">
              <button
                type="button"
                onClick={() => setActiveNavTab('prescriptions')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeNavTab === 'prescriptions'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">prescriptions</span>
                <span>Rx Verification</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveNavTab('condition_tagging')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeNavTab === 'condition_tagging'
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">ac_unit</span>
                <span>Condition Tagging</span>
              </button>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Log Out of Pharmacist Portal"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-100 hover:bg-red-50 text-neutral-700 hover:text-red-600 text-xs font-bold uppercase tracking-wider transition-colors border border-neutral-200 shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================= */}
      {/* WORKSPACE CONTENT AREA                                    */}
      {/* ========================================================= */}
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* ======================================================= */}
        {/* TAB 1: RX VERIFICATION QUEUE                           */}
        {/* ======================================================= */}
        {activeNavTab === 'prescriptions' && (
          <div>
            {/* Workspace Title: "Rx Verification Portal" & Refresh Symbol */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
                  Rx Verification Portal
                </h1>
                <p className="text-xs text-neutral-500 mt-1">
                  Clinical intake, identity validation, course regimen verification &amp; dispensing sign-off.
                </p>
              </div>

              {/* Sync Queue */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchPrescriptions}
                  title="Refresh queue"
                  aria-label="Refresh queue"
                  className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-black text-white flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                </button>
              </div>
            </div>

            {/* Main Queue Container */}
            <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
              
              {/* Table Controls: Status Filters & Search Bar */}
              <div className="p-4 sm:p-6 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Filter Status */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Filter Status:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 bg-neutral-100 p-1 rounded-full border border-neutral-200">
                    {[
                      { id: 'PENDING', label: 'Pending', count: statusCounts.PENDING },
                      { id: 'CHRONIC', label: 'Chronic', count: statusCounts.CHRONIC },
                      { id: 'APPROVED', label: 'Approved', count: statusCounts.APPROVED },
                      { id: 'REJECTED', label: 'Rejected', count: statusCounts.REJECTED },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setStatusFilter(st.id);
                          if (searchQuery) setSearchQuery('');
                        }}
                        className={`text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                          statusFilter === st.id && !searchQuery
                            ? 'bg-zinc-900 text-white shadow-sm font-extrabold'
                            : 'text-neutral-700 hover:bg-neutral-200/70'
                        }`}
                      >
                        <span>{st.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            statusFilter === st.id && !searchQuery
                              ? 'bg-white/20 text-white'
                              : 'bg-neutral-200 text-neutral-600'
                          }`}
                        >
                          {st.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar for ID numbers && email address */}
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search all DB prescriptions (Rx ID, Patient ID, Email)..."
                    className="w-full h-10 pl-9 pr-8 rounded-full bg-neutral-50 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black border border-neutral-200 transition-all shadow-inner"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px] pointer-events-none">
                    search
                  </span>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black font-bold text-sm cursor-pointer"
                      title="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

              </div>

              {/* Table Header Counter & Search Banner */}
              {searchQuery.trim() ? (
                <div className="px-6 py-2.5 bg-amber-50/80 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-amber-600">manage_search</span>
                    <span>
                      Searching across <strong>all DB prescriptions</strong>: found <strong className="text-black">{filteredPrescriptions.length}</strong> matching &ldquo;{searchQuery}&rdquo;
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-black bg-amber-100/90 hover:bg-amber-200/90 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                  >
                    <span>Clear Search</span>
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ) : (
                <div className="px-6 py-2.5 bg-neutral-50/60 border-b border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    Showing <strong className="text-black">{filteredPrescriptions.length}</strong> prescriptions
                  </span>
                  <span className="text-[11px] font-medium text-neutral-400">
                    Active filter: <strong className="text-neutral-700 uppercase">{statusFilter}</strong>
                  </span>
                </div>
              )}

              {/* Table */}
              {loadingPrescriptions ? (
                <div className="p-16 text-center text-xs font-semibold text-neutral-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
                  Loading clinical queue from server...
                </div>
              ) : filteredPrescriptions.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <span className="material-symbols-outlined text-[42px] text-neutral-300">fact_check</span>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    {searchQuery
                      ? `No prescriptions found across the database matching "${searchQuery}".`
                      : `No prescriptions found under "${statusFilter}" status.`}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-100/80 text-neutral-700 font-extrabold uppercase tracking-wider border-b border-neutral-200">
                      <tr>
                        <th className="py-3.5 px-4">Rx ID</th>
                        <th className="py-3.5 px-4">Patient ID</th>
                        <th className="py-3.5 px-4">Patient Email</th>
                        <th className="py-3.5 px-4">Patient Name</th>
                        <th className="py-3.5 px-4">Prescriber / Clinic</th>
                        <th className="py-3.5 px-4">Category &amp; Regimen</th>
                        <th className="py-3.5 px-4">Verification Status</th>
                        <th className="py-3.5 px-4">Submission Date</th>
                        <th className="py-3.5 px-4">Approved / Rejected Date</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredPrescriptions.map((rx) => {
                        const isFinalized = rx.status === 'APPROVED' || rx.status === 'REJECTED';
                        return (
                          <tr key={rx.id} className="hover:bg-neutral-50/80 transition-colors">
                            <td className="py-4 px-4 font-black text-neutral-900 whitespace-nowrap">
                              #{rx.id}
                            </td>
                            <td className="py-4 px-4 font-mono font-bold text-neutral-700 whitespace-nowrap">
                              #{rx.customerId || '—'}
                            </td>
                            <td className="py-4 px-4 font-mono text-[11px] text-neutral-600 max-w-[180px] truncate" title={rx.customerEmail}>
                              {rx.customerEmail || '—'}
                            </td>
                            <td className="py-4 px-4 font-semibold text-neutral-900 whitespace-nowrap">
                              {rx.customerName || 'Patient'}
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-semibold text-neutral-800">{rx.doctorName || 'Not specified'}</div>
                              {rx.patientNotes && (
                                <div className="text-[10px] text-neutral-500 truncate max-w-[160px]" title={rx.patientNotes}>
                                  {rx.patientNotes}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              {rx.chronicSubscription ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                                  <span className="material-symbols-outlined text-[12px]">autorenew</span>
                                  <span>Chronic Refill</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                                  Acute Course
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                                  rx.status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : rx.status === 'REJECTED'
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                <span>{rx.status}</span>
                              </span>
                            </td>
                            <td className="py-4 px-4 text-neutral-600 text-[11px] whitespace-nowrap">
                              {formatDateTime(rx.createdAt)}
                            </td>
                            <td className="py-4 px-4 text-neutral-600 text-[11px] font-mono whitespace-nowrap">
                              {rx.verifiedAt ? (
                                <span className={rx.status === 'APPROVED' ? 'text-emerald-800 font-bold' : 'text-red-800 font-bold'}>
                                  {formatDateTime(rx.verifiedAt)}
                                </span>
                              ) : (
                                <span className="text-neutral-400 font-sans italic">Pending review</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenUnifiedModal(rx)}
                                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer ${
                                    isFinalized
                                      ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300'
                                      : 'bg-zinc-900 hover:bg-black text-white'
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[15px]">
                                    {isFinalized ? 'visibility' : 'rate_review'}
                                  </span>
                                  <span>{isFinalized ? 'View Details' : 'View & Review'}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={deletingId === rx.id}
                                  onClick={() => handleDeletePrescription(rx.id)}
                                  className="w-8 h-8 rounded-full hover:bg-red-50 text-neutral-400 hover:text-red-600 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                                  title="Delete Prescription Record"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 2: CONDITION & COLD-CHAIN TAGGING                   */}
        {/* ======================================================= */}
        {activeNavTab === 'condition_tagging' && (
          <div>
            {/* Top Title & Telemetry Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
                  Condition &amp; Cold-Chain Tagging
                </h1>
                <p className="text-xs text-neutral-500 mt-1">
                  Assign shelf sections, temperature envelopes, expiry days, risk intensity, security vaults &amp; delivery handling actions.
                </p>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={fetchTaggingData}
                title="Refresh condition tagging queue"
                className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-black text-white flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
              </button>
            </div>

            {/* Metrics Dashboard Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-xs">
                <div className="text-[10px] font-extrabold uppercase text-neutral-400">Total Items</div>
                <div className="text-xl font-black text-neutral-900 mt-0.5">{tagMetrics.totalItems}</div>
              </div>

              <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200 shadow-xs">
                <div className="text-[10px] font-extrabold uppercase text-amber-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>Awaiting Review</span>
                </div>
                <div className="text-xl font-black text-amber-950 mt-0.5">{tagMetrics.awaitingReviewCount}</div>
              </div>

              <div className="bg-purple-50/80 rounded-2xl p-4 border border-purple-200 shadow-xs">
                <div className="text-[10px] font-extrabold uppercase text-purple-800 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                  <span>Dual Review</span>
                </div>
                <div className="text-xl font-black text-purple-950 mt-0.5">{tagMetrics.pendingDualCount}</div>
              </div>

              <div className="bg-cyan-50/80 rounded-2xl p-4 border border-cyan-200 shadow-xs">
                <div className="text-[10px] font-extrabold uppercase text-cyan-800 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">ac_unit</span>
                  <span>Cold Chain</span>
                </div>
                <div className="text-xl font-black text-cyan-950 mt-0.5">{tagMetrics.coldChainCount}</div>
              </div>

              <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-200 shadow-xs">
                <div className="text-[10px] font-extrabold uppercase text-blue-800 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">security</span>
                  <span>Vault / Narc</span>
                </div>
                <div className="text-xl font-black text-blue-950 mt-0.5">{tagMetrics.vaultCount}</div>
              </div>

              <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200 shadow-xs">
                <div className="text-[10px] font-extrabold uppercase text-emerald-800 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">verified</span>
                  <span>Approved Live</span>
                </div>
                <div className="text-xl font-black text-emerald-950 mt-0.5">{tagMetrics.approvedCount}</div>
              </div>
            </div>

            {/* Sub-View Switcher: Tagging Queue Console vs 5-Section Shelf Arrangement View */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-2xl border border-neutral-200">
                <button
                  type="button"
                  onClick={() => setTaggingSubView('queue')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    taggingSubView === 'queue'
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'text-neutral-700 hover:bg-neutral-200/70'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">checklist</span>
                  <span>Batch &amp; Item Tagging Queue</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTaggingSubView('shelves')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    taggingSubView === 'shelves'
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'text-neutral-700 hover:bg-neutral-200/70'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">shelves</span>
                  <span>5-Section Shelf Arrangement</span>
                </button>
              </div>

              <div className="text-xs text-neutral-500">
                Showing <strong className="text-black font-bold">{filteredTaggedItems.length}</strong> catalog items
              </div>
            </div>

            {/* SUB-VIEW 1: BATCH & ITEM TAGGING QUEUE */}
            {taggingSubView === 'queue' && (
              <div className="space-y-6 mb-8">
                
                {/* Filters Bar */}
                <div className="bg-white rounded-3xl border border-neutral-200 p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Search by Product Name, SKU, Batch # */}
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={tagProductSearch}
                        onChange={(e) => setTagProductSearch(e.target.value)}
                        placeholder="Search product, generic name, SKU, batch lot #, shelf..."
                        className="w-full h-10 pl-9 pr-8 rounded-full bg-neutral-50 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black border border-neutral-200 transition-all shadow-inner"
                      />
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px] pointer-events-none">
                        search
                      </span>
                      {tagProductSearch && (
                        <button
                          type="button"
                          onClick={() => setTagProductSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black font-bold text-sm cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2">
                      
                      {/* Review Status Filter */}
                      <select
                        value={tagStatusFilter}
                        onChange={(e) => setTagStatusFilter(e.target.value)}
                        className="h-9 px-3 rounded-full bg-neutral-50 text-xs text-neutral-800 font-bold border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                      >
                        <option value="ALL">All Review Statuses</option>
                        <option value="AWAITING_REVIEW">Awaiting Tagging / Review</option>
                        <option value="PENDING_DUAL_REVIEW">Dual Review Required (Critical/Vault)</option>
                        <option value="APPROVED">Approved &amp; Live</option>
                        <option value="REJECTED">Rejected</option>
                      </select>

                      {/* Shelf Section Filter (5 Canonical Sections) */}
                      <select
                        value={tagSectionFilter}
                        onChange={(e) => setTagSectionFilter(e.target.value)}
                        className="h-9 px-3 rounded-full bg-neutral-50 text-xs text-neutral-800 font-bold border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                      >
                        <option value="ALL">All 5 Shelf Sections</option>
                        <option value="AMBIENT">Ambient Storage (15-25°C)</option>
                        <option value="COOL_ROOM">Cool Room (8-15°C)</option>
                        <option value="REFRIGERATED">Refrigerated Cold Chain (2-8°C)</option>
                        <option value="FROZEN">Deep Frozen (-25°C to -10°C)</option>
                        <option value="CONTROLLED_VAULT">Controlled / Secured Vault</option>
                      </select>

                      {/* Expiry Filter */}
                      <select
                        value={tagExpiryFilter}
                        onChange={(e) => setTagExpiryFilter(e.target.value)}
                        className="h-9 px-3 rounded-full bg-neutral-50 text-xs text-neutral-800 font-bold border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                      >
                        <option value="ALL">All Expiry Dates</option>
                        <option value="GOOD">Good Shelf Life (&gt; 60d)</option>
                        <option value="NEAR_EXPIRY">Near Expiry (≤ 60d)</option>
                        <option value="EXPIRED">Expired</option>
                      </select>

                    </div>

                  </div>
                </div>

                {/* Tagging Items Table */}
                <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
                  {loadingTagging ? (
                    <div className="p-16 text-center text-xs font-semibold text-neutral-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
                      Loading condition tagging queue...
                    </div>
                  ) : filteredTaggedItems.length === 0 ? (
                    <div className="p-16 text-center space-y-3">
                      <span className="material-symbols-outlined text-[42px] text-neutral-300">ac_unit</span>
                      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        No medicines match the selected condition tagging filters.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-100/80 text-neutral-700 font-extrabold uppercase tracking-wider border-b border-neutral-200">
                          <tr>
                            <th className="py-3 px-4">Medicine Item &amp; Batch</th>
                            <th className="py-3 px-4">Shelf Section &amp; Envelope</th>
                            <th className="py-3 px-4">Shelf-Life &amp; Expiry</th>
                            <th className="py-3 px-4">Intensity &amp; Security</th>
                            <th className="py-3 px-4">Delivery Handling Tags</th>
                            <th className="py-3 px-4">Tagging Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {filteredTaggedItems.map((item) => {
                            const isDual = item.status === 'PENDING_DUAL_REVIEW';
                            const isApproved = item.status === 'APPROVED' || item.status === 'LIVE';

                            return (
                              <tr key={item.medicineId} className="hover:bg-neutral-50/80 transition-colors">
                                
                                {/* Item & Batch */}
                                <td className="py-3.5 px-4 align-top">
                                  <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-200 flex items-center justify-center mt-0.5">
                                      {item.medicine?.imageUrl ? (
                                        <img src={item.medicine.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="material-symbols-outlined text-neutral-400 text-[18px]">medication</span>
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-extrabold text-neutral-900 leading-tight">
                                        {item.name}
                                      </div>
                                      <div className="text-[10px] text-neutral-500 truncate max-w-xs">
                                        {item.genericName || 'Pharmaceutical compound'}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                                          {item.sku}
                                        </span>
                                        <span className="font-mono text-[10px] text-neutral-500">
                                          Lot: <strong>{item.batchNumber}</strong>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Shelf Section & Temp Envelope */}
                                <td className="py-3.5 px-4 align-top">
                                  <div className="space-y-1">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                      item.section === 'REFRIGERATED'
                                        ? 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                                        : item.section === 'COOL_ROOM'
                                        ? 'bg-teal-100 text-teal-900 border border-teal-300'
                                        : item.section === 'FROZEN'
                                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                        : item.section === 'CONTROLLED_VAULT'
                                        ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    }`}>
                                      <span className="material-symbols-outlined text-[13px]">
                                        {item.section === 'CONTROLLED_VAULT' ? 'lock' : item.section === 'AMBIENT' ? 'shelves' : 'ac_unit'}
                                      </span>
                                      <span>{item.section.replace('_', ' ')}</span>
                                    </span>

                                    <div className="text-[11px] font-mono text-neutral-700 font-bold">
                                      {item.storageTempMin}°C to {item.storageTempMax}°C
                                    </div>
                                    <div className="text-[10px] text-neutral-400">
                                      {item.shelfLocation}
                                    </div>
                                  </div>
                                </td>

                                {/* Shelf-Life & Expiry */}
                                <td className="py-3.5 px-4 align-top">
                                  <div className="space-y-1">
                                    <div className="text-xs font-bold text-neutral-800">
                                      {item.shelfLifeDays} days shelf-life
                                    </div>
                                    <div className="text-[11px] text-neutral-600">
                                      Exp: <strong>{formatDateDDMMYYYY(item.expiryDate)}</strong>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] border ${item.shelfLifeStatus.badgeClass}`}>
                                      <span className={`w-1 h-1 rounded-full ${item.shelfLifeStatus.dotClass}`}></span>
                                      <span>{item.shelfLifeStatus.label}</span>
                                    </span>
                                  </div>
                                </td>

                                {/* Intensity & Security */}
                                <td className="py-3.5 px-4 align-top">
                                  <div className="space-y-1.5">
                                    {/* Intensity */}
                                    <div>
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                        item.intensity === 'CRITICAL'
                                          ? 'bg-rose-100 text-rose-900 border border-rose-300 animate-pulse'
                                          : item.intensity === 'HIGH'
                                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                          : item.intensity === 'MEDIUM'
                                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                          : 'bg-neutral-100 text-neutral-700'
                                      }`}>
                                        <span>Intensity: {item.intensity}</span>
                                      </span>
                                    </div>

                                    {/* Security */}
                                    <div className="text-[10px] font-mono font-semibold text-neutral-600">
                                      Sec: <span className="text-black">{item.securityLevel.replace('_', ' ')}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Delivery Handling Tags */}
                                <td className="py-3.5 px-4 align-top max-w-xs">
                                  <div className="flex flex-wrap gap-1">
                                    {item.actionsObj.insulatedBox && (
                                      <span className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 text-[9px] font-bold">
                                        Insulated Box
                                      </span>
                                    )}
                                    {item.actionsObj.icePack && (
                                      <span className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 text-[9px] font-bold">
                                        Ice Pack
                                      </span>
                                    )}
                                    {item.actionsObj.keepUpright && (
                                      <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 text-[9px] font-bold">
                                        Upright
                                      </span>
                                    )}
                                    {item.actionsObj.signatureRequired && (
                                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold">
                                        Signature Req.
                                      </span>
                                    )}
                                    {item.actionsObj.idAgeCheck && (
                                      <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 text-[9px] font-bold">
                                        ID Check
                                      </span>
                                    )}
                                    {item.actionsObj.noLeaveAtDoor && (
                                      <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 text-[9px] font-bold">
                                        Hand-to-Hand
                                      </span>
                                    )}
                                    {!item.deliveryActions && (
                                      <span className="text-[10px] text-neutral-400 italic">Standard ambient dispatch</span>
                                    )}
                                  </div>
                                </td>

                                {/* Tagging Status */}
                                <td className="py-3.5 px-4 align-top whitespace-nowrap">
                                  {isApproved ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                      <span>LIVE APPROVED</span>
                                    </span>
                                  ) : isDual ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-900 border border-purple-300 animate-pulse">
                                      <span className="material-symbols-outlined text-[13px]">lock</span>
                                      <span>DUAL REVIEW REQ</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                      <span>PENDING REVIEW</span>
                                    </span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    
                                    {/* Edit / Configure Tag */}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenTagEditor(item)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                                      title="Edit condition tags & parameters"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">tune</span>
                                      <span>Configure</span>
                                    </button>

                                    {/* Approve / Dual Confirm Action */}
                                    {isDual ? (
                                      <button
                                        type="button"
                                        onClick={() => handleDirectApprove(item)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
                                        title="Sign second-pharmacist dual review"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">lock_open</span>
                                        <span>Dual Sign</span>
                                      </button>
                                    ) : !isApproved ? (
                                      <button
                                        type="button"
                                        onClick={() => handleDirectApprove(item)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
                                        title="Approve condition tag and mark item LIVE"
                                      >
                                        <span className="material-symbols-outlined text-[14px]">check</span>
                                        <span>Approve</span>
                                      </button>
                                    ) : null}

                                  </div>
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* SUB-VIEW 2: 5-SECTION SHELF ARRANGEMENT VIEW */}
            {taggingSubView === 'shelves' && (
              <div className="space-y-6 mb-8">
                
                <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black uppercase tracking-tight text-neutral-900">
                        Physical Pharmacy Shelf Zones (5 Canonical Sections)
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Move items between climate envelopes with real-time temperature synchronization and audit trail logging.
                      </p>
                    </div>
                    <div className="text-xs font-mono font-bold text-neutral-600">
                      Active Shelving Envelopes: <strong>5 of 5</strong>
                    </div>
                  </div>
                </div>

                {/* 5 Canonical Section Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  {CANONICAL_SECTIONS.map((sec) => {
                    const itemsInSection = combinedTaggedItems.filter((i) => i.section === sec.key);

                    return (
                      <div
                        key={sec.key}
                        className="bg-white rounded-3xl border border-neutral-200 shadow-sm flex flex-col overflow-hidden"
                      >
                        {/* Section Card Header */}
                        <div className={`p-4 border-b border-neutral-200 bg-neutral-50`}>
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-neutral-900 text-white">
                              <span className="material-symbols-outlined text-[14px]">{sec.icon}</span>
                              <span>{sec.displayName}</span>
                            </span>
                            <span className="font-mono text-[11px] font-bold text-neutral-700 bg-white px-2 py-0.5 rounded border border-neutral-200">
                              {itemsInSection.length} items
                            </span>
                          </div>

                          <div className="text-xs font-mono font-extrabold text-neutral-900 mt-2">
                            {sec.tempRange}
                          </div>
                          <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                            {sec.description}
                          </p>
                          <div className="mt-2 text-[9px] font-mono text-neutral-400 border-t border-neutral-200/60 pt-1.5">
                            <strong>Pack:</strong> {sec.packaging}
                          </div>
                        </div>

                        {/* Items in Section */}
                        <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[600px] bg-neutral-50/30">
                          {itemsInSection.length === 0 ? (
                            <div className="p-8 text-center text-xs text-neutral-400 italic">
                              No items currently shelved in this section.
                            </div>
                          ) : (
                            itemsInSection.map((item) => (
                              <div
                                key={item.medicineId}
                                className="bg-white rounded-2xl p-3 border border-neutral-200/90 shadow-2xs space-y-2 hover:shadow-xs transition-shadow"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="font-bold text-neutral-900 text-xs leading-tight truncate" title={item.name}>
                                      {item.name}
                                    </div>
                                    <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                      {item.sku} • Stock: <strong>{item.stockQuantity}</strong>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenTagEditor(item)}
                                    className="w-6 h-6 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors shrink-0 cursor-pointer"
                                    title="Edit Tag"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">tune</span>
                                  </button>
                                </div>

                                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-600 pt-1 border-t border-neutral-100">
                                  <span>Exp: {formatDateDDMMYYYY(item.expiryDate)}</span>
                                  <span className={`font-bold ${item.status === 'APPROVED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {item.status}
                                  </span>
                                </div>

                                {/* Relocate / Move to Another Section Dropdown */}
                                <div className="pt-1">
                                  <select
                                    onChange={(e) => {
                                      if (e.target.value && e.target.value !== sec.key) {
                                        handleMoveSection(item.tagId, item.medicineId, e.target.value);
                                      }
                                    }}
                                    defaultValue=""
                                    className="w-full h-7 px-2 text-[10px] font-bold rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-700 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                                  >
                                    <option value="" disabled>Move to section...</option>
                                    {CANONICAL_SECTIONS.filter(s => s.key !== sec.key).map(target => (
                                      <option key={target.key} value={target.key}>
                                        Move to {target.displayName}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            )}

          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODAL 1: UNIFIED PRESCRIPTION VIEW & REVIEW MODAL         */}
      {/* ========================================================= */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[92vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                    Prescription #{selectedRx.id}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      selectedRx.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : selectedRx.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {selectedRx.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Patient ID: <strong className="text-black font-mono">#{selectedRx.customerId || '—'}</strong> • 
                  Patient: <strong className="text-black">{selectedRx.customerName}</strong> ({selectedRx.customerEmail})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRx(null)}
                className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto pr-1">
              {/* Document Preview */}
              <div className="lg:col-span-7 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-500">
                  <span>Prescription Document</span>
                  {selectedRx.fileUrl && !selectedRx.isFileDeleted && (
                    <a
                      href={selectedRx.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline inline-flex items-center gap-1 lowercase text-[11px] font-semibold"
                    >
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      <span>full view</span>
                    </a>
                  )}
                </div>

                <div className="flex-1 bg-neutral-100 rounded-2xl p-3 flex items-center justify-center min-h-[360px] border border-neutral-200/80 overflow-hidden">
                  {selectedRx.isFileDeleted || selectedRx.fileUrl === '[FILE_AUTO_DELETED_UPON_REJECTION]' ? (
                    <div className="text-center p-6 space-y-2">
                      <span className="material-symbols-outlined text-4xl text-neutral-400">delete_sweep</span>
                      <p className="text-xs font-bold text-neutral-600">Document File Purged</p>
                      <p className="text-[11px] text-neutral-400 max-w-xs">
                        Per clinical retention policy, the physical file was permanently shredded upon rejection.
                      </p>
                    </div>
                  ) : selectedRx.fileUrl ? (
                    selectedRx.contentType && selectedRx.contentType.includes('pdf') ? (
                      <iframe
                        src={selectedRx.fileUrl}
                        title="Prescription PDF"
                        className="w-full h-[420px] rounded-xl border border-neutral-300"
                      />
                    ) : (
                      <img
                        src={selectedRx.fileUrl}
                        alt="Prescription Document"
                        className="max-h-[420px] w-auto object-contain rounded-xl shadow-sm"
                      />
                    )
                  ) : (
                    <div className="text-center p-6 text-neutral-400 text-xs">
                      No document file attached to this record.
                    </div>
                  )}
                </div>
              </div>

              {/* Assessment / Review */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                    <span className="text-neutral-500 font-bold uppercase text-[10px]">Prescriber</span>
                    <span className="font-bold text-neutral-900">{selectedRx.doctorName || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                    <span className="text-neutral-500 font-bold uppercase text-[10px]">Course / Regimen</span>
                    <span className="font-semibold text-neutral-900">
                      {selectedRx.chronicSubscription ? 'Chronic Automated Refill' : 'Acute Course'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                    <span className="text-neutral-500 font-bold uppercase text-[10px]">Submitted Date</span>
                    <span className="font-mono text-neutral-700">{formatDateTime(selectedRx.createdAt)}</span>
                  </div>
                  {selectedRx.verifiedAt && (
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                      <span className="text-neutral-500 font-bold uppercase text-[10px]">Decision Date</span>
                      <span className="font-mono font-bold text-neutral-900">{formatDateTime(selectedRx.verifiedAt)}</span>
                    </div>
                  )}
                </div>

                {selectedRx.status !== 'PENDING' ? (
                  <div className="bg-neutral-100 rounded-2xl p-5 border border-neutral-200 space-y-4">
                    <div className="flex items-center gap-2 text-neutral-700">
                      <span className="material-symbols-outlined text-[20px] text-neutral-500">lock</span>
                      <h4 className="text-xs font-black uppercase tracking-wider">
                        Decision Finalized ({selectedRx.status})
                      </h4>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-neutral-200 text-xs space-y-1.5">
                      <p className="font-bold text-neutral-800">
                        Decision recorded on {formatDateTime(selectedRx.verifiedAt)}
                      </p>
                      {selectedRx.status === 'REJECTED' && selectedRx.rejectionReason && (
                        <p className="text-red-700 font-semibold text-[11px]">
                          Rejection Reason: <span className="font-bold">{selectedRx.rejectionReason}</span>
                        </p>
                      )}
                      {selectedRx.verificationNotes && (
                        <p className="text-neutral-600 text-[11px]">
                          Notes: {selectedRx.verificationNotes}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-neutral-200 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => handleDeletePrescription(selectedRx.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        <span>Delete Record</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRx(null)}
                        className="px-4 py-2 rounded-full border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-white cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleVerificationSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-neutral-800 mb-2">
                        Clinical Verification Decision
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setVerificationStatus('APPROVED')}
                          className={`py-2.5 px-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                            verificationStatus === 'APPROVED'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVerificationStatus('REJECTED')}
                          className={`py-2.5 px-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                            verificationStatus === 'REJECTED'
                              ? 'bg-red-600 text-white border-red-600 shadow-sm'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">cancel</span>
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>

                    {verificationStatus === 'APPROVED' ? (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                          Pharmacist Dispensing Instructions (Optional)
                        </label>
                        <textarea
                          rows={3}
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          placeholder="e.g. Validated with prescriber. Cleared for cold-chain dispensing."
                          className="w-full p-3 rounded-2xl bg-neutral-50 text-xs border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-black resize-none"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-800 mb-1.5">
                            Select Rejection Reason
                          </label>
                          <div className="space-y-1.5">
                            {REJECTION_TAGS.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => setRejectionReason(tag)}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between cursor-pointer ${
                                  rejectionReason === tag
                                    ? 'bg-red-50 text-red-900 border-red-400 font-bold shadow-2xs'
                                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                                }`}
                              >
                                <span>{tag}</span>
                                {rejectionReason === tag && (
                                  <span className="material-symbols-outlined text-[16px] text-red-600">check</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            Additional Notes (Optional)
                          </label>
                          <input
                            type="text"
                            value={verificationNotes}
                            onChange={(e) => setVerificationNotes(e.target.value)}
                            placeholder="e.g. Seal blurred in lower right margin"
                            className="w-full px-3 py-2 rounded-xl bg-neutral-50 text-xs border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-black"
                          />
                        </div>

                        <label className="flex items-center gap-2 p-2.5 bg-red-50/70 rounded-xl border border-red-100 text-[11px] text-red-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deleteFileImmediately}
                            onChange={(e) => setDeleteFileImmediately(e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-red-600"
                          />
                          <span>Purge/shred uploaded file immediately (Strict HIPAA/GDPR)</span>
                        </label>
                      </div>
                    )}

                    <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedRx(null)}
                        className="px-4 py-2 rounded-full border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:bg-neutral-50 cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={submittingVerification}
                        className={`px-5 py-2.5 rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-sm disabled:opacity-50 transition-all cursor-pointer ${
                          verificationStatus === 'APPROVED'
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {submittingVerification ? 'Recording Decision...' : verificationStatus === 'APPROVED' ? 'Confirm Approval' : 'Confirm Rejection'}
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ITEM CONDITION & COLD CHAIN TAG EDITOR MODAL      */}
      {/* ========================================================= */}
      {showTagModal && editingMedicine && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                  Condition &amp; Cold-Chain Tag Editor
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Target: <strong className="text-black">{editingMedicine.name}</strong> (SKU: {editingMedicine.sku})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTagModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={(e) => handleSaveTag(e, false)} className="space-y-5 overflow-y-auto pr-1">
              
              {/* 1. Shelf Section Selection (5 Canonical Sections) */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-neutral-800 mb-2">
                  1. Shelf Section (5 Canonical Envelopes)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CANONICAL_SECTIONS.map((sec) => (
                    <button
                      key={sec.key}
                      type="button"
                      onClick={() => handleSectionChange(sec.key)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        tagForm.section === sec.key
                          ? 'bg-zinc-900 text-white border-zinc-900 ring-2 ring-zinc-700 shadow-xs'
                          : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px] mt-0.5">{sec.icon}</span>
                      <div>
                        <div className="text-xs font-bold">{sec.displayName}</div>
                        <div className={`text-[10px] font-mono ${tagForm.section === sec.key ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {sec.tempRange}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Temperature Range & Shelf-Life (Days) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-600 mb-1">
                    Min Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tagForm.storageTempMin}
                    onChange={(e) => setTagForm({ ...tagForm, storageTempMin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-300 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-600 mb-1">
                    Max Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tagForm.storageTempMax}
                    onChange={(e) => setTagForm({ ...tagForm, storageTempMax: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-300 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-600 mb-1">
                    Shelf Life (Days)
                  </label>
                  <input
                    type="number"
                    value={tagForm.shelfLifeDays}
                    onChange={(e) => setTagForm({ ...tagForm, shelfLifeDays: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-neutral-300 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* 3. Intensity & Security Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-neutral-800 mb-1.5">
                    3. Medicine Intensity (Risk Class)
                  </label>
                  <select
                    value={tagForm.intensity}
                    onChange={(e) => setTagForm({ ...tagForm, intensity: e.target.value })}
                    className="w-full h-10 px-3 rounded-2xl bg-neutral-50 border border-neutral-300 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                  >
                    <option value="LOW">LOW — Standard OTC formulation</option>
                    <option value="MEDIUM">MEDIUM — Moderate risk prescription</option>
                    <option value="HIGH">HIGH — High potency prescription / biologic</option>
                    <option value="CRITICAL">CRITICAL — Cytotoxic / life-critical (Dual-Review)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-neutral-800 mb-1.5">
                    4. Security Level
                  </label>
                  <select
                    value={tagForm.securityLevel}
                    onChange={(e) => setTagForm({ ...tagForm, securityLevel: e.target.value })}
                    className="w-full h-10 px-3 rounded-2xl bg-neutral-50 border border-neutral-300 text-xs font-bold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                  >
                    <option value="STANDARD">STANDARD — Open dispensary shelf</option>
                    <option value="TAMPER_EVIDENT">TAMPER_EVIDENT — Serialized seal packaging</option>
                    <option value="LOCKED">LOCKED — Double locked cabinet / fridge</option>
                    <option value="CONTROLLED_SUBSTANCE">CONTROLLED_SUBSTANCE — Biometric Vault (Dual-Review)</option>
                  </select>
                </div>
              </div>

              {/* 5. Delivery Handling Actions (Checkboxes + Free Text) */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-neutral-800 mb-2">
                  5. Delivery Handling Actions &amp; Courier Directives
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                  {[
                    { key: 'insulatedBox', label: 'Insulated Box' },
                    { key: 'icePack', label: 'Ice Pack / Gel' },
                    { key: 'keepUpright', label: 'Keep Upright' },
                    { key: 'avoidSunlight', label: 'Avoid Sunlight' },
                    { key: 'signatureRequired', label: 'Signature Req.' },
                    { key: 'idAgeCheck', label: 'ID / Age Check' },
                    { key: 'noLeaveAtDoor', label: 'Hand-to-Hand' },
                  ].map((act) => (
                    <label key={act.key} className="flex items-center gap-2 text-xs font-semibold text-neutral-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(tagForm.deliveryActions[act.key])}
                        onChange={(e) =>
                          setTagForm({
                            ...tagForm,
                            deliveryActions: {
                              ...tagForm.deliveryActions,
                              [act.key]: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 rounded accent-cyan-600"
                      />
                      <span>{act.label}</span>
                    </label>
                  ))}

                  <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-500">Max Transit:</span>
                    <input
                      type="number"
                      value={tagForm.deliveryActions.maxTransitHours}
                      onChange={(e) =>
                        setTagForm({
                          ...tagForm,
                          deliveryActions: {
                            ...tagForm.deliveryActions,
                            maxTransitHours: e.target.value,
                          },
                        })
                      }
                      className="w-12 h-7 px-1.5 text-center text-xs font-mono font-bold bg-white border border-neutral-300 rounded-md"
                    />
                    <span className="text-[10px] text-neutral-500">hrs</span>
                  </div>
                </div>

                <div className="mt-2.5">
                  <input
                    type="text"
                    value={tagForm.deliveryActions.customNotes}
                    onChange={(e) =>
                      setTagForm({
                        ...tagForm,
                        deliveryActions: {
                          ...tagForm.deliveryActions,
                          customNotes: e.target.value,
                        },
                      })
                    }
                    placeholder="Custom courier instructions (e.g. Do not expose to heat above 25°C)..."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 text-xs border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowTagModal(false)}
                  className="px-4 py-2 rounded-full border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={savingTag}
                    className="px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Save Tag Draft
                  </button>

                  <button
                    type="button"
                    disabled={savingTag}
                    onClick={(e) => handleSaveTag(e, true)}
                    className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>Save &amp; Approve LIVE</span>
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DUAL-CONFIRMATION DIALOG (Critical / Controlled) */}
      {/* ========================================================= */}
      {showDualModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-purple-200 space-y-5">
            
            <div className="flex items-center gap-3 text-purple-900 pb-3 border-b border-purple-100">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-purple-700 text-[22px]">lock_person</span>
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-neutral-900">
                  Dual-Review Authorization
                </h3>
                <p className="text-xs text-neutral-500">
                  Critical Potency / Controlled Vault Mandate
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-700 leading-relaxed bg-purple-50/70 p-3 rounded-2xl border border-purple-100">
              Target: <strong className="text-neutral-900">{dualTargetMedicine?.name || 'Selected Item'}</strong> requires mandatory secondary pharmacist verification before being made <strong>LIVE</strong> for catalog fulfillment and delivery.
            </p>

            <form onSubmit={handleDualConfirmSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-extrabold uppercase text-[10px] text-neutral-600 mb-1">
                  Secondary Reviewer Pharmacist Name / Reg #
                </label>
                <input
                  type="text"
                  required
                  value={dualSecondReviewer}
                  onChange={(e) => setDualSecondReviewer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-300 font-bold focus:outline-none focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block font-extrabold uppercase text-[10px] text-neutral-600 mb-1">
                  Authorization Note &amp; Clinical Reason
                </label>
                <textarea
                  rows={2}
                  required
                  value={dualNotes}
                  onChange={(e) => setDualNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-50 border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-purple-600 resize-none"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDualModal(false)}
                  className="px-4 py-2 rounded-full border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingDual}
                  className="px-5 py-2 rounded-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span>{submittingDual ? 'Recording Signature...' : 'Dual Confirm & Approve'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default PharmacistPrescriptionDashboard;
