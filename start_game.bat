@echo off
echo Starte Multiplayer Wiese mit Benutzerverwaltung...
echo.
echo Dieser Batch-Datei startet den Server und oeffnet den Client im Browser.
echo.

REM Starte den Server im Hintergrund
start cmd /k "cd server && node "C:\Users\Matthias\Documents\augment-projects\PokeTogetherBrowser\server\index.js""

REM Warte kurz, damit der Server Zeit hat zu starten
timeout /t 2 /nobreak > nul

REM Oeffne den Client im Browser
start "" "http://localhost:3000"

echo.
echo Server und Client wurden gestartet!
echo.
echo Du kannst das Spiel unter http://localhost:3000 erreichen.
echo.
echo Verfuegbare Benutzer:
echo - Benutzername: test1, Passwort: test
echo - Benutzername: test2, Passwort: test
echo - Benutzername: test3, Passwort: test
echo.
echo Zum Beenden des Servers schliesse das Server-Fenster.
echo.
echo Viel Spass beim Spielen!
echo.
pause
