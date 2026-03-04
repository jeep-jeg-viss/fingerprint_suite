# Fingerprinter (Input Test Harness)

Fingerprinter is a browser-based **input capture and visualization tool** for recording human interaction patterns in real time.  
It tracks **mouse movement trajectories**, **mouse clicks**, and **keyboard dynamics** (including keystroke timing) for research and testing.

This project is useful for:

- Behavioral biometrics experiments
- Bot detection and anti-automation research
- Keystroke dynamics and typing pattern analysis
- UX/usability studies with mouse path replay
- Input-based security prototyping

## Keywords

behavioral biometrics, browser fingerprinting research, input fingerprinting, mouse dynamics, mouse tracking, cursor trajectory analysis, keystroke dynamics, typing biometrics, bot detection, human vs bot interaction, JavaScript input recorder, client-side telemetry, web security research

## Features

- Real-time mouse path capture with color-coded movement segments
- Pause-based segmentation of cursor trajectories (`250ms` default threshold)
- Click capture for left/middle/right buttons with on-screen SVG markers
- Keyboard event capture (`keydown` / `keyup`) with typed text buffer
- Live typing metrics (characters, duration, CPS, WPM, per-key dwell timing)
- JSON export for downstream analysis pipelines
- PNG screenshot export of path/click overlays
- Toggleable UI panels for path, clicks, keyboard, and recording state

## Tech Stack

- HTML + CSS + Vanilla JavaScript
- Canvas API (mouse path rendering)
- SVG overlay (click visualization)
- High-resolution timing with `performance.now()`

## Project Structure

- `index.html` - Main app (capture, visualization, export)
- `guide.html` - Detailed technical guide and data model notes

## Quick Start

1. Clone the repository.
2. Open `index.html` directly in a modern browser, or serve locally:

```bash
python3 -m http.server 8000
```

3. Visit `http://localhost:8000`.
4. Move the mouse, click, and type to begin recording immediately.

## Exported Data

The JSON export includes:

- `metadata` (timestamps, viewport, device pixel ratio)
- `mouseSegments[]` (segmented cursor trajectories with `(x, y, t)` points)
- `clicks[]` (button, position, timestamp, segment association, target element)
- `keyboard.keyEvents[]` (keydown/keyup event stream)
- `keyboard.typingMetrics` (chars, duration, CPS, WPM, per-key timing)
- `keyboard.typedBuffer` (printable characters typed)

For full schema examples, see `guide.html` or the in-app “JSON Format Documentation” panel.

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
8d29 41bd 5e1f 41cd 747a 5322 2bda 0fe3 cf05 bc57 ddba c837 22b4 cbf2 0ce4 0d02