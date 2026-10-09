package com.mediorder.system_build_functions.dto;

import com.mediorder.system_build_functions.validation.ValidPhone;

import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.UserStatus;

public class AdminUserUpdateRequest {

    private String fullName;
    private String email;
    private String password;
    private Role role;
    private UserStatus status;
    @ValidPhone
    private String phoneNumber;
    private String avatarUrl;

    public AdminUserUpdateRequest() {}

    public AdminUserUpdateRequest(String fullName, String email, String password, Role role, UserStatus status, String phoneNumber, String avatarUrl) {
        this.fullName = fullName;
        this.email = email;
        this.password = password;
        this.role = role;
        this.status = status;
        this.phoneNumber = phoneNumber;
        this.avatarUrl = avatarUrl;
    }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public UserStatus getStatus() { return status; }
    public void setStatus(UserStatus status) { this.status = status; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
}
