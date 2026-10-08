package com.mediorder.it25101923_prescription_management;

import com.mediorder.it25101923_prescription_management.model.*;
import com.mediorder.it25101923_prescription_management.repository.*;
import com.mediorder.it25101923_prescription_management.service.PrescriptionCleanupService;
import com.mediorder.system_build_functions.model.*;
import com.mediorder.system_build_functions.repository.*;
import com.mediorder.system_build_functions.config.JwtTokenProvider;
import com.mediorder.it25103946_order_processing_and_workflow.model.*;
import com.mediorder.it25103946_order_processing_and_workflow.repository.OrderRepository;
import com.mediorder.it25100979_delivery_management.config.DeliveryZoneDataInitializer;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.*;
import java.util.*;
import java.util.concurrent.*;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT,properties={
    "spring.datasource.url=jdbc:h2:mem:rxworkflow;MODE=MySQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect","spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.show-sql=false","spring.sql.init.mode=never","app.upload.dir=target/test-prescription-files",
    "spring.servlet.multipart.max-file-size=10MB","spring.servlet.multipart.max-request-size=11MB",
    "app.upload.auto-delete-rejected-files=false"
})
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class PrescriptionWorkflowIntegrationTest {
    @MockBean DeliveryZoneDataInitializer initializer;
    @Autowired TestRestTemplate http;
    @Autowired UserRepository users;
    @Autowired PrescriptionRepository prescriptions;
    @Autowired PrescriptionAuditRepository audits;
    @Autowired PrescriptionUsageRepository usages;
    @Autowired PrescriptionFingerprintRepository fingerprints;
    @Autowired NotificationRepository notifications;
    @Autowired OrderRepository orders;
    @Autowired JwtTokenProvider tokens;
    @Autowired PasswordEncoder encoder;
    @Autowired PrescriptionCleanupService cleanup;
    private User customer,other,pharmacist,finance;
    private static final String API="/api/v1/prescriptions";

    @BeforeEach void setup() {
        usages.deleteAll();fingerprints.deleteAll();audits.deleteAll();notifications.deleteAll();orders.deleteAll();prescriptions.deleteAll();users.deleteAll();
        customer=user("Customer",Role.CUSTOMER);other=user("Other",Role.CUSTOMER);
        pharmacist=user("Pharmacist",Role.PHARMACIST);finance=user("Finance",Role.FINANCE_MANAGER);
    }
    private User user(String name,Role role){return users.save(User.builder().email(name.toLowerCase()+"@example.com").fullName(name).role(role).passwordHash(encoder.encode("Password123!")).phoneNumber("0771234567").build());}
    private HttpHeaders headers(User user){HttpHeaders h=new HttpHeaders();if(user!=null)h.setBearerAuth(tokens.generateTokenFromUsername(user.getEmail()));return h;}
    private ResponseEntity<Map> send(HttpMethod method,String path,Object body,User actor){return http.exchange(path,method,new HttpEntity<>(body,headers(actor)),Map.class);}
    private MultiValueMap<String,Object> form(String text,boolean chronic){
        MultiValueMap<String,Object> f=new LinkedMultiValueMap<>();
        if(text!=null)f.add("file",new ByteArrayResource(("%PDF-1.4\n"+text+"\n%%EOF").getBytes()){public String getFilename(){return "prescription.pdf";}});
        f.add("doctorName","Dr. Perera");f.add("patientNotes","Please review.");f.add("chronicSubscription",String.valueOf(chronic));return f;
    }
    private ResponseEntity<Map> multipart(HttpMethod method,String path,MultiValueMap<String,Object> body,User actor){HttpHeaders h=headers(actor);h.setContentType(MediaType.MULTIPART_FORM_DATA);return http.exchange(path,method,new HttpEntity<>(body,h),Map.class);}
    private Long upload(String text,boolean chronic){var res=multipart(HttpMethod.POST,API+"/upload",form(text,chronic),customer);assertEquals(200,res.getStatusCode().value(),res.toString());return ((Number)res.getBody().get("id")).longValue();}
    private void review(Long id,String status,Map<String,Object> extra){Map<String,Object> body=new HashMap<>(extra);body.put("status",status);var res=send(HttpMethod.PUT,API+"/"+id+"/verify",body,pharmacist);assertEquals(200,res.getStatusCode().value(),res.toString());}
    private ResponseEntity<byte[]> file(Long id,User actor){return http.exchange(API+"/"+id+"/file",HttpMethod.GET,new HttpEntity<>(headers(actor)),byte[].class);}
    private com.mediorder.it25103946_order_processing_and_workflow.model.Order order(User owner){return orders.saveAndFlush(com.mediorder.it25103946_order_processing_and_workflow.model.Order.builder().customer(owner).shippingAddress("Colombo").orderStatus(OrderStatus.PLACED).build());}

    @Test @org.junit.jupiter.api.Order(1) void customerCrudPreservesAuditAndDocumentAccessRules(){
        Long id=upload("CRUD",false);assertEquals(200,send(HttpMethod.GET,API+"/"+id,null,customer).getStatusCode().value());assertEquals(200,file(id,customer).getStatusCode().value());
        var edit=form("replaced",false);edit.set("doctorName","Dr. Silva");assertEquals(200,multipart(HttpMethod.PUT,API+"/"+id,edit,customer).getStatusCode().value());
        assertEquals("Dr. Silva",prescriptions.findById(id).orElseThrow().getDoctorName());
        assertEquals(204,http.exchange(API+"/"+id,HttpMethod.DELETE,new HttpEntity<>(headers(customer)),Void.class).getStatusCode().value());
        assertTrue(prescriptions.findById(id).orElseThrow().getArchived());assertEquals(PrescriptionStatus.CANCELLED,prescriptions.findById(id).orElseThrow().getStatus());
        assertEquals(410,file(id,customer).getStatusCode().value());assertEquals(3,audits.findByPrescriptionIdOrderByCreatedAtAscIdAsc(id).size());
        var all=http.exchange(API,HttpMethod.GET,new HttpEntity<>(headers(customer)),List.class);assertTrue(all.getBody().isEmpty());
    }
    @Test @org.junit.jupiter.api.Order(2) void clarificationRequiresExplanationAndCustomerCanRespond(){
        Long id=upload("clarification",false);
        assertEquals(400,send(HttpMethod.PUT,API+"/"+id+"/verify",Map.of("status","CLARIFICATION_REQUIRED"),pharmacist).getStatusCode().value());
        review(id,"CLARIFICATION_REQUIRED",Map.of("verificationNotes","Please upload a clearer signature."));
        assertEquals(200,multipart(HttpMethod.PUT,API+"/"+id,form("clearer version",false),customer).getStatusCode().value());
        assertEquals(PrescriptionStatus.PENDING,prescriptions.findById(id).orElseThrow().getStatus());
        review(id,"APPROVED",Map.of());assertEquals(409,multipart(HttpMethod.PUT,API+"/"+id,form(null,false),customer).getStatusCode().value());
        assertEquals(409,send(HttpMethod.PUT,API+"/"+id+"/verify",Map.of("status","REJECTED","rejectionCode","OTHER","rejectionReason","Invalid"),pharmacist).getStatusCode().value());
        assertEquals(2,notifications.count());
    }
    @Test @org.junit.jupiter.api.Order(3) void rejectionCodesAndNotesAreValidated(){
        Long id=upload("reject",false);
        for(String code:List.of("NOT_A_CODE","OTHER")) assertEquals(400,send(HttpMethod.PUT,API+"/"+id+"/verify",Map.of("status","REJECTED","rejectionCode",code),pharmacist).getStatusCode().value());
        review(id,"REJECTED",Map.of("rejectionCode","MISSING_SIGNATURE"));
        var p=prescriptions.findById(id).orElseThrow();assertEquals("MISSING_SIGNATURE",p.getRejectionCode());assertFalse(p.getRejectionReason().isBlank());
    }
    @Test @org.junit.jupiter.api.Order(4) void customerOwnershipClinicalAuthorizationAndAnonymousAccessAreEnforced(){
        Long id=upload("private",false);var p=prescriptions.findById(id).orElseThrow();
        assertEquals(403,file(id,other).getStatusCode().value());assertEquals(403,file(id,finance).getStatusCode().value());
        assertEquals(200,file(id,pharmacist).getStatusCode().value());
        assertEquals(403,http.exchange(API+"/files/"+p.getStoredFileName(),HttpMethod.GET,new HttpEntity<>(headers(other)),byte[].class).getStatusCode().value());
        assertTrue(Set.of(401,403).contains(file(id,null).getStatusCode().value()));
        assertEquals(403,send(HttpMethod.PUT,API+"/"+id+"/verify",Map.of("status","APPROVED"),customer).getStatusCode().value());
        assertEquals(403,send(HttpMethod.POST,API+"/cleanup",Map.of(),finance).getStatusCode().value());
        assertEquals(403,send(HttpMethod.GET,API+"/"+id+"/audit",null,other).getStatusCode().value());
    }
    @Test @org.junit.jupiter.api.Order(5) void duplicateDocumentsAndRenamedFilesAreBlocked(){
        upload("same document",false);
        assertEquals(409,multipart(HttpMethod.POST,API+"/upload",form("same document",false),customer).getStatusCode().value());
        var f=form(null,false);f.add("file",new ByteArrayResource("<html>not a document</html>".getBytes()){public String getFilename(){return "fake.pdf";}});
        assertEquals(400,multipart(HttpMethod.POST,API+"/upload",f,customer).getStatusCode().value());
        f.set("file",new ByteArrayResource(new byte[0]){public String getFilename(){return "empty.pdf";}});
        assertEquals(400,multipart(HttpMethod.POST,API+"/upload",f,customer).getStatusCode().value());
    }
    @Test @org.junit.jupiter.api.Order(6) void standardUsageIsLimitedAndRequiresMatchingOrder(){
        Long id=upload("single use",false);review(id,"APPROVED",Map.of());
        var bad=order(other);assertEquals(403,send(HttpMethod.POST,API+"/"+id+"/usage",Map.of("orderId",bad.getId()),pharmacist).getStatusCode().value());
        var good=order(customer);assertEquals(200,send(HttpMethod.POST,API+"/"+id+"/usage",Map.of("orderId",good.getId()),pharmacist).getStatusCode().value());
        var another=order(customer);assertEquals(409,send(HttpMethod.POST,API+"/"+id+"/usage",Map.of("orderId",another.getId()),pharmacist).getStatusCode().value());
        assertEquals(1,prescriptions.findById(id).orElseThrow().getUsedCount());assertEquals(1,usages.count());
        assertEquals(id,orders.findById(good.getId()).orElseThrow().getPrescriptionId());
    }
    @Test @org.junit.jupiter.api.Order(7) void concurrentRequestsCannotUseSinglePrescriptionTwice() throws Exception {
        Long id=upload("race",false);review(id,"APPROVED",Map.of());var first=order(customer);var second=order(customer);
        CountDownLatch start=new CountDownLatch(1);ExecutorService pool=Executors.newFixedThreadPool(2);
        try {
            List<Future<Integer>> results=new ArrayList<>();
            for(Long oid:List.of(first.getId(),second.getId()))results.add(pool.submit(()->{start.await();return send(HttpMethod.POST,API+"/"+id+"/usage",Map.of("orderId",oid),pharmacist).getStatusCode().value();}));
            start.countDown();List<Integer> codes=List.of(results.get(0).get(20,TimeUnit.SECONDS),results.get(1).get(20,TimeUnit.SECONDS));
            assertTrue(codes.contains(200));assertTrue(codes.contains(409));assertEquals(1,usages.count());
        }finally{pool.shutdownNow();}
    }
    @Test @org.junit.jupiter.api.Order(8) void chronicUsageNeedsExplicitLimitAndCannotUseSameOrderTwice(){
        Long id=upload("chronic",true);review(id,"APPROVED",Map.of("maxUses",2));var first=order(customer);var second=order(customer);
        assertEquals(200,send(HttpMethod.POST,API+"/"+id+"/usage",Map.of("orderId",first.getId()),pharmacist).getStatusCode().value());
        assertEquals(409,send(HttpMethod.POST,API+"/"+id+"/usage",Map.of("orderId",first.getId()),pharmacist).getStatusCode().value());
        assertEquals(200,send(HttpMethod.POST,API+"/"+id+"/usage",Map.of("orderId",second.getId()),pharmacist).getStatusCode().value());
        assertEquals(2,prescriptions.findById(id).orElseThrow().getUsedCount());
    }
    @Test @org.junit.jupiter.api.Order(9) void orderCreationReservesPrescriptionAndRollsBackOnFailure(){
        Long id=upload("order link",false);review(id,"APPROVED",Map.of());
        Map<String,Object> body=Map.of("shippingAddress","Colombo","prescriptionId",id,"totalAmount",100);
        assertEquals(200,send(HttpMethod.POST,"/api/v1/orders",body,customer).getStatusCode().value());
        assertEquals(409,send(HttpMethod.POST,"/api/v1/orders",body,customer).getStatusCode().value());assertEquals(1,orders.count());assertEquals(1,usages.count());
    }
    @Test @org.junit.jupiter.api.Order(10) void unauthorizedStaffRegistrationIsBlocked(){
        Map<String,Object> body=Map.of("email","newstaff@example.com","fullName","New Staff","password","Password123!","contactNumber","0771234567","role","PHARMACIST");
        assertEquals(400,send(HttpMethod.POST,"/api/v1/auth/register",body,null).getStatusCode().value());assertFalse(users.existsByEmail("newstaff@example.com"));
    }
    @Test @org.junit.jupiter.api.Order(11) void filtersApplyAlongsideSearchAndStaleEditsFail(){
        Long pending=upload("pending",false), approved=upload("approved",false);review(approved,"APPROVED",Map.of());
        var list=http.exchange(API+"?status=PENDING&search=Dr.",HttpMethod.GET,new HttpEntity<>(headers(pharmacist)),List.class);
        assertEquals(1,list.getBody().size());assertEquals(pending,((Number)((Map)list.getBody().get(0)).get("id")).longValue());
        var f=form(null,false);f.add("version","999");assertEquals(409,multipart(HttpMethod.PUT,API+"/"+pending,f,customer).getStatusCode().value());
    }
    @Test @org.junit.jupiter.api.Order(12) void retentionCleanupPurgesRejectedStandardFilesButPreservesChronic(){
        Long standard=upload("old standard",false),chronic=upload("old chronic",true);
        for(Long id:List.of(standard,chronic)){review(id,"REJECTED",Map.of("rejectionCode","EXPIRED_PRESCRIPTION"));var p=prescriptions.findById(id).orElseThrow();p.setVerifiedAt(LocalDateTime.now().minusDays(9));prescriptions.saveAndFlush(p);}
        var result=cleanup.runCleanupManually();assertEquals(1,result.get("purgedRejectedFiles"));assertTrue(prescriptions.findById(standard).orElseThrow().getIsFileDeleted());assertFalse(prescriptions.findById(chronic).orElseThrow().getIsFileDeleted());
        assertEquals(410,file(standard,customer).getStatusCode().value());assertEquals(200,file(chronic,customer).getStatusCode().value());
    }
    @Test @org.junit.jupiter.api.Order(13) void immediatePurgeRunsAfterCommittedRejectionAndIsAudited(){
        Long id=upload("immediate purge",false);
        review(id,"REJECTED",Map.of("rejectionCode","EXPIRED_PRESCRIPTION","deleteFileImmediately",true));
        assertEquals(410,file(id,customer).getStatusCode().value());
        assertTrue(audits.findByPrescriptionIdOrderByCreatedAtAscIdAsc(id).stream().anyMatch(a->a.getAction().equals("DOCUMENT_PURGED")));
    }

}
