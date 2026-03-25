package com.example.formBuilder.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserDetailResponse {
    private UUID id;
    private String username;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String profilePictureUrl;
    private List<String> permissions; // Flat list of prefixes/module names
    private List<String> roles; // List of assigned role names
    private List<Map<String, Object>> menu; // Hierarchical menu
}
