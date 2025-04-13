# Ticket 0008: Client Auth-Logik anpassen

**Einleitung:**

Dieses Ticket beschreibt die notwendigen Anpassungen auf der Client-Seite (im Browser des Benutzers), um mit dem neuen JWT/Cookie-basierten Authentifizierungssystem des Servers zu kommunizieren. Wir müssen die JavaScript-Funktionen, die für Login, Logout und die neue Registrierung zuständig sind, überarbeiten oder neu erstellen. Diese Logik befindet sich typischerweise entweder direkt in den HTML-Dateien (`login.html`, `register.html`) oder, besser, in einer separaten, wiederverwendbaren JavaScript-Datei (z.B. `client/js/auth.js`).

*   **Zweck der Änderungen:**
    *   **Login/Registrierung:** Die Funktionen müssen nun die korrekten API-Endpunkte (`/api/auth/login`, `/api/auth/register`) aufrufen. Sie senden die Benutzerdaten (Username, Passwort etc.) an den Server. Bei Erfolg leiten sie den Benutzer zur Spielseite weiter. Sie müssen keine Tokens oder Session-IDs mehr manuell im `localStorage` speichern, da der Server das JWT als `httpOnly`-Cookie setzt. Dieses Cookie wird vom Browser automatisch bei zukünftigen Anfragen an dieselbe Domain (oder gemäß der Cookie-Scope-Einstellungen) mitgesendet.
    *   **Logout:** Die Funktion ruft den neuen `/api/auth/logout`-Endpunkt auf. Der Server weist den Browser dann an, das Cookie zu löschen. Die Client-Funktion muss keine lokalen Daten mehr löschen (wie die alte `sessionId`) und leitet den Benutzer einfach zur Login-Seite um.
    *   **Authentifizierungsprüfung (`checkAuth`):** Eine neue, wichtige Funktion wird benötigt, um *bevor* geschützte Seiten (wie `game.html`) geladen werden, zu prüfen, ob der Benutzer eine gültige Sitzung hat. Dies geschieht durch einen Aufruf an den `/api/auth/me`-Endpunkt. Der Browser sendet das `token`-Cookie automatisch mit. Wenn der Server mit Benutzerdaten antwortet (Status 200), ist der Benutzer authentifiziert. Wenn der Server einen Fehler (Status 401) sendet (weil kein Cookie gesendet wurde, das Token ungültig/abgelaufen ist oder der Benutzer inaktiv ist), ist der Benutzer nicht (mehr) authentifiziert und sollte zur Login-Seite umgeleitet werden. Diese Prüfung verhindert, dass nicht eingeloggte Benutzer versuchen, das Spiel zu laden.
    *   **`credentials: 'include'`:** Diese Option ist bei allen `fetch`-Aufrufen an die API entscheidend. Sie weist den Browser explizit an, Cookies (einschließlich unseres JWT-Tokens) bei Anfragen an den Server mitzusenden, auch wenn die Anfrage von JavaScript ausgelöst wird (Cross-Site Request Forgery - CSRF - Schutzmechanismen könnten sonst greifen). Ohne diese Option würde der Server das Cookie nicht empfangen und den Benutzer nicht erkennen können.

*   **Logik:**
    *   Wir identifizieren oder erstellen eine zentrale JavaScript-Datei (z.B. `client/js/auth.js`) für diese Funktionen, um Code-Wiederholung zu vermeiden.
    *   Wir implementieren `async`-Funktionen für `login`, `register`, `logout` und `checkAuth`, die `fetch` verwenden, um mit den entsprechenden Server-Endpunkten zu kommunizieren.
    *   Wir stellen sicher, dass bei allen `fetch`-Aufrufen an unsere API die Option `credentials: 'include'` gesetzt ist.
    *   Wir verarbeiten die Server-Antworten (Status-Codes und JSON-Body) sorgfältig, um Erfolg oder Fehler zu erkennen.
    *   Bei Erfolg leiten wir den Benutzer auf die entsprechende Seite weiter (`/game.html` oder `/login.html`).
    *   Bei Fehlern lesen wir die Fehlermeldungen aus der Server-Antwort und zeigen sie dem Benutzer im entsprechenden Formular an (z.B. in dafür vorgesehenen `<div>`-Elementen).
    *   Wir entfernen jeglichen Code, der sich auf das manuelle Speichern oder Löschen von `sessionId` oder `username` im `localStorage` bezieht.

Diese Anpassungen stellen sicher, dass der Client korrekt mit dem neuen Backend-Authentifizierungssystem interagiert und die Benutzerführung bei Login, Registrierung und Logout nahtlos funktioniert.

---

**Ziel:** Anpassen der clientseitigen JavaScript-Logik für Login, Logout und Hinzufügen der Registrierung, um mit dem neuen JWT/Cookie-basierten Backend zu interagieren.

**Abhängigkeiten:** Ticket 0003 (Auth Controller), Ticket 0006 (Auth Routen)

**Aufgaben:**

1.  **Datei identifizieren/erstellen:** Entscheide, ob die Logik in `client/js/auth.js` gekapselt oder direkt in die `<script>`-Tags von `login.html` und `register.html` geschrieben wird. Eine separate Datei ist für die Wiederverwendbarkeit (z.B. für `checkAuth` in `game.js`) und Wartbarkeit besser. Erstelle ggf. `client/js/auth.js`.
2.  **Imports (falls separate Datei):** Ggf. Hilfsfunktionen importieren (z.B. eine Funktion `displayError(elementId, message)`).
3.  **`login(username, password)` Funktion anpassen/erstellen:**
    *   Sollte `async` sein und `true` bei Erfolg, `false` oder Fehlerobjekt bei Misserfolg zurückgeben.
    *   Macht `fetch('/api/auth/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'include', body: JSON.stringify({ username, password }) })`.
    *   Verarbeitet die Antwort:
        *   `if (response.ok)`: `return true;` (Weiterleitung erfolgt im aufrufenden Code).
        *   `else`: `const errorData = await response.json(); throw new Error(errorData.message || 'Login fehlgeschlagen');` (oder gib `errorData` zurück).
    *   `catch` für Netzwerkfehler (wirft ebenfalls Fehler).
