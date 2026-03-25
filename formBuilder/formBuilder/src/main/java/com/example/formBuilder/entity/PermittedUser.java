package com.example.formBuilder.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Represents a user (by identifier string) who is permitted to access a restricted form.
 * Referenced by FormService.updateVisibility — pending Form entity visibility columns.
 */
@Entity
@Table(name = "permitted_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PermittedUser {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "identifier")
    private String identifier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id")
    private Form form;
}
