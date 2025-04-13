// js/game.js - Haupt-Skript und Initialisierung

import { connectToServer, registerCallbacks as registerSocketCallbacks, emitChatMessage, emitMove, getMyId, isConnected } from './modules/socketHandler.js';
import { initUIManager, registerCallbacks as registerUICallbacks, updateUsername, updatePlayersList, showPokemonInfoPanel } from './modules/uiManager.js'; // displayChatMessage und displaySystemMessage entfernt
import { initPlayerControls, setPlayers as setPlayerModulePlayers, setMyId as setPlayerModuleMyId, updatePlayerPosition, cleanupPlayerControls } from './modules/player.js';
import { initRenderer, setPlayers as setRendererPlayers, setMyId as setRendererMyId, startRendering, stopRendering } from './modules/renderer.js';
import { initChat, displayMessage as displayChatMessage, displaySystemMessage as displayChatSystemMessage } from './modules/chat.js'; // displayMessage & displaySystemMessage importiert (mit Alias)
import { initInventory, setInventory } from './modules/inventory.js';
import { initPokemon, setTeam, setStorage } from './modules/pokemon.js';

// --- Globale Zustandsvariablen ---
let players = {}; // Wird vom Server initialisiert und aktualisiert

// --- Initialisierung beim Laden des DOM ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded. Initializing game...');

    // 1. Session-Daten holen
    const sessionId = localStorage.getItem('sessionId');
    const username = localStorage.getItem('username');

    // Wenn keine Session-Daten vorhanden sind, leitet der socketHandler bereits um.
    // Wir können hier aber den Benutzernamen schon mal anzeigen.
    initUIManager(); // UI Manager zuerst initialisieren für DOM-Referenzen
    updateUsername(username);

    // 2. Module initialisieren
    const canvasElement = document.getElementById('gameCanvas');
    if (!canvasElement) {
        console.error("FATAL: Canvas element not found!");
        alert("Spiel konnte nicht initialisiert werden: Canvas fehlt.");
        return;
    }

    const rendererInitialized = initRenderer(canvasElement);
    if (!rendererInitialized) {
        alert("Spiel konnte nicht initialisiert werden: Renderer-Fehler.");
        return;
    }

    initPlayerControls(canvasElement);
    initChat();
    initInventory(); // Lädt Beispiel-Inventar
    initPokemon();   // Lädt Beispiel-Team/Lager

    // 3. Callbacks registrieren, um Module zu verbinden
    registerSocketCallbacks({
        onInit: handleInit,
        onPlayerJoined: handlePlayerJoined,
        onPlayerMoved: handlePlayerMoved,
        onPlayerLeft: handlePlayerLeft,
        onChatMessage: handleChatMessage, // Wird jetzt von chat.js gehandhabt
        onDisconnect: handleDisconnect
    });

    registerUICallbacks({
        onSaveSettings: handleSaveSettings,
        onLogout: handleLogout
    });

    // 4. Verbindung zum Server herstellen
    // TODO: Server-URL aus Konfiguration oder Umgebungsvariable holen
    connectToServer('http://localhost:3001', sessionId, username);

    // 5. Spiel-Loop starten (nach erfolgreicher Verbindung in handleInit)
    // startRendering(); // Wird jetzt in handleInit gestartet

    console.log("Game initialization sequence complete.");
});

// --- Callback Handler ---

/**
 * Wird aufgerufen, wenn die initialen Daten vom Server kommen.
 * @param {object} serverPlayers - Das Objekt mit allen Spielerdaten.
 * @param {string} ownId - Die eigene Socket-ID.
 */
function handleInit(serverPlayers, ownId) {
    console.log("Received initial data from server:", serverPlayers);
    players = serverPlayers;

    // Informiere andere Module über den initialen Zustand
    setPlayerModulePlayers(players);
    setPlayerModuleMyId(ownId);
    setRendererPlayers(players);
    setRendererMyId(ownId);

    // Aktualisiere die Spielerliste in der UI
    updatePlayersList(players, ownId);

    // TODO: Lade hier die tatsächlichen Inventar- und Pokémon-Daten vom Server
    // Beispiel:
    // fetch('/api/player-data', { headers: { 'Authorization': `Bearer ${localStorage.getItem('sessionId')}` } })
    //   .then(res => res.json())
    //   .then(data => {
    //      setInventory(data.inventory);
    //      setTeam(data.pokemonTeam);
    //      setStorage(data.pokemonStorage);
    //   })
    //   .catch(err => console.error("Fehler beim Laden der Spielerdaten:", err));

    // Starte die Rendering-Schleife erst, wenn die Initialisierung abgeschlossen ist
    startRendering();
    displayChatSystemMessage("Willkommen auf der Multiplayer-Wiese!"); // Alias verwenden
}

