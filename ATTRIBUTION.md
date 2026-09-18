# Attribution and Third-Party Notices

This repository is an independent simulator implementation.

## Reference projects

- GeoFS: used only as a public feature/behavior reference (flight physics, global Cesium world, navigation, cameras, weather, multiplayer/ADS-B, gamepad/mobile concepts). No GeoFS source code or proprietary assets are included.
- God's Eye View: used as an architectural reference for modular Cesium world rendering, provider fallback, and live-data layering. Its public repository is MIT-licensed, but its third-party datasets and models retain their own licenses.

## Runtime data providers

- Google Maps Platform / Photorealistic 3D Tiles: user-supplied key, subject to Google Maps Platform terms.
- Cesium ion: optional user-supplied token, subject to Cesium terms.
- OpenStreetMap / Overpass: ODbL data; attribution/share-alike obligations apply.
- OpenSky Network: optional live traffic provider; follow its current usage/license terms.
- AviationWeather.gov: public weather endpoint used for METAR retrieval.
- Airports Authority of India eAIP: VOCB runway/navigation reference values used for simulator navigation only.

## Aircraft model

`public/aircraft.glb` is carried over from the project's prior prototype. Before public redistribution or commercial use, confirm and document its original license/provenance.
