Implementierungsplan für Ticket 0008: Anpassung der Client-Authentifizierungslogik im PokeTogetherBrowser
1. Einleitung
1.1. Zweck
Dieses Dokument dient als umfassender Implementierungsleitfaden für Ticket 0008 im Rahmen des PokeTogetherBrowser-Projekts. Das Kernziel ist die detaillierte Beschreibung der notwendigen Schritte zur Anpassung der clientseitigen JavaScript-Anwendung, um das neue, in der Projektdokumentation definierte Authentifizierungssystem zu nutzen. Dieses System basiert auf JSON Web Tokens (JWT), die sicher in httpOnly-Cookies gespeichert werden, und ersetzt den bisherigen, einfacheren Session-basierten Mechanismus.

1.2. Kontext
Die Analyse des aktuellen Projektstands ("Projektübersicht") hat eine signifikante Diskrepanz zwischen der detaillierten Dokumentation (agent/*.md) und dem tatsächlichen Code offenbart. Insbesondere verwendet der Client derzeit einen einfachen, im Speicher des Servers gehaltenen Session-Mechanismus, bei dem eine sessionId im localStorage des Browsers gespeichert wird. Die Projektdokumentation und die Architekturplanung sehen jedoch ein robusteres und sichereres System vor, das auf JWTs basiert, die serverseitig in httpOnly-Cookies gesetzt werden. Ticket 0008 adressiert die clientseitigen Anpassungen, die für diese Umstellung erforderlich sind, einschließlich der Implementierung von Login-, Registrierungs- und Logout-Funktionen sowie einer Methode zur Überprüfung des Authentifizierungsstatus. Diese Diskrepanz, wie in Abschnitt 4 der Projektübersicht hervorgehoben, muss behoben werden, um eine konsistente und sichere Architektur zu gewährleisten.

1.3. Wichtigkeit
Die erfolgreiche Umsetzung dieses Tickets ist von grundlegender Bedeutung für den weiteren Projektfortschritt. Ein korrekt funktionierendes, sicheres Authentifizierungssystem ist die Voraussetzung für nahezu alle geplanten Kernfeatures, die eine persistente Benutzeridentität erfordern. Dazu gehören das Speichern und Laden des Spielfortschritts (Position, Inventar, Pokémon-Team, Quests), die Verwaltung von Pokémon und Inventar über Server-APIs sowie potenziell zukünftige soziale Interaktionen. Die Umstellung auf JWTs in httpOnly-Cookies erhöht zudem die Sicherheit der Anwendung, da diese Tokens nicht direkt über clientseitiges JavaScript zugänglich sind und somit besser vor Cross-Site Scripting (XSS)-Angriffen geschützt sind als Tokens im localStorage. Diese Umstellung bringt den Code in Einklang mit der dokumentierten Zielarchitektur und schafft eine solide Basis für zukünftige Entwicklungen.

2. Voraussetzungen und Serverseitige Abhängigkeiten
2.1. Ziel
Bevor mit der clientseitigen Implementierung gemäß Ticket 0008 begonnen werden kann, müssen bestimmte serverseitige Komponenten und Konfigurationen, die durch die Tickets 0003 (Auth Controller) und 0006 (Auth Routen) abgedeckt werden, funktionsfähig sein. Dieser Abschnitt beschreibt die essenziellen serverseitigen Abhängigkeiten, die für die erfolgreiche Interaktion des Clients mit dem neuen Authentifizierungssystem notwendig sind.

2.2. Benötigte API-Endpunkte
Der Client wird mit folgenden HTTP-API-Endpunkten interagieren, die vom Backend (Node.js/Express) bereitgestellt werden müssen:

/api/auth/login (POST):
Zweck: Nimmt Benutzername und Passwort im JSON-Format entgegen.
Serververhalten: Validiert die Anmeldedaten. Bei Erfolg generiert der Server ein JWT, setzt es in ein httpOnly-Cookie (z.B. namens token) in der HTTP-Antwort und sendet eine Erfolgsantwort (z.B. Status 200 OK) mit optionalen Benutzerdaten zurück. Bei Fehler (ungültige Daten, falsches Passwort) sendet der Server eine Fehlerantwort (z.B. Status 401 Unauthorized oder 400 Bad Request) mit einer Fehlermeldung im JSON-Format.
/api/auth/register (POST):
Zweck: Nimmt Registrierungsdaten (z.B. Benutzername, E-Mail, Passwort, Passwortbestätigung) im JSON-Format entgegen.
Serververhalten: Validiert die Eingaben (z.B. Passwortstärke, E-Mail-Format, Eindeutigkeit des Benutzernamens/E-Mail). Bei Erfolg erstellt der Server einen neuen Benutzerdatensatz in der Datenbank, generiert ein JWT, setzt das httpOnly-Cookie und sendet eine Erfolgsantwort (z.B. Status 201 Created). Bei Validierungsfehlern oder wenn der Benutzername/E-Mail bereits existiert, sendet der Server eine Fehlerantwort (z.B. Status 400 Bad Request oder 409 Conflict) mit detaillierten Fehlermeldungen im JSON-Format.
/api/auth/logout (POST):
Zweck: Beendet die aktuelle Benutzersitzung.
Serververhalten: Der Server invalidiert serverseitig das mit dem Cookie assoziierte Token (falls eine serverseitige Sperrliste verwendet wird) und weist den Browser an, das httpOnly-Cookie zu löschen. Dies geschieht typischerweise durch das Setzen eines Cookies mit demselben Namen, aber einem leeren Wert und einem Ablaufdatum in der Vergangenheit (Expires=Thu, 01 Jan 1970 00:00:00 GMT). Der Server sendet eine Erfolgsantwort (z.B. Status 200 OK oder 204 No Content).
/api/auth/me (GET):
Zweck: Überprüft die Gültigkeit des vom Browser mitgesendeten httpOnly-Cookies und gibt Informationen über den authentifizierten Benutzer zurück.
Serververhalten: Der Server prüft das eingehende Cookie. Ist das Token gültig und nicht abgelaufen, sendet der Server eine Erfolgsantwort (Status 200 OK) mit Benutzerdaten (z.B. { user: { id, username, email,... } }) im JSON-Format zurück. Ist kein gültiges Cookie vorhanden, das Token ungültig oder abgelaufen, sendet der Server eine Fehlerantwort (Status 401 Unauthorized).
2.3. Tabelle: API-Endpunkt-Zusammenfassung
Die folgende Tabelle fasst die Interaktionsdetails für die benötigten API-Endpunkte zusammen und dient als Referenz für die clientseitige Implementierung:

Endpunkt	Methode	Client sendet (Body)	Client sendet (Header)	Client sendet (Cookie)	Server antwortet (Erfolg)	Server antwortet (Fehler)	Wichtige Hinweise
/api/auth/register	POST	{ username, email, password, confirmPassword }	Content-Type: application/json	Nein	201 Created (Setzt httpOnly Cookie)	400 Bad Request (Validation Errors), 409 Conflict (User Exists) - JSON mit { message } oder { errors }	
/api/auth/login	POST	{ username, password }	Content-Type: application/json	Nein	200 OK (Setzt httpOnly Cookie), optional JSON mit { user:... }	401 Unauthorized (Invalid Credentials), 400 Bad Request - JSON mit { message }	
/api/auth/logout	POST	(Leer)	-	Ja (token-Cookie)	200 OK / 204 No Content (Weist Browser an, Cookie zu löschen)	(Normalerweise keine spezifischen Fehler erwartet, außer Serverfehler 500)	Client muss credentials: 'include' verwenden.
/api/auth/me	GET	-	-	Ja (token-Cookie)	200 OK - JSON mit { user: { id, username,... } }	401 Unauthorized (Kein gültiges Cookie)	Client muss credentials: 'include' verwenden. Dient zur Überprüfung der Authentifizierung und zum Abrufen von Benutzerdaten nach dem Laden der Seite oder bei Routenwechseln.

In Google Sheets exportieren
Diese tabellarische Übersicht stellt eine zentrale Referenz dar, die das Verständnis der Interaktionsverträge zwischen Client und Server erleichtert und hilft, Fehler bei der Implementierung der fetch-Aufrufe zu vermeiden. Sie verdeutlicht das erwartete Verhalten des Servers, insbesondere bezüglich des Setzens und Löschens von Cookies sowie der Statuscodes und Antwortformate.

2.4. Kritische Serverkonfiguration: CORS (Cross-Origin Resource Sharing)
2.4.1. Erklärung und credentials: 'include' Anforderung
Ein entscheidender Aspekt bei der Interaktion zwischen dem Client und der Server-API ist die Handhabung von Cross-Origin Resource Sharing (CORS). Da der Client (vermutlich eine Next.js/React-Anwendung auf http://localhost:3000) und die API (Express-Server, möglicherweise auf http://localhost:3001 oder einem anderen Pfad auf Port 3000) potenziell unterschiedliche Ursprünge (Kombination aus Protokoll, Domain und Port) haben, greifen die Sicherheitsmechanismen der Browser bezüglich Cross-Origin-Anfragen.

Für das Funktionieren des neuen Authentifizierungssystems ist es zwingend erforderlich, dass der Client bei allen fetch-Aufrufen an die /api/auth/*-Endpunkte die Option { credentials: 'include' } verwendet. Diese Option weist den Browser an, Cookies (in diesem Fall das httpOnly JWT-Cookie) und andere Anmeldeinformationen auch bei Cross-Origin-Anfragen mitzusenden. Ohne diese Option würde der Browser das Cookie aus Sicherheitsgründen zurückhalten, und der Server könnte den Benutzer nicht authentifizieren.

2.4.2. Notwendige Serverseitige Header
Damit der Browser Anfragen mit credentials: 'include' erlaubt, muss der Server (die Express webApp) spezifische CORS-Header in seinen Antworten senden. Diese Header müssen im Rahmen von Ticket 0003/0006 korrekt konfiguriert werden:

Access-Control-Allow-Origin: Dieser Header darf nicht auf den Wildcard-Wert * gesetzt werden, wenn Credentials gesendet werden. Er muss den exakten Ursprung des Clients enthalten (z.B. http://localhost:3000).
Access-Control-Allow-Credentials: Dieser Header muss auf true gesetzt sein, um dem Browser explizit zu signalisieren, dass der Server Anfragen mit Credentials akzeptiert.
Access-Control-Allow-Methods: Muss die erlaubten HTTP-Methoden auflisten, mindestens GET und POST für die Authentifizierungs-Endpunkte.
Access-Control-Allow-Headers: Muss notwendige Anfrage-Header wie Content-Type erlauben.
2.4.3. Enge Kopplung und Debugging-Komplexität
Die Notwendigkeit von credentials: 'include' auf Client-Seite und die korrekte Konfiguration der CORS-Header auf Server-Seite sind untrennbar miteinander verbunden. Ein Fehler auf einer Seite führt unweigerlich zum Scheitern der Authentifizierung. Wenn der Server die erforderlichen Access-Control-Allow-Origin- und Access-Control-Allow-Credentials: true-Header nicht korrekt sendet, wird der Browser die Anfrage blockieren, bevor sie die eigentliche Anwendungslogik auf dem Server erreicht. Dies äußert sich oft in kryptischen Netzwerkfehlern in der Browser-Konsole (z.B. "Cross-Origin Request Blocked", "credential is not supported if the CORS header ‘Access-Control-Allow-Origin’ is ‘*’"). Entwickler, die an Ticket 0008 arbeiten, könnten fälschlicherweise annehmen, der Fehler liege in ihrem Client-Code, während das Problem tatsächlich in der Serverkonfiguration liegt. Daher ist es essenziell, bei Authentifizierungsproblemen zuerst die Netzwerk-Tab der Browser-Entwicklertools zu prüfen und die Request- und Response-Header genau zu analysieren. Eine enge Abstimmung mit den Entwicklern, die für die serverseitigen Tickets verantwortlich sind, ist hier unerlässlich.

2.4.4. Umgebungsunterschiede
CORS-Probleme treten häufig unterschiedlich in Entwicklungs- und Produktionsumgebungen auf. In der Entwicklungsumgebung laufen Client und Server oft auf localhost, aber unterschiedlichen Ports (z.B. 3000 und 3001), was ein klares Cross-Origin-Szenario darstellt und die spezifischen CORS-Header erfordert. In einer Produktionsumgebung könnten Client und API unter derselben Domain und Subdomain bereitgestellt werden (z.B. app.poketogether.com und app.poketogether.com/api), was sie zu Same-Origin macht und die CORS-Anforderungen für Credentials lockert. Es ist jedoch auch üblich, dass API und Frontend auf unterschiedlichen Subdomains (z.B. api.poketogether.com und app.poketogether.com) oder hinter verschiedenen Diensten (wie CDNs) liegen, was wieder zu Cross-Origin-Szenarien führt. Die serverseitige CORS-Konfiguration muss daher flexibel sein und darf nicht fest auf http://localhost:3000 codiert sein. Die Verwendung von Umgebungsvariablen zur Konfiguration des erlaubten Ursprungs (Access-Control-Allow-Origin) auf dem Server ist dringend empfohlen, um sowohl Entwicklungs- als auch Produktionsszenarien abdecken zu können. Tests sollten in einer Umgebung durchgeführt werden, die die Ursprungsbeziehungen der Produktion widerspiegelt.

3. Clientseitige Implementierungsstrategie
3.1. Ziel
Dieser Abschnitt definiert die empfohlene Vorgehensweise zur Organisation und Integration der neuen clientseitigen Authentifizierungslogik unter Berücksichtigung der wahrscheinlichen Technologiewahl (Next.js/React) und der Notwendigkeit, die alte localStorage-basierte Logik abzulösen.

3.2. Code-Organisation
Es wird dringend empfohlen, die gesamte clientseitige Logik für die Interaktion mit den Authentifizierungs-API-Endpunkten in einem dedizierten JavaScript-Modul zu kapseln. Angesichts der Hinweise auf Next.js/React in der Projektstruktur (.next/, pages/, components/) wäre ein geeigneter Speicherort beispielsweise client/src/services/authService.js (unter der Annahme einer src-Verzeichnisstruktur) oder client/lib/auth.js.

Die Zentralisierung in einem solchen Service-Modul bietet mehrere Vorteile:

Wiederverwendbarkeit: Funktionen wie checkAuth werden an mehreren Stellen benötigt (z.B. beim Laden geschützter Seiten, in globalen Layouts). Ein zentrales Modul vermeidet Code-Duplizierung.
Wartbarkeit: Änderungen an API-Endpunkten oder der Fehlerbehandlung müssen nur an einer Stelle vorgenommen werden.
Testbarkeit: Das Modul kann isoliert getestet werden (Unit-Tests).
Trennung der Belange (Separation of Concerns): Die UI-Komponenten (React-Komponenten) bleiben frei von direkten API-Aufrufdetails und konzentrieren sich auf die Darstellung und Benutzerinteraktion.
Die Alternative, die Logik direkt in <script>-Tags von HTML-Dateien (login.html, register.html) einzubetten, wie im Ticket angedeutet, ist bei Verwendung eines Frameworks wie Next.js/React nicht idiomatisch und sollte vermieden werden.

3.3. Integration mit UI (unter Berücksichtigung von Next.js/React)
Die Projektübersicht legt nahe, dass trotz einiger Hinweise auf eine einfache HTML/JS-Struktur wahrscheinlich Next.js/React als Frontend-Framework zum Einsatz kommt. Dies hat signifikante Auswirkungen auf die Integration der Authentifizierungslogik:

Keine direkte DOM-Manipulation: Statt Logik in login.html oder register.html einzubetten und DOM-Elemente direkt zu manipulieren, wird die Logik innerhalb von React-Komponenten implementiert.
Formularbehandlung: Login- und Registrierungsformulare werden als React-Komponenten erstellt. Der Zustand der Eingabefelder wird mit useState verwaltet. Die onSubmit-Handler der Formulare rufen die entsprechenden Funktionen aus dem authService (z.B. login, register) auf.
Weiterleitungen: Statt window.location.href wird der Router des Frameworks verwendet (z.B. der useRouter-Hook in Next.js mit router.push('/game') oder router.replace('/login')).
Authentifizierungsprüfung (checkAuth): Die checkAuth-Funktion wird nicht einfach vor dem Laden einer statischen game.html aufgerufen. Stattdessen wird sie in die Routing-Logik oder Komponentenstruktur von Next.js/React integriert:
Higher-Order Components (HOCs): Eine HOC könnte geschützte Seiten wrappen und checkAuth vor dem Rendern ausführen.
Custom Hooks: Ein useAuth-Hook könnte den Authentifizierungsstatus und Benutzerdaten verwalten und checkAuth aufrufen. Komponenten können diesen Hook verwenden, um bedingt zu rendern oder Weiterleitungen auszulösen.
Next.js Middleware: Middleware kann auf dem Server oder am Edge ausgeführt werden, um Anfragen zu prüfen, bevor sie die Seite erreichen, und ggf. Weiterleitungen durchzuführen.
getServerSideProps / getInitialProps (Next.js): Diese Funktionen können checkAuth serverseitig aufrufen (erfordert ggf. das Weiterleiten des Cookies vom Client-Request an den API-Fetch) und bei fehlender Authentifizierung eine Weiterleitung veranlassen.
Clientseitige Wrapper-Komponente: Eine Komponente im Layout könnte checkAuth beim Mounten aufrufen und basierend auf dem Ergebnis den Inhalt rendern oder eine Weiterleitung durchführen.
Die Implementierung muss diese framework-spezifischen Integrationsmuster berücksichtigen. Die konzeptionellen Codebeispiele sollten dies widerspiegeln.

3.4. Veraltung von localStorage
Es ist explizit darauf hinzuweisen, dass jeglicher Code, der sessionId, username oder andere authentifizierungsrelevante Daten im localStorage liest, schreibt oder löscht, entfernt werden muss. Das httpOnly-Cookie, das vom Server verwaltet und vom Browser automatisch gesendet wird, ist nun die alleinige Quelle der Wahrheit für den Authentifizierungsstatus auf Client-Seite.

4. Detaillierte Funktionsimplementierung
4.1. Ziel
Dieser Abschnitt beschreibt die Implementierung der vier Kernfunktionen (login, register, logout, checkAuth) innerhalb des empfohlenen authService-Moduls. Es wird durchgängig async/await für eine bessere Lesbarkeit und Handhabung von Promises verwendet.

4.2. login(username, password) Funktion
Aufgabe: Implementierung von Task 3 aus Ticket 0008.
Signatur: async function login(username, password)
Aktion: Führt einen fetch-Aufruf an den /api/auth/login-Endpunkt durch:
JavaScript

const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Essentiell für das Senden/Empfangen von Cookies
    body: JSON.stringify({ username, password })
});
Antwortverarbeitung:
Versucht immer, die Antwort als JSON zu parsen (const data = await response.json();), da der Server auch bei Fehlern eine JSON-Nachricht senden sollte.
Prüft response.ok (Status 200-299). Wenn true, war der Login erfolgreich (Server hat Cookie gesetzt). Gibt einen Erfolgsindikator zurück (z.B. true oder die vom Server gesendeten Benutzerdaten data.user).
Wenn false, wird eine Fehlermeldung aus dem JSON-Body (data.message) extrahiert und ein Fehler geworfen (throw new Error(data.message | | \HTTP error! status: ${response.status}`);`). Alternativ kann ein Fehlerobjekt zurückgegeben werden.
Fehlerbehandlung: Ein äußerer try...catch-Block fängt Netzwerkfehler (z.B. Server nicht erreichbar) oder Fehler beim Parsen der Antwort ab und wirft sie weiter oder gibt ein standardisiertes Fehlerobjekt zurück.
UI-Interaktion: Der aufrufende Code (z.B. der onSubmit-Handler der Login-Formular-Komponente) ist verantwortlich für:
Anzeigen eines Ladezustands (z.B. Deaktivieren des Submit-Buttons).
Abfangen des geworfenen Fehlers und Anzeigen der Fehlermeldung im UI.
Auslösen der Navigation zur Spielseite (z.B. /game) bei erfolgreichem Login.
4.3. register(userData) Funktion
Aufgabe: Implementierung von Task 4 aus Ticket 0008.
Signatur: async function register(userData) (wobei userData ein Objekt wie { username, email, password, confirmPassword } ist).
Aktion: Führt einen fetch-Aufruf an den /api/auth/register-Endpunkt durch:
JavaScript

const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(userData)
});
Antwortverarbeitung:
Ähnlich wie bei login. Parsen der JSON-Antwort (const data = await response.json();).
Prüft response.ok (erwartet Status 201 Created). Wenn true, war die Registrierung erfolgreich. Gibt true zurück.
Wenn false (z.B. Status 400 für Validierungsfehler, 409 für Konflikte), extrahiert die Fehlermeldung (data.message) oder detaillierte Fehler (data.errors) und wirft einen Fehler (throw new Error(data.message | | JSON.stringify(data.errors) | | \HTTP error! status: ${response.status}`);`).
Fehlerbehandlung: try...catch-Block für Netzwerkfehler etc.
UI-Interaktion: Der aufrufende Code (Registrierungsformular-Komponente) verwaltet den Formularzustand, zeigt Ladeindikatoren an, fängt Fehler ab und zeigt spezifische Validierungsfehler oder allgemeine Fehlermeldungen an. Bei Erfolg leitet er typischerweise zur Login-Seite oder direkt zur Spielseite weiter.
4.4. logout() Funktion
Aufgabe: Implementierung von Task 5 aus Ticket 0008.
Signatur: async function logout()
Aktion: Führt einen fetch-Aufruf an den /api/auth/logout-Endpunkt durch:
JavaScript

await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include' // Notwendig, damit der Server das richtige Cookie identifizieren und löschen kann
});
Antwortverarbeitung: Der primäre Zweck ist das serverseitige Löschen des Cookies. Ob der API-Aufruf selbst erfolgreich war (Status 200/204) oder fehlschlug (z.B. Netzwerkfehler), ist für das Client-Verhalten zweitrangig – der Benutzer soll in jedem Fall als ausgeloggt behandelt werden.
Weiterleitung: Ein finally-Block stellt sicher, dass die Weiterleitung zur Login-Seite immer erfolgt, unabhängig vom Erfolg des API-Aufrufs:
JavaScript

// Innerhalb der async function logout():
try {
    await fetch(...);
} catch (error) {
    console.error("Logout request failed:", error);
    // Fehler loggen, aber trotzdem weiterleiten
} finally {
    // Verwende den Next.js/React Router, falls zutreffend
    window.location.href = '/login.html'; // Oder router.push('/login');
}
Bereinigung: Jeglicher Code zum Löschen von sessionId oder username aus localStorage muss entfernt werden.
4.5. checkAuth() Funktion
Aufgabe: Implementierung von Task 6 aus Ticket 0008.
Signatur: async function checkAuth()
Aktion: Führt einen fetch-Aufruf an den /api/auth/me-Endpunkt durch:
JavaScript

const response = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include' // Sendet das Cookie automatisch mit
});
Antwortverarbeitung:
Wenn response.ok (Status 200), war die Prüfung erfolgreich. Parst die JSON-Antwort (const data = await response.json();) und gibt die Benutzerdaten zurück (z.B. data.user).
Wenn response.status === 401, ist der Benutzer nicht authentifiziert (kein gültiges Cookie). Gibt null zurück, um diesen Zustand klar zu signalisieren.
Bei anderen Fehlerstatus (z.B. 500 Internal Server Error) sollte ein Fehler geworfen werden (throw new Error(\Auth check failed with status: ${response.status}`);`), da dies auf ein unerwartetes Serverproblem hindeutet.
Fehlerbehandlung: Ein try...catch-Block fängt Netzwerkfehler ab. In diesem Fall ist es oft sinnvoll, ebenfalls null zurückzugeben, da der Authentifizierungsstatus nicht überprüft werden konnte, was aus Sicherheitssicht einem nicht authentifizierten Zustand gleichkommt.
Verwendung: Diese Funktion ist entscheidend für den Schutz von Routen oder Seiten. Sie muss aufgerufen werden, bevor geschützte Inhalte gerendert werden. Wenn sie null zurückgibt oder einen Fehler wirft, muss der Benutzer zur Login-Seite umgeleitet werden.
Der httpOnly-Kompromiss und die Abhängigkeit vom /me-Endpunkt: Die Umstellung auf httpOnly-Cookies bringt eine wichtige Änderung mit sich: Clientseitiges JavaScript kann das Token nicht mehr direkt lesen. Früher konnte man einfach prüfen, ob localStorage.getItem('sessionId') existiert. Mit httpOnly-Cookies ist der einzige Weg für den Client, den Authentifizierungsstatus zuverlässig zu prüfen und Benutzerdaten zu erhalten, eine Anfrage an einen Server-Endpunkt wie /api/auth/me. Der Server validiert das Cookie, das der Browser automatisch mitsendet. Dies bedeutet, dass die Authentifizierungsprüfung, die vorher potenziell synchron erfolgen konnte, nun immer ein asynchroner Netzwerkaufruf ist. Dies hat Konsequenzen für den Anwendungsfluss:
Ladezustände: Während checkAuth() ausgeführt wird, muss die Anwendung einen Ladezustand anzeigen, da das Ergebnis nicht sofort verfügbar ist.
Routing: Die Routing-Logik (z.B. in Next.js Middleware oder HOCs) muss diesen asynchronen Aufruf abwarten, bevor entschieden wird, ob eine Seite gerendert oder eine Weiterleitung durchgeführt wird.
State Management: Um wiederholte Aufrufe von /api/auth/me bei jeder Navigation zu vermeiden, kann das Ergebnis (Benutzerdaten oder null) nach dem ersten erfolgreichen Aufruf (z.B. nach dem Login oder beim App-Start) in einem globalen Zustand (z.B. React Context, Zustand-Management-Bibliothek) gespeichert werden.
5. Konzeptionelle Code-Struktur (JavaScript)
5.1. Ziel
Dieser Abschnitt zeigt beispielhaften JavaScript-Code für die im authService-Modul implementierten Funktionen. Die Beispiele verdeutlichen die Verwendung von fetch mit async/await, credentials: 'include' und grundlegender Fehlerbehandlung. Es wird auch kurz gezeigt, wie diese Service-Funktionen in einer React/Next.js-Umgebung genutzt werden können.

5.2. Beispiel authService.js
JavaScript

// client/src/services/authService.js (Beispiel für React/Next.js Kontext)

// Basis-URL für die API, idealerweise aus einer Konfigurationsdatei oder Umgebungsvariable
const API_BASE_URL = '/api/auth';

/**
 * Versucht, einen Benutzer über die API anzumelden.
 * @param {string} username Der Benutzername.
 * @param {string} password Das Passwort.
 * @returns {Promise<object|boolean>} Ein Promise, das bei Erfolg die Benutzerdaten oder true zurückgibt.
 * @throws {Error} Wirft einen Fehler bei fehlgeschlagenem Login oder Netzwerkproblemen.
 */
export async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Wichtig für das Senden/Empfangen des httpOnly-Cookies
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json(); // Versuche, JSON immer zu parsen

        if (!response.ok) {
            // Wirf einen Fehler mit der Nachricht aus der Server-Antwort oder einem Standardtext
            throw new Error(data.message |
| `HTTP error! status: ${response.status}`);
        }

        // Login erfolgreich, Server hat Cookie gesetzt.
        // Gibt Benutzerdaten zurück, falls vom Server gesendet, sonst true.
        return data.user |
| true;
    } catch (error) {
        console.error("Login fehlgeschlagen:", error);
        // Wirf den Fehler erneut, damit die aufrufende Komponente ihn fangen kann
        throw error;
    }
}

