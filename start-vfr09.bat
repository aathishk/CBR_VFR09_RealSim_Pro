@echo off
cd /d %~dp0
if not exist node_modules\ws (
  echo Installing dependency...
  npm install
)
node server.mjs
pause
