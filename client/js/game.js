// js/game.js - Haupt-Skript und Initialisierung

import { connectToServer, registerCallbacks as registerSocketCallbacks, emitChatMessage, emitMove, getMyId, isConnected } from './modules/socketHandler.js';
import { initUIManager, registerCallbacks as registerUICallbacks, updateUsername, updatePlayersList, showPokemonInfoPanel } from './modules/uiManager.js'; // displayChatMessage und displaySystemMessage entfernt
import { initPlayerControls, setPlayers as setPlayerModulePlayers, setMyId as setPlayerModuleMyId, updatePlayerPosition, cleanupPlayerControls } from './modules/player.js';
import { initRenderer, setPlayers as setRendererPlayers, setMyId as setRendererMyId, startRendering, stopRendering } from './modules/renderer.js';
import { initChat, displayMessage as displayChatMessage, displaySystemMessage as displayChatSystemMessage } from './modules/chat.js'; // displayMessage & displaySystemMessage importiert (mit Alias)
import { initInventory, setInventory } from './modules/inventory.js';
import { initPokemon, setTeam, setStorage } from './modules/pokemon.js';
import { checkAuth, logout as performLogout } from './authService.js'; // Importiere checkAuth und logout

// --- Globale Zustandsvariablen ---
let players = {}; // Wird vom Server initialisiert und aktualisiert

// --- Initialisierung beim Laden des DOM ---
document.addEventListener('DOMContentLoaded', async () => { // Mache die Funktion async
    console.log('DOM fully loaded. Initializing game...');

    // 1. Authentifizierung prüfen
    let currentUser = null;
    try {
        console.log("[GAME DEBUG] Calling checkAuth()..."); // DEBUG LOG
        currentUser = await checkAuth(); // Verwende checkAuth aus authService
        console.log("[GAME DEBUG] checkAuth() returned:", currentUser); // DEBUG LOG
        if (!currentUser) {
            console.log("[GAME DEBUG] User not authenticated or checkAuth failed. Redirecting to login."); // DEBUG LOG
            window.location.href = '/login.html';
            return; // Verhindere weitere Initialisierung
        }
        console.log("[GAME DEBUG] Authenticated as:", currentUser.username); // DEBUG LOG
    } catch (error) {
        console.error("Fehler bei der Authentifizierungsprüfung:", error);
        window.location.href = '/login.html'; // Bei Fehler zum Login umleiten
        return;
    }

    // UI initialisieren und Benutzernamen anzeigen
    initUIManager(); // UI Manager zuerst initialisieren für DOM-Referenzen
    updateUsername(currentUser.username); // Verwende den Namen aus checkAuth

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
    connectToServer('http://localhost:3001'); // Keine sessionId/username mehr nötig, Cookie wird automatisch gesendet

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
    // fetch('/api/player-data') // Keine Auth-Header mehr nötig, Cookie wird automatisch gesendet
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
async function handleLogout() { // Mache die Funktion async
    console.log("Logout requested by user.");
    stopRendering(); // Rendering stoppen
    cleanupPlayerControls(); // Event Listener entfernen
    try {
        await performLogout(); // Rufe die zentrale Logout-Funktion auf
        // Die Weiterleitung geschieht innerhalb von performLogout
    } catch (error) {
        // Fehler wurde bereits in performLogout geloggt, Weiterleitung erfolgt trotzdem
    }
}

// forceLogout Funktion wird nicht mehr benötigt, da die Logik in authService.logout liegt

// --- Globale Aufräumfunktion (optional) ---
window.addEventListener('beforeunload', () => {
    // Wird aufgerufen, wenn der Benutzer die Seite verlässt/schließt
    stopRendering();
    cleanupPlayerControls();
    // Socket wird automatisch getrennt
    console.log("Window closing, cleaning up.");
});