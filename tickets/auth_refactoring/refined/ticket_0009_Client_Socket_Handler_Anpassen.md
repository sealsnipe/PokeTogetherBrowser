Umsetzungsplan für Ticket 0009: JWT-Authentifizierung im Socket.io-Client
1. Best Practices bei der Speicherung von JWT im Client
JWT im Client speichern: Für die Speicherung des JWT auf der Client-Seite gibt es verschiedene Möglichkeiten. Übliche Varianten sind localStorage, sessionStorage oder nur im Speicher (In-Memory). Jede hat Vor- und Nachteile:
LocalStorage: Bleibt über Seiten-Neuladen und Browser-Sessions erhalten (persistente Speicherung, auch in neuen Tabs derselben Origin verfügbar). Das ist praktisch für Auto-Login oder Sitzungen, die länger leben sollen. Allerdings ist der Inhalt von localStorage durch JavaScript im Browser auslesbar, was bei einer XSS-Schwachstelle ausgenutzt werden könnte​
de.linkedin.com
.
SessionStorage: Ist auf den Lebenszyklus des aktuellen Tabs/der aktuellen Sitzung beschränkt. Das Token wird gelöscht, sobald der Tab geschlossen wird. Das erhöht leicht die Sicherheit, da Tokens nicht unbegrenzt herumliegen, aber bei einem Seiten-Neuladen oder neuem Tab muss der Nutzer sich neu anmelden. Gegen XSS bietet es keinen grundlegenden Vorteil gegenüber LocalStorage – beide sind über JavaScript auslesbar, solange ein Angreifer Skripte einschleusen kann.
Speicher (In-Memory): Das Token wird nur in JavaScript-Variablen gehalten (z. B. in einer globalen Variable oder im State-Management der App) und nicht in einer Storage-API persistiert. Dies hat den Vorteil, dass nach einem kompletten Reload oder in einem neuen Tab das Token nicht automatisch vorhanden ist – ein Angreifer, der z. B. lokalen Speicher ausliest, findet nichts​
stytch.com
. Allerdings geht damit auch die Bequemlichkeit verloren: Wenn der Benutzer die Seite neu lädt oder den Browser schließt, ist das Token weg, und es muss entweder neu abgerufen (z. B. via Refresh-Token) oder der Benutzer neu eingeloggt werden​
stytch.com
. Moderne SPAs tendieren dazu, Access Tokens im Speicher zu halten und Refresh Tokens in HttpOnly-Cookies zu speichern, um XSS-Risiken zu minimieren und dennoch persistente Logins zu ermöglichen​
stytch.com
​
stytch.com
. Für unser Projekt wird (wie in den vorherigen Tickets vorgesehen) das JWT im localStorage abgelegt, um einen persistenten Login zu ermöglichen – wir müssen uns aber bewusst sein, dass dies sichere Coding-Practices gegen XSS erfordert.
Sicherheitsaspekte (XSS) und Gegenmaßnahmen: Wenn JWTs im Browser gespeichert werden (insbesondere in localStorage oder sessionStorage), besteht ein Risiko bei Cross-Site-Scripting-Angriffen. Ein Angreifer, der XSS in unserer Anwendung unterbringt, könnte auf window.localStorage zugreifen und das Token stehlen. Dadurch könnte er in Besitz der Benutzer-Session gelangen. Dieses Risiko sollte nicht auf die leichte Schulter genommen werden. Wichtig ist: Unabhängig davon, wo das Token gespeichert wird, muss XSS präventiv verhindert werden​
medium.com
. Maßnahmen hierzu umfassen:
Strikte Input-Validierung und -Sanitierung: Keine ungeprüften Daten in DOM-Methoden einfügen, Nutzung von Framework-Funktionen oder Libraries (z. B. DOMPurify) zur Säuberung von HTML, um Stored oder Reflected XSS zu vermeiden.
Einsatz von Content Security Policy (CSP): CSP-Header können das Ausführen von unbekanntem Skript-Code erschweren (z. B. nur eigene Domains erlauben, keine inline-Scripts etc.), was das Risiko erfolgreich ausgeführter XSS deutlich senkt.
HttpOnly-Cookies für sensible Daten verwenden, falls möglich: In unserem Fall sollen JWTs zwar im localStorage genutzt werden, aber langfristig könnte man erwägen, stattdessen ein HttpOnly-Cookie für das Token einzusetzen, um direkte JS-Zugriffe zu verhindern. Dies müsste dann mit CSRF-Schutz kombiniert werden, da Cookies anfällig für CSRF sind​
de.linkedin.com
.
Regelmäßige Code-Prüfung (Audit) und Tests auf XSS-Stellen: z. B. Verwendung von Lintern oder Scannern, die gefährliche Patterns finden.
Letztlich gilt es, die Angriffsfläche gering zu halten. Wenn wir localStorage nutzen, muss unser Frontend so entwickelt sein, dass ein Angreifer gar keine Möglichkeit hat, eigenes Skript auszuführen. Sollte es trotzdem passieren, hilft auch kein HttpOnly-Cookie vollständig – ein Angreifer mit XSS könnte z.B. statt das Token auszulesen, einfach API-Aufrufe in unserem Kontext ausführen oder den Socket nutzen. Fazit: Fokus auf XSS-Prävention, egal wo das Token liegt​
medium.com
.
Fehlerbehandlung bei ungültigen/fehlenden Tokens: Der Client muss mit der Situation umgehen können, dass kein gültiges JWT vorhanden ist. Fehlendes Token: Wenn im localStorage kein JWT gefunden wird (z. B. der Benutzer ist nicht eingeloggt oder hat sich ausgeloggt), darf der Socket-Verbindungsaufbau gar nicht erst versucht werden. In diesem Fall sollte unsere Anwendung erkennen, dass der Nutzer nicht authentifiziert ist, und z. B. direkt auf die Login-Seite weiterleiten, statt ins Leere zu verbinden. Ungültiges oder abgelaufenes Token: Falls das JWT zwar vorhanden ist, aber vom Server als ungültig abgelehnt wird (z. B. manipuliert oder abgelaufen), muss der Client das ebenfalls abfangen. Konkret bedeutet das: wir implementieren einen Fehler-Handler für den Verbindungsaufbau (Socket.io connect_error Event), der auf Authentifizierungsfehler prüft. Erkennt er, dass das Token nicht akzeptiert wurde, sollte er das Token beim Client löschen und den Benutzer zwangsweise ausloggen (z. B. auf die Login-Seite navigieren, ggf. mit einer Fehlermeldung). Somit verhindern wir, dass der Client in einem nicht-authentifizierten Zustand hängenbleibt. Zusätzlich ist es sinnvoll, im UI eine Meldung anzuzeigen, dass die Sitzung abgelaufen oder ungültig ist, damit der Nutzer Feedback bekommt. Auch sollte der Fall eines manipulierten Tokens (z. B. falsches Format) berücksichtigt werden – hier würde der Server ebenfalls mit einem Auth-Fehler reagieren, den wir identisch behandeln können. Zusammengefasst: Immer wenn kein gültiges JWT bereitsteht, darf keine Socket-Verbindung mehr bestehen; der Client sollte sauber darauf reagieren (Logout durchführen, Navigation zum Login, etc.).
2. Typische Probleme bei Socket.io mit JWT-Authentifizierung
Bei der Umstellung auf JWT-basierte Authentifizierung in Socket.io können erfahrungsgemäß einige Probleme auftreten. Diese müssen wir berücksichtigen und abfangen:
Token nicht verfügbar oder abgelaufen: Wenn der Socket-Client startet, aber kein JWT vorhanden ist (z. B. erster Aufruf ohne Login), oder wenn das gespeicherte JWT seine Gültigkeit verloren hat, schlägt die Authentifizierung beim Verbindungsaufbau fehl. Der Socket.io-Server wird in so einem Fall die Verbindung verweigern. Ergebnis: Der Client bekommt ein connect_error Event beim Verbindungsversuch. Dieses Szenario müssen wir abfangen und entsprechend handeln (siehe Fehlerbehandlung oben): ohne gültiges Token kein Verbindungsaufbau. Das bedeutet praktisch, connectToServer sollte prüfen, ob ein Token da ist – wenn nicht, gar nicht erst io() aufrufen. Und wenn doch eins da ist, aber der Server lehnt es ab, im connect_error das Logout/Redirect durchführen.
Keine Kommunikation zwischen Client und Server (durch fehlgeschlagenen Handshake): Falls die JWT-Prüfung im Handshake fehlschlägt, wird gar keine Socket-Verbindung aufgebaut. Das heißt, keine Events (connect, disconnect, custom Events) werden mehr durchgehen. Für den Benutzer wirkt es, als würde die Anwendung "hängen" oder keine Daten laden. Um das nicht im Dunkeln zu lassen, fangen wir wie gesagt den Fehler ab und informieren den Nutzer bzw. leiten um. Wichtig ist, dass wir vor dem Verbindungsversuch alles richtig konfigurieren – d.h. das Token korrekt übergeben – damit nicht aus Versehen eine Verbindung ohne Auth entsteht. Außerdem sollte in unseren Logs (ggf. Browser-Console) klar erkennbar sein, wenn die Auth fehlgeschlagen ist (durch konsistente Fehlermeldungen im Handler).
Automatische Reconnects ohne gültiges Token: Socket.io-Client versucht standardmäßig, verlorene Verbindungen automatisch wieder herzustellen (Auto-Reconnect). Das kann problematisch werden, wenn der Token abgelaufen oder ungültig geworden ist, weil dann jeder automatische Wiederverbindungsversuch wieder fehlschlägt. Im schlimmsten Fall versucht der Client in Endlosschleife zu reconnecten, was zu vielen Fehlermeldungen und unnötigem Traffic führt. Wir müssen dieses Verhalten steuern:
Wenn der Token ungültig ist und zu einem connect_error führt, sollten wir den automatischen Reconnect gezielt unterbinden. Praktisch kann man nach einem Auth-Fehler socket.disconnect() aufrufen oder die reconnection-Option deaktivieren, damit nicht weiter versucht wird. Alternativ kann man Socket.io auch initial so konfigurieren, dass es gar nicht erst automatisch reconnectet (reconnection: false), und stattdessen selbst steuern, wann ein erneuter Verbindungsversuch stattfindet (z.B. nach erfolgreichem Login).
Wenn die Verbindung aus anderen Gründen abreißt (z.B. Netzwerkausfall) und ein gültiges Token noch vorhanden ist, dann möchten wir i.d.R. die Auto-Reconnect-Funktionalität beibehalten, damit die Verbindung wiederkommt, sobald die Verbindung möglich ist. Das heißt, die Deaktivierung von Reconnect sollte nicht global geschehen, sondern nur im Falle eines Auth-Fehlers bzw. nach Logout.
Fazit: Nach einem Authentifizierungsfehler trennen wir die Socket-Verbindung endgültig (bis neuer Token da ist). Während einer normalen Session mit gültigem Token erlauben wir Reconnects, damit temporäre Unterbrechungen selbstheilend sind.
Synchronisationsprobleme bei Multi-Tab-Umgebungen: Viele Nutzer öffnen Webanwendungen in mehreren Tabs gleichzeitig. Da localStorage zwischen Tabs geteilt wird (gleiche Origin), haben beide Tabs Zugriff auf dasselbe JWT. Das führt zu einigen Szenarien, auf die wir achten sollten:
Login in einem Tab, weiterer Tab offen: Wenn der Nutzer sich in Tab A einloggt (JWT wird in localStorage gesetzt) und in Tab B war die Anwendung bereits geöffnet (aber evtl. nicht verbunden, weil vorher kein Token da war), müsste Tab B nun mitbekommen, dass ein Token vorhanden ist. Ohne weiteres Zutun würde Tab B es erst beim nächsten manuellen Aktion merken (z.B. wenn der Nutzer die Seite neu lädt oder dort eine Verbindung manuell initiiert wird). Eine mögliche Verbesserung wäre, in Tab B auf das storage-Event des Browsers zu lauschen: dieses wird ausgelöst, wenn in einem anderen Tab localStorage verändert wurde. So kann Tab B erkennen, dass das JWT gesetzt wurde, und dann automatisch connectToServer aufrufen, um die Socket-Verbindung aufzubauen. In unserem Plan können wir diesen Mechanismus als optionalen Verbesserungshinweis erwähnen.
Logout/Token entfernt in einem Tab: Umgekehrt, wenn der Nutzer in Tab A ausgeloggt wird (Token aus localStorage entfernt), sollte Tab B die Verbindung kappen, auch wenn der Nutzer dort gerade nichts gemacht hat. Andernfalls hätte Tab B noch eine offene Socket-Verbindung mit einem inzwischen invaliden Token. Zwar würde spätestens bei der nächsten Server-Interaktion ein Fehler auftreten, aber besser ist es, sofort zu reagieren. Hier kann ebenfalls das storage-Event helfen: Tab B erkennt, dass das Token gelöscht wurde, und kann dann socket.disconnect() ausführen und den Nutzer ggf. auf die Login-Seite bringen.
Abgelaufenes Token in mehreren Tabs: Wenn JWTs ein Ablaufdatum haben (Expiry), läuft es für alle Tabs gleichzeitig ab. Sobald der erste Tab die Info vom Server bekommt, dass das Token ungültig ist (z.B. beim Versuch, neu zu verbinden oder eine geschützte Aktion durchzuführen), sollte dieser Tab das Token aus localStorage entfernen (Logout). Die anderen Tabs würden dies über das storage-Event erkennen und dann ebenfalls ausloggen. Dieses Zusammenspiel muss bedacht werden, damit der Zustand "angemeldet" synchron über alle offenen Fenster bleibt.
Kein Shared Socket zwischen Tabs: Es gibt keine einfache Möglichkeit, eine einzelne Socket.io-Verbindung zwischen Tabs zu teilen​
stackoverflow.com
. Daher wird jeder Tab seine eigene Verbindung aufmachen müssen, mit dem gleichen Token. Das bedeutet aber auch, dass jeder Tab separat vom Server authentifiziert wird. Wenn z.B. Tab A erfolgreich verbunden ist und Tab B neu geöffnet wird, muss Tab B sein eigenes connectToServer mit Token machen. Das sollte normal funktionieren, wir müssen nur sicherstellen, dass der Token in localStorage für alle Tabs zugänglich und konsistent ist.
Zusammengefasst: In Multi-Tab-Szenarien sollten wir das Browser-Storage-Event nutzen, um Login/Logout-Aktionen zu synchronisieren. Zudem sollte jeder Socket-Verbindungsaufbau immer den aktuellen JWT-Wert aus dem Storage lesen (nicht einen alten zwischengespeicherten Wert), damit jeder Tab stets mit dem aktuellsten Token verbindet.
3. Technische Umsetzung der Änderungen (Socket.io-Clienthandler)
Im Modul client/js/modules/socketHandler.js müssen wir nun konkret die Verwendung von JWT für die Socket-Authentifizierung implementieren. Folgende Schritte und Anpassungen sind vorgesehen:
Änderungen an connectToServer: Die Funktion connectToServer ist dafür zuständig, die Verbindung zum Socket.io-Server herzustellen. Hier müssen wir das JWT aus dem Storage auslesen und beim Verbindungsaufbau mitgeben. Konkret: Statt wie bisher möglicherweise eine Session-ID zu verwenden, holen wir uns das Token, z. B. via const token = localStorage.getItem('<Token-Key>'). Dieser Token wird dann im Optionen-Objekt von io() übergeben, und zwar unter dem Schlüssel auth. Beispiel: io(serverUrl, { auth: { token: token } }). Socket.io sendet dieses auth-Objekt beim Handshake an den Server, wo es vom JWT-Middleware geprüft werden kann (der Server liest es typischerweise über socket.handshake.auth.token aus). Wichtig: Bevor wir io() aufrufen, sollte geprüft werden, ob token existiert und gültig aussieht. Falls !token (null, undefined oder leerer String), kann connectToServer entweder gar nicht erst versuchen zu verbinden, oder alternativ ein Fehlerobjekt/Promise ablehnen, so dass der Aufrufer weiß, dass keine Verbindung zustande kommt. In unserem Fall ist es am einfachsten, connectToServer still abzubrechen (und evtl. eine Warnung in der Konsole zu loggen), wenn kein Token da ist. Die Verantwortung, dass connectToServer nur bei eingeloggtem Nutzer aufgerufen wird, kann aber auch beim Aufrufer liegen (Integration in die Login-Logik).
Entfernen alter Session-ID-Bezüge: Bisher wurde offenbar eine Session-ID im localStorage gehalten und für die Authentifizierung verwendet. Alle Stellen, an denen localStorage.getItem('sessionId') oder ähnliche Logik vorkommen, müssen bereinigt werden. Das betrifft wahrscheinlich:
In connectToServer: falls dort früher eine Session-ID an den Server geschickt wurde (z. B. via Query-Parameter io(url, { query: { sessionId: ... } })), wird das durch die neue JWT-Auth ersetzt. Entfernen Sie also jegliche Zusammenbau-Logik der URL oder Query mit der Session-ID. Wir nutzen stattdessen ausschließlich das JWT.
Falls die Session-ID irgendwo im Code nach erfolgreicher Verbindung gespeichert wurde (z. B. socket.on('connect', () => { localStorage.setItem('sessionId', socket.id) }) oder Ähnliches), kann das ebenfalls weg. Mit JWT ist die Session-ID obsolet – die Identifikation des Benutzers erfolgt über den Token-Inhalt serverseitig, und falls wir die Socket-ID brauchen, können wir sie jederzeit mit socket.id abfragen, ohne sie persistent zu speichern.
Funktionen wie getMyId: Wenn diese bisher die Session-ID zurücklieferten (vermutlich aus dem Storage), müssen sie angepasst werden. Wahrscheinlich soll getMyId nun entweder die Socket-ID der aktuellen Verbindung zurückgeben (diese ändert sich pro Verbindung und dient der eindeutigen Identifikation der Socket-Verbindung), oder – falls semantisch gewollt – die Benutzer-ID aus dem JWT. Letzteres würde jedoch bedeuten, das JWT am Client zu dekodieren. In einem ersten Wurf kann getMyId einfach socket.id zurückgeben. Die Nutzer-ID an sich wird serverseitig aus dem JWT ermittelt (und könnte bei Bedarf dem Client über einen separaten Event mitgeteilt werden). Wir behalten also vorerst den Zweck von getMyId als "Socket-Connection-ID" bei, oder benennen die Funktion ggf. um, wenn das missverständlich ist. Wichtig ist: jegliche Abhängigkeit von einer persistierten Session-ID im Storage entfällt.
Andere Module: Sollte es weitere Module geben, die die Session-ID aus dem Storage gezogen haben (z. B. um an REST-Calls dranzuhängen), müssen diese ebenfalls umgestellt werden, aber das wäre vermutlich in Tickets 0008 oder ähnlich erfolgt. Für Ticket 0009 konzentrieren wir uns auf den Socket-Teil.
JWT aus dem Storage lesen: Wie oben erwähnt, nutzen wir localStorage.getItem() um an das JWT heranzukommen. Wir sollten sicherstellen, dass wir den richtigen Key verwenden – vermutlich wurde in Ticket 0008 festgelegt, unter welchem Schlüssel das JWT gespeichert wird (z. B. "authToken", "jwt" o.ä.). Diesen Key verwenden wir konsistent. Es kann sinnvoll sein, diesen Key als Konstante zu definieren, etwa const TOKEN_KEY = 'jwtToken';, um Tippfehler zu vermeiden. Die Lese-Operation kann potentiell Fehler werfen in strengen Umgebungen (z. B. Safari in Privacy Mode erlaubt manchmal kein localStorage), daher könnten wir sie in einen try/catch packen, aber im Normalfall ist das nicht nötig. Nachdem wir das Token haben, fügen wir es beim Verbindungsaufbau hinzu. Hier ein Code-Snippet zur Veranschaulichung (die genaue Implementierung folgt im Code-Vorschlag):
js
Copy
Edit
const token = localStorage.getItem(TOKEN_KEY);
if (!token) {
    console.warn('Kein JWT vorhanden, Socket-Verbindung wird nicht aufgebaut.');
    return;
}
this.socket = io(SERVER_URL, {
    auth: { token: token },
    // ... evtl. weitere Optionen wie reconnectionAttempts etc.
});
Damit wird das JWT dem Server übermittelt, ohne dass es in der URL sichtbar ist (es geht im Socket-Handshake mit). Hinweis: Das JWT selbst bleibt im Speicher liegen; wir verschicken es kopiert im Auth-Handshake. Sollte irgendwann ein Token erneuert werden (Refresh-Token-Mechanismus), müssten wir dafür sorgen, dass zukünftige Verbindungsaufbauten das neue Token nehmen. Solange wir aber nur statische Tokens nutzen, reicht es, immer frisch aus localStorage zu lesen, wenn wir connectToServer aufrufen.
Verwendung des Tokens im auth-Objekt bei io(): Die eigentliche Initialisierung des Socket-Clients ändert sich durch JWT nur im Options-Objekt. Früher war dort evtl. query: { sessionId: ... } gesetzt; das kommt weg. Stattdessen: auth: { token: <JWT-String> }. Socket.io v4 wird dieses Feld intern behandeln. Auf Serverseite sollte (laut Ticket 0003) ein Middleware installiert sein, die so aussieht:
js
Copy
Edit
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    // Token validieren ...
    if (valid) next();
    else next(new Error("Authentication error"));
});
Somit führt ein falscher Token zum Verbindungsabbruch mit Fehler. Wichtig: Der Schlüssel muss auf Client und Server abgestimmt sein. Wir nutzen "token", der Server sollte dasselbe erwarten. Sollte der Server stattdessen den Token im Query erwarten (manche Beispiele nutzen query: { token: ... }), müssten wir uns anpassen. Aber moderne Vorgehensweise ist das auth-Objekt zu nutzen​
app.studyraid.com
. Vorteil: Das Token wird nicht als Query-String an jeden Polling-Request gehängt, sondern ausschließlich im initialen Handshake übergeben.
Erweiterter connect_error-Handler: Eine wichtige Neuerung ist das Hinzufügen eines Error-Handlers speziell für Verbindungsfehler. Bisher wurde darauf ggf. nicht geachtet oder nur allgemein geloggt. Jetzt wollen wir beim Verbindungsaufbau explizit auf Authentifizierungsprobleme reagieren. Das Socket.io-Clientobjekt (socket) emittiert ein Event 'connect_error', wenn der Server die Verbindung ablehnt. Im Ablehnungsfall, der durch unser JWT verursacht wird, wird der Server in der Regel den Fehler mit einer Fehlermeldung versehen (z. B. new Error("Authentication error")). Diese Fehlermeldung kommt als err.message beim Client an​
app.studyraid.com
. Unser Plan:
Direkt nach dem io(...) Aufruf und bevor wir andere Events registrieren, hängen wir einen Listener an:
js
Copy
Edit
socket.on('connect_error', (err) => {
    // Fehlerobjekt auswerten
    if (err?.message === "Authentication error" || err?.message === "jwt expired" || err?.message === "invalid token") {
        console.error("Socket-Authentifizierung fehlgeschlagen:", err.message);
        handleLogoutDueToAuthError();
    } else {
        console.error("Socket Verbindungsfehler:", err.message);
    }
});
Wir prüfen hier auf mögliche Fehlermeldungen, die auf ein Authproblem hindeuten. Da die genaue Wortwahl von unserem Server abhängt, müssten wir wissen, was Ticket 0003 im Fehlerfall sendet. Oft ist es "Authentication error" wie oben, oder eventuell spezieller (z. B. beim Einsatz von JWT-Bibliotheken wie socketio-jwt wäre es "jwt malformed" oder ähnliches). Um robust zu sein, könnten wir auch alle Fehler, die bei erster Verbindung auftreten, als Grund nehmen, um auf die Login-Seite zu gehen – aber besser ist, die Message zu filtern, damit man echte Verbindungsprobleme (Server down, Netzwerk) nicht sofort als Logout behandelt. In obigem Pseudocode werden Auth-Fehler erkannt und führen zu handleLogoutDueToAuthError(). Diese Funktion (müssen wir implementieren oder von einem Auth-Modul anrufen) soll folgendes machen:
JWT aus dem localStorage entfernen (localStorage.removeItem(TOKEN_KEY)), damit keine weiteren Versuche mit dem gleichen ungültigen Token passieren.
Evtl. einen globalen State "loggedIn" auf false setzen, falls unsere App so etwas trackt.
Die Socket-Verbindung ganz trennen: socket.disconnect() – wobei nach einem connect_error die Verbindung ohnehin nicht etabliert ist. Aber falls Socket.io noch einen reconnect versuchen will, verhindern wir das hier (dazu mehr unter Reconnect).
Den Nutzer zur Login-Seite umleiten. In einer Single-Page-App könnte das bedeuten, unsere Router-Komponente anzustoßen (navigate("/login") o.ä.). Oder man verwendet einen simplen Weg: window.location.href = "/login" um die Seite neu zu laden auf der Login-Route. Wichtig ist, den Nutzer zu zwingen, sich neu zu authentifizieren.
Optional: Eine Benutzer-Meldung anzeigen, z.B. "Deine Sitzung ist abgelaufen, bitte melde dich neu an."
Zusätzlich loggen wir andere Fehler (Network Errors etc.) in der Konsole, um sie debuggen zu können. Diese lösen kein Logout aus, sondern können eventuell von Socket.io durch Reconnect behoben werden.
Der connect_error-Handler sollte nur einmal beim Initialisierungsprozess hinzugefügt werden, nicht bei jedem Reconnect neu. In unserem Code-Vorschlag werden wir das innerhalb von connectToServer direkt nach io() machen.
Umgang mit Reconnects: Wie oben in den typischen Problemen diskutiert, müssen wir das Wiederverbindungsverhalten anpassen:
Wir können Socket.io so konfigurieren, dass es nur eine bestimmte Anzahl Versuche macht (reconnectionAttempts) oder die Intervalle einstellt. Es bietet Optionen wie reconnectionDelay, reconnectionDelayMax, reconnectionAttempts. Standardmäßig versucht es endlos, was bei Auth-Fehlern unerwünscht ist. In unserem Fall reicht es, bei Auth-Fehlern manuell abzubrechen. Dennoch könnten wir in der Initialisierung z.B. setzen: reconnectionAttempts: 5 (nur 5 Versuche dann aufgeben) – nur als Safety-Net.
Wichtiger: Wenn wir im connect_error feststellen, dass das Problem am Token liegt, rufen wir socket.disconnect() und leiten Logout ein. Ein auf diese Weise getrenntes Socket wird nicht mehr reconnecten (Auto-Reconnect wird gestoppt, da wir manuell getrennt haben). Somit verhindern wir Endlosschleifen sauber.
Falls kein Auth-Fehler vorliegt, sondern z.B. der Server nicht erreichbar war, würde connect_error auch feuern (mit z.B. err.message = "xhr poll error" oder ähnlichem). In so einem Fall wollen wir dem Nutzer nicht gleich das Login wegnehmen. Unser obiger Handler unterscheidet das: Bei anderen Fehlermeldungen loggen wir nur. Hier greift dann weiterhin die automatische Reconnect-Logik von Socket.io. Diese wird versuchen, in Abständen neu zu verbinden. Der Nutzer bleibt in unserer App angemeldet. Nimmt der Server die Verbindung irgendwann an (Netzwerk wieder da), wird connect Event kommen und alles läuft normal weiter.
Reconnect deaktivieren nach Logout: Wenn der Nutzer bewusst ausgeloggt hat (z.B. Logout-Button), sollten wir auch sicherstellen, dass keine automatische Reconnects mehr passieren. Daher sollte der Logout-Vorgang ebenfalls socket.disconnect() aufrufen, falls eine Verbindung besteht. In unserem Code wird das in handleLogoutDueToAuthError abgedeckt. Ebenso sollte ein regulärer Logout-Button diese Logik aufrufen oder ähnlich verfahren.
Kein sofortiger Neuversuch mit altem Token: Sollte aus irgendeinem Grund Socket.io doch direkt wieder versuchen zu verbinden (z.B. falls es vor unserem disconnect schon einen Retry gequeued hatte), hat es spätestens dann kein Token mehr (wir haben es ja aus Storage gelöscht). Das heißt, ein erneuter Handshake würde ohne Token erfolgen, was der Server ebenfalls ablehnt. Das Ergebnis wäre nochmal ein connect_error. Da aber unser Token fehlt, könnten wir das direkt abfangen. In jedem Fall bricht die Schleife, weil wir entweder kein connect() mehr aufrufen bis neuer Token da ist, oder der Nutzer auf Login-Seite ist.
Zusammenfassung: Im Code stellen wir sicher, dass reconnection: true (Standard) benutzt werden kann, aber wir unter bestimmten Bedingungen manuell disconnect() ausführen. Optional können wir auch socket.io.opts.reconnection = false setzen, aber das ist meistens nicht nötig, wenn wir disconnecten.
Optional (Multi-Tab Sync): Wie vorher erwähnt, könnten wir im Modul noch einen Listener auf window.addEventListener('storage', ...) setzen, der prüft, ob der Token in localStorage verändert wurde. Beispielsweise:
js
Copy
Edit
window.addEventListener('storage', (event) => {
    if (event.key === TOKEN_KEY) {
        if (!event.newValue) {
            // Token wurde entfernt (Logout in anderem Tab)
            if (socket) socket.disconnect();
            // evtl. Redirect zur Login-Seite auslösen
        } else {
            // Ein neuer Token wurde gesetzt (Login in anderem Tab)
            // Mögliche Aktion: falls noch nicht verbunden, jetzt verbinden
            // oder falls Token erneuert, aktuellen Socket ggf. aktualisieren (erfordert Neuverbinden)
        }
    }
});
Dies ist allerdings ein Bonus und muss sauber integriert werden, damit es keine doppelten Verbindungen verursacht. Für den Anfang kann man das auch weglassen oder als Hinweis kommentieren.
Mit diesen Anpassungen stellen wir sicher, dass der Socket.io-Client nun JWT-Authentifizierung nutzt und robust auf Fehler reagiert. Im nächsten Abschnitt folgt ein kompletter Code-Vorschlag, der all diese Punkte berücksichtigt.
4. Vollständiger Code-Vorschlag für socketHandler.js
Nachfolgend ein möglicher implementierter Code für das Socket-Handler-Modul. Dieser enthält alle relevanten Funktionen (connectToServer, getMyId, disconnect, on, emit, etc.), ist mit Kommentaren versehen und auf eine saubere Modulstruktur ausgerichtet. Wir nehmen an, dass wir ES6-Module verwenden (mit import/export Syntax). Kommentare erklären die Schritte:
js
Copy
Edit
// client/js/modules/socketHandler.js

