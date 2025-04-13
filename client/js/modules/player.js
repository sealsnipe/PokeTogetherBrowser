// modules/player.js
// Verwaltet den lokalen Spielerstatus, die Steuerung und Bewegung

import { BASE_SPEED, RUNNING_SPEED, NETWORK_UPDATE_INTERVAL } from '../config.js';
import { emitMove } from './socketHandler.js';
import { updateRunStatus } from './uiManager.js';

// --- Lokaler Spielerstatus ---
let isRunning = false;
const keys = {
    up: false,
    down: false,
    left: false,
    right: false
};
let lastUpdateTime = 0;
let lastNetworkUpdate = 0;

// --- Spielzustand (wird von außen gesetzt) ---
let players = {}; // Das globale Spielerobjekt
let myId = null;  // Die eigene Socket-ID
let gameCanvas = null; // Referenz auf das Canvas-Element

/**
 * Initialisiert die Spielersteuerung durch Hinzufügen von Event-Listenern.
 * @param {HTMLCanvasElement} canvasElement - Das Spiel-Canvas-Element.
 */
export function initPlayerControls(canvasElement) {
    if (!canvasElement) {
        console.error("Canvas Element nicht gefunden für initPlayerControls.");
        return;
    }
    gameCanvas = canvasElement;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur); // Reset keys on window blur

    console.log("Player controls initialized.");
    updateRunStatusUI(); // Initialen Status anzeigen
}

/**
 * Setzt das Spielerobjekt, das vom Server kommt.
 * @param {object} serverPlayers - Das Objekt mit allen Spielern.
 */
export function setPlayers(serverPlayers) {
    players = serverPlayers;
}

/**
 * Setzt die eigene Socket-ID.
 * @param {string} ownId - Die Socket-ID des lokalen Spielers.
 */
export function setMyId(ownId) {
    myId = ownId;
}

/**
 * Gibt das Datenobjekt des lokalen Spielers zurück.
 * @returns {object | null} Das Spielerobjekt oder null, wenn nicht vorhanden.
 */
export function getMyPlayer() {
    return myId ? players[myId] : null;
}

/**
 * Verarbeitet Tastendrücke.
 * @param {KeyboardEvent} e - Das KeyboardEvent-Objekt.
 */
function handleKeyDown(e) {
    // Verhindere Standard-Scrollverhalten bei Pfeiltasten und Leertaste
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }

    // Setze Tastenstatus
    let keyChanged = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { if (!keys.up) { keys.up = true; keyChanged = true; } }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { if (!keys.down) { keys.down = true; keyChanged = true; } }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { if (!keys.left) { keys.left = true; keyChanged = true; } }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { if (!keys.right) { keys.right = true; keyChanged = true; } }

    // Shift-Taste zum Umschalten des Renn-Modus (nur einmal pro Tastendruck)
    if (e.key === 'Shift' && !e.repeat) {
        isRunning = !isRunning;
        console.log('Renn-Modus:', isRunning ? 'Ein' : 'Aus');
        updateRunStatusUI();
        keyChanged = true; // Auch hier Änderung signalisieren
    }

    // Sende sofort ein Update, wenn sich der Bewegungsstatus ändert (optional)
    // if (keyChanged) {
    //     updatePlayerPosition(performance.now() - lastUpdateTime); // Sende mit aktueller DeltaTime
    // }
}

/**
 * Verarbeitet das Loslassen von Tasten.
 * @param {KeyboardEvent} e - Das KeyboardEvent-Objekt.
 */
function handleKeyUp(e) {
    // Setze Tastenstatus zurück
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
}

/**
 * Setzt alle Tastenstatus zurück, wenn das Fenster den Fokus verliert.
 */
function handleBlur() {
    keys.up = false;
    keys.down = false;
    keys.left = false;
    keys.right = false;
    console.log("Window lost focus, resetting keys.");
}

