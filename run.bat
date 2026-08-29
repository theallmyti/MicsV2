@echo off
echo ===================================================
echo             MicsV2 Launcher Utility
echo ===================================================
echo.
echo Starting all development servers...
echo.

echo [System] Launching Convex Dev...
start "Convex Dev" cmd /k "npx convex dev"

echo [System] Launching Express Backend...
start "Express Backend" cmd /k "npx tsx server/index.ts"

echo [System] Launching Vite Frontend (npm run dev)...
start "Vite Frontend" cmd /k "npm run dev"

echo.
echo [System] All servers have been launched in separate windows!
echo          You can keep this terminal open or close it.
echo ===================================================
pause
