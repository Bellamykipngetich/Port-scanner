# CyberTool: Tactical Network Port Scanner

A military-grade network reconnaissance tool built with a high-performance C++17 multi-threaded scanner engine, Java Spring Boot backend, and a tactical HUD-style web interface. Deployable locally, via Docker, or on cloud platforms.

![License](https://img.shields.io/badge/license-MIT-blue)
![Java](https://img.shields.io/badge/Java-21-orange)
![C++](https://img.shields.io/badge/C++-17-blue)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-green)

---

## Features

- **Multi-Threaded C++ Scanner Engine** - Up to 100 concurrent threads for high-speed TCP port scanning
- **Service Detection** - Automatic identification of 60+ common services (HTTP, SSH, FTP, MySQL, Redis, etc.)
- **Banner Grabbing** - Captures service banners for fingerprinting
- **Risk Assessment** - Ports classified as LOW / MEDIUM / HIGH risk
- **Tactical HUD Interface** - Military-grade robotic UI with 360-degree radar visualization
- **Real-Time Logging** - Live operation log with timestamped entries
- **Scan History** - Session-based scan history tracking
- **Input Validation** - Server-side host sanitization to prevent command injection
- **JSON API** - Clean REST API for programmatic access
- **Docker Ready** - Multi-stage Docker build for minimal image size
- **Health Check Endpoint** - Built-in `/api/health` for monitoring

---

## Architecture

```
+-------------------+       +---------------------+       +-------------------+
|   Web Browser     | ----> |  Spring Boot API    | ----> |  C++ Scanner      |
|   (HUD Frontend)  | <---- |  (Java 21)          | <---- |  (Multi-threaded) |
+-------------------+       +---------------------+       +-------------------+
        |                           |                            |
   Tactical UI              REST /api/scan               TCP SYN Connect
   Radar Display            Input Validation             Banner Grabbing
   Scan History             JSON Parsing                 Service Detection
```

---

## Prerequisites

### For Local Development
| Tool | Version | Purpose |
|------|---------|---------|
| JDK | 21+ | Java backend |
| Maven | 3.9+ | Build tool |
| GCC/G++ | 11+ | C++ scanner compilation |
| CMake | 3.10+ | C++ build system |

### For Docker (Recommended)
| Tool | Version |
|------|---------|
| Docker | 20.10+ |
| Docker Compose | 2.0+ (optional) |

---

## Quick Start with Docker (Recommended)

This is the easiest way to run CyberTool. Docker handles all compilation and dependencies.

### Option A: Docker Compose

```bash
# Clone the repository
git clone https://github.com/ArapKBett/Port-scanner.git
cd Port-scanner

# Build and run
docker compose up --build

# Access the UI
# Open http://localhost:8080 in your browser
```

### Option B: Docker Manual Build

```bash
# Build the image
docker build -t cybertool .

# Run the container
docker run -d --name cybertool -p 8080:8080 cybertool

# Check health
curl http://localhost:8080/api/health

# View logs
docker logs -f cybertool

# Stop
docker stop cybertool && docker rm cybertool
```

---

## Local Development Setup (Without Docker)

### Step 1: Build the C++ Scanner

```bash
cd c++_scanner
mkdir -p build && cd build
cmake ..
make
cd ../..
```

Verify it works:
```bash
./c++_scanner/build/scanner scanme.nmap.org 80 80
```

You should see JSON output with scan results.

### Step 2: Copy the Scanner Binary

The Spring Boot app expects the scanner at `/app/scanner`. For local development, update `ScanService.java` or create a symlink:

```bash
# Option A: Symlink (requires sudo)
sudo mkdir -p /app
sudo cp c++_scanner/build/scanner /app/scanner
sudo chmod +x /app/scanner

# Option B: Or edit ScanService.java line 48 to point to your local path:
#   new ProcessBuilder("./c++_scanner/build/scanner", ...)
```

### Step 3: Build and Run the Java Backend

```bash
cd java_backend

# Build
mvn clean package -DskipTests

# Run
mvn spring-boot:run

# Or run the JAR directly
java -jar target/cyber-backend-1.0-SNAPSHOT.jar
```

### Step 4: Access the Application

Open your browser and navigate to:
```
http://localhost:8080
```

---

## API Reference

### Scan Ports

```
GET /api/scan?host={host}&startPort={start}&endPort={end}
```

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| host | string | Yes | - | Target hostname or IP address |
| startPort | int | No | 1 | Start of port range (1-65535) |
| endPort | int | No | 1024 | End of port range (1-65535) |

**Constraints:**
- Maximum port range: 10,000 ports per scan
- Host must be a valid hostname or IPv4 address
- Scan timeout: 300 seconds

**Example Request:**
```bash
curl "http://localhost:8080/api/scan?host=scanme.nmap.org&startPort=20&endPort=100"
```

**Example Response:**
```json
{
  "host": "scanme.nmap.org",
  "ip": "45.33.32.156",
  "startPort": 20,
  "endPort": 100,
  "totalScanned": 81,
  "scanDurationMs": 2340,
  "status": "completed",
  "timestamp": "2026-04-06T12:00:00Z",
  "openPorts": [
    {
      "port": 22,
      "service": "SSH",
      "banner": "OpenSSH_6.6.1p1 Ubuntu-2ubuntu2.13",
      "latencyMs": 45
    },
    {
      "port": 80,
      "service": "HTTP",
      "banner": "",
      "latencyMs": 38
    }
  ]
}
```

### Health Check

```
GET /api/health
```

**Response:**
```json
{
  "status": "operational",
  "service": "CyberTool Scanner"
}
```

---

## Cloud Deployment

### Deploy to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) and create a new **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Runtime**: Docker
   - **Branch**: main
   - **Instance Type**: Free or Starter
5. Render will auto-detect the `Dockerfile` and build
6. Once deployed, access via your Render URL

### Deploy to Railway

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) and create a new project
3. Select **Deploy from GitHub repo**
4. Railway auto-detects the Dockerfile
5. Set the port variable if needed: `PORT=8080`
6. Deploy and access via Railway's generated URL

### Deploy to Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch (from project root)
fly launch --name cybertool --region ord

# Deploy
fly deploy

# Open in browser
fly open
```

### Deploy to Google Cloud Run

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/cybertool

# Deploy
gcloud run deploy cybertool \
  --image gcr.io/YOUR_PROJECT_ID/cybertool \
  --platform managed \
  --port 8080 \
  --allow-unauthenticated
```

---

## Project Structure

```
Port-scanner/
├── Dockerfile              # Multi-stage build (C++ -> Java -> Runtime)
├── docker-compose.yml      # One-command local deployment
├── README.md
├── c++_scanner/
│   ├── CMakeLists.txt      # CMake build config with threading
│   └── src/
│       └── scanner.cpp     # Multi-threaded port scanner with JSON output
└── java_backend/
    ├── pom.xml             # Maven config (Spring Boot 3.3.4, Java 21)
    └── src/main/
        ├── java/com/cybertool/
        │   ├── Application.java
        │   ├── controller/
        │   │   └── ScanController.java   # REST API endpoints
        │   ├── model/
        │   │   └── ScanResult.java       # Response model with PortInfo
        │   └── service/
        │       └── ScanService.java      # Input validation + process management
        └── resources/
            ├── application.properties
            └── static/
                ├── index.html            # Tactical HUD layout
                ├── css/style.css         # Military-grade robotic theme
                └── js/
                    ├── background.js     # Network topology animation
                    ├── radar.js          # 360° radar sweep visualization
                    └── script.js         # Application controller
```

---

## Security Notes

- Host input is validated against strict regex patterns to prevent command injection
- The C++ scanner binary is executed with controlled arguments only
- Port range is capped at 10,000 to prevent abuse
- Docker container runs as non-root user
- No credentials or secrets are stored in the application

---

## License

MIT License - see [LICENSE](LICENSE) for details.
