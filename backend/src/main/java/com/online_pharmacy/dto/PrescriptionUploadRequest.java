package com.mediorder.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PrescriptionUploadRequest {

    private String doctorName;

    private Long customerId;
}