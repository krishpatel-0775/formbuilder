package com.example.formBuilder.controller;
 
import com.example.formBuilder.dto.ApiResponse;
import com.example.formBuilder.dto.DashboardStatsDto;
import com.example.formBuilder.dto.RecentFormDto;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.entity.User;
import com.example.formBuilder.enums.FormStatus;
import com.example.formBuilder.repository.FormRepository;
import com.example.formBuilder.repository.FormSubmissionMetaRepository;
import com.example.formBuilder.repository.UserRepository;
import com.example.formBuilder.security.SessionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
 
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
 
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {
 
    private final FormRepository formRepository;
    private final FormSubmissionMetaRepository metaRepository;
    private final UserRepository userRepository;
 
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getStats() {
        String username = SessionUtil.getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
 
        UUID userId = user.getId();
        List<Form> userForms = formRepository.findByUserId(userId);
        List<UUID> formIds = userForms.stream().map(Form::getId).collect(Collectors.toList());
 
        long totalForms = formRepository.countByUserId(userId);
        long draftForms = formRepository.countByUserIdAndStatus(userId, FormStatus.DRAFT);
        long publishedForms = formRepository.countByUserIdAndStatus(userId, FormStatus.PUBLISHED);
        
        long totalSubmissions = formIds.isEmpty() ? 0 : metaRepository.countByFormIdIn(formIds);
 
        List<RecentFormDto> recentForms = formRepository.findTop5ByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(f -> RecentFormDto.builder()
                        .id(f.getId())
                        .formName(f.getFormName())
                        .status(f.getStatus())
                        .updatedAt(f.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());
 
        DashboardStatsDto stats = DashboardStatsDto.builder()
                .totalForms(totalForms)
                .draftForms(draftForms)
                .publishedForms(publishedForms)
                .totalSubmissions(totalSubmissions)
                .recentForms(recentForms)
                .build();
 
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
