package com.example.formBuilder.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "modules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Module {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    @Column(name = "parent_module_id")
    private Long parentId;

    @Column(name = "sub_parent_module_id")
    private Long subParentId;

    @Column(name = "menu_icon_css")
    private String iconCss;

    @Builder.Default
    private boolean active = true;
}
