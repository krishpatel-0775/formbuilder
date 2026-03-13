package com.example.formBuilder;
// ... existing imports ...
import com.example.formBuilder.service.ModuleService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class FormBuilderApplication {

	public static void main(String[] args) {
		SpringApplication.run(FormBuilderApplication.class, args);
	}

	@Bean
	CommandLineRunner init(ModuleService moduleService) {
		return args -> {
			moduleService.seedModules();
		};
	}
}
