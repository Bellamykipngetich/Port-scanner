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

# Set working directory and copy C++ code
WORKDIR /app/cpp_scanner
COPY c++_scanner/ .

# Create build directory and compile
RUN mkdir build && \
    cd build && \
    cmake .. && \
    make

# =========================
# Stage 2: Build Java Backend
# =========================
FROM maven:3.9.6-eclipse-temurin-21 AS java-builder

WORKDIR /app/java_backend

# Copy Maven config and download dependencies first (better caching)
COPY java_backend/pom.xml .
RUN mvn dependency:go-offline

# Copy actual source code
COPY java_backend/src ./src

# Build the JAR
RUN mvn clean package -DskipTests

# =========================
# Stage 3: Runtime Image
# =========================
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy backend JAR and C++ binary
COPY --from=java-builder /app/java_backend/target/cyber-backend-1.0-SNAPSHOT.jar .
COPY --from=cpp-builder /app/cpp_scanner/build/scanner ./scanner

# Make sure the scanner is executable
RUN chmod +x ./scanner

# Expose backend port
EXPOSE 8080

# Start the Spring Boot application
CMD ["java", "-jar", "cyber-backend-1.0-SNAPSHOT.jar"]
