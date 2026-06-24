@echo off
REM ============================================================================
REM QBPrinter — uninstall the printer.exe Windows Service.
REM
REM Self-elevates to Administrator (UAC prompt). Stops the service, removes
REM the registration. Leaves printer.exe / certs / logs on disk untouched so
REM support can still inspect %LOG_DIR%\err.log after removal.
REM ============================================================================

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

sc query "%SERVICE_NAME%" >nul 2>&1
if %errorLevel% neq 0 (
    echo %SERVICE_NAME% is not installed. Nothing to do.
    pause
    exit /b 0
)

if exist "%NSSM%" (
    echo Stopping %SERVICE_NAME%...
    "%NSSM%" stop "%SERVICE_NAME%" >nul 2>&1
    echo Removing %SERVICE_NAME%...
    "%NSSM%" remove "%SERVICE_NAME%" confirm
) else (
    REM Fallback if nssm.exe is missing — use sc directly.
    echo nssm.exe not found, falling back to sc...
    sc stop   "%SERVICE_NAME%" >nul 2>&1
    sc delete "%SERVICE_NAME%"
)

echo.
echo %SERVICE_NAME% removed. Logs preserved at C:\ProgramData\QBPrinter\.
pause
endlocal
