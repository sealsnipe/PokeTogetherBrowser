// modules/renderer.js
// Verantwortlich für das Zeichnen auf dem Canvas

import { getKeysState, getIsRunning, updatePlayerPosition } from './player.js'; // Importiere Spieler-Funktionen

// --- Canvas und Kontext ---
let canvas = null;
let ctx = null;

// --- Spielzustand (wird von außen gesetzt) ---
let players = {}; // Das globale Spielerobjekt
let myId = null;  // Die eigene Socket-ID

// --- Statische Kartenelemente (könnten auch aus einer Datenquelle geladen werden) ---
const dirtPatches = [
    { x: 50, y: 50, radius: 25 }, { x: 150, y: 120, radius: 20 },
    { x: 320, y: 80, radius: 15 }, { x: 420, y: 180, radius: 30 },
    { x: 80, y: 250, radius: 18 }, { x: 200, y: 350, radius: 22 },
    { x: 350, y: 420, radius: 28 }, { x: 450, y: 320, radius: 15 },
    { x: 250, y: 200, radius: 35 }, { x: 120, y: 400, radius: 20 },
    { x: 400, y: 50, radius: 18 }, { x: 280, y: 300, radius: 25 },
    { x: 180, y: 220, radius: 15 }, { x: 380, y: 250, radius: 20 },
    { x: 300, y: 150, radius: 22 }
];

const grassBlades = [];
// Generiere Grashalme (deterministisch)
for (let x = 0; x < 500; x += 25) {
    for (let y = 0; y < 500; y += 25) {
        const tooCloseToPatches = dirtPatches.some(patch => {
            const dx = x - patch.x;
            const dy = y - patch.y;
            return Math.sqrt(dx * dx + dy * dy) < patch.radius * 1.2; // Etwas mehr Abstand
        });
        if (!tooCloseToPatches) {
            const count = 1 + Math.floor((x * y) % 3);
            for (let i = 0; i < count; i++) {
                const offsetX = ((x + y + i * 3) % 10) - 5; // Variation angepasst
                const offsetY = ((x * y + i * 5) % 10) - 5; // Variation angepasst
                grassBlades.push({
                    x: x + offsetX,
                    y: y + offsetY,
                    height: 3 + ((x + y + i) % 5)
                });
            }
        }
    }
}

// --- Animations-Loop ---
let animationFrameId = null;
let lastTimestamp = 0;

/**
 * Initialisiert den Renderer.
 * @param {HTMLCanvasElement} canvasElement - Das Canvas-Element.
 */
export function initRenderer(canvasElement) {
    if (!canvasElement) {
        console.error("Canvas Element nicht gefunden für initRenderer.");
        return false;
    }
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Failed to get 2D context from canvas.");
        return false;
    }
    console.log("Renderer initialized.");
    return true;
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
 * Startet die Game-Loop (requestAnimationFrame).
 */
export function startRendering() {
    if (animationFrameId) {
        console.warn("Rendering loop already running.");
        return;
    }
    console.log("Starting rendering loop.");
    lastTimestamp = performance.now();
    gameLoop(lastTimestamp);
}

/**
 * Stoppt die Game-Loop.
 */
export function stopRendering() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        console.log("Rendering loop stopped.");
    }
}

/**
 * Die Haupt-Spielschleife.
 * @param {number} timestamp - Der aktuelle Zeitstempel von requestAnimationFrame.
 */
