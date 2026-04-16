# 🌐 NetPulse | Unified Network Control

NetPulse is a high-performance, real-time network intelligence dashboard that provides transparent insights into your connectivity health.

## 🚀 Key Features
- **Real-Time Latency Tracking**: Sub-millisecond data updates with visual trend charts.
- **Interactive LAN Discovery**: Animated node expansion for discovering devices on the local network.
- **Network Priming Engine**: Background subnet pinging to ensure accurate discovery of "silent" devices.
- **Smart Alert System**: Browser-native desktop notifications for critical latency spikes (>150ms).
- **Infrastructure Topology (Live)**: Visualizes the routing path to identify "Dead Zones" and congestion.
- **Weather Impact Analysis**: Simulates how environmental conditions affect network performance multipliers.
- **One-Click Launch**: Fully automated startup via `start.bat` or `run.ps1`.

---

## 🛠️ Quick Start

To launch the entire system (Backend, Frontend, and Browser), simply run:

### **Option 1 (Recommended for Windows)**
Double-click the **`start.bat`** file in the root directory.

### **Option 2 (PowerShell)**
Run the launch script from a terminal:
```powershell
./run.ps1
```

---

## 📂 Project Structure
- **/backend**: Node.js & Socket.io engine for real-time telemetry.
- **/frontend**: High-performance dashboard in `index.html`.
- **run.ps1 / start.bat**: Automated launch scripts.

## ⚙️ Service Ports
- **Backend API**: `http://localhost:5000`
- **Dashboard UI**: `http://localhost:5173`

---
*Operational Status: [Healthy]* - © 2026 NetPulse Systems
