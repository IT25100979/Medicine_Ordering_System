package com.mediorder.system_build_functions.dto;

import jakarta.validation.constraints.NotBlank;

public class DemoLoginRequest {

    @NotBlank(message = "Role is required for demo login")
    private String role;

    public DemoLoginRequest() {}

    public DemoLoginRequest(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
