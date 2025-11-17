package com.empresa.multiservices.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String password = "admin123";
        String encodedPassword = encoder.encode(password);

        System.out.println("Contraseña: " + password);
        System.out.println("Hash BCrypt: " + encodedPassword);

        // Verificar que el hash funciona
        boolean matches = encoder.matches(password, encodedPassword);
        System.out.println("Verificación: " + matches);
    }
}
