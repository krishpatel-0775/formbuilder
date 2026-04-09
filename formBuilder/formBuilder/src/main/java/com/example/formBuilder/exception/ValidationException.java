package com.example.formBuilder.exception;

import lombok.Getter;
import java.util.List;
import java.util.Map;

@Getter
public class ValidationException extends RuntimeException {
    private final Map<String, List<String>> errors;

    public ValidationException(String message) {
        super(message);
        this.errors = null;
    }

    public ValidationException(Map<String, List<String>> errors) {
        super("Validation failed");
        this.errors = errors;
    }
}
