package com.cybertool.controller;

import com.cybertool.model.ScanResult;
import com.cybertool.service.ScanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ScanController {

    @Autowired
    private ScanService scanService;

    @GetMapping("/scan")
    public ResponseEntity<ScanResult> scan(
            @RequestParam String host,
            @RequestParam(defaultValue = "1") int startPort,
            @RequestParam(defaultValue = "1024") int endPort) {

        ScanResult result = scanService.scanHost(host, startPort, endPort);

        if ("error".equals(result.getStatus())) {
            return ResponseEntity.badRequest().body(result);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("{\"status\":\"operational\",\"service\":\"CyberTool Scanner\"}");
    }
}
