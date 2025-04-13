// modules/uiManager.js
// Verwaltet DOM-Manipulationen und UI-Updates

import { typeIcons, typeWeaknesses } from '../data/typeInfo.js';
import { getPokemonIconColor } from '../utils.js';

// --- DOM Element References ---
let currentUserElement;
let runStatusElement;
let playersContainerElement;
let optionsModalElement;
let closeModalBtnElement;
let saveOptionsBtnElement;
let resolutionSelectElement;
let logoutBtnElement; // Der Button im Header
let pokemonInfoPanelElement;
let infoCloseBtnElement;
let infoIconElement;
let infoNameElement;
let infoTypeElement;
let infoLevelElement;
let infoHpElement;
let weaknessListX2Element;
let weaknessListX4Element;
let gameCanvasElement; // Referenz für Höhenanpassung
let pokemonTeamElement; // Referenz für Höhenanpassung

// --- Callbacks ---
let onSaveSettingsCallback = (resolution) => console.log('Settings saved:', resolution);
let onLogoutCallback = () => console.log('Logout requested');

/**
 * Initialisiert den UI-Manager, holt Referenzen auf DOM-Elemente und setzt Listener.
 */
export function initUIManager() {
    currentUserElement = document.getElementById('currentUser');
    runStatusElement = document.getElementById('runStatus');
    playersContainerElement = document.getElementById('playersContainer');
    optionsModalElement = document.getElementById('optionsModal');
    closeModalBtnElement = document.getElementById('closeModalBtn');
    saveOptionsBtnElement = document.getElementById('saveOptionsBtn');
    resolutionSelectElement = document.getElementById('resolutionSelect');
    logoutBtnElement = document.getElementById('logoutBtn'); // Button im Header
    pokemonInfoPanelElement = document.getElementById('pokemon-info-panel');
    infoCloseBtnElement = pokemonInfoPanelElement?.querySelector('.info-close'); // Innerhalb des Panels suchen
    infoIconElement = pokemonInfoPanelElement?.querySelector('.info-icon');
    infoNameElement = pokemonInfoPanelElement?.querySelector('.info-name');
    infoTypeElement = pokemonInfoPanelElement?.querySelector('.info-type');
    infoLevelElement = document.getElementById('info-level');
    infoHpElement = document.getElementById('info-hp');
    weaknessListX2Element = document.getElementById('weakness-list-x2');
    weaknessListX4Element = document.getElementById('weakness-list-x4');
    gameCanvasElement = document.getElementById('gameCanvas');
    pokemonTeamElement = document.getElementById('pokemon-team');

    // --- Event Listeners ---
    const settingsBtn = document.getElementById('settingsBtn');
    settingsBtn?.addEventListener('click', showOptionsModal);
    closeModalBtnElement?.addEventListener('click', hideOptionsModal);
    saveOptionsBtnElement?.addEventListener('click', () => {
        const selectedResolution = resolutionSelectElement.value;
        applyResolution(selectedResolution); // Wende Auflösung direkt an
        onSaveSettingsCallback(selectedResolution); // Informiere Hauptlogik zum Speichern
        hideOptionsModal();
    });
    // Schließe Modal bei Klick außerhalb
    window.addEventListener('click', (event) => {
        if (event.target === optionsModalElement) {
            hideOptionsModal();
        }
    });

    logoutBtnElement?.addEventListener('click', () => {
        onLogoutCallback(); // Rufe registrierten Logout-Callback auf
    });

    infoCloseBtnElement?.addEventListener('click', hidePokemonInfoPanel);

    console.log("UI Manager initialized.");
    loadSettings(); // Lade gespeicherte Einstellungen beim Start
}

/**
 * Registriert Callback-Funktionen für UI-Events.
 * @param {object} callbacks - Objekt mit Callbacks ({ onSaveSettings, onLogout }).
 */
export function registerCallbacks(callbacks) {
    if (callbacks.onSaveSettings) onSaveSettingsCallback = callbacks.onSaveSettings;
    if (callbacks.onLogout) onLogoutCallback = callbacks.onLogout;
}


/**
 * Aktualisiert den angezeigten Benutzernamen.
 * @param {string} username - Der anzuzeigende Benutzername.
 */