/**
 * Versucht, einen neuen Benutzer über die API zu registrieren.
 * @param {object} userData Objekt mit Registrierungsdaten { username, email, password, confirmPassword }.
 * @returns {Promise<boolean>} Ein Promise, das bei Erfolg true zurückgibt.
 * @throws {Error} Wirft einen Fehler bei fehlgeschlagener Registrierung oder Netzwerkproblemen.
 */
export async function register(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
             // Beinhaltet möglicherweise data.errors für detaillierte Validierungsfehler
            throw new Error(data.message |
| JSON.stringify(data.errors) |
| `HTTP error! status: ${response.status}`);
        }
        // Registrierung erfolgreich
        return true;
    } catch (error) {
        console.error("Registrierung fehlgeschlagen:", error);
        throw error;
    }
}

/**
 * Sendet eine Logout-Anfrage an den Server.
 * Leitet den Benutzer IMMER zur Login-Seite weiter.
 * @returns {Promise<void>}
 */
export async function logout() {
    try {
        await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            credentials: 'include', // Sendet das Cookie, damit der Server weiß, welche Session beendet werden soll
        });
        // Kein spezifischer Rückgabewert benötigt
    } catch (error) {
        console.error("Logout-Anfrage fehlgeschlagen:", error);
        // Fehler loggen, aber die Weiterleitung im finally-Block wird trotzdem ausgeführt
    } finally {
        // WICHTIG: Immer weiterleiten, um sicherzustellen, dass der Benutzer ausgeloggt wird (aus Client-Sicht).
        // Passe dies ggf. an den verwendeten Router an (z.B. Next.js Router).
        if (typeof window!== 'undefined') { // Sicherstellen, dass dies nur im Browser ausgeführt wird
             window.location.href = '/login'; // Oder entsprechender Pfad zur Login-Seite/Route
        }
    }
}

