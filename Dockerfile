# ========================
# Stage 1: Build C++ Scanner
# ========================
FROM ubuntu:22.04 AS cpp-builder

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/cpp_scanner
COPY c++_scanner/ .

RUN mkdir -p build && cd build && cmake .. && make

# =========================
# Stage 2: Build Java Backend
# =========================
FROM maven:3.9.6-eclipse-temurin-21 AS java-builder

WORKDIR /app/java_backend

COPY java_backend/pom.xml .
RUN mvn dependency:go-offline

COPY java_backend/src ./src

RUN mvn clean package -DskipTests

# =========================
# Stage 3: Runtime Image
# =========================
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy JAR and C++ binary
COPY --from=java-builder /app/java_backend/target/cyber-backend-1.0-SNAPSHOT.jar .
COPY --from=cpp-builder /app/cpp_scanner/build/scanner ./scanner

RUN chmod +x ./scanner

# Non-root user for security
RUN groupadd -r cybertool && useradd -r -g cybertool cybertool
RUN chown -R cybertool:cybertool /app
USER cybertool

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "cyber-backend-1.0-SNAPSHOT.jar"]
