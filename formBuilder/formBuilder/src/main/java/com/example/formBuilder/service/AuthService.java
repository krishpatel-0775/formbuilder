package com.example.formBuilder.service;

import com.example.formBuilder.dto.LoginRequest;
import com.example.formBuilder.dto.LoginResponse;
import com.example.formBuilder.dto.RegisterRequest;
import com.example.formBuilder.entity.User;
import com.example.formBuilder.exception.ValidationException;
import com.example.formBuilder.repository.UserRepository;
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

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;

    public String register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new ValidationException("Username is already taken.");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ValidationException("Email is already registered.");
        }

        User user = new User();
        user.setName(request.getUsername()); // Default name to username
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        // Storing password as plain text since this is intentionally non-production-grade
        user.setPassword(request.getPassword());
        user.setExtraDetails(request.getExtraDetails());

        userRepository.save(user);
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
}
