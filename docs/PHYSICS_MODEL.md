# Flight-Dynamics Model

The default aircraft is a generic light trainer intended to exercise the simulation stack. It is not a certified or aircraft-specific model.

## State

- Position: latitude, longitude, altitude
- Body velocity: `u v w`
- Body angular rates: `p q r`
- Attitude: quaternion
- Engine RPM, throttle, fuel, mixture
- Control surfaces: elevator, aileron, rudder
- Gear/flap state

## Environment

ISA atmosphere provides temperature, pressure, density and speed of sound. METAR wind is transformed from the local North/East/Down frame into aircraft body axes before aerodynamic forces are computed.

## Aerodynamics

Dynamic pressure is:

`q = 0.5 * rho * V^2`

Lift, drag and side force use coefficient buildup with alpha/beta and normalized angular rates. Induced drag uses aspect ratio and an efficiency factor. Flaps, landing gear, ground effect and post-stall lift attenuation modify the coefficients.

## Propulsion

The generic propeller model uses an efficiency/power-over-airspeed thrust envelope with a static-thrust cap, plus propeller torque and small P-factor / slipstream directional terms.

## Integration

The simulator propagates translational velocity, angular rates, quaternion attitude and geographic position with RK4 substeps. A fixed 120 Hz simulation cadence is used by the main loop.

## Landing / collision

Terrain height is sampled from Cesium where available. Low-altitude contact is evaluated using vertical sink rate, groundspeed and bank. Hard contacts set the aircraft to a crashed state; acceptable contacts create a touchdown state used by the landing assessment.

## Validation path

For aircraft-specific fidelity, replace the generic coefficients and inertia values with validated AFM/POH or flight-test data and calibrate against stall speed, cruise speed, climb rate, glide performance, takeoff/landing distance, control authority and engine/propeller performance.
