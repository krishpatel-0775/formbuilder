package com.example.formBuilder.security;

import com.example.formBuilder.entity.User;
import com.example.formBuilder.entity.UserRole;
import com.example.formBuilder.entity.Role;
import com.example.formBuilder.repository.UserRepository;
import com.example.formBuilder.repository.UserRoleRepository;
import com.example.formBuilder.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        List<SimpleGrantedAuthority> authorities = userRoleRepository.findByUserId(user.getId()).stream()
                .map(ur -> roleRepository.findById(ur.getRoleId()))
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRoleName()))
                .collect(Collectors.toList());

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                authorities
        );
    }
}
