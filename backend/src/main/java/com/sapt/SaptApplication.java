package com.sapt;

import com.sapt.model.User;
import com.sapt.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableAsync
public class SaptApplication {

	public static void main(String[] args) {
		SpringApplication.run(SaptApplication.class, args);
	}

	@Bean
	public CommandLineRunner initData(UserRepository userRepository) {
		return args -> {
			if (userRepository.findByUsername("admin").isEmpty()) {
				User admin = new User();
				admin.setName("System Admin");
				admin.setUsername("admin");
				admin.setPassword("admin123");
				admin.setRole("Admin");
				admin.setDepartment("-");
				admin.setEmail("admin@school.com");
				userRepository.save(admin);
				System.out.println("Default admin user created: admin / admin123");
			} else {
				System.out.println("Admin user already exists.");
			}
		};
	}
}
