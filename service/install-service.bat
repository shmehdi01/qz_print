@echo off
REM ============================================================================
REM QBPrinter — install printer.exe as a hidden, auto-restart Windows Service.
REM
REM What this does:
REM   1. Self-elevates to Administrator (UAC prompt). Required to register a
REM      service and write to ProgramData.
REM   2. Stops + removes any prior QBPrinter service so an upgrade is clean.
REM   3. Registers printer.exe under SERVICE_AUTO_START using NSSM, points its
REM      logs to C:\ProgramData\QBPrinter\, auto-restarts on crash after 3s.
REM   4. Starts the service.
REM
REM End result: the bridge starts at boot, runs hidden, survives logoff, and a
REM non-admin user cannot stop or close it via Task Manager.
REM
REM Requirements (next to this .bat):
REM   - nssm.exe       (https://nssm.cc/download, ~340 KB, MIT)
REM   - printer.exe    (the QZ print bridge)
REM
REM Re-running this script reinstalls cleanly (good for upgrades).
REM ============================================================================

REM ---- self-elevate -----------------------------------------------------------
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

setlocal
set "SERVICE_NAME=QBPrinter"
set "SCRIPT_DIR=%~dp0"
set "NSSM=%SCRIPT_DIR%nssm.exe"
set "EXE=%SCRIPT_DIR%printer.exe"
set "LOG_DIR=C:\ProgramData\QBPrinter"
set "OUT_LOG=%LOG_DIR%\out.log"
set "ERR_LOG=%LOG_DIR%\err.log"

REM ---- sanity checks ----------------------------------------------------------
if not exist "%NSSM%" (
    echo [FAIL] nssm.exe not found next to this script: "%NSSM%"
    echo Download from https://nssm.cc/download and place it beside install-service.bat
    pause
    exit /b 1
)
if not exist "%EXE%" (
    echo [FAIL] printer.exe not found next to this script: "%EXE%"
    pause
    exit /b 1
)

REM ---- ensure log dir ---------------------------------------------------------
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>&1

REM ---- clean any prior install (so this script is also the upgrade path) -----
sc query "%SERVICE_NAME%" >nul 2>&1
if %errorLevel% equ 0 (
    echo Stopping existing %SERVICE_NAME% service...
    "%NSSM%" stop "%SERVICE_NAME%" >nul 2>&1
    echo Removing existing %SERVICE_NAME% service...
    "%NSSM%" remove "%SERVICE_NAME%" confirm >nul 2>&1
)

REM ---- install + configure ----------------------------------------------------
echo Installing %SERVICE_NAME% service...
"%NSSM%" install "%SERVICE_NAME%" "%EXE%"
if %errorLevel% neq 0 (
    echo [FAIL] nssm install returned errorlevel %errorLevel%
    pause
    exit /b 1
)

REM Start at boot.
"%NSSM%" set "%SERVICE_NAME%" Start SERVICE_AUTO_START

REM Working dir = the folder containing printer.exe. This matters because the
REM bridge reads bundled assets relative to its own location (see readAppFile).
"%NSSM%" set "%SERVICE_NAME%" AppDirectory "%SCRIPT_DIR%"

REM Log stdout/stderr to a stable location for support.
"%NSSM%" set "%SERVICE_NAME%" AppStdout "%OUT_LOG%"
"%NSSM%" set "%SERVICE_NAME%" AppStderr "%ERR_LOG%"

REM Rotate logs at 10 MB so they don't grow without bound.
"%NSSM%" set "%SERVICE_NAME%" AppRotateFiles 1
"%NSSM%" set "%SERVICE_NAME%" AppRotateOnline 1
"%NSSM%" set "%SERVICE_NAME%" AppRotateBytes 10485760

REM Auto-restart 3s after any exit; cap restart loop so we don't spin if it's
REM truly broken (10 restarts then back-off).
"%NSSM%" set "%SERVICE_NAME%" AppExit Default Restart
"%NSSM%" set "%SERVICE_NAME%" AppRestartDelay 3000
"%NSSM%" set "%SERVICE_NAME%" AppThrottle 1500

REM Human-readable description in services.msc.
"%NSSM%" set "%SERVICE_NAME%" Description "QueueBuster QZ Tray print bridge. Auto-starts on boot, restarts on crash."

REM ---- start ------------------------------------------------------------------
echo Starting %SERVICE_NAME%...
"%NSSM%" start "%SERVICE_NAME%"
if %errorLevel% neq 0 (
    echo [WARN] start returned errorlevel %errorLevel% — check %ERR_LOG%
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo  %SERVICE_NAME% installed and started.
echo    Logs:  %OUT_LOG%
echo           %ERR_LOG%
echo    Stop/start:  services.msc  (search %SERVICE_NAME%)
echo    Or admin cmd: sc stop %SERVICE_NAME%  /  sc start %SERVICE_NAME%
echo ============================================================================
echo.
pause
endlocal
