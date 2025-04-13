// modules/socketHandler.js
// Verwaltet die Socket.IO-Verbindung und die Server-Kommunikation

// Globale Socket.IO-Instanz (wird in connectToServer initialisiert)
let socket = null;
let myId = null; // Eigene Socket-ID nach erfolgreicher Verbindung

// Referenzen auf Funktionen anderer Module (werden später gesetzt)
let onInitCallback = (serverPlayers, ownId) => console.log('Initial state received:', serverPlayers, ownId);
let onPlayerJoinedCallback = (id, data) => console.log('Player joined:', id, data);
let onPlayerMovedCallback = (id, data) => console.log('Player moved:', id, data);
let onPlayerLeftCallback = (id) => console.log('Player left:', id);
let onChatMessageCallback = (message) => console.log('Chat message received:', message);
let onDisconnectCallback = (reason) => console.warn('Disconnected:', reason);

/**
 * Stellt die Verbindung zum Socket.IO-Server her.
 * @param {string} serverUrl - Die URL des Socket.IO-Servers.
 * @param {string} sessionId - Die Session-ID zur Authentifizierung.
 * @param {string} username - Der Benutzername (wird aktuell nicht für Auth verwendet, aber gut zu haben).
 */
export function connectToServer(serverUrl, sessionId, username) {
    if (socket) {
        console.warn("Socket already connected.");
        return;
    }

    // Überprüfe, ob eine Session existiert
    if (!sessionId || !username) {
        console.error('Keine gültige Session gefunden. Umleitung zum Login.');
        window.location.href = '/login.html'; // Zurück zur Login-Seite
        return;
    }

    console.log(`Versuche Verbindung zu ${serverUrl} mit SessionID: ${sessionId}`);

    // io() ist global verfügbar durch das Skript im HTML
    socket = io(serverUrl, {
        auth: {
            sessionId: sessionId
        }
    });

    // --- Event Listeners ---

    socket.on('connect', () => {
        myId = socket.id;
        console.log('Erfolgreich verbunden mit Server. Eigene ID:', myId);
        // Optional: Hier könnte man dem Server mitteilen, dass man bereit ist
    });

    socket.on('connect_error', (error) => {
        console.error('Verbindungsfehler:', error.message);
        if (error.message === 'Nicht authentifiziert' || error.message === 'Invalid session') {
            // Session ist ungültig oder abgelaufen
            console.error('Authentifizierung fehlgeschlagen. Session ungültig.');
            localStorage.removeItem('sessionId');
            localStorage.removeItem('username');
            window.location.href = '/login.html';
        }
        // Hier könnten weitere Fehlerbehandlungen implementiert werden (z.B. Server nicht erreichbar)
    });

    socket.on('disconnect', (reason) => {
        console.warn(`Verbindung zum Server getrennt: ${reason}`);
        myId = null;
        socket = null; // Setze Socket zurück
        onDisconnectCallback(reason); // Informiere andere Module
        // Optional: Automatischen Reconnect-Versuch implementieren oder Nutzer informieren
        alert("Verbindung zum Server verloren. Bitte lade die Seite neu.");
        // window.location.href = '/login.html'; // Oder zum Login umleiten
    });

    // Spiel-spezifische Events
    socket.on('init', (serverPlayers) => {
        if (!myId) myId = socket.id; // Stelle sicher, dass myId gesetzt ist
        onInitCallback(serverPlayers, myId);
    });

    socket.on('player-joined', ({ id, pos, username }) => {
        onPlayerJoinedCallback(id, { ...pos, username });
    });

    socket.on('player-moved', ({ id, pos, username }) => {
        // Verhindere, dass eigene Bewegungsupdates zurückkommen und die lokale Position überschreiben
        // (Der Server sollte idealerweise keine eigenen Moves zurücksenden, aber sicher ist sicher)
        if (id !== myId) {
            onPlayerMovedCallback(id, { ...pos, username });
        }
    });

    socket.on('player-left', (id) => {
        onPlayerLeftCallback(id);
    });

    socket.on('chat-message', (message) => {
        // Füge die eigene ID zur Nachricht hinzu, falls sie vom Server kommt
        // (Annahme: Server sendet Nachrichten an alle, inkl. Absender)
        message.isOwnMessage = message.senderId === myId;
        onChatMessageCallback(message);
    });
}

/**
 * Registriert Callback-Funktionen, die bei bestimmten Server-Events aufgerufen werden.
 * @param {object} callbacks - Ein Objekt mit den Callback-Funktionen.
 */
export function registerCallbacks(callbacks) {
    if (callbacks.onInit) onInitCallback = callbacks.onInit;
    if (callbacks.onPlayerJoined) onPlayerJoinedCallback = callbacks.onPlayerJoined;
    if (callbacks.onPlayerMoved) onPlayerMovedCallback = callbacks.onPlayerMoved;
    if (callbacks.onPlayerLeft) onPlayerLeftCallback = callbacks.onPlayerLeft;
    if (callbacks.onChatMessage) onChatMessageCallback = callbacks.onChatMessage;
    if (callbacks.onDisconnect) onDisconnectCallback = callbacks.onDisconnect;
}

/**
 * Sendet die Spielerposition an den Server.
 * @param {object} pos - Das Positionsobjekt { x, y }.
 */
export function emitMove(pos) {
    if (socket && socket.connected) {
        socket.emit('move', pos);
    } else {
        console.warn("Socket nicht verbunden. 'move' konnte nicht gesendet werden.");
    }
}

/**
 * Sendet eine Chat-Nachricht an den Server.
 * @param {string} messageText - Der Text der Nachricht.
 */
export function emitChatMessage(messageText) {
    if (socket && socket.connected) {
        socket.emit('chat-message', messageText);
    } else {
        console.warn("Socket nicht verbunden. Chat-Nachricht konnte nicht gesendet werden.");
    }
}

/**
 * Gibt die aktuelle Socket-ID zurück.
 * @returns {string|null} Die Socket-ID oder null, wenn nicht verbunden.
 */
export function getMyId() {
    return myId;
}

/**
 * Gibt zurück, ob der Socket aktuell verbunden ist.
 * @returns {boolean}
 */
export function isConnected() {
    return socket?.connected ?? false;
}