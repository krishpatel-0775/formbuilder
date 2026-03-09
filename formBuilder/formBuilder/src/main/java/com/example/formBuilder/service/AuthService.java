package com.example.formBuilder.service;

import com.example.formBuilder.dto.LoginRequest;
import com.example.formBuilder.dto.LoginResponse;
import com.example.formBuilder.dto.RegisterRequest;
import com.example.formBuilder.entity.Admin;
import com.example.formBuilder.exception.ValidationException;
import com.example.formBuilder.repository.AdminRepository;
import com.example.formBuilder.security.SessionUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AdminRepository adminRepository;
    private final AuthenticationManager authenticationManager;

    public String register(RegisterRequest request) {
        if (adminRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new ValidationException("Username is already taken.");
        }
        if (adminRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ValidationException("Email is already registered.");
        }

        Admin admin = new Admin();
        admin.setUsername(request.getUsername());
        admin.setEmail(request.getEmail());
        // Storing password as plain text since this is intentionally non-production-grade
        admin.setPassword(request.getPassword());
        admin.setExtraDetails(request.getExtraDetails());

        adminRepository.save(admin);
        return "Admin registered successfully";
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
        Admin admin = adminRepository.findByUsername(authenticatedUsername)
                .orElseThrow(() -> new ValidationException("User not found"));

        return new LoginResponse(admin.getId(), admin.getUsername(), admin.getEmail());
    }

    public void logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    public Long getCurrentAdminId() {
        String username = SessionUtil.getCurrentAdminUsername();
        if (username != null) {
            return adminRepository.findByUsername(username)
                    .map(Admin::getId)
                    .orElse(null);
        }
        return null;
    }
}
