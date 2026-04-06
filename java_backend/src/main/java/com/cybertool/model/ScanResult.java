package com.cybertool.model;

import java.time.Instant;
import java.util.List;

public class ScanResult {
    private String host;
    private String ip;
    private int startPort;
    private int endPort;
    private int totalScanned;
    private int scanDurationMs;
    private String status;
    private String timestamp;
    private List<PortInfo> openPorts;
    private String error;

    public ScanResult() {
        this.timestamp = Instant.now().toString();
        this.status = "completed";
    }

    public static ScanResult error(String message) {
        ScanResult r = new ScanResult();
        r.status = "error";
        r.error = message;
        return r;
    }

    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }
    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }
    public int getStartPort() { return startPort; }
    public void setStartPort(int startPort) { this.startPort = startPort; }
    public int getEndPort() { return endPort; }
    public void setEndPort(int endPort) { this.endPort = endPort; }
    public int getTotalScanned() { return totalScanned; }
    public void setTotalScanned(int totalScanned) { this.totalScanned = totalScanned; }
    public int getScanDurationMs() { return scanDurationMs; }
    public void setScanDurationMs(int scanDurationMs) { this.scanDurationMs = scanDurationMs; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public List<PortInfo> getOpenPorts() { return openPorts; }
    public void setOpenPorts(List<PortInfo> openPorts) { this.openPorts = openPorts; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public static class PortInfo {
        private int port;
        private String service;
        private String banner;
        private int latencyMs;

        public PortInfo() {}

        public int getPort() { return port; }
        public void setPort(int port) { this.port = port; }
        public String getService() { return service; }
        public void setService(String service) { this.service = service; }
        public String getBanner() { return banner; }
        public void setBanner(String banner) { this.banner = banner; }
        public int getLatencyMs() { return latencyMs; }
        public void setLatencyMs(int latencyMs) { this.latencyMs = latencyMs; }
    }
}