/**
 * Aktualisiert die Spielerposition basierend auf Tastenstatus und Zeit.
 * Wird typischerweise im gameLoop aufgerufen.
 * @param {number} deltaTime - Die Zeit seit dem letzten Frame in Millisekunden.
 */
export function updatePlayerPosition(deltaTime) {
    if (!myId || !players[myId] || !gameCanvas) return; // Stelle sicher, dass alles initialisiert ist

    const player = players[myId];
    const pos = { x: player.x, y: player.y }; // Kopiere aktuelle Position

    // Prüfe, ob überhaupt eine Taste gedrückt ist
    const isMoving = keys.up || keys.down || keys.left || keys.right;
    if (!isMoving) {
        lastUpdateTime = performance.now(); // Aktualisiere Zeit trotzdem für nächsten Frame
        return; // Keine Bewegung, keine Aktualisierung nötig
    }

    // Hole die aktuelle Canvas-Größe
    const canvasWidth = gameCanvas.width;
    const canvasHeight = gameCanvas.height;

    // Skalierungsfaktor für Bewegung basierend auf der Standardgröße (500x500)
    // Dies ist wichtig, wenn die Auflösung geändert wird, damit die gefühlte Geschwindigkeit gleich bleibt.
    const scaleX = canvasWidth / 500;
    const scaleY = canvasHeight / 500;

    // Berechne die Geschwindigkeit basierend auf dem Renn-Status
    const currentSpeed = isRunning ? RUNNING_SPEED : BASE_SPEED;

    // Berechne die Bewegung basierend auf der verstrichenen Zeit (für gleichmäßige Bewegung)
    // Normalisiere auf ~60 FPS (16.67 ms pro Frame)
    const moveStep = currentSpeed * (deltaTime / (1000 / 60));

    // Berechne Bewegungsvektor
    let dx = 0;
    let dy = 0;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;

    // Normalisiere diagonalen Vektor, um konstante Geschwindigkeit zu gewährleisten
    if (dx !== 0 && dy !== 0) {
        const length = Math.sqrt(dx * dx + dy * dy);
        dx = (dx / length);
        dy = (dy / length);
    }

    // Aktualisiere die Position
    pos.x += dx * moveStep;
    pos.y += dy * moveStep;

    // Begrenze die Position auf den Spielbereich (Spielergröße berücksichtigen)
    // Annahme: Spielergröße ist 20x20 in der Basisauflösung 500x500
    const playerSize = 20 * Math.min(scaleX, scaleY);
    pos.x = Math.max(0, Math.min(pos.x, canvasWidth - playerSize));
    pos.y = Math.max(0, Math.min(pos.y, canvasHeight - playerSize));

    // Aktualisiere die lokale Spielerposition sofort für flüssige Darstellung
    players[myId] = { ...player, ...pos }; // Behalte andere Spielerdaten wie username bei

    // Sende die Position an den Server (mit Ratenbegrenzung)
    const now = performance.now();
    if (now - lastNetworkUpdate >= NETWORK_UPDATE_INTERVAL) {
        lastNetworkUpdate = now;
        // Sende nur x und y
        emitMove({ x: pos.x, y: pos.y });
    }

    lastUpdateTime = now;
}

/**
 * Gibt den aktuellen Rennstatus zurück.
 * @returns {boolean}
 */
export function getIsRunning() {
    return isRunning;
}

/**
 * Gibt den aktuellen Tastenstatus zurück.
 * @returns {object}
 */
export function getKeysState() {
    return { ...keys }; // Kopie zurückgeben
}

/**
 * Aktualisiert die Rennstatus-Anzeige in der UI.
 */
function updateRunStatusUI() {
    updateRunStatus(isRunning);
}

/**
 * Entfernt die Event-Listener, wenn das Modul nicht mehr benötigt wird.
 */
export function cleanupPlayerControls() {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('blur', handleBlur);
    console.log("Player controls cleaned up.");
}