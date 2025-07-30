# ========================
# Stage 1: Build C++ Scanner
# ========================
FROM ubuntu:22.04 AS cpp-builder

# Install build tools
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory and copy source code
WORKDIR /app/cpp_scanner
COPY c++_scanner/ .

# Build the C++ scanner
RUN mkdir -p build && cd build && cmake .. && make

# =========================
# Stage 2: Build Java Backend
# =========================
FROM maven:3.9.6-eclipse-temurin-21 AS java-builder

WORKDIR /app/java_backend

# Cache dependencies
COPY java_backend/pom.xml .
RUN mvn dependency:go-offline

# Copy source
COPY java_backend/src ./src

# Build the Spring Boot JAR
RUN mvn clean package -DskipTests

# =========================
# Stage 3: Runtime Image
# =========================
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy JAR and C++ binary from previous stages
COPY --from=java-builder /app/java_backend/target/cyber-backend-1.0-SNAPSHOT.jar .
COPY --from=cpp-builder /app/cpp_scanner/build/scanner ./scanner

# Make C++ binary executable
RUN chmod +x ./scanner

# Expose application port for Render
EXPOSE 8080

# Start the Spring Boot server
CMD ["java", "-jar", "cyber-backend-1.0-SNAPSHOT.jar"]
