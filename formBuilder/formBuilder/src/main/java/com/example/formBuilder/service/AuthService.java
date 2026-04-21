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
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

import java.util.*;
import java.util.stream.Collectors;
import java.util.List;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final ModuleService moduleService;


    // ================= REGISTER =================
    @Transactional
    public String register(RegisterRequest request) {
        validateNewUser(request);

        User user = buildUserFromRequest(request);

        User savedUser = userRepository.save(user);
        assignDefaultRole(savedUser);

        return "User registered successfully";
    }

    // ================= UPDATE PROFILE =================
    @Transactional
    public void updateProfile(UUID userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ValidationException("User not found"));

        validateUpdateUser(user, request);
        updateUserFields(user, request);

        userRepository.save(user);
    }

    // ================= LOGIN =================
    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {

        moduleService.seedModules(request.getIdentifier());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getIdentifier(), request.getPassword())
        );

        SecurityContext sc = SecurityContextHolder.getContext();
        sc.setAuthentication(authentication);

        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, sc);

        String username = ((UserDetails) authentication.getPrincipal()).getUsername();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ValidationException("User not found"));

        user.setLastSessionId(session.getId());
        userRepository.save(user);

        return new LoginResponse(user.getId(), user.getUsername(), user.getEmail());
    }

    // ================= LOGOUT =================
    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    // ================= REFRESH SECURITY =================
    public void refreshSecurityContext(String username) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        Authentication newAuth = new UsernamePasswordAuthenticationToken(
                userDetails,
                userDetails.getPassword(),
                userDetails.getAuthorities()
        );

        SecurityContextHolder.getContext().setAuthentication(newAuth);
    }

    // ================= CURRENT USER =================
    public UUID getCurrentUserId() {
        String username = SessionUtil.getCurrentUsername();

        if (username == null) return null;

        return userRepository.findByUsername(username)
                .map(User::getId)
                .orElse(null);
    }

    // ================= USER DETAILS =================
    public UserDetailResponse getUserDetails() {
        String username = SessionUtil.getCurrentUsername();
        if (username == null) return null;

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) return null;

        moduleService.seedModules();

        var menu = moduleService.getUserMenuForUser(username);
        List<String> permissions = extractPermissions(menu);
        List<String> roles = getUserRoles(user.getId());

        return UserDetailResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .menu(menu)
                .permissions(permissions)
                .roles(roles)
                .build();
    }

    // ================= PRIVATE HELPERS =================

    private void validateNewUser(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new ValidationException("Username is already taken.");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ValidationException("Email is already registered.");
        }
    }

    private void validateUpdateUser(User user, UpdateUserRequest request) {
        if (!user.getUsername().equals(request.getUsername())
                && userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new ValidationException("Username is already taken.");
        }

        if (!user.getEmail().equals(request.getEmail())
                && userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ValidationException("Email is already registered.");
        }
    }

    private User buildUserFromRequest(RegisterRequest request) {
        User user = new User();
        user.setName(request.getFullName());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        return user;
    }

    private void updateUserFields(User user, UpdateUserRequest request) {
        user.setName(request.getFullName());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
    }


    private void assignDefaultRole(User user) {
        roleRepository.findByRoleName("FORMS_MANAGER").ifPresent(role -> {
            userRoleRepository.save(UserRole.builder()
                    .user(user)
                    .role(role)
                    .build());
        });
    }

    private List<String> getUserRoles(UUID userId) {
        return userRoleRepository.findByUser_Id(userId).stream()
                .map(ur -> ur.getRole().getRoleName())
                .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private List<String> extractPermissions(List<Map<String, Object>> menu) {
        List<String> permissions = new ArrayList<>();
        collectPrefixes(menu, permissions);
        return permissions;
    }

    @SuppressWarnings("unchecked")
    private void collectPrefixes(List<Map<String, Object>> items, List<String> prefixes) {
        if (items == null) return;

        for (var item : items) {
            String prefix = (String) item.get("prefix");

            if (prefix != null && !prefix.isEmpty()) {
                prefixes.add(prefix);
            }

            List<Map<String, Object>> children =
                    (List<Map<String, Object>>) item.get("children");

            collectPrefixes(children, prefixes);
        }
    }
}
