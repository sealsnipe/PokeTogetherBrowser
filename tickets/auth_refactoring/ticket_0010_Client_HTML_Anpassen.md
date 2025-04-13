# Ticket 0010: Client HTML anpassen & Registrierung erstellen

**Einleitung:**

Dieses Ticket befasst sich mit den Benutzeroberflächen (HTML-Seiten), die der Benutzer für die Anmeldung (`login.html`) und die neu zu erstellende Registrierung (`register.html`) sieht. Diese Seiten sind die direkten Schnittstellen für den Benutzer zur Interaktion mit dem Authentifizierungssystem. Sie müssen nicht nur die notwendigen Eingabefelder bereitstellen, sondern auch das clientseitige JavaScript enthalten, das die Benutzereingaben sammelt, die entsprechenden API-Aufrufe an den Server sendet (mithilfe der Funktionen aus Ticket 0008) und dem Benutzer Feedback gibt (Erfolg oder Fehler).

*   **Zweck der Änderungen:**
    *   **`login.html`:** Diese Seite muss angepasst werden, um die aktualisierte `login`-Funktion (aus Ticket 0008) zu verwenden. Das bedeutet, dass das JavaScript im `<script>`-Block dieser Seite (oder einer importierten Datei) beim Absenden des Formulars die `login`-Funktion aufruft. Es darf keine veraltete Logik mehr enthalten, die versucht, eine `sessionId` im `localStorage` zu speichern. Die Fehlerbehandlung muss so angepasst werden, dass sie die vom Server über die API zurückgegebenen Fehlermeldungen (z.B. "Ungültige Anmeldedaten") in einem dafür vorgesehenen HTML-Element anzeigt. Außerdem wird ein Link zur neuen Registrierungsseite hinzugefügt.
    *   **`register.html` (Neu):** Diese Seite muss neu erstellt werden. Sie benötigt ein HTML-Formular mit Feldern für Benutzername, E-Mail (optional, je nach Serverkonfiguration), Passwort und Passwortbestätigung. Ähnlich wie bei `login.html` muss ein `<script>`-Block (oder eine importierte Datei) das Absenden des Formulars abfangen, die `register`-Funktion (aus Ticket 0008) aufrufen und die Serverantwort verarbeiten. Bei Erfolg wird zur Spielseite weitergeleitet. Bei Fehlern (z.B. "Benutzername vergeben", "Passwörter stimmen nicht überein", Validierungsfehler von Ticket 0005) müssen diese dem Benutzer klar angezeigt werden, idealerweise beim jeweiligen Eingabefeld. Ein Link zurück zur Login-Seite ist ebenfalls erforderlich.
    *   **Konsistentes Design & UX:** Beide Seiten sollten ein ähnliches visuelles Design verwenden (CSS). Die Benutzerführung sollte klar sein, mit deutlichen Links zwischen Login und Registrierung. Die Fehleranzeige sollte konsistent und verständlich sein.

*   **Logik:**
    *   **HTML:** Wir definieren die Struktur der Formulare mit `<input>`-Feldern, `<label>`-Elementen und `<div>`-Containern für Fehlermeldungen. Wichtig sind eindeutige `id`-Attribute für den Zugriff per JavaScript.
    *   **CSS:** Wir stellen sicher, dass beide Seiten ansprechend gestaltet sind und die Fehlercontainer standardmäßig ausgeblendet sind und nur bei Bedarf (mit z.B. roter Schrift) angezeigt werden.
    *   **JavaScript (Event Handling):**
        1.  Ein `submit`-Event-Listener wird an jedes Formular gehängt.
        2.  `event.preventDefault()` verhindert das Neuladen der Seite.
        3.  Fehlermeldungs-Container werden zurückgesetzt (geleert und ausgeblendet).
        4.  Die Werte aus den Eingabefeldern werden gelesen.
        5.  Die entsprechende Funktion (`login` oder `register` aus Ticket 0008) wird mit `async/await` aufgerufen.
        6.  Ein `try...catch`-Block fängt Fehler ab (sowohl Netzwerkfehler als auch vom Server zurückgegebene Fehler).
        7.  Im `catch`-Block wird die Fehlermeldung analysiert (ist es ein allgemeiner Fehler oder ein spezifischer Feld-Fehler aus `error.errors`?) und im entsprechenden HTML-Container angezeigt.
        8.  Wenn der Aufruf von `login` oder `register` erfolgreich war (`true` zurückgibt), erfolgt die Weiterleitung zu `/game.html`.