function gameLoop(timestamp) {
    // Berechne die Zeit seit dem letzten Frame
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    // Aktualisiere die Position des lokalen Spielers
    updatePlayerPosition(deltaTime);

    // Zeichne das Spiel
    drawGame();

    // Fordere den nächsten Frame an
    animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Zeichnet den gesamten Spielzustand auf das Canvas.
 */
function drawGame() {
    if (!ctx || !canvas) return;

    // Hole die aktuelle Canvas-Größe
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Skalierungsfaktor für Objekte basierend auf der Standardgröße (500x500)
    const scaleX = canvasWidth / 500;
    const scaleY = canvasHeight / 500;

    // 1. Hintergrund zeichnen
    drawBackground(canvasWidth, canvasHeight, scaleX, scaleY);

    // 2. Spieler zeichnen
    drawPlayers(scaleX, scaleY);

    // Optional: Weitere Elemente zeichnen (z.B. NPCs, Items auf der Karte)
}

/**
 * Zeichnet den Hintergrund (Wiese, Erdflecken, Gras).
 * @param {number} canvasWidth - Aktuelle Breite des Canvas.
 * @param {number} canvasHeight - Aktuelle Höhe des Canvas.
 * @param {number} scaleX - Horizontaler Skalierungsfaktor.
 * @param {number} scaleY - Vertikaler Skalierungsfaktor.
 */
function drawBackground(canvasWidth, canvasHeight, scaleX, scaleY) {
    // Wiese
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Erdflecken
    ctx.fillStyle = '#8B4513'; // Braun
    dirtPatches.forEach(patch => {
        ctx.beginPath();
        // Ellipse für natürlichere Form
        ctx.ellipse(
            patch.x * scaleX,
            patch.y * scaleY,
            patch.radius * scaleX,      // Radius X
            patch.radius * 0.7 * scaleY, // Radius Y (etwas flacher)
            0,                          // Feste Rotation (keine Rotation)
            0, Math.PI * 2
        );
        ctx.fill();
    });

    // Grashalme
    ctx.strokeStyle = '#8BC34A'; // Helleres Grün
    ctx.lineWidth = 1 * Math.min(scaleX, scaleY); // Skalierte Linienbreite
    grassBlades.forEach(blade => {
        ctx.beginPath();
        ctx.moveTo(blade.x * scaleX, blade.y * scaleY);
        // Leichte Biegung für natürlicheres Aussehen
        ctx.quadraticCurveTo(
            (blade.x + (Math.random() - 0.5) * 4) * scaleX, // Kontrollpunkt X
            (blade.y - blade.height / 2) * scaleY,          // Kontrollpunkt Y
            blade.x * scaleX,                               // Endpunkt X
            (blade.y - blade.height) * scaleY               // Endpunkt Y
        );
        ctx.stroke();
    });
}

/**
 * Zeichnet alle Spieler auf das Canvas.
 * @param {number} scaleX - Horizontaler Skalierungsfaktor.
 * @param {number} scaleY - Vertikaler Skalierungsfaktor.
 */
function drawPlayers(scaleX, scaleY) {
    const keys = getKeysState(); // Aktuellen Tastenstatus holen
    const isRunning = getIsRunning(); // Aktuellen Rennstatus holen

    Object.entries(players).forEach(([id, player]) => {
        if (!player || typeof player.x !== 'number' || typeof player.y !== 'number') {
             console.warn(`Ungültige Spielerdaten für ID ${id}:`, player);
             return; // Überspringe ungültige Spielerdaten
        }

        const isCurrentPlayer = id === myId;
        const pos = player;

        // Skalierte Position und Größe
        // Spielergröße ist 20x20 in der Basisauflösung 500x500
        const playerSize = 20 * Math.min(scaleX, scaleY);
        const scaledX = pos.x; // Position wird bereits skaliert in player.js berechnet
        const scaledY = pos.y; // Position wird bereits skaliert in player.js berechnet


        // Schatten zeichnen (optional)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(scaledX + playerSize / 2 + 2 * scaleX, scaledY + playerSize + 1 * scaleY, playerSize / 2.2, playerSize / 4, 0, 0, Math.PI * 2);
        ctx.fill();


        // Spieler-Rechteck zeichnen
        ctx.fillStyle = player.color || (isCurrentPlayer ? '#2196F3' : '#F44336'); // Farbe aus Player-Objekt oder Standard
        ctx.fillRect(scaledX, scaledY, playerSize, playerSize);

        // Benutzername zeichnen
        if (pos.username) {
            ctx.font = `${Math.max(10, 12 * Math.min(scaleX, scaleY))}px Arial`; // Mindestgröße 10px
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'black'; // Schwarze Umrandung für Lesbarkeit
            ctx.lineWidth = 2;
            ctx.strokeText(pos.username, scaledX + playerSize / 2, scaledY - 5 * scaleY);
            ctx.fillText(pos.username, scaledX + playerSize / 2, scaledY - 5 * scaleY);
        }

        // Renn-Effekt für den eigenen Spieler zeichnen
        if (isCurrentPlayer && isRunning && (keys.up || keys.down || keys.left || keys.right)) {
            drawRunningEffect(scaledX, scaledY, playerSize, keys, scaleX, scaleY);
        }
    });
}

/**
 * Zeichnet den "Renn"-Effekt (Bewegungslinien).
 * @param {number} x - Skalierte X-Position des Spielers.
 * @param {number} y - Skalierte Y-Position des Spielers.
 * @param {number} size - Skalierte Größe des Spielers.
 * @param {object} keys - Aktueller Tastenstatus.
 * @param {number} scaleX - Horizontaler Skalierungsfaktor.
 * @param {number} scaleY - Vertikaler Skalierungsfaktor.
 */
function drawRunningEffect(x, y, size, keys, scaleX, scaleY) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = Math.max(1, 2 * Math.min(scaleX, scaleY)); // Mindestbreite 1px

    // Bestimme die Richtung *entgegengesetzt* zur Bewegung
    let dirX = 0;
    let dirY = 0;
    if (keys.up) dirY = 1;
    if (keys.down) dirY = -1;
    if (keys.left) dirX = 1;
    if (keys.right) dirX = -1;

    // Normalisiere Richtung
     if (dirX !== 0 && dirY !== 0) {
        const length = Math.sqrt(dirX * dirX + dirY * dirY);
        dirX = (dirX / length);
        dirY = (dirY / length);
    }

    // Zeichne 2-3 Linien hinter dem Spieler
    for (let i = 0; i < 3; i++) {
        // Startpunkt leicht zufällig um die Mitte der *gegenüberliegenden* Seite
        const startOffsetX = (dirX === 0) ? (Math.random() * size * 0.6 - size * 0.3) : (dirX * size / 2);
        const startOffsetY = (dirY === 0) ? (Math.random() * size * 0.6 - size * 0.3) : (dirY * size / 2);

        const startX = x + size / 2 + startOffsetX;
        const startY = y + size / 2 + startOffsetY;

        // Länge der Linie
        const length = (5 + Math.random() * 8) * Math.min(scaleX, scaleY);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(
            startX + dirX * length,
            startY + dirY * length
        );
        ctx.stroke();
    }
}