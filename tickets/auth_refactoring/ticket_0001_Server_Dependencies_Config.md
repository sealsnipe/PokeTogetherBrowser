# Ticket 0001: Server Dependencies & Config

**Einleitung:**

Dieses Ticket legt die Grundlage für das neue Authentifizierungssystem auf dem Server. Bevor wir die eigentliche Logik für Login, Registrierung und Sitzungsverwaltung implementieren können, müssen wir sicherstellen, dass alle benötigten externen Softwarepakete (Abhängigkeiten) installiert sind und eine zentrale Konfiguration für die JSON Web Tokens (JWT) existiert.

*   **Zweck der Abhängigkeiten:**
    *   `jsonwebtoken`: Wird benötigt, um die digitalen "Ausweise" (JWTs) zu erstellen, die ein Benutzer nach dem Login erhält, und um diese bei späteren Anfragen zu überprüfen. Es implementiert den JWT-Standard.
    *   `cookie-parser`: Eine Express-Middleware, die es dem Server erleichtert, Cookies zu lesen, die vom Browser des Benutzers gesendet werden. Wir werden das JWT in einem Cookie speichern.
    *   *(Optional)* `express-validator`: Hilft bei der Überprüfung von Benutzereingaben (z.B. ob ein Passwort lang genug ist), bevor sie weiterverarbeitet werden. Verbessert die Datensicherheit und -qualität.
    *   *(Optional)* `dotenv`: Ermöglicht das Laden von Konfigurationswerten (wie dem geheimen Schlüssel für JWT) aus einer separaten `.env`-Datei, anstatt sie direkt in den Code zu schreiben, was sicherer und flexibler für verschiedene Umgebungen (Entwicklung, Produktion) ist.
*   **Zweck der JWT-Konfiguration:**
    *   **JWT Secret:** Ein geheimer Schlüssel, der nur dem Server bekannt ist. Er wird verwendet, um die JWTs digital zu "unterschreiben" (mittels HMAC-Algorithmus wie HS256, dem Standard von `jsonwebtoken`). Nur mit diesem Schlüssel kann der Server sicherstellen, dass ein JWT nicht manipuliert wurde. Es ist entscheidend, diesen Schlüssel geheim zu halten und ausreichend komplex zu gestalten.
    *   **JWT Ablaufzeit:** Legt fest, wie lange ein JWT gültig ist (z.B. 7 Tage). Danach muss sich der Benutzer erneut anmelden. Dies ist ein wichtiger Sicherheitsmechanismus, um das Risiko bei gestohlenen Tokens zu begrenzen.

Dieses Ticket stellt also sicher, dass die Werkzeuge und Grundeinstellungen vorhanden sind, bevor wir die spezifischen Authentifizierungsfunktionen in späteren Tickets bauen.

---

**Ziel:** Sicherstellen, dass alle notwendigen serverseitigen Abhängigkeiten für die JWT/Cookie-Authentifizierung installiert sind und die Konfiguration für JWT vorbereitet ist.

**Aufgaben:**

1.  **Abhängigkeiten prüfen/installieren:**
    *   Öffne `server/package.json`.
    *   Überprüfe, ob `"jsonwebtoken"` und `"cookie-parser"` unter `dependencies` aufgeführt sind. Beachte die Versionsnummern (z.B. `^4.7.2` bedeutet Version 4.7.2 oder höher innerhalb von Version 4).
    *   Falls nicht, führe `npm install jsonwebtoken cookie-parser` im `server`-Verzeichnis aus. Dies fügt die neuesten kompatiblen Versionen hinzu.
    *   *(Optional)* Entscheide, ob `express-validator` verwendet werden soll. Wenn ja, führe `npm install express-validator` aus.
    *   *(Optional)* Wenn Umgebungsvariablen für das Secret verwendet werden sollen (empfohlen!), installiere `dotenv`: `npm install dotenv`.
    *   **Best Practice:** Führe nach der Installation `npm audit` aus, um nach bekannten Sicherheitslücken in den installierten Paketen zu suchen.

