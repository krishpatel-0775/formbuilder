package com.example.formBuilder.repository;


import com.example.formBuilder.entity.FormField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FormFieldRepository extends JpaRepository<FormField, Long> {

    List<FormField> findByFormId(Long formId);
}