/**
 * Überprüft den aktuellen Authentifizierungsstatus durch Abfrage des /me Endpunkts.
 * @returns {Promise<object|null>} Ein Promise, das bei Erfolg das Benutzerobjekt zurückgibt,
 *                                  bei fehlender Authentifizierung (401) null,
 *                                  oder bei Netzwerk-/Serverfehlern ebenfalls null zurückgibt oder einen Fehler wirft.
 */
export async function checkAuth() {
     try {
        const response = await fetch(`${API_BASE_URL}/me`, {
            method: 'GET',
            credentials: 'include', // Sendet Cookie automatisch
        });

        if (response.ok) { // Status 200-299
            const data = await response.json();
            return data.user; // Gibt das Benutzerobjekt zurück { id, username,... }
        } else if (response.status === 401) {
            return null; // Explizit nicht authentifiziert
        } else {
            // Anderer Serverfehler (z.B. 500) oder unerwarteter Status
            // Hier könnte man auch einen Fehler werfen, statt null zurückzugeben,
            // um zwischen "nicht eingeloggt" und "Prüfung fehlgeschlagen" zu unterscheiden.
            console.error(`Auth check failed with status: ${response.status}`);
            return null; // Behandelt Serverfehler vorerst wie "nicht authentifiziert"
        }
    } catch (error) {
        console.error("Auth check request failed (network error?):", error);
        // Netzwerkfehler oder fehlgeschlagener Fetch
        // Rückgabe von null signalisiert, dass der Status nicht bestätigt werden konnte.
        return null;
    }
}
5.3. Beispiel Verwendung (React/Next.js)
JavaScript

