Umsetzungsplan Ticket 0011 – JWT-Authentifizierung in game.js
Schritt-für-Schritt Anleitung
Imports anpassen: Überprüfen Sie am Anfang von client/js/game.js alle Import-Anweisungen und globale Verweise auf das alte Session-System. Entfernen oder ersetzen Sie Importe, die nicht mehr benötigt werden (z. B. ein Session-Management-Modul). Falls das neue Auth-System Hilfsfunktionen bereitstellt (etwa zum Umgang mit Cookies/JWT), importieren Sie diese. Beispiel: Wenn bisher sessionManager.js importiert wurde, kann dieser Import entfernt werden, da JWT/Cookies nun direkt genutzt werden. Stellen Sie sicher, dass game.js weiterhin als Vanilla JS Modul funktioniert (falls als <script> eingebunden, ggf. type="module" setzen, damit import funktioniert).
Authentifizierungsprüfung implementieren (checkAuth): Fügen Sie in game.js eine Funktion checkAuth() hinzu, die beim Laden der Seite aufgerufen wird. Diese Funktion überprüft, ob der Benutzer authentifiziert ist. Konkret:
JWT-Cookie prüfen: Lesen Sie das JWT aus dem Cookie (z. B. mit document.cookie oder einer Hilfsfunktion). Suchen Sie nach dem Cookie-Namen (z. B. authToken). Hinweis: Ist das JWT als HttpOnly-Cookie gesetzt, kann es nicht direkt per JavaScript ausgelesen werden​
security.stackexchange.com
. In diesem Fall sollte checkAuth stattdessen z. B. einen geschützten Ping an den Server senden (etwa eine kleine Fetch-Anfrage an /api/authcheck), um zu verifizieren, ob die Session gültig ist.
Gültigkeit/Expiration prüfen: Stellen Sie sicher, dass das JWT noch gültig ist. Sie können das Token bspw. dekodieren (Payload Base64-decoden) und das exp-Claim prüfen. Wenn das Token fehlt oder abgelaufen ist, leiten Sie auf die Login-Seite um (z. B. window.location.href = "/login.html"). Dies verhindert, dass ein nicht authentifizierter Nutzer das Spiel sieht.
Benutzernamen auslesen: Ist der Nutzer eingeloggt, extrahieren Sie den Benutzernamen. Dieser könnte im JWT-Payload enthalten sein (z. B. als username oder email). Decodieren Sie dazu das JWT-Payload (z. B. via atob(token.split('.')[1])) und parsen Sie das JSON, um an den username zu gelangen. Alternativ, falls der Server den Nutzernamen bereits in der HTML (z. B. im DOM als verstecktes Feld) bereitstellt, kann dieser direkt übernommen werden. Weisen Sie den Wert dann dem UI-Element für den Nutzernamen zu (z. B. document.getElementById('username').innerText = username;). So sieht der Spieler sofort, mit welchem Account er angemeldet ist.
Alte Session-ID-Logik entfernen: Suchen Sie in game.js nach allen Stellen, an denen bisher die Session-ID verwendet oder erwartet wurde (z. B. aus LocalStorage, als URL-Parameter oder Cookie). Entfernen Sie diese Logik komplett oder passen Sie sie an das JWT an:
Session-Storage entfernen: Falls die alte Implementierung eine Session-ID in localStorage oder sessionStorage abgelegt hat, ist das nicht mehr nötig. Löschen Sie entsprechend Code wie let sessionId = localStorage.getItem("sessionId");.
URL/Verbindungs-Parameter: Wenn die Spiel-Server-Verbindung bislang die Session-ID über die URL oder per Query-Parameter erhielt (z. B. ws://server/game?session=<ID>), ändern Sie diese Stellen. Mit JWT sind zusätzliche URL-Parameter oft nicht nötig, da die Authentifizierung über das Cookie automatisch erfolgt (der Browser schickt das JWT-Cookie im WebSocket-Handshake mit). Nur falls notwendig (etwa bei Cross-Domain oder spezifischer Server-Implementierung), fügen Sie stattdessen das JWT als Parameter ein (z. B. ?token=<JWT>).
Globale Session-Variablen: Entfernen Sie veraltete globale Variablen wie window.sessionId oder Ähnliches. Stattdessen können Sie ggf. eine Variable für den JWT-Token einführen, falls Sie diesen im Code brauchen (z. B. const token = getAuthTokenFromCookie();).
Serververbindung mit JWT aktualisieren (connectToServer): Passen Sie die Funktion an, die die Verbindung zum Spiel-Server herstellt (meist via WebSocket oder Event-Stream):
WebSocket-Verbindung: Stellen Sie die Verbindung nun unter Berücksichtigung der JWT-Authentifizierung her. Bei gleicher Domain wird das Auth-Cookie automatisch mitgesendet. Beispiel: socket = new WebSocket("wss://" + location.host + "/game"); (hier schickt der Browser das Cookie mit). Wenn der Server das JWT als Parameter erwartet, nutzen Sie stattdessen: socket = new WebSocket("wss://"+location.host+"/game?token=" + token);​
linode.com
. (Ersetzen Sie location.host und Pfad entsprechend Ihrer Server-URL.)
Event-Handler setzen: Belassen oder erstellen Sie die Event-Handler für onopen, onmessage, onerror und onclose. Insbesondere sollte onerror/onclose Fehler abfangen, die durch fehlgeschlagene Authentifizierung entstehen könnten. Beispiel: Wenn der Server die Verbindung schließt, weil das Token ungültig ist oder abgelaufen, können Sie im onclose-Handler eine Meldung ausgeben und den Nutzer zurück auf die Login-Seite führen.
Bestehende Logik übernehmen: Übernehmen Sie alle relevanten Initialisierungsschritte innerhalb von onopen (z. B. Begrüßungsnachricht vom Server empfangen, Spielwelt laden etc.), die vorher mit Session-ID gearbeitet haben, nun unverändert oder leicht angepasst (z. B. kein Senden der Session-ID mehr nötig, da Auth bereits steht).
Reihenfolge: Rufen Sie connectToServer() erst nach erfolgreicher Auth-Prüfung auf. Dadurch vermeiden Sie Race Conditions, bei denen die Verbindung aufgebaut wird, bevor das JWT verfügbar/gültig ist.
Logout-Funktion umbauen (logout/handleLogout): Implementieren Sie die Abmeldung nun passend zum JWT-System:
Event-Listener: Verbinden Sie den Logout-Button im HTML mit einer Logout-Handler-Funktion. Z. B.: document.getElementById('logoutButton').addEventListener('click', handleLogout);.
Token entfernen: In handleLogout() sorgen Sie dafür, dass das JWT ungültig gemacht wird. Da JWTs nicht serverseitig gelöscht werden können, genügt es für den Client, das Token zu entfernen, sodass keine authentifizierten Anfragen mehr möglich sind​
medium.com
. Ist das JWT im LocalStorage oder in einem nicht-HttpOnly-Cookie gespeichert, löschen Sie es dort (Cookie löschen durch Setzen eines abgelaufenen Cookies​
forum.freecodecamp.org
, LocalStorage via removeItem). Beispiel für Cookie-Invalidierung: document.cookie = "authToken=; Max-Age=0; path=/;". Befindet sich das JWT in einem HttpOnly-Cookie, rufen Sie eine Logout-API im Backend auf (z. B. per fetch('/api/logout')), die das Cookie serverseitig löscht/invalide macht.
Aufräumen: Schließen Sie aktive Ressourcen. Bspw. falls eine WebSocket-Verbindung besteht, rufen Sie socket.close() auf, um die Verbindung sauber zu trennen. Stoppen Sie auch ggf. laufende Spiel-Loops oder Timer. Dadurch wird sichergestellt, dass nach dem Logout keine Hintergrundprozesse weiterlaufen.
Weiterleitung: Leiten Sie den Nutzer nach Logout auf die Login-Seite oder Landing-Page um. Häufig kann ein einfaches window.location.href = "/login.html"; verwendet werden, ggf. nach Bestätigung, dass der Logout-API-Call durch ist. Dies entlädt die aktuelle Spielseite und stellt sicher, dass alle JS-Objekte (inkl. Canvas-Kontext) freigegeben werden.
Cleanup und Finalisierung: Entfernen Sie zum Abschluss eventuelles Debug-Logging oder veraltete Kommentare, die sich auf das alte System beziehen. Testen Sie die Implementierung schrittweise: Zuerst ob die Login-Prüfung greift (ungültiger Cookie -> Redirect), dann ob mit gültigem JWT das Spiel normal startet, und schließlich ob Logout das Gewünschte tut. Achten Sie darauf, dass nun keine Referenz auf die alte Session-ID mehr vorhanden ist und alles über JWT/Cookie läuft.
Best Practices bei der Umsetzung
JWT sicher speichern: Speichern Sie das JWT niemals in unsicheren Bereichen wie ungeschützt im LocalStorage, wenn es sich vermeiden lässt. Der Einsatz eines HttpOnly-Cookies wird empfohlen, da dieses nicht per JavaScript auslesbar ist und somit vor XSS-Angriffen schützt​
security.stackexchange.com
. Stellen Sie sicher, dass das Cookie auch das Secure-Flag hat (nur via HTTPS übertragen).
Token-Lebenszeit beachten: JWTs besitzen in der Regel ein Ablaufdatum (exp). Planen Sie die Applikation so, dass abgelaufene Tokens erkannt werden. Beispielsweise kann checkAuth() das Ablaufdatum prüfen und den Nutzer auffordern, sich neu anzumelden, bevor der Server die Verbindung verweigert. Alternativ kann der Server bei abgelaufenem Token den WebSocket schließen – in onclose sollten Sie dann reagieren (z. B. Meldung "Session abgelaufen, bitte neu anmelden.").
Fehlerbehandlung einbauen: Implementieren Sie robustes Error-Handling. Falls ein benötigtes Cookie fehlt oder das JWT-Parsing fehlschlägt (z. B. weil das Token manipuliert ist), fangen Sie Exceptions ab (try/catch) und reagieren Sie sinnvoll, etwa mit einem Redirect zur Login-Seite oder einer Fehlermeldung. Gleiches gilt für Netzwerkfehler bei der Serververbindung: nutzen Sie den socket.onerror-Event, um Verbindungsprobleme zu loggen, und informieren Sie den Nutzer ggf. (z. B. "Verbindung zum Server verloren.").
Initialisierungsreihenfolge: Authentifizierung vor Spiel-Initialisierung. Laden Sie Ressourcen (Sprites, Sounds, etc.) oder starten Sie den Game-Loop erst, nachdem sichergestellt ist, dass der Nutzer eingeloggt ist. Dies spart Ressourcen und vermeidet Fehlverhalten, falls ein nicht angemeldeter Benutzer versehentlich den Game-Code ausführen könnte. Benutzen Sie DOMContentLoaded oder platzieren Sie das Skript am Ende der HTML, damit alle DOM-Elemente (Canvas, Buttons) verfügbar sind, bevor Ihr Code darauf zugreift.
Ressourcenmanagement: Stellen Sie sicher, dass beim Verlassen der Seite oder beim Logout alle Ressourcen freiwerden. Schließen Sie WebSocket-Verbindungen, entfernen Sie ggf. über removeEventListener registrierte Handler (falls diese nach Logout weiterbestehen könnten), und lassen Sie laufende Intervalle/Timer auslaufen (clearInterval/clearTimeout). Dies verhindert Speicherlecks und unerwartetes Verhalten bei erneutem Login oder Seitenaufruf.
Sicherheit bei Logout: Bedenken Sie, dass JWTs nicht serverseitig invalidiert werden können, sobald sie ausgestellt sind​
medium.com
. Ein Logout löscht nur das Token im Browser, aber ein Angreifer mit einer Kopie dieses Tokens könnte es bis zum Ablauf weiter benutzen. Um dem entgegenzuwirken: kurze Gültigkeitsdauer für Tokens wählen (z. B. 15 Minuten) und ggf. bei Logout ein Flag auf dem Server setzen, um das Token als invalidiert zu behandeln (Blacklist). Diese Punkte betreffen zwar vor allem den Server, sind aber wichtig im Umgang mit JWT-Auth.
Debugging und Logging: Testen Sie die Übergabe des JWT an den Server. Im Entwicklermodus kann es hilfreich sein, das Token oder Teile davon zu loggen, um zu prüfen, ob alles passt – aber entfernen Sie solche Logs vor Produktion, um keine sensiblen Daten preiszugeben. Nutzen Sie Browser-DevTools (Netzwerk-Tab) um zu verifizieren, dass beim WebSocket-Handshake das Cookie mitgesendet wird bzw. der Query-Parameter korrekt übergeben wird.
Typische Probleme und Fehlerquellen
Problem/Fehlerquelle	Beschreibung und Lösungsempfehlung
Race Condition bei Verbindungsaufbau	Wenn connectToServer() gestartet wird, bevor checkAuth() fertig ist, kann es passieren, dass der Socket ohne gültiges Token verbindet. Lösung: Rufen Sie den Verbindungsaufbau erst nach erfolgreicher Authentifizierung auf (ggf. in einem Callback/Promise von checkAuth() falls asynchron).
JWT nicht verfügbar im Client	Bei Verwendung eines HttpOnly-Cookies steht das JWT nicht im JavaScript zur Verfügung. Dadurch könnten Funktionen wie checkAuth() oder das Setzen des Nutzernamens ins Leere laufen. Lösung: Implementieren Sie einen alternativen Weg: z. B. eine kleine API-Abfrage GET /me, die bei gültigem Cookie den Nutzernamen zurückgibt, oder rendern Sie den Namen serverseitig in die game.html. checkAuth() kann dann anhand des Response feststellen, ob der Nutzer eingeloggt ist.
Asynchrone Fehlerbehandlung	WebSocket- und Fetch-Aufrufe sind asynchron und Fehler zeigen sich ggf. erst verzögert. Ein häufiges Problem ist, dass der WebSocket sofort wieder schließt (z. B. wegen ungültigem Token) und das Spiel nicht darauf reagiert. Lösung: Setzen Sie socket.onclose und socket.onerror sorgfältig, um solche Fehler abzufangen. Loggen Sie die Ereignisse und reagieren Sie z. B. mit einem Redirect zur Login-Seite oder einem automatischen Reconnect-Versuch (falls sinnvoll).
Unvollständige Bereinigung beim Logout	Wenn beim Logout nicht alle Aktivitäten gestoppt werden, kann es zu Speicherlecks oder Geisterprozessen kommen (z. B. ein weiterhin laufender Game-Loop oder ein offener Socket im Hintergrund). Lösung: Stellen Sie in handleLogout sicher, alle wichtigen Objekte zu terminieren: socket.close(), cancelAnimationFrame(gameLoopId), removeEventListener(...) etc. Überprüfen Sie auch, dass nach dem Logout-Klick keine weiteren Updates am Canvas erfolgen.
Cookie-/JWT-Konflikte	Falls der Benutzer noch einen alten Session-Cookie hat, könnte es zu Konflikten kommen (z. B. der alte Cookie wird statt des JWT ausgewertet). Lösung: Entfernen Sie alte Cookies/LocalStorage-Einträge bei der Migration. Am besten vergibt man dem JWT-Cookie einen neuen Namen, der nicht mit der alten Session kollidiert, und löscht beim Laden der Seite explizit sessionId-Cookies oder ähnliche Überreste.
Lokale Zeit vs. Serverzeit	JWT-Expiry-Prüfungen im Client hängen von der lokalen Uhrzeit des Browsers ab. Ist die Systemzeit falsch, kann das Token als ungültig angesehen werden, obwohl es serverseitig ok ist (oder umgekehrt). Lösung: Berücksichtigen Sie solche Fälle; im Zweifel verlassen Sie sich eher auf den Server. Beispielsweise kann man beim Verbindungsaufbau einen Fehler "Token expired" vom Server auswerten, statt rein auf Client-Calc zu vertrauen.
Codeentwurf für die angepasste game.js
Im Folgenden ein Entwurf der angepassten client/js/game.js. Dieser Code beinhaltet die JWT-Authentifizierung via Cookie, die Verbindung zum Spielserver sowie Logout-Handling. Passen Sie Bezeichner (Cookie-Name, URLs) an Ihr konkretes Projekt an:
js
Copy
Edit
/** 
 * Liest einen Cookie-Wert anhand seines Namens aus. 
 * Gibt den Cookie-Inhalt als String zurück oder null, falls nicht vorhanden.
 */
function getCookie(name) {
  const value = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return value ? value.pop() : null;
}

/** 
 * Prüft, ob ein gültiges JWT vorhanden ist. 
 * Falls nicht, wird zur Login-Seite weitergeleitet.
 * Falls ja, wird der Benutzername angezeigt.
 */
function checkAuth() {
  const token = getCookie('authToken');  // JWT aus Cookie holen (falls nicht HttpOnly)
  if (!token) {
    console.warn('Kein Auth-Token gefunden, Weiterleitung zur Login-Seite.');
    window.location.replace('/login.html');
    return false;
  }
  // Optional: JWT auf Gültigkeit prüfen (Dekodierung und Expiry-Check)
  try {
    const payloadBase64 = token.split('.')[1];            // JWT-Payload Teil
    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.warn('Token abgelaufen.');
      window.location.replace('/login.html');
      return false;
    }
    // Benutzername aus Payload nutzen, falls vorhanden
    if (payload.username || payload.name) {
      const username = payload.username || payload.name;
      const userElem = document.getElementById('username');
      if (userElem) userElem.textContent = username;
    }
  } catch (e) {
    console.error('Fehler bei JWT-Prüfung:', e);
    // Bei Fehler ebenfalls zur Login-Seite (Token evtl. manipuliert)
    window.location.replace('/login.html');
    return false;
  }
  return true;
}

