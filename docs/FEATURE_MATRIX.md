# Feature Matrix

## GeoFS-inspired behaviors implemented

| Area | CBR VFR-09 |
|---|---|
| Global 3D world | CesiumJS, optional Google Photorealistic 3D Tiles |
| Fallback world | Cesium ion terrain + OSM buildings |
| Physics | nonlinear 6-DOF, quaternions, RK4 at fixed 120 Hz |
| Aerodynamics | lift, drag, side force, alpha/beta, stall, flaps, gear, ground effect |
| Propulsion | propeller power/thrust envelope, torque, P-factor terms |
| Weather | VOCB METAR wind/gust, simulated gust component |
| Navigation | GPS-style route, localizer/glideslope/PAPI/DME-style approach guidance |
| Camera | follow, cockpit, chase, free |
| Input | keyboard, Gamepad API, ESP32/MPU6050, phone gyro |
| Traffic | regional OpenSky snapshots |
| Replay | deterministic state snapshots |
| Training | autopilot, route checkpoints, landing assessment |

## God’s Eye View-inspired architecture

- Cesium-based scene and camera ownership.
- Layered world/data modules instead of one monolithic HTML file.
- Explicit data-source attribution.
- Runtime provider fallback.
- Live-data proxies in a local Node service.

## Not copied

No GeoFS source code, GeoFS proprietary aircraft, or God's Eye View third-party data/model files were copied into this project. Only publicly described product behavior and openly available architectural patterns were used.
