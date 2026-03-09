package com.example.formBuilder.security;

import com.example.formBuilder.entity.Admin;
import com.example.formBuilder.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AdminDetailsService implements UserDetailsService {

    private final AdminRepository adminRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        // Find by username first, if not found, find by email
        Admin admin = adminRepository.findByUsername(usernameOrEmail)
                .orElseGet(() -> adminRepository.findByEmail(usernameOrEmail)
                        .orElseThrow(() -> new UsernameNotFoundException("Admin not found with username or email: " + usernameOrEmail))
                );

        return new User(
                admin.getUsername(), // Using username as the principal
                admin.getPassword(),
                Collections.emptyList() // No authorities/roles (simplified requirement)
        );
    }
}
