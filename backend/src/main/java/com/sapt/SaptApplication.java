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
    @Bean(name = "taskExecutor")
    public java.util.concurrent.Executor taskExecutor() {
        org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor executor = new org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10); // Start with more threads
        executor.setMaxPoolSize(50); // Allow scaling up for large batches
        executor.setQueueCapacity(500); // Buffer more tasks (enough for a whole grade)
        executor.setThreadNamePrefix("Async-");
        // If queue is full, run in main thread instead of discarding (prevents data loss)
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
