package com.example.formBuilder.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter to log activity after authentication is established.
 * Order is set to run after Spring Security filters to ensure user identity is available.
 */
@Slf4j
@Component
@Order(10) // Run after MdcFilter (MIN_VALUE) and SessionControlFilter
public class ActivityLoggingFilter extends OncePerRequestFilter {

    private static final long SLOW_THRESHOLD_MS = 1000;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        long startTime = System.currentTimeMillis();

        try {
            filterChain.doFilter(request, response);

            // ── Extract User Identity
            String username = MDC.get("user");
            if (username == null || username.isBlank() || "anonymousUser".equals(username)) {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated()) {
                    username = auth.getName();
                    MDC.put("user", username); // Ensure MDC is updated for any downstream logs
                } else {
                    username = "anonymous";
                }
            }

            // ── Log Performance & Activity
            long duration = System.currentTimeMillis() - startTime;
            int status = response.getStatus();
            String method = request.getMethod();
            String uri = request.getRequestURI();

            // Skip common noise
            if (shouldSkipLogging(method, uri, status)) {
                return;
            }

            if (duration > SLOW_THRESHOLD_MS) {
                log.warn("SLOW REQUEST - [{} {}] status={} duration={}ms user={} reqId={}",
                        method, uri, status, duration, username, MDC.get("requestId"));
            } else {
                log.info("Activity: [{} {}] status={} duration={}ms user={} reqId={}",
                        method, uri, status, duration, username, MDC.get("requestId"));
            }

        } finally {
            // Context is cleared in MdcFilter
        }
    }

    private boolean shouldSkipLogging(String method, String uri, int status) {
        // Only log state changes, authentication, or errors by default
        boolean isAuth = uri.contains("/auth/");
        boolean isStateChange = !"GET".equalsIgnoreCase(method) && !"OPTIONS".equalsIgnoreCase(method);
        boolean isError = status >= 400;
        
        return !(isAuth || isStateChange || isError);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.contains("/swagger-ui") || path.contains("/v3/api-docs") || path.contains("/static");
    }
}