import { API_BASE_URL } from '../config.js';  // Beispiel: Basis-URL zum Socket-Server (falls benötigt)
// Hinweis: API_BASE_URL könnte z.B. "http://localhost:3000" enthalten, je nach Deployment

const TOKEN_KEY = 'authToken';  // Schluessel unter dem das JWT im localStorage gespeichert ist

// Internes Socket.io-Client Objekt
let socket = null;

/**
 * Stellt eine Verbindung zum Socket.io-Server her, mit JWT-Auth im Handshake.
 * Liest dazu das JWT aus dem localStorage und übergibt es im auth-Objekt.
 * Falls bereits eine Verbindung besteht, wird diese ggf. vorher getrennt.
 */
export function connectToServer() {
  // Falls schon ein Socket verbunden ist, zuerst trennen, um Doppelverbindungen zu vermeiden
  if (socket && socket.connected) {
    socket.disconnect();
    socket = null;
  }

  // JWT aus dem Storage lesen
  let token;
  try {
    token = localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.error('Fehler beim Zugriff auf localStorage:', e);
    token = null;
  }

  if (!token) {
    console.warn('Kein JWT-Token vorhanden. Verbindung nicht aufgebaut.');
    // Ohne Token brechen wir ab. Der Aufrufer sollte ggf. den Nutzer zur Anmeldung schicken.
    return;
  }

  // Socket.io Verbindung initialisieren mit Auth-Daten
  socket = io(API_BASE_URL, {
    auth: { token: token },
    // optional: Automatischen Reconnect begrenzen, um Endlosschleifen zu vermeiden
    reconnectionAttempts: 5,       // z.B. maximal 5 Versuche
    reconnectionDelay: 1000,       // 1 Sekunde Startverzögerung
    reconnectionDelayMax: 5000,    // bis zu 5 Sekunden zwischen Versuchen
    // transports: ['websocket'],  // falls wir WebSocket-only nutzen wollen (Standard ist Polling + WebSocket fallback)
  });

  // Event-Handler für erfolgreiche Verbindung
  socket.on('connect', () => {
    console.log('Socket verbunden, ID:', socket.id);
    // Hier könnten wir bei Bedarf weitere Initialisierungen vornehmen,
    // z.B. dem Server etwas mitteilen oder im UI den Status anzeigen.
  });

  // Event-Handler für Verbindungsfehler beim Handshake (z.B. Auth fehlgeschlagen)
  socket.on('connect_error', (err) => {
    // Hinweis: connect_error tritt auch bei Netzwerkausfällen o.ä. auf, daher differenzieren
    const msg = err.message || err.toString();
    if (msg.toLowerCase().includes('auth') || msg.toLowerCase().includes('jwt')) {
      // Wir vermuten einen Authentifizierungsfehler anhand der Fehlermeldung
      console.error('Socket Connect-Error (Auth problem):', msg);
      // Token aus Storage entfernen, da es ungültig ist
      try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ }
      // Socket-Verbindung kappen und automatische Reconnects unterbinden
      if (socket) {
        socket.disconnect(); 
        // Optional: socket.io.opts.reconnection = false; // (disconnect sollte genügen)
      }
      // Weiterleitung zur Login-Seite (oder zentralen Logout-Routine)
      // Annahme: Es gibt eine globale authHandler, der Logout durchführt:
      // authHandler.logout(); 
      // Oder einfache Lösung:
      window.location.href = '/login'; 
    } else {
      // Andere Fehler (z.B. Server nicht erreichbar)
      console.error('Socket Connect-Error:', msg);
      // Hier *nicht* disconnecten, Socket.io versucht Auto-Reconnect sofern reconnection=true
      // Wir könnten ggf. eine UI-Anzeige machen: "Verbindung unterbrochen, Versuche neu zu verbinden..."
    }
  });

  // Event-Handler für reguläre Disconnects nach erfolgreicher Verbindung
  socket.on('disconnect', (reason) => {
    console.warn('Socket disconnected. Grund:', reason);
    // Mögliche values für reason: 'io server disconnect', 'io client disconnect', 'ping timeout', ...
    // Bei einem Logout (manuell oder durch Auth-Error) haben wir bereits alles nötige getan (Token gelöscht etc.)
    // Falls der disconnect unerwartet war (z.B. Server down), versucht Socket.io ggf. zu reconnecten (je nach Einstellung).
    // Wir können hier optional behandeln, z.B. UI-Status "getrennt" setzen.
  });
}

