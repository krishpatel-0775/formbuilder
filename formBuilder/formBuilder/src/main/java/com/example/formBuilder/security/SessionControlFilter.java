package com.example.formBuilder.security;

import com.example.formBuilder.entity.User;
import com.example.formBuilder.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(5)
@RequiredArgsConstructor
public class SessionControlFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String username = SessionUtil.getCurrentUsername();

        if (username != null && !"anonymousUser".equals(username)) {
            org.slf4j.MDC.put("user", username);
            HttpSession session = request.getSession(false);
            
            if (session != null) {
                String currentSessionId = session.getId();
                
                User user = userRepository.findByUsername(username).orElse(null);
                
                if (user != null && user.getLastSessionId() != null && !user.getLastSessionId().equals(currentSessionId)) {
                    // Mismatch found - invalidate session
                    session.invalidate();
                    SecurityContextHolder.clearContext();
                    
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\": \"Session invalidated due to concurrent login\"}");
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