// Beispielhafte LoginPage.jsx Komponente (vereinfacht)
import React, { useState, useContext } from 'react';
import { useRouter } from 'next/router'; // Beispiel mit Next.js Router
import { login } from '../services/authService';
// Angenommen, es gibt einen AuthContext für globalen State
// import { AuthContext } from '../context/AuthContext';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    // const { setAuthUser } = useContext(AuthContext); // Funktion zum Setzen des globalen User-States

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const user = await login(username, password); // Ruft die Service-Funktion auf
            // Optional: Benutzerdaten im globalen State speichern
            // if (user && typeof user === 'object') {
            //     setAuthUser(user);
            // } else {
            //     // Falls login() nur true zurückgibt, ggf. checkAuth() erneut aufrufen
            //     // oder Server muss User-Daten bei Login zurückgeben
            // }

            // Weiterleitung zur Spielseite bei Erfolg
            router.push('/game'); // Verwende Next.js Router
        } catch (err) {
            // Zeige die Fehlermeldung aus dem Service an
            setError(err.message |
| 'Ein unerwarteter Fehler ist aufgetreten.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={loading}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                    />
                </div>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button type="submit" disabled={loading}>
                    {loading? 'Logging in...' : 'Login'}
                </button>
            </form>
            {/* Link zur Registrierungsseite etc. */}
        </div>
    );
}

