# QBPrinter — Windows Service install

These scripts register `printer.exe` (the QueueBuster QZ Tray print bridge) as
a real Windows Service so it:

- runs hidden in the background — no console window
- starts automatically at boot
- survives user logoff
- **cannot be closed by a non-admin user** via Task Manager
- auto-restarts within 3 seconds if it ever crashes

This is the recommended production deployment. Replaces the "double-click the
exe and leave the window open" workflow that merchants kept closing.

## What you need (4 files, all in the same folder)

| File | Where to get it |
|---|---|
| `printer.exe` | [Drive download](https://drive.google.com/file/d/1SL3wHwy9VthvHW73q1aSiYUKfCmZgF0v/view?usp=sharing) — QueueBuster QZ Tray print bridge (~48 MB) |
| `nssm.exe` | [Drive download](https://drive.google.com/file/d/1qFMCyb3y8oMqWi-rvPegFcRi3AJP0qiV/view?usp=sharing) — Non-Sucking Service Manager 2.24 win64 (~324 KB, MIT) |
| `install-service.bat` | [Drive download](https://drive.google.com/file/d/1bdT0xiSVEEk5wVI3VFrIhFRYKsR0CBuq/view?usp=sharing) — installs the Windows service (run as admin) |
| `uninstall-service.bat` | [Drive download](https://drive.google.com/file/d/1vooa5VhUgkJZ6UryKcGnCifmYsWbSIKT/view?usp=sharing) — removes the service (run as admin) |

Download all four files from the Drive links above. Put them in one directory
on the merchant's machine, e.g. `C:\Program Files\QBPrinter\`.

## Install

1. Right-click `install-service.bat` → **Run as administrator**
   (or the script will self-elevate via UAC prompt).
2. Wait for "QBPrinter installed and started" message.
3. Done — the service is running and will auto-start on every boot.

## Verify

```cmd
sc query QBPrinter
```
should show `STATE : 4 RUNNING`.

Or open `services.msc` and look for **QBPrinter**.

Test a print from the merchant's POS — it should work without the merchant
ever having to launch a window.

## Logs

The service logs stdout/stderr to:
- `C:\ProgramData\QBPrinter\out.log`
- `C:\ProgramData\QBPrinter\err.log`

Both rotate at 10 MB.

## Common operations (admin cmd)

| Action | Command |
|---|---|
| Stop | `sc stop QBPrinter` |
| Start | `sc start QBPrinter` |
| Restart | `sc stop QBPrinter && sc start QBPrinter` |
| Uninstall | run `uninstall-service.bat` as admin |
| Reinstall (upgrade) | drop a new `printer.exe`, re-run `install-service.bat` (it cleans up the prior install first) |

## Troubleshooting

- **"QZ Tray not connected"** in `err.log` — QZ Tray itself must be installed
  and running. The QBPrinter service connects to QZ Tray over WebSocket on
  localhost; it does **not** include QZ Tray.
- **Printer not found / wrong printer** — Windows services run as `LocalSystem`
  by default, which sometimes can't see printers installed under a specific
  user account. If this happens, configure the service to run as the merchant
  user from `services.msc` → QBPrinter → Properties → Log On.
- **Service won't start** — open `err.log`. Most common causes are a missing
  bundled cert (rebuild `printer.exe`) or QZ Tray being stopped.

## Why a service and not a tray app

A regular hidden console can be killed via Task Manager by any user. A real
Windows service is protected by the SCM and can only be stopped by an
administrator. This was the explicit ask from merchants who kept accidentally
closing the bridge window.
