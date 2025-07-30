package com.cybertool.service;

import com.cybertool.model.ScanResult;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;

@Service
public class ScanService {

    public ScanResult scanHost(String host, int startPort, int endPort) {
        StringBuilder output = new StringBuilder();
        int exitCode;

        try {
            // Absolute path to the scanner binary (placed by Dockerfile)
            ProcessBuilder pb = new ProcessBuilder("/app/scanner",
                    host,
                    String.valueOf(startPort),
                    String.valueOf(endPort));
            pb.redirectErrorStream(true); // Merge stderr into stdout

            Process process = pb.start();

            // Read scanner output
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            exitCode = process.waitFor();
            if (exitCode != 0) {
                return new ScanResult("Scanner failed with code " + exitCode);
            }

            // Return result wrapped in your ScanResult model
            return new ScanResult(output.toString());

        } catch (Exception e) {
            e.printStackTrace();
            return new ScanResult("Error running scanner: " + e.getMessage());
        }
    }
}