Diese Anpassungen schaffen die notwendige Benutzeroberfläche und die clientseitige Logik für die Interaktion mit dem neuen Authentifizierungssystem.

---

**Ziel:** Anpassen der Login-Seite (`login.html`) und Erstellen einer neuen Registrierungs-Seite (`register.html`), um die neue Authentifizierungslogik zu verwenden.

**Abhängigkeiten:** Ticket 0008 (Client Auth-Logik)

**Aufgaben:**

1.  **`login.html` anpassen:**
    *   **Datei öffnen:** `client/login.html`.
    *   **JavaScript überprüfen/anpassen (im `<script>`-Block oder importierter Datei):**
        *   Stelle sicher, dass auf die `login`-Funktion (aus Ticket 0008) zugegriffen werden kann.
        *   Implementiere den `submit`-Handler für das Login-Form (`#loginForm`):
            ```javascript
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              // Fehlermeldungen zurücksetzen
              document.getElementById('generalError').textContent = '';
              document.getElementById('generalError').style.display = 'none';
              // Ggf. auch Feld-spezifische Fehler zurücksetzen

              const username = document.getElementById('username').value;
              const password = document.getElementById('password').value;

              try {
                const success = await login(username, password); // Ruft Funktion aus auth.js auf
                if (success) {
                  window.location.href = '/game.html'; // Weiterleitung bei Erfolg
                }
                // Wenn login() false zurückgibt oder Fehler wirft, wird catch ausgelöst
              } catch (error) {
                console.error('Login-Fehler:', error);
                document.getElementById('generalError').textContent = error.message || 'Ein unbekannter Fehler ist aufgetreten.';
                document.getElementById('generalError').style.display = 'block';
              }
            });
            ```
        *   Entferne jeglichen Code, der `localStorage` für Session-Daten verwendet.
    *   **HTML-Struktur:**
        *   Überprüfe `input`-Felder (`id="username"`, `id="password"`).
        *   Überprüfe Fehlercontainer (`id="generalError"` etc.).
        *   Füge Link zu `register.html` hinzu (falls nicht vorhanden):
            `<p>Noch kein Konto? <a href="register.html">Registrieren</a></p>`

