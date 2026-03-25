package com.example.formBuilder.controller;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.ApiResponse;
import com.example.formBuilder.dto.LoginRequest;
import com.example.formBuilder.dto.LoginResponse;
import com.example.formBuilder.dto.RegisterRequest;
import com.example.formBuilder.dto.UpdateUserRequest;
import com.example.formBuilder.dto.UserDetailResponse;
import com.example.formBuilder.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.net.MalformedURLException;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = AppConstants.FRONTEND_URL, allowCredentials = "true")
public class AuthController {

    private final AuthService authService;

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> register(
            @RequestPart("request") @Valid RegisterRequest request,
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture) {
        return ResponseEntity.ok(ApiResponse.success(authService.register(request, profilePicture), null));
    }

    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> updateProfile(
            @RequestPart("request") @Valid UpdateUserRequest request,
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture) {
        UUID userId = authService.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(401).body(ApiResponse.error(401, "Not authenticated"));
        }
        authService.updateProfile(userId, request, profilePicture);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", null));
    }

    @GetMapping("/profile-photo/{fileName:.+}")
    public ResponseEntity<Resource> getProfilePhoto(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get("C:\\Users\\stadmin\\Desktop\\projects\\formbuilder\\formBuilder\\formBuilder\\profile-photo").resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                String contentType = "image/jpeg"; // Default
                if (fileName.toLowerCase().endsWith(".png")) contentType = "image/png";
                else if (fileName.toLowerCase().endsWith(".gif")) contentType = "image/gif";
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request, httpRequest)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(HttpServletRequest request) {
        authService.logout(request);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDetailResponse>> me() {
        UserDetailResponse userDetails = authService.getUserDetails();
        if (userDetails == null) {
            return ResponseEntity.status(401).body(ApiResponse.error(401, "Not authenticated"));
        }
        return ResponseEntity.ok(ApiResponse.success(userDetails));
    }
}
