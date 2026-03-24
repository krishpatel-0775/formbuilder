package com.example.formBuilder.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * Request body for creating a new version.
 * The server always clones from the latest existing version.
 * An empty body is valid — all fields are optional.
 */
@Getter
@Setter
public class CreateVersionRequest {
    // Optional: client can pass nothing; server resolves the latest version to clone from
    private Long baseVersionId;
}
