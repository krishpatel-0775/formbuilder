package com.example.formBuilder.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "role_modules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleModule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "role_id", nullable = false)
    private UUID roleId;

    @Column(name = "module_id", nullable = false)
    private UUID moduleId;
}