export default LoginPage;
6. Clientseitige Best Practices
6.1. Ziel
Um eine wartbare, robuste und benutzerfreundliche Implementierung der clientseitigen Authentifizierung sicherzustellen, sollten folgende Best Practices beachtet werden.

6.2. Zentralisierte Logik
Wie bereits in Abschnitt 3.2 dargelegt, ist die Kapselung der gesamten API-Interaktionslogik in einem dedizierten Service-Modul (authService.js) entscheidend. Dies fördert die Wiederverwendbarkeit, erleichtert Tests und Wartung und hält die UI-Komponenten sauber.

6.3. Robuste Fehlerbehandlung
Es reicht nicht aus, Fehler nur abzufangen. Die Anwendung sollte dem Benutzer aussagekräftiges Feedback geben. Statt generischer Meldungen wie "Login fehlgeschlagen" sollten, wann immer möglich, die spezifischen Fehlermeldungen angezeigt werden, die vom Server zurückgegeben werden (z.B. "Ungültiger Benutzername oder Passwort", "Benutzername bereits vergeben", "Passwort muss mindestens 8 Zeichen lang sein"). Dies hilft dem Benutzer, das Problem zu verstehen und zu beheben.

6.4. Benutzer-Feedback
Während asynchroner Operationen (API-Aufrufe wie Login, Registrierung, checkAuth) sollte der Benutzer visuelles Feedback erhalten. Dies kann durch das Deaktivieren von Buttons, das Anzeigen von Ladeindikatoren (Spinnern) oder das Ändern des Mauszeigers geschehen. Dies verhindert doppelte Klicks und informiert den Benutzer darüber, dass die Anwendung arbeitet.

