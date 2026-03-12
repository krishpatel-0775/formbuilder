package com.example.formBuilder.repository;

import com.example.formBuilder.entity.JoinRequest;
import com.example.formBuilder.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JoinRequestRepository extends JpaRepository<JoinRequest, Long> {
    List<JoinRequest> findByTeamIdAndStatus(Long teamId, RequestStatus status);
    List<JoinRequest> findByUserId(Long userId);
}
