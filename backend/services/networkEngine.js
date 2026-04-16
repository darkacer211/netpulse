const { exec } = require('child_process');
const https = require('https');
const http = require('http');

/**
 * NetPulse Network Engine (v2.1 - Snappy)
 * Optimized for 3-second time-sliced measurement.
 */

const PING_TARGET = '8.8.8.8';
const DOWNLOAD_TEST_URL = 'https://speed.cloudflare.com/__down?bytes=50000000'; // 50MB (buffer for fast lines)
const UPLOAD_TEST_URL = 'https://httpbin.org/post';

// State
let lastLatency = 20;
let weatherState = 'Clear'; 
let simulationInterval = null;

const getLatency = () => {
    return new Promise((resolve) => {
        exec(`ping -n 1 ${PING_TARGET}`, (error, stdout) => {
            if (error) { resolve(lastLatency); return; }
            const match = stdout.match(/time[=<](\d+)ms/);
            if (match && match[1]) {
                lastLatency = parseInt(match[1]);
                resolve(lastLatency);
            } else { resolve(lastLatency); }
        });
    });
};

const runDownloadPhase = () => {
    return new Promise((resolve) => {
        const startTime = Date.now();
        let receivedBytes = 0;
        let resolved = false;
        
        const request = https.get(DOWNLOAD_TEST_URL, (res) => {
            res.on('data', (chunk) => {
                receivedBytes += chunk.length;
            });
            
            // Snap measurement at 3 seconds
            setTimeout(() => {
                if (resolved) return;
                resolved = true;
                const durationSeconds = (Date.now() - startTime) / 1000;
                const mbps = (receivedBytes * 8) / (durationSeconds * 1000 * 1000);
                request.destroy();
                resolve(parseFloat(mbps.toFixed(2)));
            }, 3000); 

            res.on('end', () => {
                if (resolved) return;
                resolved = true;
                const durationSeconds = (Date.now() - startTime) / 1000;
                const mbps = (receivedBytes * 8) / (durationSeconds * 1000 * 1000);
                resolve(parseFloat(mbps.toFixed(2)));
            });
        });

        request.on('error', () => {
            if (!resolved) { resolved = true; resolve(0); }
        });

        setTimeout(() => { 
            if (!resolved) { resolved = true; request.destroy(); resolve(0); }
        }, 5000); // Guard timeout
    });
};

const runUploadPhase = () => {
    return new Promise((resolve) => {
        const chunk = Buffer.alloc(1024 * 64, 'A'); // 64KB chunk
        const startTime = Date.now();
        let sentBytes = 0;
        let resolved = false;

        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream' }
        };

        const req = https.request(UPLOAD_TEST_URL, options, (res) => {
            res.on('data', () => {}); 
            res.on('end', () => {
                if (resolved) return;
                resolved = true;
                const durationSeconds = (Date.now() - startTime) / 1000;
                const mbps = (sentBytes * 8) / (durationSeconds * 1000 * 1000);
                resolve(parseFloat(mbps.toFixed(2)));
            });
        });

        req.on('error', () => {
            if (!resolved) { resolved = true; resolve(0); }
        });

        // Time-sliced upload loop
        const uploadLoop = setInterval(() => {
            if (resolved) { clearInterval(uploadLoop); return; }
            req.write(chunk);
            sentBytes += chunk.length;
        }, 10);

        setTimeout(() => {
            if (resolved) return;
            resolved = true;
            clearInterval(uploadLoop);
            req.end();
            const durationSeconds = (Date.now() - startTime) / 1000;
            const mbps = (sentBytes * 8) / (durationSeconds * 1000 * 1000);
            resolve(parseFloat(mbps.toFixed(2)));
        }, 3000); // Snappy 3-second window
    });
};

const getTopologyData = () => {
    return [
        { id: 'usr', name: 'User Laptop', type: 'Origin', lat: 2, status: 'Healthy' },
        { id: 'lan', name: 'Local Router', type: 'Gateway', lat: 5, status: 'Healthy' },
        { id: 'isp', name: 'Central ISP Node', type: 'Bridge', lat: 24, status: 'Healthy' },
        { id: 'hub', name: 'Regional Hub', type: 'Hop', lat: 85, status: 'Congested' }, 
        { id: 'target', name: 'Global DNS', type: 'Destination', lat: 88, status: 'Healthy' }
    ];
};

const getWeatherImpact = () => {
    const types = ['Clear', 'Rainy', 'Cloudy', 'Stormy'];
    if (Math.random() > 0.9)  weatherState = types[Math.floor(Math.random() * types.length)];

    let impactFactor = 1.0;
    let description = "Perfect conditions.";
    if (weatherState === 'Rainy') { impactFactor = 1.15; description = "Light rain. Minor jitter."; }
    else if (weatherState === 'Stormy') { impactFactor = 1.8; description = "Severe storm interference."; }
    else if (weatherState === 'Cloudy') { impactFactor = 1.05; description = "High cloud cover."; }

    return { type: weatherState, impact: impactFactor, description };
};

const startEngine = (io) => {
    if (simulationInterval) return;
    simulationInterval = setInterval(async () => {
        const rawLat = await getLatency();
        const weather = getWeatherImpact();
        const latency = Math.round(rawLat * weather.impact);
        
        io.emit('networkUpdate', {
            latency, 
            ping: latency,
            quality: latency < 60 ? 'Excellent' : (latency < 150 ? 'Fair' : 'Poor'),
            weather,
            topology: getTopologyData(),
            timestamp: new Date().toISOString()
        });
    }, 2000);
};

const stopEngine = () => {
    if (simulationInterval) { clearInterval(simulationInterval); simulationInterval = null; }
};

module.exports = { startEngine, stopEngine, runDownloadPhase, runUploadPhase };
