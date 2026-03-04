# Fingerprinter (Input Test Harness)

Fingerprinter is a browser-based **input capture and visualization tool** for recording human interaction patterns in real time.  
It tracks **mouse movement trajectories**, **mouse clicks**, **keyboard dynamics**, and **network signals** for research and testing.

This project is useful for:

- Behavioral biometrics experiments
- Bot detection and anti-automation research
- Keystroke dynamics and typing pattern analysis
- UX/usability studies with mouse path replay
- Input-based security prototyping
- Network fingerprinting and proxy detection

## Keywords

behavioral biometrics, browser fingerprinting research, input fingerprinting, mouse dynamics, mouse tracking, cursor trajectory analysis, keystroke dynamics, typing biometrics, bot detection, human vs bot interaction, JavaScript input recorder, client-side telemetry, web security research, network fingerprinting, proxy detection, TLS analysis

## Features

- Real-time mouse path capture with color-coded movement segments
- Pause-based segmentation of cursor trajectories (`250ms` default threshold)
- Click capture for left/middle/right buttons with on-screen SVG markers
- Keyboard event capture (`keydown` / `keyup`) with typed text buffer
- Live typing metrics (characters, duration, CPS, WPM, per-key dwell timing)
- **Network signal detection** (RTT, DNS timing, TCP/TLS handshake, proxy detection)
- **Server-assisted network analysis** via Node.js backend with WebSocket RTT measurements
- **Proxy and VPN detection** using server-side header analysis
- **Real-time risk scoring** based on behavioral and network anomalies
- JSON export for downstream analysis pipelines
- PNG screenshot export of path/click overlays
- Toggleable UI panels for path, clicks, keyboard, and recording state

## Tech Stack

- HTML + CSS + Vanilla JavaScript
- Canvas API (mouse path rendering)
- SVG overlay (click visualization)
- High-resolution timing with `performance.now()`
- **Node.js + Express** (backend server)
- **WebSocket** (real-time communication)

## Project Structure

- `index.html` - Main app (capture, visualization, export, network signals)
- `simple-input.html` - Simplified version without advanced features
- `guide.html` - Detailed technical guide and data model notes
- `server.js` - Node.js server for accurate network signal detection
- `package.json` - Node.js dependencies

## Quick Start

### Option 1: Static Files Only (Basic)

Open `index.html` directly in a modern browser, or serve locally:

```bash
python3 -m http.server 8000
```

Visit `http://localhost:8000`.

### Option 2: Full Server (Recommended)

For accurate network signal detection and proxy analysis:

1. Install dependencies:

```bash
npm install
```

2. Start the Node.js server:

```bash
npm start
```

Or for development with auto-reload (Node.js 18+):

```bash
npm run dev
```

3. Visit `http://localhost:3000`.

4. Move the mouse, click, and type to begin recording immediately.

## Network Signal Detection

When using the Node.js server (`npm start`), the application provides accurate network signal detection:

### Server-Assisted Measurements

- **RTT (Round-Trip Time)**: Accurate measurement via WebSocket ping/pong (1-second intervals)
- **RTT Jitter**: Calculated from WebSocket latency variations
- **Proxy Detection**: Server-side analysis of `X-Forwarded-For`, `X-Real-IP`, `CF-Connecting-IP` headers
- **TLS Information**: Protocol version, cipher suite, ALPN
- **Real IP Detection**: Distinguishes between client IP and proxy IPs

### Client-Side Measurements

- DNS lookup timing (or "cached" if pre-resolved)
- TCP handshake timing (or "cached" if connection reused)
- TLS handshake timing
- TTFB (Time to First Byte)
- Connection type (4g, 3g, etc.)
- Downlink speed estimate

### Anomaly Detection

The system detects various network anomalies:

- **Cached DNS/TCP**: May indicate proxy/VPN or repeated visits
- **Low RTT + High Speed**: Possible datacenter/VPN connection
- **Proxy Headers**: Server-side proxy detection via forwarded headers
- **TLS/TCP Mismatch**: May indicate proxy overhead

## API Endpoints

When running the Node.js server:

- `GET /api/network-info` - Comprehensive network information including proxy detection
- `GET /api/ping` - Server timestamp for latency measurement
- `GET /api/stats` - WebSocket connection statistics
- `WebSocket /` - Real-time RTT measurements and network updates

## Exported Data

The JSON export includes:

- `metadata` (timestamps, viewport, device pixel ratio)
- `mouseSegments[]` (segmented cursor trajectories with `(x, y, t)` points)
- `clicks[]` (button, position, timestamp, segment association, target element)
- `keyboard.keyEvents[]` (keydown/keyup event stream)
- `keyboard.typingMetrics` (chars, duration, CPS, WPM, per-key timing)
- `keyboard.typedBuffer` (printable characters typed)
- `network` (navigation timing, server-detected info, proxy status, TLS info)
- `environment` (WebGL, plugins, headless detection, etc.)
- `riskScore` (overall bot/human classification score)
- `anomalies[]` (detected suspicious patterns)

For full schema examples, see `guide.html` or the in-app "JSON Format Documentation" panel.

## Privacy and Ethics

This tool captures detailed behavioral input signals that may be identifying.  
Use informed consent, minimize retained data, and follow applicable privacy regulations (for example GDPR/CCPA) when collecting real user data.

## Browser Compatibility

Designed for modern browsers that support:

- Canvas and SVG
- Clipboard API (for screenshot copy)
- `performance.now()`

## License

Licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).  
See [`LICENSE`](LICENSE).