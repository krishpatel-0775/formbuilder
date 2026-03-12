package com.example.formBuilder.repository;

import com.example.formBuilder.entity.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ModuleRepository extends JpaRepository<Module, Long> {
    List<Module> findByActive(boolean active);
    java.util.Optional<Module> findByModuleName(String moduleName);
}
