package com.example.formBuilder.controller;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.ApiResponse;
import com.example.formBuilder.dto.JoinRequestDto;
import com.example.formBuilder.dto.TeamRequest;
import com.example.formBuilder.entity.JoinRequest;
import com.example.formBuilder.entity.Team;
import com.example.formBuilder.entity.TeamMember;
import com.example.formBuilder.enums.RequestStatus;
import com.example.formBuilder.enums.TeamRole;
import com.example.formBuilder.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = AppConstants.FRONTEND_URL, allowCredentials = "true")
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    public ResponseEntity<ApiResponse<Team>> createTeam(@RequestBody TeamRequest request) {
        return ResponseEntity.ok(ApiResponse.success(teamService.createTeam(request)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<TeamMember>>> getMyTeams() {
        return ResponseEntity.ok(ApiResponse.success(teamService.getMyTeams()));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<String>> sendJoinRequest(@RequestBody JoinRequestDto request) {
        return ResponseEntity.ok(ApiResponse.success(teamService.sendJoinRequest(request.getInviteCode())));
    }

    @GetMapping("/{teamId}/requests")
    public ResponseEntity<ApiResponse<List<JoinRequest>>> getPendingRequests(@PathVariable Long teamId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getPendingRequests(teamId)));
    }

    @PutMapping("/requests/{requestId}")
    public ResponseEntity<ApiResponse<String>> handleJoinRequest(
            @PathVariable Long requestId,
            @RequestParam RequestStatus status) {
        return ResponseEntity.ok(ApiResponse.success(teamService.handleJoinRequest(requestId, status)));
    }

    @PostMapping("/{teamId}/members")
    public ResponseEntity<ApiResponse<String>> addMember(
            @PathVariable Long teamId,
            @RequestParam String email,
            @RequestParam TeamRole role) {
        return ResponseEntity.ok(ApiResponse.success(teamService.addMemberByEmail(teamId, email, role)));
    }

    @PutMapping("/{teamId}/members/{userId}/role")
    public ResponseEntity<ApiResponse<String>> updateRole(
            @PathVariable Long teamId,
            @PathVariable Long userId,
            @RequestParam TeamRole role) {
        return ResponseEntity.ok(ApiResponse.success(teamService.updateMemberRole(teamId, userId, role)));
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    public ResponseEntity<ApiResponse<String>> removeMember(
            @PathVariable Long teamId,
            @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.removeMember(teamId, userId), null));
    }

    @GetMapping("/{teamId}/members")
    public ResponseEntity<ApiResponse<List<TeamMember>>> getTeamMembers(@PathVariable Long teamId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamMembers(teamId)));
    }
}
