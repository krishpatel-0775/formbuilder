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
        normalizeModule(module);
        return moduleRepository.save(module);
    }

    public Module updateModule(UUID id, Module moduleDetails) {
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

        normalizeModule(module);
        
        return moduleRepository.save(module);
    }

    private void normalizeModule(Module module) {
        if (module.isParent()) {
            module.setParentId(null);
            module.setSubParentId(null);
            module.setSubParent(false);
        } else if (module.isSubParent()) {
            module.setSubParentId(null);
            module.setParent(false);
        }
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
        Set<UUID> roleIds = userRoles.stream().map(UserRole::getRoleId).collect(Collectors.toSet());

        Set<UUID> moduleIds = new HashSet<>();
        for (UUID roleId : roleIds) {
            moduleIds.addAll(roleModuleRepository.findByRoleId(roleId).stream()
                    .map(RoleModule::getModuleId)
                    .collect(Collectors.toSet()));
        }

        List<Module> allActiveModules = moduleRepository.findByActive(true);
        Map<UUID, Module> moduleMap = allActiveModules.stream()
                .collect(Collectors.toMap(Module::getId, m -> m));

        Set<UUID> finalModuleIds = new HashSet<>(moduleIds);

        List<UUID> toCheck = new ArrayList<>(moduleIds);
        int index = 0;
        while (index < toCheck.size()) {
            UUID mid = toCheck.get(index++);
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

    private List<Map<String, Object>> buildHierarchy(List<Module> modules) {
        List<Map<String, Object>> menu = new ArrayList<>();
        
        List<Module> parents = modules.stream()
                .filter(Module::isParent)
                .collect(Collectors.toList());

        for (Module parent : parents) {
            Map<String, Object> parentNode = mapModule(parent);
            List<Map<String, Object>> subMenus = new ArrayList<>();

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
                } else if (child.getSubParentId() == null) {
                    subMenus.add(mapModule(child));
                }
            }
            parentNode.put("children", subMenus);
            menu.add(parentNode);
        }

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
        seedModules(SessionUtil.getCurrentUsername());
    }

    @Transactional
    public void seedModules(String targetUsername) {
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

        Module dashboardModule = findOrCreate(existing, "Dashboard", "/dashboard", "LayoutDashboard", null, false);
        Module formsParent = findOrCreate(existing, "Forms Management", null, "file-text", true);
        Module adminParent = findOrCreate(existing, "System Admin", null, "shield", true);

        Module vaultModule = findOrCreate(existing, "Form Vault", "/forms/all", "list", formsParent.getId());
        Module createModule = findOrCreate(existing, "Create New Form", "/", "plus-circle", formsParent.getId());
        
        findOrCreate(existing, "Module Management", "/admin/modules", "layout", adminParent.getId());
        findOrCreate(existing, "Role Management", "/admin/roles", "shield", adminParent.getId());
        findOrCreate(existing, "User Management", "/admin/users", "users", adminParent.getId());

        existing = moduleRepository.findAll();
        final UUID adminRoleId = adminRole.getId();
        final UUID formsManagerRoleId = formsManagerRole.getId();

        for (Module m : existing) {
            if (roleModuleRepository.findByRoleId(adminRoleId).stream()
                    .noneMatch(rm -> rm.getModuleId().equals(m.getId()))) {
                roleModuleRepository.save(RoleModule.builder().roleId(adminRoleId).moduleId(m.getId()).build());
            }

            if (m.getId().equals(dashboardModule.getId()) || m.getId().equals(formsParent.getId()) || m.getId().equals(vaultModule.getId()) || m.getId().equals(createModule.getId())) {
                if (roleModuleRepository.findByRoleId(formsManagerRoleId).stream()
                        .noneMatch(rm -> rm.getModuleId().equals(m.getId()))) {
                    roleModuleRepository.save(RoleModule.builder().roleId(formsManagerRoleId).moduleId(m.getId()).build());
                }
            }
        }

        if (targetUsername != null) {
            userRepository.findByUsername(targetUsername).ifPresent(user -> {
                if (userRoleRepository.findByUserId(user.getId()).isEmpty()) {
                    boolean anyAdminExists = !userRoleRepository.findByRoleId(adminRoleId).isEmpty();
                    UUID roleToAssign = anyAdminExists ? formsManagerRoleId : adminRoleId;
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

    private Module findOrCreate(List<Module> existing, String name, String prefix, String icon, UUID parentId) {
        Optional<Module> found = existing.stream()
                .filter(m -> m.getModuleName().trim().equalsIgnoreCase(name.trim()))
                .findFirst();
        
        if (found.isPresent()) return found.get();

        Module newModule = Module.builder()
                .moduleName(name)
                .prefix(prefix)
                .iconCss(icon)
                .parentId(parentId)
                .active(true)
                .build();
        return moduleRepository.save(newModule);
    }

    private Module findOrCreate(List<Module> existing, String name, String prefix, String icon, UUID parentId, boolean isParent) {
        Optional<Module> found = existing.stream()
                .filter(m -> m.getModuleName().trim().equalsIgnoreCase(name.trim()))
                .findFirst();
        
        if (found.isPresent()) return found.get();
 
        Module newModule = Module.builder()
                .moduleName(name)
                .prefix(prefix)
                .iconCss(icon)
                .parentId(parentId)
                .isParent(isParent)
                .active(true)
                .build();
        return moduleRepository.save(newModule);
    }

    @Transactional
    public void deleteModule(UUID id) {
        Module module = moduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Module not found"));

        List<Module> children = moduleRepository.findAll().stream()
                .filter(m -> id.equals(m.getParentId()) || id.equals(m.getSubParentId()))
                .collect(Collectors.toList());
        
        for (Module child : children) {
            deleteModule(child.getId());
        }

        roleModuleRepository.deleteAll(roleModuleRepository.findByModuleId(id));
        moduleRepository.delete(module);
    }

    private Map<String, Object> mapModule(Module m) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", m.getId());
        map.put("name", m.getModuleName());
        map.put("description", m.getModuleDescription());
        map.put("prefix", m.getPrefix());
        map.put("icon", m.getIconCss());
        map.put("isParent", m.isParent());
        map.put("isSubParent", m.isSubParent());
        return map;
    }
}