2.  **`register.html` erstellen:**
    *   **Datei erstellen:** `client/register.html`.
    *   **HTML-Struktur:** Kopiere `login.html` als Basis.
        *   Füge Felder für E-Mail (`id="email"`) und Passwortbestätigung (`id="confirmPassword"`) hinzu, jeweils mit `<label>` und Fehlercontainer (`id="emailError"`, `id="confirmPasswordError"`).
        *   Ändere Button-Text und Footer-Link (`<p>Bereits ein Konto? <a href="login.html">Anmelden</a></p>`).
    *   **CSS:** Übernehme Styles oder verlinke gemeinsames CSS.
    *   **JavaScript hinzufügen (`<script>`-Block):**
        *   Stelle sicher, dass auf die `register`-Funktion (aus Ticket 0008) zugegriffen werden kann.
        *   Implementiere den `submit`-Handler für das Registrierungs-Form (`#registerForm`):
            ```javascript
            document.getElementById('registerForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              // Alle Fehlermeldungen zurücksetzen
              document.querySelectorAll('.error-message').forEach(el => {
                  el.textContent = '';
                  el.style.display = 'none';
              });

              const username = document.getElementById('username').value;
              const email = document.getElementById('email').value; // Kann leer sein, wenn optional
              const password = document.getElementById('password').value;
              const confirmPassword = document.getElementById('confirmPassword').value;

              // Client-seitige Prüfung (optional, aber gut für UX)
              if (password !== confirmPassword) {
                  document.getElementById('confirmPasswordError').textContent = 'Passwörter stimmen nicht überein.';
                  document.getElementById('confirmPasswordError').style.display = 'block';
                  return;
              }

              try {
                const success = await register(username, email, password, confirmPassword);
                if (success) {
                  window.location.href = '/game.html'; // Weiterleitung bei Erfolg
                }
              } catch (error) {
                console.error('Registrierungs-Fehler:', error);
                // Versuche, Fehlerdetails zu analysieren (falls Server ein errors-Array sendet)
                try {
                    const errorData = JSON.parse(error.message); // Prüfen, ob die Nachricht JSON ist
                    if (Array.isArray(errorData)) { // Annahme: errors-Array von express-validator
                        errorData.forEach(err => {
                            const errorElement = document.getElementById(`${err.param}Error`);
                            if (errorElement) {
                                errorElement.textContent = err.msg;
                                errorElement.style.display = 'block';
                            } else {
                                // Fallback für allgemeine Fehler
                                document.getElementById('generalError').textContent += `${err.msg} `;
                                document.getElementById('generalError').style.display = 'block';
                            }
                        });
                    } else {
                         document.getElementById('generalError').textContent = error.message;
                         document.getElementById('generalError').style.display = 'block';
                    }
                } catch (parseError) {
                    // Wenn error.message kein JSON war
                    document.getElementById('generalError').textContent = error.message || 'Ein unbekannter Fehler ist aufgetreten.';
                    document.getElementById('generalError').style.display = 'block';
                }
              }
            });
            ```

**Best Practices & Überlegungen:**

*   **Client-seitige Validierung:** Füge grundlegende Prüfungen hinzu (z.B. Passwortübereinstimmung, erforderliche Felder nicht leer), um unnötige Serveranfragen zu vermeiden und dem Benutzer sofortiges Feedback zu geben. Verlasse dich aber **niemals** nur auf Client-seitige Validierung; die serverseitige Validierung (Ticket 0005) ist entscheidend für die Sicherheit.
*   **Passwort-Stärke-Anzeige:** Erwäge, während der Eingabe im Registrierungsformular eine visuelle Anzeige der Passwortstärke hinzuzufügen.
*   **Barrierefreiheit:** Stelle sicher, dass Formulare semantisch korrekt sind (Verwendung von `<label for="...">`), für Screenreader zugänglich sind und Tastaturnavigation unterstützen.
*   **Ladezustände:** Zeige dem Benutzer an, dass eine Anfrage an den Server gesendet wird (z.B. durch Deaktivieren des Buttons und Anzeigen eines Spinners).

**Mögliche Probleme & Risiken:**

*   **JavaScript-Fehler:** Fehler im Event-Handler-Code können die Formularübermittlung verhindern.
*   **Fehlerhafte Fehleranzeige:** Wenn die `id`-Attribute der Fehlercontainer nicht mit den erwarteten Fehlerschlüsseln übereinstimmen, werden Fehler nicht korrekt angezeigt.
*   **Inkonsistentes Verhalten:** Wenn `login`/`register` in Ticket 0008 anders implementiert sind (z.B. keine Fehler werfen), muss die Fehlerbehandlung hier angepasst werden.

**Akzeptanzkriterien:**

*   `login.html` verwendet die neue `login`-Funktion, speichert keine Session-Daten mehr lokal, zeigt Server-Fehler korrekt an und enthält einen Link zu `register.html`.
*   Die neue Datei `client/register.html` existiert und ist funktionsfähig.
*   `register.html` enthält ein Formular mit den erforderlichen Feldern und Fehlercontainern.
*   Das JavaScript in `register.html` ruft die neue `register`-Funktion auf, leitet bei Erfolg weiter und zeigt Server-Fehler (idealerweise feldbezogen) korrekt an.
*   Beide Seiten haben ein konsistentes Design und ermöglichen die Navigation zwischen ihnen.