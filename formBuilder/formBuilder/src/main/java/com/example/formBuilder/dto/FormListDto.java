package com.example.formBuilder.dto;

import com.example.formBuilder.enums.FormStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FormListDto {
    private Long id;
    private String formName;
    private FormStatus status;

//    public FormListDto(Long id, String formName) {
//        this.id = id;
//        this.formName = formName;
//        this
//    }
}