/**
 * Gibt die eigene Socket-ID zurück, falls verbunden.
 * Diese ID ist die eindeutige Kennung der aktuellen Socket-Verbindung.
 * @returns {string|null} Socket-ID oder null, wenn kein Socket verbunden ist.
 */
export function getMyId() {
  if (socket && socket.connected) {
    return socket.id;
  }
  return null;
}

/**
 * Trennt die Socket.io-Verbindung manuell.
 * Sollte beim Logout oder beim Verlassen der Seite aufgerufen werden, 
 * um die Verbindung sauber zu schließen.
 */
export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Registriert einen Event-Listener auf dem Socket.
 * @param {string} event - Event-Name 
 * @param {function} callback - Callback-Funktion bei Eintreffen des Events
 */
export function on(event, callback) {
  if (!socket) {
    console.error('Socket ist nicht initialisiert. Event kann nicht registriert werden:', event);
    return;
  }
  socket.on(event, callback);
}

/**
 * Sendet ein Event/ eine Nachricht an den Socket.io-Server.
 * @param {string} event - Event-Name
 * @param {*} data - Beliebige zu sendende Daten (muss serialisierbar sein)
 * @param {function} [ack] - Optionale Callback-Funktion für Acknowledgement vom Server
 */
export function emit(event, data, ack) {
  if (!socket) {
    console.error('Socket ist nicht initialisiert. Kann Event nicht senden:', event);
    return;
  }
  if (ack) {
    socket.emit(event, data, ack);
  } else {
    socket.emit(event, data);
  }
}