/** 
 * Stellt die Verbindung zum Game-Server her, unter Verwendung des JWT zur Authentifizierung.
 * Bei Erfolg werden Nachrichten empfangen, bei Fehler wird entsprechend reagiert.
 */
let socket = null;
function connectToServer() {
  // WebSocket-URL zusammenbauen (gleiche Herkunft, daher Cookie wird mitgesendet)
  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
  const wsUrl = protocol + window.location.host + '/game';  // Pfad ggf. anpassen
  console.log('Verbinde zum Game-Server:', wsUrl);
  socket = new WebSocket(wsUrl);
  
  // Event: Verbindung geöffnet
  socket.onopen = () => {
    console.log('Game-Server Verbindung hergestellt.');
    // TODO: Hier ggf. Initialisierungsnachricht an Server senden, falls nötig.
  };

  // Event: Nachricht empfangen
  socket.onmessage = (event) => {
    const data = event.data;
    // TODO: Spiel-Logik für eingehende Daten hier einbauen.
    console.log('Nachricht vom Server:', data);
  };

  // Event: Fehler aufgetreten
  socket.onerror = (error) => {
    console.error('WebSocket-Fehler:', error);
    // (Optional) Nutzer informieren
    // Hinweis: onclose wird i.d.R. ebenfalls aufgerufen bei Verbindungsabbruch.
  };

  // Event: Verbindung geschlossen
  socket.onclose = (event) => {
    console.warn('Verbindung geschlossen. Code:', event.code);
    if (!event.wasClean) {
      console.warn('Verbindung unerwartet abgebrochen.');
    }
    // Wenn z.B. wegen Auth-Fehler geschlossen (Code 4001 o.ä.), zur Login-Seite leiten:
    // (Annahme: Server nutzt z.B. Code 4001 für "Auth failed")
    if (event.code === 4001) {
      alert('Authentifizierung fehlgeschlagen oder abgelaufen. Bitte neu anmelden.');
      window.location.replace('/login.html');
    }
  };
}