2.  **JWT-Konfiguration erstellen:**
    *   **JWT Secret:**
        *   **Generierung:** Generiere eine starke, kryptographisch sichere, zufällige Zeichenkette. Mindestens 32 Bytes (entspricht 64 Hex-Zeichen) werden empfohlen. Tools wie `openssl rand -hex 32` oder Online-Generatoren können verwendet werden. **Verwende niemals einfache Passwörter oder leicht zu erratende Strings!**
        *   **Speicherung (Sicherheit!):** Speichere dieses Secret **niemals** direkt im Code oder in Versionskontrollsystemen (wie Git).
            *   *Empfohlen:* Verwende eine `.env`-Datei im `server`-Verzeichnis:
                1.  Erstelle die Datei `.env`.
                2.  Füge sie zur `.gitignore`-Datei hinzu, um versehentliches Einchecken zu verhindern.
                3.  Füge die Zeile `JWT_SECRET=DEIN_GENERIERTER_SCHLUESSEL` hinzu.
            *   *Alternativ (weniger sicher):* Umgebungsvariablen des Betriebssystems oder Konfigurationsmanagement-Tools für Produktionsumgebungen.
    *   **JWT Ablaufzeit (`JWT_EXPIRES_IN`):**
        *   Definiere die Gültigkeitsdauer. Übliche Werte sind zwischen 15 Minuten (`'15m'`) und mehreren Tagen (`'7d'`).
        *   **Trade-off:** Kürzere Zeiten sind sicherer (begrenzen das Zeitfenster bei Token-Diebstahl), erfordern aber häufigere Logins oder eine Implementierung von Refresh Tokens (was den Rahmen dieses Plans sprengt). Längere Zeiten sind benutzerfreundlicher. Wähle einen sinnvollen Kompromiss (z.B. `'1d'` oder `'7d'` für den Anfang).
        *   Speichere diesen Wert ebenfalls in der `.env`-Datei oder der Konfigurationsdatei.
    *   **Konfigurationsdatei (`server/config/auth.js`):** Erstelle diese Datei, um die Werte zentral zu laden und bereitzustellen.
        ```javascript
        // server/config/auth.js
        // Lade .env-Datei, falls dotenv installiert ist
        try {
          require('dotenv').config();
          console.log("dotenv geladen aus server/config/auth.js"); // Debug-Log
        } catch (e) {
          // dotenv nicht installiert oder .env nicht gefunden - kein Problem, wenn Variablen anders gesetzt werden
        }

        const jwtSecret = process.env.JWT_SECRET;
        const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d'; // Fallback Ablaufzeit

        if (!jwtSecret) {
          console.error("FATALER FEHLER: JWT_SECRET ist nicht in der Umgebung oder .env-Datei definiert!");
          // In einer echten Anwendung sollte der Prozess hier beendet werden,
          // da ohne Secret keine sichere Authentifizierung möglich ist.
          // Für die Entwicklung setzen wir einen unsicheren Fallback, aber mit Warnung.
          console.warn("!!! Verwende unsicheren Fallback JWT_SECRET für die Entwicklung !!!");
          // process.exit(1); // In Produktion hier beenden!
        }

        module.exports = {
          JWT_SECRET: jwtSecret || 'bitte-sofort-aendern-in-env-oder-config', // Unsicherer Fallback
          JWT_EXPIRES_IN: jwtExpiresIn
        };
        ```
    *   Stelle sicher, dass diese Konfiguration (`authConfig`) in den relevanten Dateien (Controller, Middleware) importiert werden kann: `const authConfig = require('../config/auth');`.

**Best Practices & Überlegungen:**

*   **Secret Rotation:** In Produktionsumgebungen sollten Secrets regelmäßig rotiert (geändert) werden. Mechanismen dafür müssen etabliert werden.
*   **Algorithmus:** `jsonwebtoken` verwendet standardmäßig `HS256`. Dies ist sicher, solange das Secret geheim bleibt. Für komplexere Architekturen (z.B. Microservices) könnte `RS256` (mit Public/Private Keys) eine Option sein.
*   **`.env`-Datei:** Füge die `.env`-Datei *immer* zur `.gitignore` hinzu. Erstelle stattdessen eine `.env.example`-Datei mit den benötigten Variablennamen (ohne die Werte), die eingecheckt wird.
*   **Fehlerbehandlung:** Die Konfigurationsdatei sollte robust sein und klare Fehlermeldungen ausgeben, wenn das Secret fehlt.

**Mögliche Probleme & Risiken:**

*   **Secret Leakage:** Das größte Risiko. Wenn das Secret kompromittiert wird, können Angreifer gültige JWTs für beliebige Benutzer erstellen.
*   **Schwaches Secret:** Leicht zu erratende Secrets können durch Brute-Force-Angriffe geknackt werden.
*   **Fehlende `.env`-Datei / Umgebungsvariablen:** Der Server kann ohne Secret nicht sicher starten oder verwendet einen unsicheren Fallback.
*   **Abhängigkeits-Sicherheitslücken:** Veraltete Pakete können bekannte Schwachstellen enthalten (`npm audit` regelmäßig ausführen).

**Akzeptanzkriterien:**

*   `jsonwebtoken` und `cookie-parser` sind in `server/package.json` vorhanden und installiert.
*   Eine sichere Methode zur Verwaltung des `JWT_SECRET` ist implementiert (vorzugsweise über `.env`-Datei und `dotenv`).
*   Das `JWT_SECRET` ist stark und zufällig generiert.
*   Die `.env`-Datei ist in `.gitignore` eingetragen.
*   Die JWT-Ablaufzeit (`JWT_EXPIRES_IN`) ist sinnvoll definiert.
*   Die Konfiguration (`server/config/auth.js`) lädt die Werte korrekt und ist für andere Server-Module zugänglich.
*   Der Server gibt einen Fehler aus oder beendet sich, wenn das `JWT_SECRET` nicht geladen werden kann (außer im Entwicklungsmodus mit expliziter Warnung).