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
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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

    private static final String PROFILE_PHOTO_DIR = "C:\\Users\\stadmin\\Desktop\\projects\\formbuilder\\formBuilder\\formBuilder\\profile-photo";

    @Transactional
    public String register(RegisterRequest request, MultipartFile profilePicture) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new ValidationException("Username is already taken.");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ValidationException("Email is already registered.");
        }

        User user = new User();
        user.setName(request.getFullName());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        if (profilePicture != null && !profilePicture.isEmpty()) {
            try {
                File dir = new File(PROFILE_PHOTO_DIR);
                if (!dir.exists()) {
                    dir.mkdirs();
                }

                String originalFileName = profilePicture.getOriginalFilename();
                String extension = "";
                if (originalFileName != null && originalFileName.contains(".")) {
                    extension = originalFileName.substring(originalFileName.lastIndexOf("."));
                }
                String fileName = UUID.randomUUID().toString() + extension;
                Path filePath = Paths.get(PROFILE_PHOTO_DIR, fileName);
                Files.copy(profilePicture.getInputStream(), filePath);

                // For simplicity, we store the filename. A full URL would depend on how the file is served.
                user.setProfilePictureUrl(fileName);
            } catch (Exception e) {
                throw new RuntimeException("Failed to save profile picture: " + e.getMessage());
            }
        }

        User savedUser = userRepository.save(user);

        roleRepository.findByRoleName("FORMS_MANAGER").ifPresent(role -> {
            userRoleRepository.save(UserRole.builder()
                    .userId(savedUser.getId())
                    .roleId(role.getId())
                    .build());
        });

        return "User registered successfully";
    }

    @Transactional
    public void updateProfile(Long userId, UpdateUserRequest request, MultipartFile profilePicture) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ValidationException("User not found"));

        if (!user.getUsername().equals(request.getUsername()) && userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new ValidationException("Username is already taken.");
        }
        if (!user.getEmail().equals(request.getEmail()) && userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ValidationException("Email is already registered.");
        }

        user.setName(request.getFullName());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());

        if (profilePicture != null && !profilePicture.isEmpty()) {
            try {
                File dir = new File(PROFILE_PHOTO_DIR);
                if (!dir.exists()) {
                    dir.mkdirs();
                }

                String originalFileName = profilePicture.getOriginalFilename();
                String extension = "";
                if (originalFileName != null && originalFileName.contains(".")) {
                    extension = originalFileName.substring(originalFileName.lastIndexOf("."));
                }
                String fileName = UUID.randomUUID().toString() + extension;
                Path filePath = Paths.get(PROFILE_PHOTO_DIR, fileName);
                Files.copy(profilePicture.getInputStream(), filePath);

                // Update profile picture URL
                user.setProfilePictureUrl(fileName);
            } catch (Exception e) {
                throw new RuntimeException("Failed to save profile picture: " + e.getMessage());
            }
        }

        userRepository.save(user);
    }

    public LoginResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        // Ensure roles/modules exist and user has a default role if missing BEFORE authentication
        moduleService.seedModules(request.getIdentifier()); 

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

        return new LoginResponse(user.getId(), user.getUsername(), user.getEmail());
    }

    public void refreshSecurityContext(String username) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        Authentication newAuth = new UsernamePasswordAuthenticationToken(
                userDetails,
                userDetails.getPassword(),
                userDetails.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(newAuth);
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
                .fullName(user.getName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .profilePictureUrl(user.getProfilePictureUrl() != null ? "/api/auth/profile-photo/" + user.getProfilePictureUrl() : null)
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
