/* =========================================
   CYBERTOOL - NETWORK TOPOLOGY BACKGROUND
   Animated particle network with data streams
   ========================================= */

(function() {
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');

    let width, height;
    const nodes = [];
    const dataPackets = [];
    const NODE_COUNT = 80;
    const CONNECTION_DIST = 180;
    const PACKET_SPEED = 2;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    // Network node
    class Node {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.radius = Math.random() * 2 + 1;
            this.type = Math.random();
            this.pulsePhase = Math.random() * Math.PI * 2;
            this.isServer = Math.random() < 0.08;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.pulsePhase += 0.02;

            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;

            if (this.isServer) {
                // Server nodes - hexagonal shape
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i - Math.PI / 6;
                    const r = 5 * pulse;
                    const px = Math.cos(angle) * r;
                    const py = Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.strokeStyle = `rgba(0, 229, 255, ${0.6 * pulse})`;
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = `rgba(0, 229, 255, ${0.1 * pulse})`;
                ctx.fill();
                ctx.restore();
            } else {
                // Regular nodes - dots
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 229, 255, ${0.3 * pulse})`;
                ctx.fill();
            }
        }
    }

    // Data packet traveling between nodes
    class DataPacket {
        constructor(fromNode, toNode) {
            this.from = fromNode;
            this.to = toNode;
            this.progress = 0;
            this.speed = 0.008 + Math.random() * 0.012;
            this.alive = true;
        }

        update() {
            this.progress += this.speed;
            if (this.progress >= 1) this.alive = false;
        }

        draw() {
            const x = this.from.x + (this.to.x - this.from.x) * this.progress;
            const y = this.from.y + (this.to.y - this.from.y) * this.progress;

            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(118, 255, 3, ${1 - this.progress})`;
            ctx.fill();

            // Trail
            const tx = this.from.x + (this.to.x - this.from.x) * Math.max(0, this.progress - 0.05);
            const ty = this.from.y + (this.to.y - this.from.y) * Math.max(0, this.progress - 0.05);
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(x, y);
            ctx.strokeStyle = `rgba(118, 255, 3, ${0.3 * (1 - this.progress)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    // Initialize nodes
    for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push(new Node());
    }

    // Spawn data packets periodically
    let packetTimer = 0;

    function spawnPacket() {
        if (nodes.length < 2) return;
        const from = nodes[Math.floor(Math.random() * nodes.length)];
        let to = from;
        let attempts = 0;
        while (to === from && attempts < 10) {
            to = nodes[Math.floor(Math.random() * nodes.length)];
            attempts++;
        }
        const dx = from.x - to.x;
        const dy = from.y - to.y;
        if (Math.sqrt(dx * dx + dy * dy) < CONNECTION_DIST * 1.5) {
            dataPackets.push(new DataPacket(from, to));
        }
    }

    function drawConnections() {
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONNECTION_DIST) {
                    const alpha = (1 - dist / CONNECTION_DIST) * 0.12;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.fillStyle = 'rgba(3, 10, 18, 0.15)';
        ctx.fillRect(0, 0, width, height);

        drawConnections();

        nodes.forEach(n => {
            n.update();
            n.draw();
        });

        // Manage data packets
        packetTimer++;
        if (packetTimer % 15 === 0) spawnPacket();

        for (let i = dataPackets.length - 1; i >= 0; i--) {
            dataPackets[i].update();
            dataPackets[i].draw();
            if (!dataPackets[i].alive) dataPackets.splice(i, 1);
        }

        requestAnimationFrame(animate);
    }

    // Initial clear
    ctx.fillStyle = 'rgba(3, 10, 18, 1)';
    ctx.fillRect(0, 0, width, height);

    animate();
})();
