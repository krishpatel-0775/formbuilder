package com.example.formBuilder.service;

import com.example.formBuilder.entity.FileMetadata;
import com.example.formBuilder.entity.FormField;
import com.example.formBuilder.exception.ValidationException;
import com.example.formBuilder.repository.FileMetadataRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {

    private final FileMetadataRepository fileMetadataRepository;
 
    @org.springframework.beans.factory.annotation.Value("${app.upload.form-files-dir:./uploads/form-files}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    public FileMetadata uploadFile(MultipartFile file, FormField field) throws IOException {
        validateFile(file, field);

        File dir = new File(uploadDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String originalFileName = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
        }

        String storedFileName = UUID.randomUUID().toString() + fileExtension;
        Path filePath = Paths.get(uploadDir, storedFileName);

        Files.copy(file.getInputStream(), filePath);

        FileMetadata metadata = new FileMetadata();
        metadata.setFileName(storedFileName);
        metadata.setOriginalFileName(originalFileName);
        metadata.setFileType(file.getContentType());
        metadata.setFileSize(file.getSize());
        metadata.setFilePath(filePath.toString());

        return fileMetadataRepository.save(metadata);
    }

    public void validateFile(MultipartFile file, FormField field) {
        if (file.isEmpty()) {
            throw new ValidationException("File is empty");
        }

        // Validate Size
        if (field.getMaxFileSize() != null) {
            long maxSizeInBytes = (long) field.getMaxFileSize() * 1024 * 1024;
            if (file.getSize() > maxSizeInBytes) {
                throw new ValidationException("File size exceeds maximum limit of " + field.getMaxFileSize() + "MB");
            }
        }

        // Validate Type
        if (field.getAllowedFileTypes() != null && !field.getAllowedFileTypes().isBlank()) {
            String originalFileName = file.getOriginalFilename();
            if (originalFileName == null || !originalFileName.contains(".")) {
                throw new ValidationException("Invalid file type (no extension found)");
            }

            String extension = originalFileName.substring(originalFileName.lastIndexOf(".") + 1).toLowerCase();
            String[] allowedTypes = field.getAllowedFileTypes().toLowerCase().split(",");
            boolean isValid = Arrays.asList(allowedTypes).contains(extension);

            if (!isValid) {
                throw new ValidationException("File type '" + extension + "' is not allowed. Allowed types: " + field.getAllowedFileTypes());
            }
        }
    }

    public FileMetadata getFileMetadata(UUID id) {
        return fileMetadataRepository.findById(id)
                .orElseThrow(() -> new ValidationException("File not found"));
    }

    public byte[] getFileContent(FileMetadata metadata) throws IOException {
        return Files.readAllBytes(Paths.get(metadata.getFilePath()));
    }
}
