package com.example.formBuilder.security;

import com.example.formBuilder.entity.User;
import com.example.formBuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.formBuilder.entity.UserRole;
import com.example.formBuilder.repository.UserRoleRepository;
import com.example.formBuilder.repository.RoleRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;


import java.util.Optional;
import java.util.stream.Collectors;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        List<UserRole> userRoles = userRoleRepository.findByUserId(user.getId());
        List<SimpleGrantedAuthority> authorities = userRoles.stream()
                .map(ur -> roleRepository.findById(ur.getRoleId()))
                .filter(Optional::isPresent)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.get().getRoleName()))
                .collect(Collectors.toList());

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                authorities
        );
    }
}
