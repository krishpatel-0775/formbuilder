package com.example.formBuilder.controller;

import com.example.formBuilder.dto.ApiResponse;
import com.example.formBuilder.entity.FileMetadata;
import com.example.formBuilder.entity.FormField;
import com.example.formBuilder.exception.ResourceNotFoundException;
import com.example.formBuilder.repository.FormFieldRepository;
import com.example.formBuilder.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class FileController {

    private final FileService fileService;
    private final FormFieldRepository formFieldRepository;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<UUID>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("fieldId") UUID fieldId) throws IOException {
        
        FormField field = formFieldRepository.findById(fieldId)
                .orElseThrow(() -> new ResourceNotFoundException("Form field not found"));
        
        FileMetadata metadata = fileService.uploadFile(file, field);
        return ResponseEntity.ok(ApiResponse.success(metadata.getId()));
    }

    @GetMapping("/view/{id}")
    public ResponseEntity<Resource> viewFile(@PathVariable UUID id) throws IOException {
        FileMetadata metadata = fileService.getFileMetadata(id);
        byte[] content = fileService.getFileContent(metadata);
        
        ByteArrayResource resource = new ByteArrayResource(content);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + metadata.getOriginalFileName() + "\"")
                .contentType(MediaType.parseMediaType(metadata.getFileType()))
                .contentLength(metadata.getFileSize())
                .body(resource);
    }
}
