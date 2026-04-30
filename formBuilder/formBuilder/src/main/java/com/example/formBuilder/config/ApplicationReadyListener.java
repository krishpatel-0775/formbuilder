package com.example.formBuilder.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * Listener to print a concise production-ready startup summary.
 */
@Slf4j
@Component
public class ApplicationReadyListener implements ApplicationListener<ApplicationReadyEvent> {

    private final Environment environment;

    public ApplicationReadyListener(Environment environment) {
        this.environment = environment;
    }

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        String port = environment.getProperty("server.port", "8080");
        String profiles = Arrays.toString(environment.getActiveProfiles());
        String dbUrl = environment.getProperty("spring.datasource.url");
        
        long uptimeSeconds = event.getTimeTaken().getSeconds();
        double uptimeMillis = event.getTimeTaken().toMillis() % 1000 / 1000.0;
        double totalUptime = uptimeSeconds + uptimeMillis;

        log.info("----------------------------------------------------------");
        log.info("Application 'Form Builder' is running!");
        log.info("Port:     {}", port);
        log.info("Profiles: {}", profiles);
        log.info("Database: {}", (dbUrl != null ? "CONNECTED (" + dbUrl.split(":")[1] + ")" : "UNKNOWN"));
        log.info("Startup:  {}s", String.format("%.2f", totalUptime));
        log.info("----------------------------------------------------------");
    }
}
