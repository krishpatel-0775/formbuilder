package com.example.formBuilder.dto;

import com.example.formBuilder.enums.FormStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FormListDto {
    private UUID id;
    private String formName;
    private String code;
    private FormStatus status;

}