4.  **`register(username, email, password, confirmPassword)` Funktion erstellen:**
    *   Sollte `async` sein und `true` bei Erfolg, `false` oder Fehlerobjekt bei Misserfolg zurückgeben.
    *   Macht `fetch('/api/auth/register', { method: 'POST', headers: {'Content-Type': 'application/json'}, credentials: 'include', body: JSON.stringify({ username, email, password, confirmPassword }) })`.
    *   Verarbeitet die Antwort:
        *   `if (response.ok)`: `return true;` (Weiterleitung im aufrufenden Code).
        *   `else`: `const errorData = await response.json(); throw new Error(errorData.message || JSON.stringify(errorData.errors) || 'Registrierung fehlgeschlagen');` (oder gib `errorData` zurück).
    *   `catch` für Netzwerkfehler.
5.  **`logout()` Funktion anpassen/erstellen:**
    *   Sollte `async` sein.
    *   Macht `fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })`.
    *   Verwendet `.finally { window.location.href = '/login.html'; }`, um sicherzustellen, dass die Umleitung immer erfolgt, unabhängig vom Erfolg des Serveraufrufs (da das Cookie clientseitig nicht zuverlässig gelöscht werden kann).
    *   Entferne `localStorage.removeItem('sessionId');` und `localStorage.removeItem('username');`.
6.  **`checkAuth()` Funktion erstellen (oder Äquivalent):**
    *   Sollte `async` sein.
    *   Macht `fetch('/api/auth/me', { method: 'GET', credentials: 'include' })`.
    *   Verarbeitet die Antwort:
        *   `if (response.ok)`: `const data = await response.json(); return data;` (enthält `{ player: ... }`).
        *   `if (response.status === 401)`: `return null;` (Nicht authentifiziert).
        *   `else`: `throw new Error('Fehler bei der Authentifizierungsprüfung: ' + response.status);` (Anderer Serverfehler).
    *   `catch` für Netzwerkfehler (wirft ebenfalls Fehler oder gibt `null` zurück).
7.  **Exportieren (falls separate Datei):** Exportiere die Funktionen `login`, `register`, `logout`, `checkAuth`.

**Best Practices & Überlegungen:**

*   **Zentrale Auth-Datei:** Die Verwendung einer separaten `auth.js`-Datei verbessert die Organisation und Wiederverwendbarkeit.
*   **Fehlerbehandlung:** Die Funktionen sollten Fehler werfen oder klar signalisieren (z.B. durch Rückgabe von `null` oder einem Fehlerobjekt), damit der aufrufende Code (in `login.html`, `register.html`, `game.js`) entsprechend reagieren kann (Fehler anzeigen, Umleiten).
*   **User Experience:** Gib dem Benutzer klares Feedback während der Anfragen (z.B. Ladeanzeige) und bei Fehlern.
*   **Sicherheit:** Obwohl `httpOnly` Cookies sicher vor direktem JavaScript-Zugriff sind, stelle sicher, dass keine sensiblen Daten unnötig im Client-Code oder `localStorage` gespeichert werden.

**Mögliche Probleme & Risiken:**

*   **Fehlendes `credentials: 'include'`:** Führt dazu, dass Cookies nicht gesendet werden und die Authentifizierung serverseitig fehlschlägt (401).
*   **CORS-Probleme:** Wenn Client und Server auf unterschiedlichen Domains/Ports laufen (was hier der Fall ist: Client vermutlich auf 3000, API auf 3000, Socket auf 3001), müssen die CORS-Header auf dem Server korrekt gesetzt sein, um Anfragen mit Credentials zu erlauben (`Access-Control-Allow-Origin` muss spezifisch sein, nicht `*`, und `Access-Control-Allow-Credentials` muss `true` sein). Dies betrifft die Express-App (`webApp`).
*   **Fehlerhafte Fehleranzeige:** Unklare oder fehlende Fehlermeldungen frustrieren den Benutzer.
*   **Falsche Umleitungen:** Benutzer landen nach Aktionen nicht auf der erwarteten Seite.

**Akzeptanzkriterien:**

*   Die clientseitige Auth-Logik (idealerweise in `client/js/auth.js`) ist angepasst/erstellt.
*   Die `login`-Funktion ruft `/api/auth/login` korrekt auf, verwendet `credentials: 'include'`, gibt Erfolg/Fehler zurück und verwendet kein `localStorage`.
*   Die `register`-Funktion ruft `/api/auth/register` korrekt auf, verwendet `credentials: 'include'` und gibt Erfolg/Fehler zurück.
*   Die `logout`-Funktion ruft `/api/auth/logout` korrekt auf, verwendet `credentials: 'include'`, leitet immer um und bereinigt **nicht** den `localStorage`.
*   Die `checkAuth`-Funktion prüft den Authentifizierungsstatus korrekt über `/api/auth/me` mit `credentials: 'include'`.
*   Fehler von den API-Aufrufen werden korrekt behandelt und können im UI angezeigt werden.