/**
 * Wird aufgerufen, wenn ein Spieler beitritt.
 * @param {string} id - Die ID des neuen Spielers.
 * @param {object} data - Die Daten des neuen Spielers { x, y, username, color }.
 */
function handlePlayerJoined(id, data) {
    console.log(`Player joined: ${data.username} (${id})`);
    players[id] = data;
    updatePlayersList(players, getMyId()); // UI aktualisieren
    displayChatSystemMessage(`${data.username} ist beigetreten.`); // Alias verwenden
}

/**
 * Wird aufgerufen, wenn sich ein Spieler bewegt.
 * @param {string} id - Die ID des Spielers.
 * @param {object} data - Die neuen Positionsdaten { x, y, username, color }.
 */
function handlePlayerMoved(id, data) {
    // Aktualisiere nur, wenn der Spieler existiert
    if (players[id]) {
        // Behalte bestehende Daten (wie username, color), falls sie nicht im 'pos'-Objekt sind
        players[id] = { ...players[id], ...data };
    } else {
        // Spieler existiert nicht lokal? Füge ihn hinzu.
        console.warn(`Received move for unknown player ${id}. Adding player.`);
        players[id] = data;
        updatePlayersList(players, getMyId()); // UI aktualisieren
    }
    // Renderer greift direkt auf das 'players'-Objekt zu, keine explizite Aktualisierung nötig
}

/**
 * Wird aufgerufen, wenn ein Spieler geht.
 * @param {string} id - Die ID des Spielers.
 */
function handlePlayerLeft(id) {
    const username = players[id]?.username || id;
    console.log(`Player left: ${username} (${id})`);
    delete players[id];
    updatePlayersList(players, getMyId()); // UI aktualisieren
    displayChatSystemMessage(`${username} hat das Spiel verlassen.`); // Alias verwenden
}

/**
 * Wird aufgerufen, wenn eine Chat-Nachricht empfangen wird.
 * @param {object} message - Das Nachrichtenobjekt.
 */
function handleChatMessage(message) {
    // Rufe die importierte Funktion aus chat.js auf
    displayChatMessage(message);
}

/**
 * Wird aufgerufen, wenn die Verbindung zum Server getrennt wird.
 * @param {string} reason - Der Grund für die Trennung.
 */
function handleDisconnect(reason) {
    stopRendering(); // Stoppe die Spiel-Loop
    cleanupPlayerControls(); // Entferne Event Listener
    // UI Manager zeigt bereits eine Meldung an oder leitet um
    console.error(`Disconnected from server: ${reason}. Game stopped.`);
    // Hier könnte man versuchen, automatisch neu zu verbinden
}

/**
 * Wird aufgerufen, wenn der Benutzer die Einstellungen speichert.
 * @param {string} resolution - Die ausgewählte Auflösung.
 */
function handleSaveSettings(resolution) {
    console.log("Saving settings - Resolution:", resolution);
    // Die Auflösung wird bereits im uiManager angewendet.
    // Speichere die Einstellung im Local Storage
    localStorage.setItem('gameResolution', resolution);
    // Optional: Bestätigungsnachricht anzeigen
}

/**
 * Wird aufgerufen, wenn der Benutzer auf "Abmelden" klickt.
 */
function handleLogout() {
    console.log("Logout requested by user.");
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        console.warn("Keine Session-ID für Logout gefunden.");
        forceLogout(); // Trotzdem versuchen aufzuräumen
        return;
    }

    // Sende Logout-Anfrage an den Server (optional, aber gut für serverseitiges Aufräumen)
    fetch('/api/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log("Server logout successful.");
        } else {
            console.warn("Server logout failed:", data.message);
        }
    })
    .catch(error => {
        console.error('Error during server logout request:', error);
    })
    .finally(() => {
        // Immer lokales Aufräumen und Umleitung durchführen
        forceLogout();
    });
}

/**
 * Führt das lokale Aufräumen und die Umleitung zum Login durch.
 */
function forceLogout() {
    stopRendering();
    cleanupPlayerControls();
    localStorage.removeItem('sessionId');
    localStorage.removeItem('username');
    console.log("Local session cleared. Redirecting to login.");
    window.location.href = '/login.html';
}

// --- Globale Aufräumfunktion (optional) ---
window.addEventListener('beforeunload', () => {
    // Wird aufgerufen, wenn der Benutzer die Seite verlässt/schließt
    stopRendering();
    cleanupPlayerControls();
    // Socket wird automatisch getrennt
    console.log("Window closing, cleaning up.");
});