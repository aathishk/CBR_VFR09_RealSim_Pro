#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if [ ! -d node_modules/ws ]; then npm install; fi
node server.mjs
