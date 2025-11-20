package com.empresa.multiservices;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MultiservicesApplication {

	public static void main(String[] args) {
		SpringApplication.run(MultiservicesApplication.class, args);
	}

}
