package com.example.formBuilder.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "modules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Module {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "module_name", nullable = false)
    private String moduleName;

    @Column(name = "module_des")
    private String moduleDescription;

    private String prefix;
    private String plugin;
    private String controller;
    private String action;

    @Column(name = "is_parent")
    @JsonProperty("isParent")
    private boolean isParent;

    @Column(name = "is_sub_parent")
    @JsonProperty("isSubParent")
    private boolean isSubParent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_module_id")
    private Module parentModule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sub_parent_module_id")
    private Module subParentModule;

    @Column(name = "menu_icon_css")
    private String iconCss;

    @Builder.Default
    private boolean active = true;
}
