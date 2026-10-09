package com.mediorder.system_build_functions.dto;

import com.mediorder.system_build_functions.validation.ValidPhone;

public class ProfileUpdateRequest {
    private String fullName;
    @ValidPhone
    private String contactNumber;
    private String avatarUrl;

    public ProfileUpdateRequest() {}

    public ProfileUpdateRequest(String fullName, String contactNumber, String avatarUrl) {
        this.fullName = fullName;
        this.contactNumber = contactNumber;
        this.avatarUrl = avatarUrl;
    }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
