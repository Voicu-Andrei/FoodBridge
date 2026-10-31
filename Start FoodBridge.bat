@echo off
rem Double-click this file to start FoodBridge (Windows).
title FoodBridge
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js is not installed. Follow step 2 in README.md, then try again.
  echo.
  pause
  exit /b 1
)

node scripts\start.mjs
echo.
echo   FoodBridge has stopped.
pause