6.5. Asynchrones Flow Management
Die konsequente Verwendung von async/await in Verbindung mit try...catch...finally-Blöcken ist essenziell für die korrekte Handhabung von Promises, die von fetch zurückgegeben werden. Dies stellt sicher, dass Fehler korrekt abgefangen und verarbeitet werden und dass Aufräumarbeiten (wie das Zurücksetzen des Ladezustands im finally-Block) zuverlässig ausgeführt werden.

6.6. State Management (React/Next.js Kontext)
In einer React/Next.js-Anwendung muss der Authentifizierungsstatus (eingeloggt/nicht eingeloggt) und die Benutzerdaten (falls vorhanden) global verwaltet werden, damit verschiedene Teile der Anwendung darauf zugreifen können (z.B. Header zur Anzeige des Benutzernamens, Routing-Logik). Hierfür eignen sich:

React Context API: Gut für einfache bis mittlere Anforderungen.
Zustand Management Bibliotheken (Zustand, Redux, Jotai etc.): Bieten mehr Struktur und Skalierbarkeit für komplexere Anwendungen.
Der globale Zustand sollte nach erfolgreichen login-, register- und checkAuth-Aufrufen aktualisiert und nach logout zurückgesetzt werden.

6.7. Sicherheitsaspekte
Das httpOnly-Attribut des Cookies verhindert den direkten Zugriff auf das JWT über JavaScript. Dies ist ein wichtiger Sicherheitsvorteil. Entwickler sollten nicht versuchen, diese Einschränkung zu umgehen oder das Token anderweitig clientseitig zu speichern. Sensible Informationen, die eventuell über den /api/auth/me-Endpunkt abgerufen werden, sollten nur dann im Client-Zustand gespeichert werden, wenn sie für die UI benötigt werden, und nicht unnötig in localStorage oder anderen potenziell unsicheren Speichern abgelegt werden.

7. Mögliche Probleme und Lösungsstrategien
7.1. Ziel
Bei der Implementierung der clientseitigen Authentifizierung können verschiedene Probleme auftreten. Dieser Abschnitt beschreibt häufige Fallstricke und bietet Strategien zur Diagnose und Behebung.