export function updateUsername(username) {
    if (currentUserElement) {
        currentUserElement.textContent = username || 'Nicht angemeldet';
    }
}

/**
 * Aktualisiert die Statusanzeige für das Rennen.
 * @param {boolean} isRunning - Ob der Spieler gerade rennt.
 */
export function updateRunStatus(isRunning) {
    if (runStatusElement) {
        runStatusElement.textContent = `Laufen: ${isRunning ? 'EIN' : 'AUS'} (Shift drücken zum Umschalten)`;
        runStatusElement.style.color = isRunning ? '#4CAF50' : '#aaa';
    }
}

/**
 * Aktualisiert die Spielerliste in der UI.
 * @param {object} players - Das Spielerobjekt { id: { username, ... } }.
 * @param {string} myId - Die eigene Socket-ID zur Hervorhebung.
 */
export function updatePlayersList(players, myId) {
    if (!playersContainerElement) return;
    playersContainerElement.innerHTML = ''; // Leere den Container

    Object.entries(players).forEach(([id, player]) => {
        const isCurrentPlayer = id === myId;
        const playerDiv = document.createElement('div');
        playerDiv.className = `player-item ${isCurrentPlayer ? 'current-player' : ''}`;

        const colorDiv = document.createElement('div');
        colorDiv.className = 'player-color';
        // Verwende die Farbe aus dem Spielerobjekt, falls vorhanden, sonst Standard
        colorDiv.style.backgroundColor = player.color || (isCurrentPlayer ? '#2196F3' : '#F44336');

        const nameSpan = document.createElement('span');
        let displayName = player.username || 'Unbekannt';
        // Kürze Namen, wenn nötig (optional, kann auch per CSS erfolgen)
        // displayName = displayName.length > 6 ? displayName.substring(0, 4) + '…' : displayName;
        nameSpan.textContent = displayName;
        nameSpan.title = player.username || 'Unbekannt'; // Voller Name im Tooltip

        if (isCurrentPlayer) {
            nameSpan.title += ' (Du)';
            nameSpan.style.fontWeight = 'bold';
        }

        playerDiv.appendChild(colorDiv);
        playerDiv.appendChild(nameSpan);
        playersContainerElement.appendChild(playerDiv);
    });
}

// --- Modal Handling ---

export function showOptionsModal() {
    if (optionsModalElement) {
        optionsModalElement.style.display = 'flex';
    }
}

export function hideOptionsModal() {
    if (optionsModalElement) {
        optionsModalElement.style.display = 'none';
    }
}

/**
 * Lädt gespeicherte Einstellungen (z.B. Auflösung) und wendet sie an.
 */
function loadSettings() {
    const savedResolution = localStorage.getItem('gameResolution');
    if (savedResolution && resolutionSelectElement) {
        resolutionSelectElement.value = savedResolution;
        applyResolution(savedResolution);
    } else {
        // Wende Standardauflösung an, falls nichts gespeichert ist
        applyResolution(resolutionSelectElement?.value || '500x500');
    }
}

/**
 * Wendet die ausgewählte Auflösung auf das Canvas und abhängige UI-Elemente an.
 * @param {string} resolution - Die Auflösung als String (z.B. "800x600").
 */
function applyResolution(resolution) {
    if (!gameCanvasElement || !pokemonTeamElement) {
        console.error("Canvas or Pokemon Team element not found for applying resolution.");
        return;
    }
    const [width, height] = resolution.split('x').map(Number);

    // Setze die Canvas-Größe
    gameCanvasElement.width = width;
    gameCanvasElement.height = height;

    // Passe die Höhe des Pokémon-Team-Bereichs an
    adjustElementHeight(pokemonTeamElement, gameCanvasElement);

    // Passe Breite der Spielerliste an (optional, könnte auch CSS sein)
    // const playersList = document.getElementById('playersList');
    // if (playersList) {
    //     playersList.style.maxWidth = `${width * 0.2}px`; // Beispiel: 20% der Canvas-Breite
    // }

    console.log(`Auflösung angewendet: ${width}x${height}`);
}

/**
 * Passt die Höhe eines Elements an die Höhe eines Referenzelements an.
 * @param {HTMLElement} elementToAdjust - Das anzupassende Element.
 * @param {HTMLElement} referenceElement - Das Referenzelement für die Höhe.
 */
