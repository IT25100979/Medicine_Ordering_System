package com.mediorder.it25102867_batchandstock_management.dto;

public class ReorderPORequest {
    private Integer quantity;
    private String supplierNotes;
    private Long coordinatorId;

    public ReorderPORequest() {}

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getSupplierNotes() { return supplierNotes; }
    public void setSupplierNotes(String supplierNotes) { this.supplierNotes = supplierNotes; }

    public Long getCoordinatorId() { return coordinatorId; }
    public void setCoordinatorId(Long coordinatorId) { this.coordinatorId = coordinatorId; }
}
