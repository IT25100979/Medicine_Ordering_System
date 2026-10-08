package com.mediorder.it25101923_prescription_management.service;

import com.mediorder.it25101923_prescription_management.model.PrescriptionAudit;
import com.mediorder.it25101923_prescription_management.repository.PrescriptionRepository;
import com.mediorder.it25101923_prescription_management.repository.PrescriptionAuditRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

/** Runs after the review has committed, so a rejected transaction cannot erase its document. */
@Service
public class PrescriptionDocumentPurgeService {
    private final PrescriptionRepository prescriptions;
    private final PrescriptionAuditRepository audits;
    private final FileStorageService storage;
    public PrescriptionDocumentPurgeService(PrescriptionRepository prescriptions,PrescriptionAuditRepository audits,FileStorageService storage) {
        this.prescriptions=prescriptions;this.audits=audits;this.storage=storage;
    }
    @Transactional(propagation=Propagation.REQUIRES_NEW)
    public boolean purge(Long id,Long actorId,String actorName) {
        var p=prescriptions.findForUpdate(id).orElseThrow();
        if(Boolean.TRUE.equals(p.getChronicSubscription()) || Boolean.TRUE.equals(p.getIsFileDeleted()) || p.getStoredFileName()==null) return false;
        if(!storage.deleteFile(p.getStoredFileName()) && storage.fileExists(p.getStoredFileName())) return false;
        p.setIsFileDeleted(true);p.setFileUrl("[FILE_AUTO_DELETED_PER_RETENTION_POLICY]");prescriptions.saveAndFlush(p);
        audits.save(new PrescriptionAudit(id,actorId,actorName,"DOCUMENT_PURGED",p.getStatus().name(),p.getStatus().name(),"Physical document removed; review history preserved."));
        return true;
    }
}