7.2. CORS-Konfigurationsfehler (Revisited)
Symptome: Netzwerkfehler in der Browser-Konsole, die explizit auf CORS hinweisen (z.B. "Access-Control-Allow-Origin missing", "Credentials flag is true, but Access-Control-Allow-Credentials is not true"). fetch-Aufrufe schlagen fehl, ohne dass Breakpoints im Server-Code erreicht werden. Authentifizierung schlägt fehl (401), obwohl die Anmeldedaten korrekt sind, weil das Cookie aufgrund der CORS-Policy nicht gesendet wurde.
Lösungsstrategie: Überprüfen Sie die Response-Header der fehlgeschlagenen Anfrage im "Network"-Tab der Browser-Entwicklertools. Stellen Sie sicher, dass Access-Control-Allow-Origin auf den exakten Ursprung des Clients gesetzt ist (nicht *) und Access-Control-Allow-Credentials auf true steht. Stimmen Sie sich eng mit den Backend-Entwicklern (verantwortlich für Tickets 0003/0006) ab. Testen Sie in einer Umgebung, die die Produktions-Ursprünge simuliert.
7.3. Fehlendes credentials: 'include'
Symptome: Login/Registrierung funktionieren (da hier noch kein Cookie gesendet werden muss), aber nachfolgende Anfragen an geschützte Endpunkte (wie /api/auth/me oder andere API-Routen, die Authentifizierung erfordern) schlagen mit 401 Unauthorized fehl, weil das zuvor gesetzte Cookie nicht mitgesendet wird.
Lösungsstrategie: Überprüfen Sie jeden fetch-Aufruf, der an die API-Endpunkte des Backends gerichtet ist und eine Authentifizierung erfordert. Stellen Sie sicher, dass die Option { credentials: 'include' } im options-Objekt des fetch-Aufrufs vorhanden ist.
7.4. API-Interaktionsfehler
Symptome: HTTP-Fehlerstatus wie 404 Not Found (Endpunkt-URL falsch oder nicht implementiert), 405 Method Not Allowed (falsche HTTP-Methode verwendet, z.B. GET statt POST), 400 Bad Request (Request-Body falsch formatiert, fehlende Felder, serverseitige Validierung fehlgeschlagen), 500 Internal Server Error (unerwarteter Fehler auf dem Server).
Lösungsstrategie: Vergleichen Sie die Implementierung der fetch-Aufrufe (URL, Methode, Header, Body-Struktur) sorgfältig mit der API-Spezifikation (siehe Tabelle in Abschnitt 2.3 und Details aus Tickets 0003/0006). Stellen Sie sicher, dass Content-Type: application/json gesetzt ist, wenn ein JSON-Body gesendet wird. Implementieren Sie eine robuste clientseitige Fehlerbehandlung, die versucht, Fehlermeldungen aus dem JSON-Antwortkörper zu parsen und anzuzeigen.
7.5. User Experience Probleme
Symptome: Die Anwendung reagiert nicht sichtbar auf Benutzeraktionen (z.B. Klick auf Login-Button). Fehlermeldungen sind unverständlich oder fehlen ganz. Die Seite "hängt" bei einem Fehler.
Lösungsstrategie: Implementieren Sie durchgängig Ladezustände für asynchrone Aktionen. Fangen Sie Fehler aus den authService-Funktionen in den UI-Komponenten ab und zeigen Sie klare, benutzerfreundliche Fehlermeldungen an. Stellen Sie sicher, dass alle möglichen Ausführungspfade (Erfolg, erwartete Fehler, unerwartete Fehler) abgedeckt sind und dem Benutzer Feedback geben.
7.6. Fehlerhafte Weiterleitungslogik
Symptome: Benutzer werden nach Login/Logout nicht auf die erwartete Seite weitergeleitet. Nicht eingeloggte Benutzer können auf geschützte Seiten zugreifen. Es entstehen Weiterleitungsschleifen (z.B. ständiges Hin- und Herspringen zwischen /game und /login).
Lösungsstrategie: Überprüfen Sie die Implementierung des Routenschutzes. Stellen Sie sicher, dass checkAuth korrekt aufgerufen wird und die Weiterleitungslogik (z.B. router.push oder router.replace in Next.js) zuverlässig ausgelöst wird, wenn checkAuth null zurückgibt. Testen Sie Randfälle, wie den direkten Zugriff auf geschützte URLs im nicht eingeloggten Zustand. Verwenden Sie router.replace statt router.push für Weiterleitungen von geschützten Routen zur Login-Seite, um zu verhindern, dass die Login-Seite in der Browser-Historie landet und der Benutzer über den "Zurück"-Button wieder auf die geschützte Seite gelangt.
7.7. Stille Fehler bei checkAuth
Ein spezifisches Problem kann auftreten, wenn die checkAuth-Funktion bei Netzwerk- oder Serverfehlern (Status ungleich 200 oder 401) einfach null zurückgibt. Wenn die Routenschutzlogik nur prüft if (!checkAuthResult) { redirectToLogin(); }, führt dies dazu, dass der Benutzer auch bei temporären Serverproblemen oder Netzwerkfehlern immer wieder zur Login-Seite zurückgeschickt wird, selbst wenn sein Cookie potenziell noch gültig wäre. Dies kann frustrierend sein, da der Login vielleicht funktioniert, die anschließende Überprüfung aber fehlschlägt und den Benutzer wieder ausloggt (scheinbar). Es ist daher ratsam, innerhalb von checkAuth oder in der aufrufenden Logik zwischen den Fehlerfällen zu unterscheiden:

Status 401: Bedeutet klar "nicht authentifiziert" -> null zurückgeben oder spezifischen Status signalisieren.
Netzwerkfehler / Andere Serverfehler (z.B. 500): Bedeutet "Authentifizierungsstatus konnte nicht überprüft werden". Hier könnte checkAuth einen spezifischen Fehler werfen oder ein spezielles Objekt zurückgeben. Die aufrufende Logik könnte dann entscheiden, ob sie den Benutzer zur Login-Seite leitet oder eine Fehlermeldung anzeigt ("Verbindung zum Server fehlgeschlagen, Authentifizierung kann nicht überprüft werden.") und den Benutzer auf der aktuellen Seite belässt oder zu einer Fehlerseite leitet. Dies gibt dem Benutzer mehr Kontext als ein stilles Zurückwerfen zur Login-Seite.
8. Integration mit UI und Anwendungsfluss
8.1. Ziel
Dieser Abschnitt beschreibt, wie die im authService implementierten Funktionen mit der Benutzeroberfläche (UI), insbesondere in einer React/Next.js-Umgebung, verbunden werden und wie sie den Anwendungsfluss steuern.

