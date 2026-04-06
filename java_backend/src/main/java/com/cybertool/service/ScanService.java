package com.cybertool.service;

import com.cybertool.model.ScanResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

@Service
public class ScanService {

    private static final ObjectMapper mapper = new ObjectMapper();
    private static final Pattern HOST_PATTERN = Pattern.compile("^[a-zA-Z0-9][a-zA-Z0-9.\\-]{0,253}[a-zA-Z0-9]$");
    private static final Pattern IP_PATTERN = Pattern.compile("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$");
    private static final int MAX_PORT_RANGE = 10000;
    private static final int SCAN_TIMEOUT_SECONDS = 300;

    public ScanResult scanHost(String host, int startPort, int endPort) {
        // Input validation
        if (host == null || host.isBlank()) {
            return ScanResult.error("Host is required");
        }

        host = host.trim().toLowerCase();

        if (!HOST_PATTERN.matcher(host).matches() && !IP_PATTERN.matcher(host).matches()) {
            return ScanResult.error("Invalid host format. Use a valid hostname or IP address.");
        }

        if (startPort < 1 || startPort > 65535 || endPort < 1 || endPort > 65535) {
            return ScanResult.error("Ports must be between 1 and 65535");
        }

        if (startPort > endPort) {
            return ScanResult.error("Start port must be less than or equal to end port");
        }

        if ((endPort - startPort + 1) > MAX_PORT_RANGE) {
            return ScanResult.error("Port range too large. Maximum " + MAX_PORT_RANGE + " ports per scan.");
        }

        try {
            ProcessBuilder pb = new ProcessBuilder(
                "/app/scanner",
                host,
                String.valueOf(startPort),
                String.valueOf(endPort)
            );
            pb.redirectErrorStream(false);

            Process process = pb.start();

            StringBuilder stdout = new StringBuilder();
            StringBuilder stderr = new StringBuilder();

            Thread stdoutReader = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        stdout.append(line).append("\n");
                    }
                } catch (Exception ignored) {}
            });

            Thread stderrReader = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getErrorStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        stderr.append(line).append("\n");
                    }
                } catch (Exception ignored) {}
            });

            stdoutReader.start();
            stderrReader.start();

            boolean finished = process.waitFor(SCAN_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                return ScanResult.error("Scan timed out after " + SCAN_TIMEOUT_SECONDS + " seconds");
            }

            stdoutReader.join(5000);
            stderrReader.join(5000);

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                String errMsg = stderr.toString().trim();
                return ScanResult.error("Scanner failed (code " + exitCode + "): " + errMsg);
            }

            return parseJsonOutput(stdout.toString());

        } catch (Exception e) {
            return ScanResult.error("Internal error: " + e.getMessage());
        }
    }

    private ScanResult parseJsonOutput(String json) {
        try {
            JsonNode root = mapper.readTree(json);
            ScanResult result = new ScanResult();
            result.setHost(root.path("host").asText(""));
            result.setIp(root.path("ip").asText(""));
            result.setStartPort(root.path("startPort").asInt(0));
            result.setEndPort(root.path("endPort").asInt(0));
            result.setTotalScanned(root.path("totalScanned").asInt(0));
            result.setScanDurationMs(root.path("scanDurationMs").asInt(0));

            List<ScanResult.PortInfo> ports = new ArrayList<>();
            JsonNode portsNode = root.path("openPorts");
            if (portsNode.isArray()) {
                for (JsonNode pn : portsNode) {
                    ScanResult.PortInfo pi = new ScanResult.PortInfo();
                    pi.setPort(pn.path("port").asInt());
                    pi.setService(pn.path("service").asText("UNKNOWN"));
                    pi.setBanner(pn.path("banner").asText(""));
                    pi.setLatencyMs(pn.path("latencyMs").asInt(0));
                    ports.add(pi);
                }
            }
            result.setOpenPorts(ports);
            return result;

        } catch (Exception e) {
            return ScanResult.error("Failed to parse scanner output: " + e.getMessage());
        }
    }
}
