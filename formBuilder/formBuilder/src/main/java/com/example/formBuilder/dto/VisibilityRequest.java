package com.example.formBuilder.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class VisibilityRequest {
    private String visibilityType;
    private List<String> permittedUsers;
}
