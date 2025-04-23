# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
COPY java_backend/pom.xml .
RUN mvn dependency:go-offline
COPY java_backend/src ./src
RUN mvn package

# Runtime stage
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /app/target/cyber-backend-1.0-SNAPSHOT.jar .
COPY c++_scanner/build/scanner ./scanner
RUN chmod +x ./scanner
EXPOSE 8080
CMD ["java", "-jar", "cyber-backend-1.0-SNAPSHOT.jar"]
