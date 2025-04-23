package com.cybertool.service;

import com.cybertool.model.ScanResult;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

@Service
public class ScanService {

    public ScanResult scanHost(String host, int startPort, int endPort) throws Exception {
        List<Integer> openPorts = new ArrayList<>();
        
        // Execute C++ scanner
        ProcessBuilder pb = new ProcessBuilder("./scanner", host, 
                                             String.valueOf(startPort), 
                                             String.valueOf(endPort));
        pb.redirectErrorStream(true);
        Process process = pb.start();
        
        // Read output
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        String line;
        while ((line = reader.readLine()) != null) {
            if (line.startsWith("Port ") && line.endsWith(" is open")) {
                try {
                    int port = Integer.parseInt(line.split(" ")[1]);
                    openPorts.add(port);
                } catch (NumberFormatException ignored) {}
            }
        }
        process.waitFor();
        
        return new ScanResult(host, openPorts);
    }
}
