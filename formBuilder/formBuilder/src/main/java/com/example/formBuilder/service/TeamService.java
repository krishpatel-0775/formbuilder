package com.example.formBuilder.service;

import com.example.formBuilder.dto.TeamRequest;
import com.example.formBuilder.entity.*;
import com.example.formBuilder.enums.RequestStatus;
import com.example.formBuilder.enums.TeamRole;
import com.example.formBuilder.exception.ResourceNotFoundException;
import com.example.formBuilder.exception.ValidationException;
import com.example.formBuilder.repository.*;
import com.example.formBuilder.security.SessionUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final JoinRequestRepository joinRequestRepository;
    private final AdminRepository adminRepository;

    private Admin getCurrentUser() {
        String username = SessionUtil.getCurrentAdminUsername();
        if (username == null) throw new ValidationException("Unauthorized");
        return adminRepository.findByUsername(username)
                .orElseThrow(() -> new ValidationException("User not found"));
    }

    @Transactional
    public Team createTeam(TeamRequest request) {
        Admin user = getCurrentUser();
        Team team = new Team(request.getName());
        team = teamRepository.save(team);

        TeamMember member = new TeamMember();
        member.setTeamId(team.getId());
        member.setUserId(user.getId());
        member.setRole(TeamRole.TEAM_ADMIN);
        teamMemberRepository.save(member);

        return team;
    }

    public List<TeamMember> getMyTeams() {
        Admin user = getCurrentUser();
        return teamMemberRepository.findByUserId(user.getId());
    }

    @Transactional
    public String sendJoinRequest(String inviteCode) {
        Admin user = getCurrentUser();
        Team team = teamRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with code: " + inviteCode));

        Optional<TeamMember> existingMember = teamMemberRepository.findByTeamIdAndUserId(team.getId(), user.getId());
        if (existingMember.isPresent()) {
            throw new ValidationException("You are already a member of this team");
        }

        JoinRequest request = new JoinRequest();
        request.setTeam(team);
        request.setUser(user);
        request.setStatus(RequestStatus.PENDING);
        joinRequestRepository.save(request);

        return "Join request sent successfully";
    }

    @Transactional
    public String handleJoinRequest(Long requestId, RequestStatus status) {
        Admin teamAdmin = getCurrentUser();
        JoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        checkTeamAdminPermission(request.getTeam().getId(), teamAdmin.getId());

        request.setStatus(status);
        if (status == RequestStatus.APPROVED) {
            TeamMember member = new TeamMember();
            member.setTeamId(request.getTeam().getId());
            member.setUserId(request.getUser().getId());
            member.setRole(TeamRole.FORM_EDITOR); // Default role
            teamMemberRepository.save(member);
        }
        joinRequestRepository.save(request);

        return "Request " + status.toString().toLowerCase() + " successfully";
    }

    @Transactional
    public String addMemberByEmail(Long teamId, String email, TeamRole role) {
        Admin currentAdmin = getCurrentUser();
        checkTeamAdminPermission(teamId, currentAdmin.getId());

        Admin targetUser = adminRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        Optional<TeamMember> existing = teamMemberRepository.findByTeamIdAndUserId(teamId, targetUser.getId());
        if (existing.isPresent()) {
            throw new ValidationException("User is already a member of this team");
        }

        TeamMember member = new TeamMember();
        member.setTeamId(teamId);
        member.setUserId(targetUser.getId());
        member.setRole(role);
        teamMemberRepository.save(member);

        return "User added to team successfully";
    }

    @Transactional
    public String updateMemberRole(Long teamId, Long userId, TeamRole newRole) {
        Admin currentAdmin = getCurrentUser();
        checkTeamAdminPermission(teamId, currentAdmin.getId());

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        member.setRole(newRole);
        teamMemberRepository.save(member);

        return "Role updated successfully";
    }

    public List<JoinRequest> getPendingRequests(Long teamId) {
        Admin currentAdmin = getCurrentUser();
        checkTeamAdminPermission(teamId, currentAdmin.getId());
        return joinRequestRepository.findByTeamIdAndStatus(teamId, RequestStatus.PENDING);
    }

    public List<TeamMember> getTeamMembers(Long teamId) {
        Admin actor = getCurrentUser();
        // Any member of the team can list members
        teamMemberRepository.findByTeamIdAndUserId(teamId, actor.getId())
                .orElseThrow(() -> new ValidationException("Access denied: You are not a member of this team"));
        
        return teamMemberRepository.findByTeamId(teamId);
    }

    @Transactional
    public String removeMember(Long teamId, Long userId) {
        Admin currentAdmin = getCurrentUser();
        checkTeamAdminPermission(teamId, currentAdmin.getId());

        if (currentAdmin.getId().equals(userId)) {
            throw new ValidationException("You cannot remove yourself from the team");
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in team"));

        teamMemberRepository.delete(member);
        return "Member removed from team successfully";
    }

    private void checkTeamAdminPermission(Long teamId, Long userId) {
        TeamMember adminMember = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new ValidationException("You are not a member of this team"));
        if (adminMember.getRole() != TeamRole.TEAM_ADMIN) {
            throw new ValidationException("Only TEAM_ADMIN can perform this action");
        }
    }
}
