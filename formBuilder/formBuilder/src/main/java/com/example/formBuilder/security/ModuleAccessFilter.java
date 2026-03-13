package com.example.formBuilder.security;

import com.example.formBuilder.service.ModuleService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class ModuleAccessFilter extends OncePerRequestFilter {

    private final ModuleService moduleService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String username = SessionUtil.getCurrentUsername();

        // Only filter API requests that require authentication
        // Auth and public forms are already handled in SecurityConfig permitAll or in hasAccessToPath
        if (path.startsWith("/api/") && !path.startsWith("/api/auth/login") && !path.startsWith("/api/auth/register")) {
            
            // For public form submission/viewing, we might want to bypass or handle separately
            // However, hasAccessToPath can handle it if we want it to.
            // But usually public endpoints shouldn't be blocked by module access if they are permitAll.
            
            // Let's check permissions only if there is a logged-in user
            if (username != null) {
                boolean hasAccess = moduleService.hasAccessToPath(username, path);
                
                if (!hasAccess) {
                    // Check if it's one of the permitAll paths in SecurityConfig
                    // Actually, if it's permitAll, it shouldn't even reach here in a way that blocks valid public use
                    // But to be safe, let's allow it if it's a known public endpoint that doesn't map to a module
                    if (!isPublicEndpoint(path)) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.getWriter().write("{\"success\":false, \"message\":\"Access Denied: Module permission required\"}");
                        response.setContentType("application/json");
                        return;
                    }
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicEndpoint(String path) {
        // Paths that are permitAll in SecurityConfig but NOT associated with a specific protected module
        return path.startsWith("/api/auth/") || 
               path.startsWith("/api/modules/seed") ||
               path.startsWith("/v3/api-docs") || 
               path.startsWith("/swagger-ui");
    }
}
