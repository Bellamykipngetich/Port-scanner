package com.cybertool.model;

import java.util.List;

public class ScanResult {
    private String host;
    private List<Integer> openPorts;

    // Constructors
    public ScanResult() {}
    public ScanResult(String host, List<Integer> openPorts) {
        this.host = host;
        this.openPorts = openPorts;
    }

    // Getters and Setters
    public String getHost() {
        return host;
    }
    public void setHost(String host) {
        this.host = host;
    }
    public List<Integer> getOpenPorts() {
        return openPorts;
    }
    public void setOpenPorts(List<Integer> openPorts) {
        this.openPorts = openPorts;
    }
}
