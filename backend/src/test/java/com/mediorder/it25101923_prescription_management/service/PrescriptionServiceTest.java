package com.mediorder.it25101923_prescription_management.service;
import com.mediorder.it25101923_prescription_management.model.*;
import com.mediorder.it25101923_prescription_management.dto.PrescriptionVerificationRequest;
import com.mediorder.it25101923_prescription_management.strategy.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import java.nio.file.Path;
import java.nio.file.Files;
import static org.junit.jupiter.api.Assertions.*;

class PrescriptionServiceTest {
    @TempDir Path directory;
    private FileStorageService storage(){FileStorageService s=new FileStorageService();ReflectionTestUtils.setField(s,"uploadDir",directory.toString());s.init();return s;}
    @Test void storesRealPdfAndDetectsTrustedMimeInsteadOfClientClaim() throws Exception {
        var s=storage();var f=new MockMultipartFile("file","document.pdf","text/html","%PDF-1.4\nvalid\n%%EOF".getBytes());
        String name=s.storeFile(f);assertTrue(s.fileExists(name));assertEquals("application/pdf",s.detectContentType(f));assertTrue(s.loadFileAsResource(name).exists());assertTrue(s.deleteFile(name));assertFalse(s.fileExists(name));
    }
    @Test void renamedHtmlAndTraversalNamesAreRejected(){
        var s=storage();assertThrows(IllegalArgumentException.class,()->s.storeFile(new MockMultipartFile("file","fake.pdf","application/pdf","<html>fake</html>".getBytes())));
        assertThrows(IllegalArgumentException.class,()->s.storeFile(new MockMultipartFile("file","../rx.pdf","application/pdf","%PDF-1.4".getBytes())));
        assertThrows(SecurityException.class,()->s.loadFileAsResource("../outside.pdf"));
    }
    @Test void oversizedAndEmptyFilesAreRejected(){var s=storage();assertThrows(IllegalArgumentException.class,()->s.storeFile(new MockMultipartFile("file","large.pdf","application/pdf",new byte[10*1024*1024+1])));assertThrows(IllegalArgumentException.class,()->s.storeFile(new MockMultipartFile("file","empty.pdf","application/pdf",new byte[0])));}
    @Test void imageSignatureMustMatchExtension(){var s=storage();byte[] png=new byte[]{(byte)137,80,78,71,13,10,26,10,0,0,0,0};assertDoesNotThrow(()->s.storeFile(new MockMultipartFile("file","image.png","image/png",png)));assertThrows(IllegalArgumentException.class,()->s.storeFile(new MockMultipartFile("file","image.jpg","image/jpeg",png)));}
    @Test void chronicStrategyAlwaysPreservesRejectedDocuments(){var p=Prescription.builder().chronicSubscription(true).build();var s=new ChronicPrescriptionRetentionStrategy();var r=new PrescriptionVerificationRequest();r.setDeleteFileImmediately(true);assertTrue(s.supports(p));assertFalse(s.shouldDeleteRejectedFile(r,true));assertFalse(new StandardPrescriptionRetentionStrategy().supports(p));}
    @Test void standardStrategyHonorsExplicitDeletionOrConfiguration(){var p=Prescription.builder().chronicSubscription(false).build();var s=new StandardPrescriptionRetentionStrategy();var r=new PrescriptionVerificationRequest();assertTrue(s.supports(p));assertFalse(s.shouldDeleteRejectedFile(r,false));assertTrue(s.shouldDeleteRejectedFile(r,true));r.setDeleteFileImmediately(true);assertTrue(s.shouldDeleteRejectedFile(r,false));}
}
