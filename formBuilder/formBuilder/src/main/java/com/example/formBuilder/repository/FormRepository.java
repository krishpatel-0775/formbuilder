package com.example.formBuilder.repository;


import com.example.formBuilder.entity.Form;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FormRepository extends JpaRepository<Form, Long> {
    List<Form> findByAdminId(Long adminId);
    Optional<Form> findByIdAndAdminId(Long id, Long adminId);
}
