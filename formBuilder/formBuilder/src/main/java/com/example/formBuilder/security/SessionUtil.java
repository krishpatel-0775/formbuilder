package com.example.formBuilder.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

public class SessionUtil {

    public static String getCurrentAdminUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();

            if (principal instanceof UserDetails) {
                return ((UserDetails) principal).getUsername();
            } else if (principal instanceof String) {
                // In cases like anonymous user, the principal is just the string "anonymousUser"
                if (!"anonymousUser".equals(principal)) {
                    return (String) principal;
                }
            }
        }
        return null;
    }
}
