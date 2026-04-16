const { exec } = require('child_process');

/**
 * NetPulse ARP Scanner (v1.0 - Modular)
 * Discovers devices on the local area network.
 */

/**
 * NetPulse Network Priming (Ping Sweep)
 * Wakes up the local ARP table by pinging the subnet.
 */
let lastPrimeTime = 0;
const primeNetwork = async () => {
    const now = Date.now();
    if (now - lastPrimeTime < 60000) return; // Prime once per minute
    
    lastPrimeTime = now;
    console.log('[NetPulse] Initiating background network discovery...');

    // Advanced non-blocking priming using .NET Ping class via PowerShell
    // This is significantly faster and works on PowerShell 5.1+
    const command = 'powershell -Command "1..254 | ForEach-Object { (New-Object System.Net.NetworkInformation.Ping).SendAsync(\'192.168.0.$_\', 200) }"';
    
    exec(command, (err) => {
        if (err) console.error('[NetPulse] Priming Error:', err.message);
        else console.log('[NetPulse] Network discovry packets sent.');
    });
};

const scanLocalDevices = async () => {
    // Prime the network in background (non-blocking for UI responsiveness)
    primeNetwork();

    return new Promise((resolve) => {
        exec('arp -a', (error, stdout) => {
            if (error) {
                console.error('ARP Scan Error:', error);
                resolve([]);
                return;
            }

            const devices = [];
            const lines = stdout.split('\n');

            // More robust regex for Windows ARP output
            // Handles potential leading spaces and varying MAC formats
            const arpRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+([0-9a-fA-F:-]{11,20})\s+(\w+)/i;

            lines.forEach(line => {
                const trimmed = line.trim();
                const match = trimmed.match(arpRegex);
                if (match) {
                    const [_, ip, mac, type] = match;
                    
                    if (ip !== '255.255.255.255' && !ip.startsWith('224.') && !ip.startsWith('192.168.0.229')) {
                        devices.push({
                            ip,
                            mac: mac.toUpperCase().replace(/-/g, ':'),
                            type: type.charAt(0).toUpperCase() + type.slice(1),
                            name: getDeviceVendor(mac)
                        });
                    }
                }
            });

            resolve(devices.slice(0, 15)); 
        });
    });
};

/**
 * Simple OUI-based vendor guessing (Common ones)
 */
const getDeviceVendor = (mac) => {
    const cleanMac = mac.replace(/[:-]/g, '').toUpperCase();
    if (cleanMac.startsWith('000C29') || cleanMac.startsWith('005056')) return 'VMware';
    if (cleanMac.startsWith('00155D')) return 'Microsoft Hyper-V';
    if (cleanMac.startsWith('B0CA68') || cleanMac.startsWith('E4E749')) return 'Samsung';
    if (cleanMac.startsWith('002500') || cleanMac.startsWith('AC87A3')) return 'Apple';
    if (cleanMac.startsWith('F4F5D8') || cleanMac.startsWith('48D224')) return 'Google';
    return 'Generic Device';
};

module.exports = { scanLocalDevices };
