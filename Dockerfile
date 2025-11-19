FROM eclipse-temurin:21-jre-alpine

LABEL maintainer="Sistema Multiservicios"
LABEL description="Backend Spring Boot para Sistema de Gestión Multiservicios"

WORKDIR /app

# Copiar el JAR compilado
COPY target/multiservices-1.0.0.jar app.jar

# Exponer puerto del backend
EXPOSE 8081

# Variables de entorno por defecto
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-Xmx512m -Xms256m"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8081/actuator/health || exit 1

# Ejecutar la aplicación
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
