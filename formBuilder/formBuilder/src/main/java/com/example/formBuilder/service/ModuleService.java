package com.example.formBuilder.service;

import com.example.formBuilder.entity.*;
import com.example.formBuilder.entity.Module;
import com.example.formBuilder.repository.*;
import com.example.formBuilder.security.SessionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleModuleRepository roleModuleRepository;
    private final RoleRepository roleRepository;

    public Module createModule(Module module) {
        return moduleRepository.save(module);
    }

    public Module updateModule(Long id, Module moduleDetails) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Module not found"));
        
        module.setModuleName(moduleDetails.getModuleName());
        module.setModuleDescription(moduleDetails.getModuleDescription());
        module.setPrefix(moduleDetails.getPrefix());
        module.setPlugin(moduleDetails.getPlugin());
        module.setController(moduleDetails.getController());
        module.setAction(moduleDetails.getAction());
        module.setParent(moduleDetails.isParent());
        module.setSubParent(moduleDetails.isSubParent());
        module.setParentId(moduleDetails.getParentId());
        module.setSubParentId(moduleDetails.getSubParentId());
        module.setIconCss(moduleDetails.getIconCss());
        module.setActive(moduleDetails.isActive());
        
        return moduleRepository.save(module);
    }

    public List<Module> getAllModules() {
        return moduleRepository.findAll();
    }

    public List<Map<String, Object>> getUserMenu() {
        String username = SessionUtil.getCurrentUsername();
        return getUserMenuForUser(username);
    }

    public List<Map<String, Object>> getUserMenuForUser(String username) {
        if (username == null) return Collections.emptyList();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<UserRole> userRoles = userRoleRepository.findByUserId(user.getId());
        Set<Long> roleIds = userRoles.stream().map(UserRole::getRoleId).collect(Collectors.toSet());

        Set<Long> moduleIds = new HashSet<>();
        for (Long roleId : roleIds) {
            moduleIds.addAll(roleModuleRepository.findByRoleId(roleId).stream()
                    .map(RoleModule::getModuleId)
                    .collect(Collectors.toSet()));
        }

        List<Module> allActiveModules = moduleRepository.findByActive(true);
        Map<Long, Module> moduleMap = allActiveModules.stream()
                .collect(Collectors.toMap(Module::getId, m -> m));

        Set<Long> finalModuleIds = new HashSet<>(moduleIds);
        
        // Ensure parents of all included modules are also included
        List<Long> toCheck = new ArrayList<>(moduleIds);
        int index = 0;
        while (index < toCheck.size()) {
            Long mid = toCheck.get(index++);
            Module m = moduleMap.get(mid);
            if (m != null && m.getParentId() != null) {
                if (finalModuleIds.add(m.getParentId())) {
                    toCheck.add(m.getParentId());
                }
            }
            if (m != null && m.getSubParentId() != null) {
                if (finalModuleIds.add(m.getSubParentId())) {
                    toCheck.add(m.getSubParentId());
                }
            }
        }

        List<Module> userModules = allActiveModules.stream()
                .filter(m -> finalModuleIds.contains(m.getId()))
                .collect(Collectors.toList());

        return buildHierarchy(userModules);
    }

    public boolean hasAccessToPath(String username, String path) {
        if (username == null || path == null) return false;
        
        // Special case for authenticated users to access common/auth endpoints
        if (path.startsWith("/api/auth/me") || path.startsWith("/api/auth/logout")) return true;

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return false;

        List<UserRole> userRoles = userRoleRepository.findByUserId(user.getId());
        Set<Long> roleIds = userRoles.stream().map(UserRole::getRoleId).collect(Collectors.toSet());

        // Optimization: Admin has access to everything
        boolean isAdmin = roleIds.stream()
                .map(roleRepository::findById)
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .anyMatch(r -> "SYSTEM_ADMIN".equals(r.getRoleName()));
        
        if (isAdmin) return true;

        for (Long roleId : roleIds) {
            List<RoleModule> rms = roleModuleRepository.findByRoleId(roleId);
            for (RoleModule rm : rms) {
                Module m = moduleRepository.findById(rm.getModuleId()).orElse(null);
                if (m != null && m.getApiPath() != null) {
                    // Check direct path access
                    if (path.startsWith(m.getApiPath())) return true;
                    
                    // Special case: Form modules also grant access to Submissions API
                    if (m.getApiPath().startsWith("/api/forms") && path.startsWith("/api/submissions")) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private List<Map<String, Object>> buildHierarchy(List<Module> modules) {
        List<Map<String, Object>> menu = new ArrayList<>();
        
        // Find top level parents
        List<Module> parents = modules.stream()
                .filter(Module::isParent)
                .collect(Collectors.toList());

        for (Module parent : parents) {
            Map<String, Object> parentNode = mapModule(parent);
            List<Map<String, Object>> subMenus = new ArrayList<>();

            // Find sub parents or direct links under this parent
            List<Module> children = modules.stream()
                    .filter(m -> parent.getId().equals(m.getParentId()))
                    .collect(Collectors.toList());

            for (Module child : children) {
                if (child.isSubParent()) {
                    Map<String, Object> subParentNode = mapModule(child);
                    List<Map<String, Object>> subChildren = modules.stream()
                            .filter(m -> child.getId().equals(m.getSubParentId()))
                            .map(this::mapModule)
                            .collect(Collectors.toList());
                    subParentNode.put("children", subChildren);
                    subMenus.add(subParentNode);
                } else {
                    subMenus.add(mapModule(child));
                }
            }
            parentNode.put("children", subMenus);
            menu.add(parentNode);
        }

        // Add modules without parents appearing as top level (if any)
        List<Module> standalone = modules.stream()
                .filter(m -> !m.isParent() && m.getParentId() == null)
                .collect(Collectors.toList());
        
        for (Module s : standalone) {
            menu.add(mapModule(s));
        }

        return menu;
    }

    @Transactional
    public void seedModules() {
        Role adminRole = roleRepository.findByRoleName("SYSTEM_ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .roleName("SYSTEM_ADMIN")
                        .roleDescription("Full access to all system modules")
                        .build()));

        Role formsManagerRole = roleRepository.findByRoleName("FORMS_MANAGER")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .roleName("FORMS_MANAGER")
                        .roleDescription("Access to forms management modules")
                        .build()));

        List<Module> existing = moduleRepository.findAll();

        // Ensure Parents
        Module formsParent = findOrCreate(existing, "Forms Management", null, "file-text", true);
        Module adminParent = findOrCreate(existing, "System Admin", null, "shield", true);

        // Ensure Main Links
        Module vaultModule = findOrCreate(existing, "Form Vault", "/forms/all", "list", formsParent.getId(), "/api/forms");
        Module createModule = findOrCreate(existing, "Create New Form", "/", "plus-circle", formsParent.getId(), "/api/forms");
        
        findOrCreate(existing, "Module Management", "/admin/modules", "layout", adminParent.getId(), "/api/modules");
        findOrCreate(existing, "Role Management", "/admin/roles", "shield", adminParent.getId(), "/api/roles");
        findOrCreate(existing, "User Management", "/admin/users", "users", adminParent.getId(), "/api/users");

        // Refresh existing list to get new IDs
        existing = moduleRepository.findAll();
        final Long adminRoleId = adminRole.getId();
        final Long formsManagerRoleId = formsManagerRole.getId();

        // Map modules to roles
        for (Module m : existing) {
            // Admin gets everything
            if (roleModuleRepository.findByRoleId(adminRoleId).stream()
                    .noneMatch(rm -> rm.getModuleId().equals(m.getId()))) {
                roleModuleRepository.save(RoleModule.builder().roleId(adminRoleId).moduleId(m.getId()).build());
            }

            // Forms Manager only gets forms related modules
            if (m.getId().equals(formsParent.getId()) || m.getId().equals(vaultModule.getId()) || m.getId().equals(createModule.getId())) {
                if (roleModuleRepository.findByRoleId(formsManagerRoleId).stream()
                        .noneMatch(rm -> rm.getModuleId().equals(m.getId()))) {
                    roleModuleRepository.save(RoleModule.builder().roleId(formsManagerRoleId).moduleId(m.getId()).build());
                }
            }
        }

        // Ensure current user has a role if they have none
        String currentUsername = SessionUtil.getCurrentUsername();
        if (currentUsername != null) {
            userRepository.findByUsername(currentUsername).ifPresent(user -> {
                if (userRoleRepository.findByUserId(user.getId()).isEmpty()) {
                    // If no one is an admin yet, make this user the first admin
                    boolean anyAdminExists = !userRoleRepository.findByRoleId(adminRoleId).isEmpty();
                    Long roleToAssign = anyAdminExists ? formsManagerRoleId : adminRoleId;
                    userRoleRepository.save(UserRole.builder().userId(user.getId()).roleId(roleToAssign).build());
                }
            });
        }
    }

    private Module findOrCreate(List<Module> existing, String name, String prefix, String icon, boolean isParent) {
        Optional<Module> found = existing.stream()
                .filter(m -> m.getModuleName().trim().equalsIgnoreCase(name.trim()))
                .findFirst();
        
        if (found.isPresent()) return found.get();

        Module newModule = Module.builder()
                .moduleName(name)
                .prefix(prefix)
                .iconCss(icon)
                .isParent(isParent)
                .active(true)
                .build();
        return moduleRepository.save(newModule);
    }

    private Module findOrCreate(List<Module> existing, String name, String prefix, String icon, Long parentId, String apiPath) {
        Optional<Module> found = existing.stream()
                .filter(m -> m.getModuleName().trim().equalsIgnoreCase(name.trim()))
                .findFirst();
        
        if (found.isPresent()) {
            Module m = found.get();
            if (m.getApiPath() == null && apiPath != null) {
                m.setApiPath(apiPath);
                return moduleRepository.save(m);
            }
            return m;
        }

        Module newModule = Module.builder()
                .moduleName(name)
                .prefix(prefix)
                .iconCss(icon)
                .parentId(parentId)
                .apiPath(apiPath)
                .active(true)
                .build();
        return moduleRepository.save(newModule);
    }

    private Map<String, Object> mapModule(Module m) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", m.getId());
        map.put("name", m.getModuleName());
        map.put("description", m.getModuleDescription());
        map.put("prefix", m.getPrefix());
        map.put("icon", m.getIconCss());
        map.put("apiPath", m.getApiPath());
        map.put("isParent", m.isParent());
        map.put("isSubParent", m.isSubParent());
        return map;
    }
}