// Optional: sofort verbinden, falls bei Laden der App schon ein Token da ist
// (Je nach Architektur kann man dies auch im zentralen App-Startup machen)
if (localStorage.getItem(TOKEN_KEY)) {
  connectToServer();
}

// EXPORTS: (falls wir nicht oben schon export vor Funktionen nutzen, könnten wir hier ein default export machen)
// export default { connectToServer, getMyId, disconnect, on, emit };
Erläuterungen zum obigen Code:
Wir verwenden ein modulares Pattern: Der Socket wird in der Modul-Closure als let socket gehalten. Die Funktionen on, emit etc. greifen darauf zu. Alternativ hätten wir eine Klasse oder ein Factory-Muster nehmen können (z.B. createSocketHandler()), aber für einen singulären Socket-Verbindung reicht dieses einfache Muster. Es exportiert die notwendigen Funktionen zur Nutzung in der gesamten App.
connectToServer() prüft zunächst, ob eventuell noch ein alter Socket verbunden ist, und trennt diesen zur Sicherheit (verhindert doppelte Verbindungen im Falle von Fehlbedienung).
Dann wird das Token geholt. Die Verwendung von try/catch beim localStorage-Zugriff ist prophylaktisch. In normalen Umgebungen klappt das immer; es soll nur verhindern, dass ein SecurityError die App stoppt.
Ist kein Token da, loggen wir eine Warnung und verlassen die Funktion. (Man könnte auch einen Error zurückgeben oder ein Promise ablehnen – hier ist es void, also einfach Abbruch).
Beim Initialisieren von io(API_BASE_URL, { ... }) setzen wir einige Optionen. Das Wichtigste ist auth: { token: token }. Darüber hinaus haben wir reconnectionAttempts etc. gesetzt, um nicht endlos zu versuchen. Diese Werte kann man je nach Bedarf justieren oder auch weglassen (Default: endlos mit exponentiellem Backoff). Wir lassen reconnection an, damit kurze Ausfälle überbrückt werden.
Event-Handler:
socket.on('connect', ...) bestätigt die erfolgreiche Verbindung. Hier könnte man z.B. Benutzer-ID vom Server erfragen, falls benötigt, oder einfach nur loggen.
socket.on('connect_error', ...) behandelt Verbindungsfehler. Wir checken die Fehlermeldung (err.message). Da Strings wie "Authentication error" oder "not authorized" etc. möglich sind, benutzen wir .includes('auth') und .includes('jwt') als Heuristik. Das fängt "Authentication error", "auth failed", "JWT expired" usw. ab. Im echten Einsatz lieber genau auf die vom Server definierte Fehlermeldung prüfen, um false positives zu vermeiden. Bei erkanntem Auth-Fehler: Logging, Token löschen, Socket Disconnect, Weiterleitung Logout. Bei anderen Fehlern: nur loggen. Damit belassen wir Socket.io die Chance, neu zu verbinden.
socket.on('disconnect', ...) informiert, wenn die Verbindung getrennt wurde nachdem sie mal bestanden hat. Gründe könnten ein serverseitiges socket.disconnect() oder ein Netzwerkabbruch sein. Hier nur Logging. Im Falle eines Logout haben wir vorher schon alles notwendige erledigt (das Disconnect-Event wird dann mit reason "io client disconnect" auftreten, da wir es initiiert haben).
Die Hilfsfunktionen on(event, callback) und emit(event, data, ack) sind einfache Wrapper, um anderen Teilen der Anwendung die Nutzung des Sockets zu erleichtern, ohne direkt auf das socket-Objekt zugreifen zu müssen. Sie prüfen, ob socket initialisiert ist, und loggen einen Fehler, wenn nicht. So kann man verhindern, dass z.B. versehentlich Events gesendet werden, bevor connectToServer aufgerufen wurde.
disconnect() erlaubt es, manuell die Verbindung zu schließen, z.B. beim Logout oder wenn der Nutzer die Seite verlässt. Dies räumt das socket-Objekt auf.
Am Ende ist ein optionaler Block, der sofort versucht zu verbinden, falls beim Laden der App bereits ein Token im Storage ist. Je nach Architektur könnte man das aber woanders steuern (etwa in einer zentralen Auth-Komponente). Es steht als Kommentar, dass das optional ist. Man könnte es aktivieren, damit ein bestehendes Login sofort eine Socket-Verbindung herstellt, ohne dass der Nutzer etwas tun muss.
Dieser Code ist ein Ausgangspunkt und sollte zu den Gegebenheiten des Projekts (z.B. genaue Fehler-Messages, vorhandene Auth-Utilities) angepasst werden. Er verdeutlicht aber die notwendigen Änderungen gegenüber der alten Session-ID-Version.
5. Hinweise zur Integration und Tests
Abschließend einige wichtige Hinweise, um diese Änderung erfolgreich ins Projekt zu integrieren, sowie Testszenarien, um die Funktionalität zu überprüfen:
Abhängigkeiten / Voraussetzungen aus Ticket 0003 und 0008:
Bevor Ticket 0009 wirksam werden kann, müssen die Tickets 0003 und 0008 umgesetzt sein:
Ticket 0003: Erwartungsgemäß wurde in diesem Schritt die Server-seitige JWT-Authentifizierung implementiert. Das heißt, der Socket.io-Server akzeptiert jetzt ein JWT im Handshake und validiert es (vermutlich mittels einer Middleware, die das Token mit dem hinterlegten Secret decodiert und prüft). Außerdem wurde wahrscheinlich die bisherige Session-ID-Mechanik serverseitig entfernt oder deaktiviert. Wichtig: Der Server muss dem Client im Fehlerfall eine eindeutige Fehlermeldung schicken (z. B. "Authentication error"), damit der Client entsprechend reagieren kann. Zudem sollte der Server definieren, wie er ablaufende Tokens handhabt – wahrscheinlich kappt er einfach die Verbindung oder lässt sie bestehen, bis getrennt wird (da JWT stateless sind, weiß der Server nach dem Handshake nichts vom Ablaufdatum, es sei denn er prüft periodisch). Für unsere Client-Implementierung nehmen wir an: Der Server lehnt den Verbindungsaufbau mit einem Fehler ab, wenn JWT ungültig ist. Dieses Verhalten muss stehen, sonst greift unser connect_error-Handling nicht richtig.
Ticket 0008: Dieser Teil dürfte den Login-Prozess im Frontend umgestellt haben. Insbesondere sollte jetzt nach erfolgreicher Login-Authentifizierung (z. B. via Fetch/XHR zum Backend) ein JWT vom Server geliefert und im Browser gespeichert werden. Vermutlich wurde dort localStorage.setItem(TOKEN_KEY, <JWT>) eingeführt. Außerdem müsste Ticket 0008 auch den Logout-Prozess angepasst haben, sodass beim Logout das JWT entfernt wird (statt einer Session-ID). Eventuell hat Ticket 0008 auch schon einen Teil des Socket-Themas vorbereitet, z.B. im UI eine Anzeige "verbunden" entfernt, bis JWT da ist. Wichtig ist: Wenn Ticket 0008 fertig ist, steht beim Aufruf von connectToServer ein JWT im Storage bereit, sofern der Nutzer eingeloggt ist. Andernfalls ist der Nutzer gar nicht im "Online-Modus" der App. Diese Annahme erlauben wir uns. Sollte Ticket 0008 außerdem einen Refresh-Token-Mechanismus eingeführt haben, müsste man überlegen, wie dieser mit Socket.io zusammenspielt (z. B. bei Verbindungsabbrüchen Token erneuern). Im Rahmen von Ticket 0009 gehen wir aber davon aus, dass es (noch) keinen automatischen Refresh gibt – der Nutzer muss neu einloggen, wenn JWT abläuft.
Außerdem sollte die REST-API (falls vorhanden) bereits auf JWT umgestellt sein (Ticket 0008 könnte auch API-Aufrufe betreffen). Das hat indirekt Einfluss: z.B. ein abgelaufenes JWT würde auch API-Anfragen fehlschlagen lassen, woraufhin der Client evtl. reagiert und ausloggt. Diese Mechanismen sollten konsistent mit unserem Socket-Handling sein.
Tests zur Validierung der neuen Socket-Auth: Um sicherzustellen, dass die Implementierung korrekt funktioniert, sollten folgende Testszenarien durchgespielt werden:
Verbindung mit gültigem Token: Starten Sie die Anwendung als eingeloggter Benutzer (JWT im Storage). Beim Laden sollte connectToServer aufgerufen werden und eine erfolgreiche Socket-Verbindung entstehen. Prüfen: Wird keine Fehlermeldung geworfen? Führt socket.connected zu true? Kommt am Server ein connection Event mit gültigem socket.handshake.auth.token an? (Server-Logs prüfen). Können Client und Server regulär Events austauschen (z.B. Test-Event senden, Antwort empfangen)? Dies stellt sicher, dass die Auth-Daten richtig übermittelt und akzeptiert wurden.
Verbindung ohne Token (nicht eingeloggt): Logout durchführen, sodass kein JWT im Storage ist. Dann connectToServer aufrufen (oder App neu laden ohne Login). Erwartet: Der Code sollte gar nicht erst versuchen zu verbinden. In unserem Vorschlag würde eine Warnung in der Konsole erscheinen, aber kein connect_error, da io() nie ausgeführt wurde. Die Anwendung sollte den Nutzer idealerweise direkt auf der Login-Seite halten. Falls dennoch connectToServer aus Versehen aufgerufen wird, sollte zumindest socket null bleiben und kein Fehler entstehen.
Weiterer Schritt: Falls man ohne Token doch io() aufruft (hypothetisch), würde der Server ablehnen. Dies kann man simulieren, indem man einen Dummy-Token setzt, der garantiert falsch ist, und dann connectToServer aufruft (also Token vorhanden aber ungültig, was zum nächsten Test führt).
Verbindung mit ungültigem/abgelaufenem Token: Man kann einen abgelaufenen oder gefälschten JWT ins localStorage schreiben (z.B. Token manipulieren, letzten Teil verändern, oder einen Token verwenden, der mit falschem Secret signiert ist). Dann connectToServer ausführen. Erwartet: Der Server lehnt ab; beim Client feuert connect_error. Unser Handler sollte greifen: In der Console sollte "Auth problem" Fehler erscheinen, das Token sollte aus dem Storage entfernt werden, und ein Redirect zur Login-Seite erfolgen. Prüfen Sie, ob nach diesem Vorgang localStorage.getItem(TOKEN_KEY) wirklich null ist und keine weiteren Verbindungsversuche stattfinden (Netzwerk-Tab beobachten, ob Socket.io weitere Requests sendet). Die Anwendung sollte den Login-Screen zeigen. Dies testet die Logout-auf-Auth-Error Routine.
Automatische Reconnects bei temporärem Ausfall: Starten Sie mit gültigem Token und etablierter Verbindung. Stoppen Sie dann kurzfristig den Socket.io-Server (oder trennen Sie die Netzwerkverbindung) und beobachten Sie den Client. Erwartet: disconnect Event tritt auf (Grund z.B. "ping timeout" oder "Transport close"). Socket.io versucht im Hintergrund zu reconnecten (es werden evtl. ein paar Fehlversuche geloggt, aber kein Logout, da unsere connect_error nur auf Auth prüft). Starten Sie den Server wieder, bzw. stellen Netzwerk wieder her. Erwartet: Der Client stellt die Verbindung automatisch wieder her (connect Event erneut, neue socket.id). JWT wird bei diesen Reconnects automatisch wieder mitgeschickt von Socket.io (es verwendet intern die gleichen auth-Daten bei jedem Verbindungsversuch). Daher sollte der Server die Verbindung akzeptieren, sofern das Token noch gültig ist. Ergebnis: Die App bleibt verbunden, ohne dass der Nutzer etwas tun musste. Falls das Token während der Off-Zeit ablief, würde der nächste Verbindungsversuch vom Server abgelehnt – dann greift wieder unser Auth-Error-Handling (Logout). Dieses Szenario kann man simulieren, indem man die Gültigkeitsdauer des JWT absichtlich kurz setzt.
Multi-Tab Synchronisation: Testen Sie das Verhalten über mehrere Tabs:
Öffnen Sie zwei Tabs der Anwendung. Loggen Sie sich in Tab A ein. In Tab B sollten nun entweder automatisch die Socket-Verbindung starten (wenn connectToServer z.B. auch dort aufgerufen wird und nun ein Token findet) oder es bleibt zunächst aus. Falls keine automatische Erkennung eingebaut ist, kann man in Tab B manuell die Seite neu laden – dann sollte es das JWT finden und verbinden. Überlegen Sie, ob eine Echtzeit-Synchronisation hier nötig ist. (Optional: Implementieren des storage-Events und dann testen: Loggen Sie in Tab A ein und schauen, ob Tab B ohne Reload reagiert).
Loggen Sie sich in Tab A wieder aus. Damit wird JWT aus Storage gelöscht und socket.disconnect() aufgerufen. In Tab B sollte, falls storage-Event-Handling implementiert ist, ebenfalls die Verbindung geschlossen werden und Tab B zum Login wechseln. Ist das nicht implementiert, würde Tab B noch connected bleiben – prüfen Sie in dem Fall, ob Aktionen in Tab B noch funktionieren. Vermutlich nicht, da das Token ja gelöscht ist. Wenn Tab B jetzt versucht, etwas über den Socket zu senden, könnte der Server es evtl. noch akzeptieren, solange die Verbindung steht (denn der Server hat Tab B beim Verbindungsaufbau authentifiziert und weiß nichts vom gelöschten Token). Allerdings, wenn Tab B die Seite neu lädt oder neu verbindet, wird es kein Token mehr finden und so behandelt, als ausgeloggt. Dieses Szenario zeigt, dass idealerweise ein Logout im einem Tab alle Tabs betrifft. Ggf. sollte man also die storage-Synchronisation wirklich integrieren.
Testen Sie auch, ob ein Login in einem Tab und danach Nutzen der App in einem zweiten Tab problemlos funktioniert. Beide sollten gleichzeitig Echtzeitdaten empfangen können (der Server sollte zwei Sockets mit demselben Benutzer-Account händeln können, je nach Implementierung).
Code-Qualität und Regressionstest: Stellen Sie sicher, dass durch das Entfernen der Session-ID keine anderen Funktionen beeinträchtigt wurden. Suchen Sie im Projekt nach Verwendungen von sessionId oder ähnlichen Strings, um sicher zu gehen, dass nichts übersehen wurde. Führen Sie automatisierte Tests (falls vorhanden) aus. Insbesondere Integrationstests für den Login/Logout und Echtzeitfunktionen sollten angepasst werden: z.B. ein Test, der früher prüfte, ob localStorage.sessionId gesetzt wird, muss nun auf JWT prüfen.
Architektur und Wartbarkeit: Durch die oben vorgeschlagene Änderungen bleibt die Architektur sauber: Das Socket-Handling ist in einem Modul gekapselt. Andere Teile der Anwendung rufen nur die exportierten Funktionen auf (connectToServer, emit, on, etc.), aber kennen die interne Implementierung nicht. So können wir z.B. in Zukunft das Auth-System wechseln (z.B. auf Cookie-basiert) und müssten nur dieses Modul anpassen. Dokumentieren Sie die neuen Methoden und das Verhalten (z.B. in einem README oder Wiki fürs Projekt), insbesondere das Logout-Verhalten via connect_error. Das Team muss wissen, dass ein "Authentication error" vom Socket automatisch einen Logout triggert.
Fehler- und Sonderfälle: Testen Sie auch einmal bewusst falsches Verhalten, z.B. manipulieren Sie localStorage während die App läuft (um zu sehen, ob unser Handler robust ist), oder provozieren Sie ein connect_error aus anderen Gründen (z.B. Server antwortet mit HTTP 400 auf Handshake). Die App sollte dabei nicht abstürzen. Unsere Implementierung sollte solche Fälle zumindest loggen und möglichst recovern.
Wenn all diese Punkte beachtet und getestet wurden, sollte Ticket 0009 erfolgreich implementiert sein. Die Socket.io-Verbindung nutzt dann das neue JWT-basierte Authentifizierungssystem korrekt, die alte Session-ID-Mechanik ist vollständig entfernt, und das System ist gegen die gängigsten Fehlerfälle robust gemacht.