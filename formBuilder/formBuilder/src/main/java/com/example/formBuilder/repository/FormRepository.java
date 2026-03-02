package com.example.formBuilder.repository;


import com.example.formBuilder.entity.Form;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FormRepository extends JpaRepository<Form, Long> {
}