/** 
 * Meldet den Benutzer ab (Logout).
 * Bricht die Serververbindung ab, löscht das Auth-Cookie und leitet zur Login-Seite.
 */
function logout() {
  // 1. WebSocket-Verbindung sauber schließen, falls offen
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close(1000, 'Logout');  // Code 1000 = normal closure
  }
  // 2. JWT-Cookie entfernen (Client-seitig, falls nicht HttpOnly)
  document.cookie = 'authToken=; Max-Age=0; path=/;';
  // 3. (Optional) Logout-Request an Server senden, um serverseitige Aktionen auszuführen
  fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(err => {
    console.warn('Logout-Request fehlgeschlagen:', err);
  }).finally(() => {
    // 4. Zur Login-Seite umleiten
    window.location.replace('/login.html');
  });
}

/** 
 * Handler für den Logout-Button.
 * Bestätigt ggf. den Logout-Wunsch und ruft dann logout() aus.
 */
function handleLogout() {
  const confirmLogout = true; // Falls gewünscht, hier via confirm() vom Nutzer bestätigen lassen.
  if (confirmLogout) {
    logout();
  }
}

// Initialisierung beim Laden der Seite
window.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {            // Prüft Auth und zeigt Username an
    connectToServer();          // Stellt die Verbindung her (wenn authentifiziert)
    // Logout-Button-Event zuweisen
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
    // TODO: Weitere Initialisierung (Canvas-Kontext holen, Game-Loop starten, etc.)
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      // Beispiel: Hintergrund zeichnen
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
});
In diesem Code-Entwurf wird checkAuth() sofort beim Laden ausgeführt, und bricht ab (Redirect), falls der Nutzer nicht eingeloggt ist. Nur wenn checkAuth() true zurückgibt (gültiges Token gefunden), geht es mit Verbindungsaufbau und Spielinitialisierung weiter. Die WebSocket-Verbindung (connectToServer) setzt auf das Cookie für die Authentifizierung – der Server muss entsprechend so konfiguriert sein, das JWT aus dem Cookie oder Query auszulesen. Der Logout-Prozess (logout()/handleLogout) schließt die Verbindung, räumt Cookies ab und navigiert weg, um einen vollständigen Neustand zu gewährleisten. Die wichtigsten Funktionen und ihre Aufgaben sind nachfolgend zusammengefasst:
Funktion	Zweck (Kurzbeschreibung)
getCookie(...)	Hilfsfunktion zum Auslesen eines Cookie-Wertes anhand des Namens. Gibt null zurück, wenn Cookie fehlt.
checkAuth()	Prüft, ob ein JWT-Auth-Cookie vorhanden und gültig ist. Leitet unautorisierte Nutzer zur Login-Seite um. Stellt bei erfolgreicher Auth den Anzeigenamen des Nutzers im UI ein.
connectToServer()	Baut die WebSocket-Verbindung zum Game-Server auf. Sendet das JWT automatisch (Cookie) oder explizit (Query) mit. Richtet Event-Handler ein für Nachrichten, Fehler und Verbindungsabbruch.
logout()	Führt den eigentlichen Logout durch: schließt aktive Verbindungen, löscht das Auth-Cookie (und informiert den Server über Logout), dann Weiterleitung zur Login-Seite.
handleLogout()	Event-Handler für den Logout-Button im UI. Ruft nach Bedarf logout() auf (hier könnte man auch eine Bestätigungsabfrage integrieren).
Integration in die bestehende game.html
Die HTML-Datei game.html muss so aufgebaut sein, dass game.js mit den dort definierten Elementen interagieren kann:
Canvas-Element: In game.html sollte ein <canvas> Element mit einer bekannten ID existieren, z. B. <canvas id="gameCanvas" width="800" height="600"></canvas>. Das Skript game.js greift darauf mit document.getElementById('gameCanvas') zu, um den 2D-Kontext zu erhalten (getContext('2d')) und das Spiel darauf zu zeichnen. Stellen Sie sicher, dass Höhe und Breite gesetzt sind oder im Script angepasst werden, und dass das Canvas im Layout sichtbar ist (CSS ggf. anpassen).
Username-Anzeige: Es ist empfehlenswert, im HTML einen Platzhalter für den Benutzernamen vorzusehen, z. B. <span id="username"></span> innerhalb einer Menüleiste oder Kopfzeile. game.js füllt dieses Span-Element nach erfolgreicher Authentifizierung mit dem tatsächlichen Login-Namen des Spielers (siehe checkAuth(), das den innerText setzt). So sieht der Nutzer z. B. "Angemeldet als MaxMustermann". Falls der Nutzername bereits serverseitig in die HTML gerendert wird (etwa via Template), sollte checkAuth() diese Anzeige trotzdem aktualisieren oder zumindest nicht überschreiben.
Logout-Button: In der HTML-Datei sollte ein Logout-Knopf vorhanden sein, z. B. <button id="logoutButton">Logout</button>. Der Button muss die im Script referenzierte ID haben (logoutButton im obigen Code). game.js hängt im DOMContentLoaded-Handler den Event Listener handleLogout an diesen Button. Beim Klick wird dann der Logout-Vorgang aus dem Script ausgeführt. Achten Sie darauf, dass der Button nur für eingeloggte Nutzer sichtbar ist (ggf. per CSS ausblenden, falls Seite sowohl für eingeloggte als auch ausgeloggte Zustände genutzt wird).
Script-Einbindung: Binden Sie game.js am Ende der game.html ein (direkt vor </body>), oder verwenden Sie das defer-Attribut, damit das Script erst nach dem Aufbau des DOM ausgeführt wird. Beispiel: <script src="client/js/game.js" defer></script>. Dadurch ist sichergestellt, dass Elemente wie Canvas und Buttons bereits im DOM existieren, wenn game.js läuft. (Im gezeigten Code wird zusätzlich DOMContentLoaded abgewartet, was doppelte Sicherheit bietet.)
Andere UI-Elemente: Falls weitere UI-Komponenten existieren (Chat-Fenster, Score-Anzeige etc.), stellen Sie analog sicher, dass game.js diese per ID auswählen und manipulieren kann. Die Interaktion mit solchen Elementen (z. B. Anzeigen aktualisieren) sollte ebenfalls erst nach erfolgreicher Authentifizierung erfolgen.
Durch diese Integration der game.js mit game.html wird erreicht, dass:
Beim Aufruf der Spieleseite ohne gültige Anmeldung sofort eine Weiterleitung erfolgt (Schutz der Spielseite).
Der Benutzername aus dem Token angezeigt wird, was dem Nutzer Feedback über seinen Login gibt.
Der Logout-Button eine definierte Funktion hat, die das neue JWT-basierte Login sauber beendet.
Das Canvas-Element vom Script gefunden und genutzt werden kann, um das Spiel zu rendern.
Mit diesem Umsetzungsplan kann ein Entwickler direkt beginnen, die Datei client/js/game.js anzupassen. Die Schritte führen strukturiert durch die notwendigen Änderungen vom alten Session-basierten Ansatz hin zu JWT/Cookie-Authentifizierung. Durch die erläuterten Best Practices und Hinweise zu häufigen Fallstricken ist sichergestellt, dass die Integration robust und wartbar gelingt. So vorbereitet, lässt sich die neue Authentifizierungslogik nahtlos in das bestehende Vanilla-JS/Canvas-Projekt einfügen.