8.2. Verbindung von UI-Elementen
Formulare (Login/Registrierung): Wie im Code-Beispiel (Abschnitt 5.3) gezeigt, werden die onSubmit-Handler von Formular-Komponenten die login- oder register-Funktionen aus dem authService aufrufen. useState wird verwendet, um die Werte der Eingabefelder, den Ladezustand (loading) und Fehlermeldungen (error) zu verwalten und die UI entsprechend zu aktualisieren.
Logout-Button: Ein Klick-Handler (onClick) auf einem Logout-Button ruft die logout-Funktion aus dem authService auf. Diese Funktion kümmert sich intern um den API-Aufruf und die anschließende Weiterleitung.
Anzeige von Benutzerinformationen: Komponenten, die Benutzerinformationen anzeigen müssen (z.B. ein Header, der den Benutzernamen anzeigt), beziehen diese Daten aus dem globalen Authentifizierungszustand (siehe Abschnitt 6.6), der durch checkAuth oder nach einem erfolgreichen Login initialisiert/aktualisiert wird.
8.3. Routenschutz / Bedingtes Rendern
Die checkAuth-Funktion ist der Schlüssel zum Schutz von Seiten oder Komponenten, die nur für eingeloggte Benutzer zugänglich sein sollen (z.B. die Spielseite /game). Die Integration erfolgt typischerweise wie folgt (Beispiele für React/Next.js):

Clientseitiger Schutz mit Hook/Context: Ein benutzerdefinierter Hook (z.B. useAuth) oder eine Komponente, die den AuthContext verwendet, kann checkAuth beim Mounten aufrufen. Basierend auf dem Ergebnis (Benutzerobjekt oder null) wird entweder die geschützte Komponente gerendert oder eine Weiterleitung zur Login-Seite mittels useRouter ausgelöst. Dies geschieht oft in einer Layout-Komponente, die alle geschützten Seiten umschließt.
JavaScript

// Beispiel: Geschützte Routen-Komponente
import { useAuth } from '../hooks/useAuth'; // Angenommener Hook, der checkAuth aufruft
import { useRouter } from 'next/router';
import LoadingSpinner from './LoadingSpinner';

function ProtectedRoute({ children }) {
    const { user, isLoading, error } = useAuth();
    const router = useRouter();

    if (isLoading) {
        return <LoadingSpinner />; // Zeige Ladeanzeige während checkAuth läuft
    }

    if (error ||!user) {
        // Leite zur Login-Seite weiter, wenn nicht authentifiziert oder Fehler
        if (typeof window!== 'undefined') {
             router.replace('/login'); // replace, um Login nicht in History zu pushen
        }
        return null; // Rendere nichts, während weitergeleitet wird
    }

    // Benutzer ist authentifiziert, rendere die geschützte Komponente
    return children;
}
Serverseitiger Schutz (Next.js): Mit getServerSideProps kann checkAuth auf dem Server ausgeführt werden. Dies erfordert jedoch, dass das Cookie vom eingehenden Client-Request an den fetch-Aufruf zum /api/auth/me-Endpunkt weitergeleitet wird. Wenn checkAuth fehlschlägt, kann getServerSideProps eine Weiterleitung (redirect) zurückgeben.
Middleware (Next.js): Middleware läuft vor der Seiten-Logik und kann Anfragen basierend auf dem Cookie prüfen und Weiterleitungen durchführen, bevor die Seite überhaupt gerendert wird. Dies ist oft eine effiziente Methode für den Routenschutz.
8.4. Aktualisieren des Anwendungszustands
Es ist entscheidend, dass der globale Authentifizierungszustand der Anwendung konsistent gehalten wird. Erfolgreiche Aufrufe von:

login oder register: Sollten den globalen Zustand auf "eingeloggt" setzen und die Benutzerdaten speichern.
logout: Sollten den globalen Zustand auf "nicht eingeloggt" zurücksetzen und die Benutzerdaten entfernen.
checkAuth: Sollte den globalen Zustand initialisieren oder aktualisieren, wenn die Anwendung geladen wird oder wenn eine Überprüfung notwendig ist.
Dies stellt sicher, dass alle Teile der UI (Header, Menüs, geschützte Inhalte) immer den korrekten Authentifizierungsstatus widerspiegeln.

9. Schlussfolgerung
9.1. Zusammenfassung
Die erfolgreiche Implementierung von Ticket 0008 erfordert eine sorgfältige Anpassung der clientseitigen Logik im PokeTogetherBrowser. Die Kernschritte umfassen die Erstellung eines zentralisierten authService-Moduls, die Implementierung der Funktionen login, register, logout und checkAuth unter Verwendung der fetch-API mit der essenziellen Option credentials: 'include', die vollständige Entfernung der alten localStorage-basierten Authentifizierungslogik, die Implementierung einer robusten Fehlerbehandlung mit aussagekräftigem Benutzerfeedback und die Integration dieser Funktionen in die UI und den Anwendungsfluss (insbesondere die Routing-Logik unter Berücksichtigung des wahrscheinlichen Einsatzes von React/Next.js). Besondere Aufmerksamkeit gilt der korrekten Handhabung von CORS, da dies eine häufige Fehlerquelle bei der Arbeit mit Credentials und Cross-Origin-Anfragen darstellt.

9.2. Abschließende Betonung
Für den Erfolg dieses Tickets und die Stabilität der Anwendung ist thorough testing unerlässlich. Die Tests sollten insbesondere folgende Aspekte abdecken:

Der vollständige Authentifizierungszyklus: Registrierung -> Logout -> Login -> Zugriff auf geschützte Ressource -> Logout.
Alle Fehlerpfade: Ungültige Anmeldedaten, Validierungsfehler bei der Registrierung, Serverfehler (simuliert), Netzwerkfehler (simuliert durch Offline-Modus im Browser).
CORS-Konfiguration: Tests in einer Umgebung, die die Ursprungsbeziehung zwischen Client und Server realistisch abbildet (z.B. unterschiedliche Ports auf localhost). Überprüfung der Netzwerk-Header.
Routenschutz: Direkter Zugriff auf geschützte URLs im nicht eingeloggten Zustand muss zur Login-Seite führen. Nach dem Login muss der Zugriff möglich sein. Nach dem Logout muss der Zugriff wieder verwehrt werden.
Abstimmung mit dem Backend: Eine enge Koordination mit den Entwicklern, die für die serverseitigen Tickets 0003 und 0006 verantwortlich sind, ist notwendig, um sicherzustellen, dass die API-Endpunkte wie erwartet funktionieren und die CORS-Header korrekt gesetzt sind.
Die Umsetzung dieses Tickets legt den Grundstein für eine sichere und funktionale Benutzerverwaltung und ist somit ein kritischer Schritt für die Weiterentwicklung des PokeTogetherBrowser-Projekts.