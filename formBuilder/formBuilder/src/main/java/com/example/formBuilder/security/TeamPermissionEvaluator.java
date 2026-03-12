package com.example.formBuilder.security;

import com.example.formBuilder.entity.TeamMember;
import com.example.formBuilder.enums.TeamRole;
import com.example.formBuilder.repository.AdminRepository;
import com.example.formBuilder.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;

@Component
@RequiredArgsConstructor
public class TeamPermissionEvaluator implements PermissionEvaluator {

    private final TeamMemberRepository teamMemberRepository;
    private final AdminRepository adminRepository;

    @Override
    public boolean hasPermission(Authentication auth, Object targetDomainObject, Object permission) {
        if (auth == null || targetDomainObject == null || !(permission instanceof String)) {
            return false;
        }
        
        String username = auth.getName();
        Long teamId = (Long) targetDomainObject;
        TeamRole requiredRole = TeamRole.valueOf((String) permission);
        
        return adminRepository.findByUsername(username)
                .flatMap(user -> teamMemberRepository.findByTeamIdAndUserId(teamId, user.getId()))
                .map(member -> {
                    if (member.getRole() == TeamRole.TEAM_ADMIN) return true;
                    if (requiredRole == TeamRole.TEAM_ADMIN) return member.getRole() == TeamRole.TEAM_ADMIN;
                    if (requiredRole == TeamRole.DEVELOPER) return member.getRole() == TeamRole.DEVELOPER;
                    if (requiredRole == TeamRole.FORM_EDITOR) return true; // All internal roles can edit
                    return false;
                })
                .orElse(false);
    }

    @Override
    public boolean hasPermission(Authentication auth, Serializable targetId, String targetType, Object permission) {
        return hasPermission(auth, targetId, permission);
    }
}
