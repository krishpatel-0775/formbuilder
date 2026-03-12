package com.example.formBuilder.repository;

import com.example.formBuilder.entity.TeamMember;
import com.example.formBuilder.entity.TeamMemberId;
import com.example.formBuilder.enums.TeamRole;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, TeamMemberId> {
    List<TeamMember> findByUserId(Long userId);
    List<TeamMember> findByTeamId(Long teamId);
    Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);
}