function adjustElementHeight(elementToAdjust, referenceElement) {
    if (elementToAdjust && referenceElement) {
        elementToAdjust.style.height = `${referenceElement.height}px`;
    }
}


// --- Pokémon Info Panel ---

/**
 * Zeigt das Pokémon-Info-Panel mit den Daten des übergebenen Pokémon an.
 * @param {object} pokemon - Das Pokémon-Objekt.
 */
export function showPokemonInfoPanel(pokemon) {
    if (!pokemonInfoPanelElement || !pokemon) return;

    // Setze Grunddaten
    if (infoIconElement) {
        infoIconElement.textContent = pokemon.icon || '?';
        infoIconElement.style.backgroundColor = getPokemonIconColor(pokemon.type);
    }
    if (infoNameElement) infoNameElement.textContent = pokemon.name || 'Unbekannt';
    if (infoTypeElement) infoTypeElement.textContent = pokemon.type || 'Unbekannt';
    if (infoLevelElement) infoLevelElement.textContent = pokemon.level || '?';
    if (infoHpElement) infoHpElement.textContent = `${pokemon.hp ?? '?'}/${pokemon.maxHp ?? '?'}`;

    // Leere und fülle Schwächen-Listen
    if (weaknessListX2Element) weaknessListX2Element.innerHTML = '';
    if (weaknessListX4Element) weaknessListX4Element.innerHTML = '';

    const weaknesses = typeWeaknesses[pokemon.type];

    if (weaknesses) {
        // 2x Schwächen
        if (weaknesses.x2 && weaknesses.x2.length > 0) {
            weaknesses.x2.forEach(weakness => {
                weaknessListX2Element?.appendChild(createWeaknessItem(weakness, 'x2'));
            });
        } else {
            weaknessListX2Element?.appendChild(createNoWeaknessMessage('Keine Schwächen'));
        }

        // 4x Schwächen
        if (weaknesses.x4 && weaknesses.x4.length > 0) {
            weaknesses.x4.forEach(weakness => {
                weaknessListX4Element?.appendChild(createWeaknessItem(weakness, 'x4'));
            });
        } else {
            weaknessListX4Element?.appendChild(createNoWeaknessMessage('Keine extremen Schwächen'));
        }
    } else {
        weaknessListX2Element?.appendChild(createNoWeaknessMessage('Schwächen-Daten nicht verfügbar'));
        weaknessListX4Element?.appendChild(createNoWeaknessMessage('Schwächen-Daten nicht verfügbar'));
    }

    pokemonInfoPanelElement.classList.add('active');
}

/**
 * Erstellt ein DOM-Element für einen Schwäche-Eintrag.
 * @param {string} weaknessType - Der Typ der Schwäche.
 * @param {'x2'|'x4'} multiplier - Der Multiplikator ('x2' oder 'x4').
 * @returns {HTMLElement} Das erstellte div-Element.
 */
function createWeaknessItem(weaknessType, multiplier) {
    const weaknessItem = document.createElement('div');
    weaknessItem.className = `weakness-item ${multiplier}`;

    const weaknessIcon = document.createElement('span');
    weaknessIcon.className = 'weakness-icon';
    weaknessIcon.textContent = typeIcons[weaknessType] || '?';

    const weaknessName = document.createElement('span');
    weaknessName.textContent = weaknessType;

    weaknessItem.appendChild(weaknessIcon);
    weaknessItem.appendChild(weaknessName);
    return weaknessItem;
}

/**
 * Erstellt eine "Keine Schwächen"-Nachricht.
 * @param {string} text - Der anzuzeigende Text.
 * @returns {HTMLElement} Das erstellte div-Element.
 */
function createNoWeaknessMessage(text) {
    const noWeakness = document.createElement('div');
    noWeakness.textContent = text;
    noWeakness.style.color = '#aaa';
    noWeakness.style.fontSize = '12px';
    return noWeakness;
}


/**
 * Versteckt das Pokémon-Info-Panel.
 */
export function hidePokemonInfoPanel() {
    pokemonInfoPanelElement?.classList.remove('active');
}