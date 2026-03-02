package com.example.formBuilder.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class FormListDto {
    private Long id;
    private String formName;

    public FormListDto(Long id, String formName) {
        this.id = id;
        this.formName = formName;
    }
}
