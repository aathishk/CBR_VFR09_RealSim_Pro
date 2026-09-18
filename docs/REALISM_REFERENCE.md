# Realism Reference

This build is an independent implementation. It does not copy GeoFS source code or proprietary assets. It uses public feature descriptions from GeoFS and architecture patterns from the MIT-licensed God's Eye View project.

## GeoFS-derived feature targets
- Cesium-based global 3D environment
- physics-based lift/drag/stall behavior across aircraft surfaces
- configurable weather / METAR wind, gusts, turbulence and clouds as the project evolves
- navigation aids and runway database concepts
- multiple camera modes
- joystick/Gamepad API support
- multiplayer and live ADS-B traffic concepts

## God's Eye View-derived architecture targets
- CesiumJS + Vite-style geospatial rendering
- provider fallback strategy
- modular flight/traffic/data layers
- explicit attribution and third-party data boundaries

## Current implementation
- 120 Hz fixed simulation loop with RK4 substeps
- quaternion attitude state and nonlinear 6-DOF translational/rotational equations
- trainer aircraft coefficient model with propeller advance-ratio approximation, stall, ground effect, flaps, gear and P-factor terms
- real VOCB runway 05/23 geometry and current AAI navigation-aid data in `src/navigation.js`
- METAR proxy for VOCB weather
- optional OpenSky traffic proxy
- Google Photorealistic 3D Tiles when configured; Cesium ion terrain as fallback; OSM buildings as another fallback
- keyboard, Gamepad API, ESP32/MPU6050 and phone gyro inputs
- replay recording and playback

## Fidelity caveat
This is not a certified or manufacturer-validated flight model. To obtain aircraft-specific fidelity, replace the generic trainer coefficients and mass/inertia model with validated AFM/POH or flight-test data and calibrate against known performance points (stall, cruise, climb, glide, control forces/rates, takeoff/landing distance).
