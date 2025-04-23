# Stage 1: Build C++ scanner
FROM ubuntu:22.04 AS cpp-builder
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app/c++_scanner
COPY c++_scanner/ .
RUN mkdir build && cd build && cmake .. && make

# Stage 2: Build Java application
FROM maven:3.9.6-eclipse-temurin-17 AS java-builder
WORKDIR /app/java_backend
COPY java_backend/pom.xml .
RUN mvn dependency:go-offline
COPY java_backend/src ./src
RUN mvn clean package

# Stage 3: Runtime image
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=java-builder /app/java_backend/target/cyber-backend-1.0-SNAPSHOT.jar .
COPY --from=cpp-builder /app/c++_scanner/build/scanner ./scanner
RUN chmod +x ./scanner
EXPOSE 8080
CMD ["java", "-jar", "cyber-backend-1.0-SNAPSHOT.jar"]
