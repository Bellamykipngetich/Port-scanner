package com.cybertool.controller;

import com.cybertool.model.ScanResult;
import com.cybertool.service.ScanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ScanController {

    @Autowired
    private ScanService scanService;

    @GetMapping("/scan")
    public ScanResult scan(@RequestParam String host,
                           @RequestParam int startPort,
                           @RequestParam int endPort) throws Exception {
        return scanService.scanHost(host, startPort, endPort);
    }
}
