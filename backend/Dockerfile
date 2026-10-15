# --- Stage 1: Build the JAR ---
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app

# Copy dependency definitions first (caches layers for faster builds)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build the application executable
COPY src ./src
RUN mvn package -DskipTests

# --- Stage 2: Production Runtime ---
FROM eclipse-temurin-17-jre-alpine
WORKDIR /app

# Create a non-root user for security best practices
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy the compiled JAR from Stage 1
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]