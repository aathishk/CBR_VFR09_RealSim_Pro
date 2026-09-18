# CBR VFR-09 RealSim Pro

A browser-based Coimbatore VFR flight simulator built as an independent implementation inspired by public GeoFS feature descriptions and the modular Cesium architecture demonstrated by God's Eye View.

## Included

- CesiumJS globe with optional Google Photorealistic 3D Tiles.
- Cesium ion terrain fallback when configured.
- OpenStreetMap/Overpass 3D building fallback when photorealistic tiles are unavailable.
- 120 Hz fixed-step flight model with RK4 integration.
- Quaternion attitude propagation and nonlinear body-axis 6-DOF equations.
- Trainer aircraft aerodynamics: lift, drag, side force, alpha/beta, stability derivatives, stall, ground effect, flap/gear effects, propeller thrust, torque and P-factor terms.
- METAR wind/gust integration from AviationWeather.gov through the local server proxy.
- Optional regional ADS-B traffic via OpenSky.
- VOCB runway 05/23 geometry and current AAI radio-navigation reference data.
- ILS/LOC/G/S/PAPI/DME-style approach guidance.
- Keyboard, standard Gamepad API, ESP32 + MPU6050 Web Serial and phone gyro input.
- Follow, cockpit, chase and free camera modes.
- Autopilot training mode, landing evaluation and replay.

## Important fidelity note

The default aircraft profile is a generic light trainer. It is intentionally not represented as a certified model of a real aircraft. Real-aircraft fidelity requires an aircraft-specific mass/inertia model, geometry and validated aerodynamic/propulsion data from appropriate AFM/POH/flight-test sources.

## Run locally

Requirements: Node.js 20+.

```bash
npm install
npm start
```

Open `http://localhost:4173`.

Optional `.env` variables:

```text
GOOGLE_MAPS_API_KEY=...
CESIUM_ION_TOKEN=...
OPENSKY_CLIENT_ID=...
OPENSKY_CLIENT_SECRET=...
PORT=4173
WS_PORT=3001
```

Use a restricted Google key. Do not commit credentials.

For the phone controller, open `http://<PC-LAN-IP>:4173/controller.html` from the phone on the same network. The phone websocket relay uses port 3001.

## Controls

Keyboard: W/S pitch, A/D roll, Q/E rudder, Shift/Ctrl throttle, G gear, F flaps, B brake, Z/X trim, V camera, P autopilot, I engine start, M engine stop, C IMU calibration, R reset.

Gamepad: left stick pitch/roll, right stick X yaw, LT/RT throttle, A camera, B reset, X calibration, Y autopilot, LB flaps, RB gear, D-pad trim.

## References

- GeoFS official feature and instruction pages: see `docs/REALISM_REFERENCE.md`.
- God's Eye View public repository and data-source/architecture documentation: see `docs/REALISM_REFERENCE.md` and `docs/DATA_SOURCES.md`.
- JSBSim reference concepts are used as a physics-design reference; the simulator remains a browser-native implementation.
- Airports Authority of India eAIP VOCB information is referenced for runway and navaid data.

This software is for simulation/education and is not for operational navigation or flight training without qualified validation.
