package com.example.formBuilder.repository;

import com.example.formBuilder.entity.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ModuleRepository extends JpaRepository<Module, UUID> {
    List<Module> findByActive(boolean active);
    Optional<Module> findByModuleName(String moduleName);
}
