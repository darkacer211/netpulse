/**
 * Simulator Service
 * Generates mock call quality metrics every 1.5 seconds.
 */

const generateMetrics = () => {
  // Latency: 40ms - 250ms (Normal: 40-100, High: 150-250)
  const latency = Math.floor(Math.random() * (250 - 40) + 40);

  // Jitter: 5ms - 60ms
  const jitter = Math.floor(Math.random() * (60 - 5) + 5);

  // Packet Loss: 0% - 5%
  const packetLoss = parseFloat((Math.random() * 5).toFixed(2));

  // Signal Strength: -90dBm to -30dBm (Simulated for visualization)
  const signalStrength = Math.floor(Math.random() * (-30 - (-90)) + (-90));

  return {
    timestamp: new Date().toISOString(),
    latency,
    jitter,
    packetLoss,
    signalStrength,
    status: getStatus(latency, jitter, packetLoss)
  };
};

const getStatus = (latency, jitter, packetLoss) => {
  if (latency > 200 || packetLoss > 3 || jitter > 45) return 'Poor';
  if (latency > 150 || packetLoss > 2 || jitter > 30) return 'Moderate';
  return 'Good';
};

let intervalId = null;

const startSimulation = (io) => {
  if (intervalId) return;

  console.log('Call Quality Simulation Started');
  intervalId = setInterval(() => {
    const metrics = generateMetrics();
    io.emit('callMetrics', metrics);

    // Alert Detection Logic
    if (metrics.status === 'Poor' || metrics.status === 'Moderate') {
        const alert = {
            type: metrics.status === 'Poor' ? 'Critical' : 'Warning',
            message: `Performance dip detected: ${metrics.status} Quality`,
            metrics: { 
                latency: metrics.latency, 
                jitter: metrics.jitter, 
                packetLoss: metrics.packetLoss 
            },
            timestamp: new Date().toISOString()
        };
        io.emit('callAlert', alert);
    }
  }, 1500);
};

const stopSimulation = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('Call Quality Simulation Stopped');
  }
};

module.exports = { startSimulation, stopSimulation };
