const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { startEngine, stopEngine, runDownloadPhase, runUploadPhase } = require('./services/networkEngine');
const { scanLocalDevices } = require('./services/arpScanner');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// API Routes
app.get('/status', (req, res) => {
  res.json({ 
    status: 'Operational', 
    timestamp: new Date().toISOString(),
    engine: 'Real-time Network Monitor'
  });
});

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  startEngine(io);
  
  // Dual-Phase Global Speed Test
  socket.on('requestSpeedTest', async () => {
    console.log('Dual-Phase Speed Test started for:', socket.id);
    
    // Phase 1: Download
    socket.emit('speedTestPhase', { phase: 'Download', status: 'Active' });
    const downloadMbps = await runDownloadPhase();
    socket.emit('speedTestPhase', { phase: 'Download', result: downloadMbps, status: 'Completed' });

    // Phase 2: Upload
    socket.emit('speedTestPhase', { phase: 'Upload', status: 'Active' });
    const uploadMbps = await runUploadPhase();
    socket.emit('speedTestPhase', { phase: 'Upload', result: uploadMbps, status: 'Completed' });

    // Final result
    socket.emit('speedTestResult', { 
        download: downloadMbps, 
        upload: uploadMbps, 
        timestamp: new Date().toISOString() 
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Periodic Local ARP Scan (Every 10 seconds)
setInterval(async () => {
    const devices = await scanLocalDevices();
    io.emit('localNetworkUpdate', {
        devices,
        timestamp: new Date().toISOString()
    });
}, 10000); 


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Call Quality Monitoring Server running on port ${PORT}`);
});

