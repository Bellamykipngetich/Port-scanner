/* =========================================
   CYBERTOOL - MAIN APPLICATION CONTROLLER
   ========================================= */

(function() {
    // DOM Elements
    const form = document.getElementById('scanForm');
    const hostInput = document.getElementById('host');
    const startPortInput = document.getElementById('startPort');
    const endPortInput = document.getElementById('endPort');
    const scanBtn = document.getElementById('scanBtn');
    const scanStatus = document.getElementById('scanStatus');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressTimer = document.getElementById('progressTimer');
    const resultsPanel = document.getElementById('resultsPanel');
    const resultsBody = document.getElementById('resultsBody');
    const resultsCount = document.getElementById('resultsCount');
    const logOutput = document.getElementById('logOutput');
    const clearLogBtn = document.getElementById('clearLog');
    const historyList = document.getElementById('historyList');
    const footerStatus = document.getElementById('footerStatus');
    const clockDisplay = document.getElementById('clockDisplay');
    const scanCountDisplay = document.getElementById('scanCount');

    // State
    let scanHistory = [];
    let totalScans = 0;
    let timerInterval = null;
    let scanStartTime = null;

    // High-risk ports (commonly targeted)
    const HIGH_RISK_PORTS = new Set([21, 23, 25, 135, 137, 138, 139, 445, 1433, 1434, 3389, 5900, 11211]);
    const MEDIUM_RISK_PORTS = new Set([22, 53, 80, 110, 143, 389, 443, 636, 993, 995, 3306, 5432, 6379, 8080, 8443, 9200, 27017]);

    // Clock
    function updateClock() {
        const now = new Date();
        clockDisplay.textContent = now.toTimeString().split(' ')[0];
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Logging
    function log(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        const timestamp = new Date().toTimeString().split(' ')[0];
        const prefix = type === 'system' ? 'SYS' : type === 'success' ? 'OK ' : type === 'error' ? 'ERR' : type === 'warning' ? 'WRN' : 'INF';
        entry.textContent = `[${timestamp}] [${prefix}] ${message}`;
        logOutput.appendChild(entry);
        logOutput.scrollTop = logOutput.scrollHeight;
    }

    // Clear log
    clearLogBtn.addEventListener('click', () => {
        logOutput.innerHTML = '';
        log('Log cleared', 'system');
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            startPortInput.value = btn.dataset.start;
            endPortInput.value = btn.dataset.end;
            log(`Preset applied: ports ${btn.dataset.start}-${btn.dataset.end}`, 'info');
        });
    });

    // Risk assessment
    function getRisk(port, service) {
        if (HIGH_RISK_PORTS.has(port)) return 'high';
        if (MEDIUM_RISK_PORTS.has(port)) return 'medium';
        if (port < 1024) return 'medium';
        return 'low';
    }

    function getRiskLabel(risk) {
        switch(risk) {
            case 'high': return 'HIGH';
            case 'medium': return 'MED';
            default: return 'LOW';
        }
    }

    // Latency class
    function getLatencyClass(ms) {
        if (ms < 100) return 'latency-fast';
        if (ms < 500) return 'latency-medium';
        return 'latency-slow';
    }

    // Sanitize text for display
    function esc(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Timer
    function startTimer() {
        scanStartTime = Date.now();
        timerInterval = setInterval(() => {
            const elapsed = ((Date.now() - scanStartTime) / 1000).toFixed(1);
            progressTimer.textContent = elapsed + 's';
        }, 100);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    // Progress simulation
    function simulateProgress() {
        let progress = 0;
        progressContainer.style.display = 'block';
        progressFill.style.width = '0%';

        const interval = setInterval(() => {
            if (progress < 85) {
                progress += Math.random() * 8;
                progressFill.style.width = Math.min(progress, 85) + '%';
            }
        }, 200);

        return {
            complete: () => {
                clearInterval(interval);
                progressFill.style.width = '100%';
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                }, 1000);
            },
            fail: () => {
                clearInterval(interval);
                progressFill.style.background = 'var(--danger)';
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                    progressFill.style.background = '';
                }, 2000);
            }
        };
    }

    // Set scanning state
    function setScanningState(scanning) {
        scanBtn.disabled = scanning;
        if (scanning) {
            scanBtn.classList.add('scanning');
            scanBtn.querySelector('.btn-text').textContent = 'SCANNING...';
            scanStatus.textContent = 'ACTIVE';
            scanStatus.style.color = 'var(--warning)';
            scanStatus.style.borderColor = 'var(--warning)';
            footerStatus.textContent = 'STATUS: SCANNING';
            if (window.radarAPI) window.radarAPI.setScanning(true);
        } else {
            scanBtn.classList.remove('scanning');
            scanBtn.querySelector('.btn-text').textContent = 'INITIATE SCAN';
            scanStatus.textContent = 'STANDBY';
            scanStatus.style.color = '';
            scanStatus.style.borderColor = '';
            footerStatus.textContent = 'STATUS: IDLE';
            if (window.radarAPI) window.radarAPI.setScanning(false);
        }
    }

    // Render results
    function renderResults(result) {
        resultsPanel.style.display = 'block';
        resultsBody.innerHTML = '';

        const ports = result.openPorts || [];
        resultsCount.textContent = ports.length + ' PORT' + (ports.length !== 1 ? 'S' : '') + ' DETECTED';

        if (ports.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="6" style="text-align:center;color:var(--text-dim);padding:30px;">NO OPEN PORTS DETECTED IN RANGE</td>';
            resultsBody.appendChild(row);
            return;
        }

        ports.forEach((p, i) => {
            const risk = getRisk(p.port, p.service);
            const latencyClass = getLatencyClass(p.latencyMs);
            const row = document.createElement('tr');
            row.style.animationDelay = (i * 0.05) + 's';
            row.innerHTML = `
                <td><span class="port-number">${p.port}</span></td>
                <td><span class="state-open">OPEN</span></td>
                <td><span class="service-name">${esc(p.service || 'UNKNOWN')}</span></td>
                <td><span class="banner-text" title="${esc(p.banner || '')}">${esc(p.banner || '--')}</span></td>
                <td><span class="${latencyClass}">${p.latencyMs}ms</span></td>
                <td><span class="risk-${risk}">${getRiskLabel(risk)}</span></td>
            `;
            resultsBody.appendChild(row);

            // Add to radar
            if (window.radarAPI) {
                window.radarAPI.addPort(p.port, result.endPort || 65535);
            }
        });
    }

    // Update radar stats
    function updateStats(result) {
        const open = (result.openPorts || []).length;
        const total = result.totalScanned || 0;
        document.getElementById('statOpen').textContent = open;
        document.getElementById('statClosed').textContent = total - open;
        document.getElementById('statDuration').textContent = result.scanDurationMs || '--';
        document.getElementById('statTarget').textContent = (result.ip || result.host || '--').substring(0, 15);
    }

    // Add to history
    function addToHistory(result) {
        const item = {
            host: result.host || 'unknown',
            ip: result.ip || '',
            ports: (result.openPorts || []).length,
            range: `${result.startPort}-${result.endPort}`,
            duration: result.scanDurationMs,
            time: new Date().toLocaleTimeString()
        };
        scanHistory.unshift(item);
        if (scanHistory.length > 20) scanHistory.pop();

        renderHistory();
    }

    function renderHistory() {
        if (scanHistory.length === 0) {
            historyList.innerHTML = '<div class="history-empty">No previous scans in this session</div>';
            return;
        }

        historyList.innerHTML = scanHistory.map((h, i) => `
            <div class="history-item" data-index="${i}">
                <span class="history-host">${esc(h.host)}</span>
                <span style="color:var(--text-dim)">:</span>
                <span style="color:var(--text)">${h.range}</span>
                <span class="history-ports">${h.ports} open</span>
                <span style="color:var(--text-dim)">${h.duration}ms</span>
                <span class="history-time">${h.time}</span>
            </div>
        `).join('');
    }

    // Form submit - Execute scan
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const host = hostInput.value.trim();
        const startPort = parseInt(startPortInput.value);
        const endPort = parseInt(endPortInput.value);

        // Client-side validation
        if (!host) {
            log('Target host is required', 'error');
            return;
        }

        if (isNaN(startPort) || isNaN(endPort) || startPort < 1 || endPort > 65535 || startPort > endPort) {
            log('Invalid port range', 'error');
            return;
        }

        if ((endPort - startPort + 1) > 10000) {
            log('Port range too large. Maximum 10,000 ports per scan.', 'error');
            return;
        }

        // Start scan
        setScanningState(true);
        const progress = simulateProgress();
        startTimer();

        if (window.radarAPI) window.radarAPI.clearMarkers();

        log(`Initiating scan on ${host}`, 'info');
        log(`Port range: ${startPort}-${endPort} (${endPort - startPort + 1} ports)`, 'info');
        log('Resolving target hostname...', 'info');

        try {
            const url = `/api/scan?host=${encodeURIComponent(host)}&startPort=${startPort}&endPort=${endPort}`;
            const response = await fetch(url);
            const result = await response.json();

            stopTimer();

            if (result.status === 'error' || !response.ok) {
                progress.fail();
                log(`Scan failed: ${result.error || 'Unknown error'}`, 'error');
                setScanningState(false);
                return;
            }

            progress.complete();

            // Log results
            log(`Target resolved: ${result.host} -> ${result.ip}`, 'success');
            log(`Scan completed in ${result.scanDurationMs}ms`, 'success');
            log(`Scanned ${result.totalScanned} ports, ${(result.openPorts || []).length} open`, 'success');

            (result.openPorts || []).forEach(p => {
                const risk = getRisk(p.port, p.service);
                const riskTag = risk === 'high' ? ' [HIGH RISK]' : risk === 'medium' ? ' [MEDIUM RISK]' : '';
                log(`Port ${p.port} OPEN - ${p.service}${p.banner ? ' | ' + p.banner : ''}${riskTag}`,
                    risk === 'high' ? 'warning' : 'success');
            });

            // Render
            renderResults(result);
            updateStats(result);
            addToHistory(result);

            totalScans++;
            scanCountDisplay.textContent = `SCANS: ${totalScans}`;

        } catch (error) {
            stopTimer();
            progress.fail();
            log(`Network error: ${error.message}`, 'error');
            log('Check target host and try again', 'warning');
        }

        setScanningState(false);
    });

    // Initial log
    log('All systems nominal. Ready for reconnaissance.', 'system');

})();
