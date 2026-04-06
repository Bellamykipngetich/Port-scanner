/* =========================================
   CYBERTOOL - TACTICAL RADAR DISPLAY
   360-degree rotating sweep with port markers
   ========================================= */

(function() {
    const canvas = document.getElementById('radarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let size = 300;
    let center, radius;
    let sweepAngle = 0;
    let portMarkers = [];
    let isScanning = false;

    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        size = Math.min(rect.width - 24, 300);
        canvas.width = size;
        canvas.height = size;
        center = size / 2;
        radius = center - 10;
    }

    resize();
    window.addEventListener('resize', resize);

    class PortMarker {
        constructor(port, maxPort) {
            const portAngle = ((port % 360) / 360) * Math.PI * 2 - Math.PI / 2;
            const portRadius = (0.3 + Math.random() * 0.6) * radius;
            this.x = center + Math.cos(portAngle) * portRadius;
            this.y = center + Math.sin(portAngle) * portRadius;
            this.port = port;
            this.alpha = 1.0;
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.size = 3;
        }

        update() {
            this.pulsePhase += 0.05;
            this.alpha = Math.max(0.4, Math.sin(this.pulsePhase) * 0.3 + 0.7);
        }

        draw() {
            // Outer glow
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 4, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(118, 255, 3, ${this.alpha * 0.15})`;
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(118, 255, 3, ${this.alpha})`;
            ctx.fill();

            // Label
            ctx.font = '9px Share Tech Mono';
            ctx.fillStyle = `rgba(118, 255, 3, ${this.alpha * 0.8})`;
            ctx.textAlign = 'center';
            ctx.fillText(this.port, this.x, this.y - 8);
        }
    }

    function drawRadarBase() {
        // Background
        ctx.fillStyle = 'rgba(3, 10, 18, 0.95)';
        ctx.fillRect(0, 0, size, size);

        // Concentric rings
        for (let i = 1; i <= 4; i++) {
            ctx.beginPath();
            ctx.arc(center, center, (radius / 4) * i, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 229, 255, ${0.08 + i * 0.02})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // Cross hairs
        ctx.beginPath();
        ctx.moveTo(center, 10);
        ctx.lineTo(center, size - 10);
        ctx.moveTo(10, center);
        ctx.lineTo(size - 10, center);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Diagonal lines
        const diag = radius * 0.707;
        ctx.beginPath();
        ctx.moveTo(center - diag, center - diag);
        ctx.lineTo(center + diag, center + diag);
        ctx.moveTo(center + diag, center - diag);
        ctx.lineTo(center - diag, center + diag);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
        ctx.stroke();

        // Degree markers
        ctx.font = '8px Share Tech Mono';
        ctx.fillStyle = 'rgba(0, 229, 255, 0.3)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labels = ['0', '90', '180', '270'];
        const positions = [
            [center, 6],
            [size - 6, center],
            [center, size - 6],
            [6, center]
        ];
        labels.forEach((label, i) => {
            ctx.fillText(label, positions[i][0], positions[i][1]);
        });

        // Outer ring
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Tick marks every 30 degrees
        for (let i = 0; i < 360; i += 30) {
            const angle = (i * Math.PI) / 180;
            const innerR = radius - 5;
            const outerR = radius;
            ctx.beginPath();
            ctx.moveTo(center + Math.cos(angle) * innerR, center + Math.sin(angle) * innerR);
            ctx.lineTo(center + Math.cos(angle) * outerR, center + Math.sin(angle) * outerR);
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    function drawSweep() {
        // Sweep gradient
        const gradient = ctx.createConicalGradient
            ? null // Not widely supported, use arc approach
            : null;

        // Sweep trail (using multiple arcs for fade effect)
        const sweepLength = Math.PI / 3;
        for (let i = 0; i < 20; i++) {
            const segAngle = sweepAngle - (sweepLength / 20) * i;
            const alpha = (1 - i / 20) * (isScanning ? 0.25 : 0.08);

            ctx.beginPath();
            ctx.moveTo(center, center);
            ctx.arc(center, center, radius, segAngle - sweepLength / 20, segAngle);
            ctx.closePath();
            ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
            ctx.fill();
        }

        // Sweep line
        const lineAlpha = isScanning ? 0.8 : 0.2;
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(
            center + Math.cos(sweepAngle) * radius,
            center + Math.sin(sweepAngle) * radius
        );
        ctx.strokeStyle = `rgba(0, 229, 255, ${lineAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Sweep endpoint dot
        ctx.beginPath();
        ctx.arc(
            center + Math.cos(sweepAngle) * radius,
            center + Math.sin(sweepAngle) * radius,
            3, 0, Math.PI * 2
        );
        ctx.fillStyle = `rgba(0, 229, 255, ${lineAlpha})`;
        ctx.fill();
    }

    function drawCenterTarget() {
        const t = Date.now() / 1000;
        const pulse = Math.sin(t * 2) * 0.3 + 0.7;

        // Center dot
        ctx.beginPath();
        ctx.arc(center, center, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 229, 255, ${pulse})`;
        ctx.fill();

        // Center ring
        ctx.beginPath();
        ctx.arc(center, center, 8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 229, 255, ${pulse * 0.4})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function animate() {
        drawRadarBase();

        sweepAngle += isScanning ? 0.03 : 0.008;
        if (sweepAngle > Math.PI * 2) sweepAngle -= Math.PI * 2;

        drawSweep();

        portMarkers.forEach(m => {
            m.update();
            m.draw();
        });

        drawCenterTarget();

        requestAnimationFrame(animate);
    }

    animate();

    // Public API
    window.radarAPI = {
        setScanning: function(scanning) {
            isScanning = scanning;
        },
        clearMarkers: function() {
            portMarkers = [];
        },
        addPort: function(port, maxPort) {
            portMarkers.push(new PortMarker(port, maxPort || 65535));
        }
    };
})();
