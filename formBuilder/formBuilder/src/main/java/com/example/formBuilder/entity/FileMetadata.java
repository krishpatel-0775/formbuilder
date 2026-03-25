package com.example.formBuilder.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FileMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String fileName;
    private String originalFileName;
    private String fileType;
    private Long fileSize;
    private String filePath;
    private LocalDateTime createdAt = LocalDateTime.now();
}
