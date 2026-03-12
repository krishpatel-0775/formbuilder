package com.example.formBuilder.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "role_modules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleModule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "role_id", nullable = false)
    private Long roleId;

    @Column(name = "module_id", nullable = false)
    private Long moduleId;
}
