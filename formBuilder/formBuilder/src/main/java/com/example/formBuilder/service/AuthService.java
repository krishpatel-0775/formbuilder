package com.example.formBuilder.service;

import com.example.formBuilder.dto.*;
import com.example.formBuilder.entity.User;
import com.example.formBuilder.exception.ValidationException;
import com.example.formBuilder.entity.Role;
import com.example.formBuilder.entity.UserRole;
import com.example.formBuilder.repository.RoleRepository;
import com.example.formBuilder.repository.UserRoleRepository;
import com.example.formBuilder.repository.UserRepository;
import com.example.formBuilder.security.SessionUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.List;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final ModuleService moduleService;

    @Transactional
    public String register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new ValidationException("Username is already taken.");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ValidationException("Email is already registered.");
        }

        User user = new User();
        user.setName(request.getUsername());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);

        roleRepository.findByRoleName("FORMS_MANAGER").ifPresent(role -> {
            userRoleRepository.save(UserRole.builder()
                    .userId(savedUser.getId())
                    .roleId(role.getId())
                    .build());
        });

        return "User registered successfully";
    }

    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getIdentifier(), request.getPassword())
        );

        SecurityContext sc = SecurityContextHolder.getContext();
        sc.setAuthentication(authentication);

        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, sc);

        String authenticatedUsername = ((UserDetails) authentication.getPrincipal()).getUsername();
        User user = userRepository.findByUsername(authenticatedUsername)
                .orElseThrow(() -> new ValidationException("User not found"));

        // Ensure user has at least one role
        moduleService.seedModules(); // This will also assign a role to the current user if missing

        return new LoginResponse(user.getId(), user.getUsername(), user.getEmail());
    }

    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    public Long getCurrentUserId() {
        String username = SessionUtil.getCurrentUsername();
        if (username != null) {
            return userRepository.findByUsername(username)
                    .map(User::getId)
                    .orElse(null);
        }
        return null;
    }

    public UserDetailResponse getUserDetails() {
        String username = SessionUtil.getCurrentUsername();
        if (username == null) return null;

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return null;

        // Ensure roles/modules exist and user has a default role if none assigned
        moduleService.seedModules();

        var menu = moduleService.getUserMenuForUser(username);
        
        // Flatten permissions for easier checking on frontend
        List<String> permissions = new ArrayList<>();
        collectPrefixes(menu, permissions);

        // Fetch User Roles
        List<String> roles = userRoleRepository.findByUserId(user.getId()).stream()
                .map(ur -> roleRepository.findById(ur.getRoleId())
                        .map(Role::getRoleName)
                        .orElse("UNKNOWN"))
                .collect(Collectors.toList());

        return UserDetailResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .menu(menu)
                .permissions(permissions)
                .roles(roles)
                .build();
    }

    @SuppressWarnings("unchecked")
    private void collectPrefixes(List<Map<String, Object>> items, List<String> prefixes) {
        if (items == null) return;
        for (var item : items) {
            String prefix = (String) item.get("prefix");
            if (prefix != null && !prefix.isEmpty()) {
                prefixes.add(prefix);
            }
            List<Map<String, Object>> children = (List<Map<String, Object>>) item.get("children");
            collectPrefixes(children, prefixes);
        }
    }
}
