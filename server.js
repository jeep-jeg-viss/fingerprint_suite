const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const fs = require('fs');

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

// Store connection metrics per client
const clientMetrics = new Map();

// Middleware to capture timing info
app.use((req, res, next) => {
  req.startTime = process.hrtime.bigint();
  
  // Capture connection info
  req.connectionInfo = {
    remoteAddress: req.socket.remoteAddress,
    remotePort: req.socket.remotePort,
    localAddress: req.socket.localAddress,
    localPort: req.socket.localPort,
    encrypted: req.socket.encrypted || false,
    tlsVersion: req.socket.getCipher ? req.socket.getCipher().version : null,
    cipherSuite: req.socket.getCipher ? req.socket.getCipher().name : null,
    servername: req.socket.servername || null,
    protocol: req.protocol,
    httpVersion: req.httpVersion,
    headers: req.headers
  };
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - req.startTime) / 1000000; // Convert to ms
    req.connectionInfo.responseTime = duration;
    req.connectionInfo.timestamp = Date.now();
  });
  
  next();
});

// Static files
app.use(express.static(path.join(__dirname)));

// Network analysis API endpoint
app.get('/api/network-info', (req, res) => {
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const clientIP = forwarded ? forwarded.split(',')[0].trim() : req.connectionInfo.remoteAddress;
  
  // Calculate various network metrics
  const networkInfo = {
    timestamp: Date.now(),
    connection: {
      clientIP: clientIP,
      realIP: realIP || clientIP,
      remotePort: req.connectionInfo.remotePort,
      localPort: req.connectionInfo.localPort,
      protocol: req.connectionInfo.protocol,
      httpVersion: req.connectionInfo.httpVersion,
      tls: req.connectionInfo.encrypted ? {
        version: req.connectionInfo.tlsVersion,
        cipher: req.connectionInfo.cipherSuite,
        servername: req.connectionInfo.servername,
        alpn: req.socket.alpnProtocol || null
      } : null
    },
    proxy: {
      detected: !!(forwarded || req.headers['x-forwarded-host'] || req.headers['x-forwarded-proto']),
      forwardedFor: forwarded || null,
      forwardedHost: req.headers['x-forwarded-host'] || null,
      forwardedProto: req.headers['x-forwarded-proto'] || null,
      via: req.headers['via'] || null,
      cfRay: req.headers['cf-ray'] || null,
      cfConnectingIP: req.headers['cf-connecting-ip'] || null
    },
    timing: {
      responseTime: req.connectionInfo.responseTime || 0
    },
    headers: {
      userAgent: req.headers['user-agent'],
      accept: req.headers['accept'],
      acceptEncoding: req.headers['accept-encoding'],
      acceptLanguage: req.headers['accept-language'],
      dnt: req.headers['dnt'],
      referer: req.headers['referer'],
      origin: req.headers['origin']
    },
    network: {
      // These will be updated by WebSocket measurements
      rtt: null,
      jitter: null,
      packetLoss: null
    }
  };
  
  res.json(networkInfo);
});

// Endpoint to measure latency from server perspective
app.get('/api/ping', (req, res) => {
  const timestamp = Date.now();
  res.json({ 
    timestamp, 
    server: 'ok',
    connection: {
      remoteAddress: req.socket.remoteAddress,
      encrypted: req.socket.encrypted || false
    }
  });
});

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientId = generateClientId();
  const startTime = Date.now();
  
  // Store client metrics
  clientMetrics.set(clientId, {
    id: clientId,
    connectedAt: startTime,
    remoteAddress: req.socket.remoteAddress,
    rttMeasurements: [],
    lastPing: null,
    connectionInfo: {
      headers: req.headers,
      url: req.url
    }
  });
  
  console.log(`[WS] Client ${clientId} connected from ${req.socket.remoteAddress}`);
  
  // Send initial connection info
  ws.send(JSON.stringify({
    type: 'connection',
    clientId: clientId,
    timestamp: startTime,
    serverTime: new Date().toISOString(),
    remoteAddress: req.socket.remoteAddress
  }));
  
  // Setup ping interval for RTT measurement
  const pingInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      const pingTime = Date.now();
      clientMetrics.get(clientId).lastPing = pingTime;
      ws.ping();
    }
  }, 1000);
  
  // Handle pong responses
  ws.on('pong', () => {
    const client = clientMetrics.get(clientId);
    if (client && client.lastPing) {
      const rtt = Date.now() - client.lastPing;
      client.rttMeasurements.push(rtt);
      
      // Keep only last 100 measurements
      if (client.rttMeasurements.length > 100) {
        client.rttMeasurements.shift();
      }
      
      // Calculate jitter
      const jitter = calculateJitter(client.rttMeasurements);
      
      // Send updated metrics to client
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'rtt-update',
          rtt: rtt,
          jitter: jitter,
          measurements: client.rttMeasurements.length,
          avgRtt: Math.round(client.rttMeasurements.reduce((a, b) => a + b, 0) / client.rttMeasurements.length),
          minRtt: Math.min(...client.rttMeasurements),
          maxRtt: Math.max(...client.rttMeasurements)
        }));
      }
    }
  });
  
  // Handle messages from client
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'request-network-info':
          // Send comprehensive network info
          const forwarded = req.headers['x-forwarded-for'];
          const clientIP = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
          
          ws.send(JSON.stringify({
            type: 'network-info',
            timestamp: Date.now(),
            network: {
              clientIP: clientIP,
              proxyDetected: !!(forwarded || req.headers['x-forwarded-host']),
              proxyHeaders: {
                'x-forwarded-for': forwarded || null,
                'x-real-ip': req.headers['x-real-ip'] || null,
                'cf-connecting-ip': req.headers['cf-connecting-ip'] || null,
                'cf-ray': req.headers['cf-ray'] || null
              },
              tls: req.socket.encrypted ? {
                version: req.socket.getCipher().version,
                cipher: req.socket.getCipher().name
              } : null,
              connectionAge: Date.now() - startTime
            }
          }));
          break;
          
        case 'echo-test':
          // Echo test for custom latency measurement
          ws.send(JSON.stringify({
            type: 'echo-response',
            clientTimestamp: message.timestamp,
            serverTimestamp: Date.now(),
            echo: message.data
          }));
          break;
          
        default:
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type: ' + message.type
          }));
      }
    } catch (e) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid JSON: ' + e.message
      }));
    }
  });
  
  // Handle close
  ws.on('close', () => {
    clearInterval(pingInterval);
    clientMetrics.delete(clientId);
    console.log(`[WS] Client ${clientId} disconnected`);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`[WS] Client ${clientId} error:`, error.message);
  });
});

// Helper functions
function generateClientId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function calculateJitter(measurements) {
  if (measurements.length < 2) return 0;
  
  let jitterSum = 0;
  for (let i = 1; i < measurements.length; i++) {
    jitterSum += Math.abs(measurements[i] - measurements[i - 1]);
  }
  
  return Math.round(jitterSum / (measurements.length - 1));
}

// Stats endpoint for debugging
app.get('/api/stats', (req, res) => {
  const stats = {
    connectedClients: wss.clients.size,
    clients: Array.from(clientMetrics.values()).map(c => ({
      id: c.id,
      connectedAt: c.connectedAt,
      remoteAddress: c.remoteAddress,
      measurementCount: c.rttMeasurements.length,
      avgRtt: c.rttMeasurements.length > 0 
        ? Math.round(c.rttMeasurements.reduce((a, b) => a + b, 0) / c.rttMeasurements.length)
        : 0
    }))
  };
  res.json(stats);
});

server.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] WebSocket server ready for connections`);
});
