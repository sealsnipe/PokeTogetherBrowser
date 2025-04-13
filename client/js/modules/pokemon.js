// modules/pokemon.js
// Verwaltet das Pokémon-Team und das Lager

import { examplePokemonTeam, examplePokemonStorage } from '../data/exampleData.js'; // Beispiel-Daten
import { getHpBarClass, getPokemonIconColor } from '../utils.js';
import { showPokemonInfoPanel } from './uiManager.js';
import { MAX_TEAM_SIZE } from '../config.js';

// --- DOM Element References ---
let teamContainer = null;
let storageContainer = null;
let teamTab = null;
let storageTab = null;

// --- State ---
let currentTeam = [];
let currentStorage = [];
let draggedItemIndex = null; // Index des gezogenen Pokémon im Team

/**
 * Initialisiert das Pokémon-Modul.
 */
export function initPokemon() {
    teamContainer = document.getElementById('teamContent');
    storageContainer = document.getElementById('storageContent');
    teamTab = document.getElementById('teamTab');
    storageTab = document.getElementById('storageTab');

    if (!teamContainer || !storageContainer || !teamTab || !storageTab) {
        console.error("Pokemon UI elements not found!");
        return;
    }

    // Lade initiale (Beispiel-)Daten
    // Später durch Server-Daten ersetzen
    setTeam(examplePokemonTeam);
    setStorage(examplePokemonStorage);

    // Event-Listener für Tab-Wechsel
    teamTab.addEventListener('click', switchToTeamView);
    storageTab.addEventListener('click', switchToStorageView);

    // Event-Listener zum Schließen offener Menüs bei Klick außerhalb
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.pokemon-slot')) {
            closeAllPokemonMenus();
        }
    });

    console.log("Pokemon module initialized.");
}

/**
 * Setzt die Team-Daten und rendert neu.
 * @param {Array<object>} teamData - Array von Pokémon-Objekten für das Team.
 */
export function setTeam(teamData) {
    currentTeam = teamData;
    renderPokemonTeam();
}

/**
 * Setzt die Lager-Daten und rendert neu, falls die Lager-Ansicht aktiv ist.
 * @param {Array<object>} storageData - Array von Pokémon-Objekten für das Lager.
 */
export function setStorage(storageData) {
    currentStorage = storageData;
    // Rendere nur neu, wenn die Lager-Ansicht aktiv ist
    if (storageContainer && storageContainer.style.display !== 'none') {
        renderPokemonStorage();
    }
}

// --- Tab Switching ---

function switchToTeamView() {
    if (!teamTab?.classList.contains('active')) {
        teamTab?.classList.add('active');
        storageTab?.classList.remove('active');
        if(teamContainer) teamContainer.style.display = 'block';
        if(storageContainer) storageContainer.style.display = 'none';
        // Team wird bei Initialisierung und Änderungen gerendert, hier nicht nötig
    }
}

function switchToStorageView() {
    if (!storageTab?.classList.contains('active')) {
        storageTab?.classList.add('active');
        teamTab?.classList.remove('active');
        if(storageContainer) storageContainer.style.display = 'block';
        if(teamContainer) teamContainer.style.display = 'none';

        // Rendere das Lager, wenn es zum ersten Mal angezeigt wird oder leer ist
        if (storageContainer && storageContainer.children.length === 0) {
            renderPokemonStorage();
        }
    }
}

// --- Rendering ---

/**
 * Rendert das Pokémon-Team in der UI.
 */
function renderPokemonTeam() {
    if (!teamContainer) return;
    teamContainer.innerHTML = ''; // Leere Container

    // Rendere vorhandene Pokémon
    currentTeam.forEach((pokemon, index) => {
        const slot = createPokemonSlot(pokemon, index, 'team');
        teamContainer.appendChild(slot);
    });

    // Füge leere Slots hinzu, bis MAX_TEAM_SIZE erreicht ist
    const emptySlotsCount = Math.max(0, MAX_TEAM_SIZE - currentTeam.length);
    for (let i = 0; i < emptySlotsCount; i++) {
        teamContainer.appendChild(createEmptySlot());
    }
}

/**
 * Rendert das Pokémon-Lager in der UI.
 */
function renderPokemonStorage() {
    if (!storageContainer) return;
    storageContainer.innerHTML = ''; // Leere Container

    if (currentStorage.length === 0) {
         const emptyMessage = document.createElement('div');
        emptyMessage.textContent = 'Lager ist leer';
        emptyMessage.style.color = '#aaa';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.padding = '20px';
        storageContainer.appendChild(emptyMessage);
        return;
    }

    // Rendere Lager-Pokémon
    currentStorage.forEach((pokemon, index) => {
        const slot = createPokemonSlot(pokemon, index, 'storage');
        storageContainer.appendChild(slot);
    });
}

/**
 * Erstellt ein DOM-Element für einen leeren Pokémon-Slot.
 * @returns {HTMLElement} Das erstellte div-Element.
 */
function createEmptySlot() {
    const emptySlot = document.createElement('div');
    emptySlot.className = 'empty-slot';
    emptySlot.textContent = 'Leerer Slot';
    return emptySlot;
}

/**
 * Erstellt ein DOM-Element für einen Pokémon-Slot (Team oder Lager).
 * @param {object} pokemon - Das Pokémon-Objekt.
 * @param {number} index - Der Index des Pokémon im jeweiligen Array.
 * @param {'team'|'storage'} context - Gibt an, ob der Slot für Team oder Lager ist.
 * @returns {HTMLElement} Das erstellte Slot-Element.
 */
function createPokemonSlot(pokemon, index, context) {
    const slot = document.createElement('div');
    slot.className = 'pokemon-slot';
    slot.dataset.id = pokemon.id;
    slot.dataset.index = index;
    slot.title = `Lv. ${pokemon.level} ${pokemon.name}`; // Tooltip

    // Icon
    const iconElement = document.createElement('div');
    iconElement.className = 'pokemon-icon';
    iconElement.textContent = pokemon.icon || '?';
    iconElement.style.backgroundColor = getPokemonIconColor(pokemon.type);

    // Details (Name, Level, HP)
    const detailsElement = document.createElement('div');
    detailsElement.className = 'pokemon-details';

    const nameElement = document.createElement('div');
    nameElement.className = 'pokemon-name';
    nameElement.textContent = pokemon.name;

    const levelElement = document.createElement('div');
    levelElement.className = 'pokemon-level';
    levelElement.textContent = `Lv. ${pokemon.level} | ${pokemon.type}`;

    const hpElement = document.createElement('div');
    hpElement.className = 'pokemon-hp';
    const hpText = document.createElement('span');
    hpText.textContent = 'HP';
    const hpBar = document.createElement('div');
    hpBar.className = 'hp-bar';
    const hpFill = document.createElement('div');
    hpFill.className = `hp-fill ${getHpBarClass(pokemon.hp, pokemon.maxHp)}`;
    hpFill.style.width = `${Math.max(0, Math.min(100, (pokemon.hp / pokemon.maxHp) * 100))}%`; // Clamp 0-100
    const hpValue = document.createElement('span');
    hpValue.textContent = `${pokemon.hp ?? '?'}/${pokemon.maxHp ?? '?'}`;

    hpBar.appendChild(hpFill);
    hpElement.appendChild(hpText);
    hpElement.appendChild(hpBar);
    hpElement.appendChild(hpValue);

    detailsElement.appendChild(nameElement);
    detailsElement.appendChild(levelElement);
    detailsElement.appendChild(hpElement);

    // Menü
    const menuElement = createPokemonMenu(pokemon, index, context, slot);

    // Zusammenfügen
    slot.appendChild(iconElement);
    slot.appendChild(detailsElement);
    slot.appendChild(menuElement);

    // Event-Listener für Klick (Menü öffnen/schließen)
    slot.addEventListener('click', (e) => {
        // Verhindere, dass Klick auf Menüoption das Menü schließt
        if (e.target.classList.contains('menu-option')) return;
        togglePokemonMenu(slot);
    });

    // Drag & Drop nur für Team-Slots aktivieren
    if (context === 'team') {
        slot.draggable = true;
        addDragDropListeners(slot, index);
    }

    return slot;
}

/**
 * Erstellt das Kontextmenü für einen Pokémon-Slot.
 * @param {object} pokemon - Das Pokémon-Objekt.
 * @param {number} index - Der Index des Pokémon.
 * @param {'team'|'storage'} context - Kontext (Team oder Lager).
 * @param {HTMLElement} slotElement - Das zugehörige Slot-Element.
 * @returns {HTMLElement} Das Menü-Element.
 */
function createPokemonMenu(pokemon, index, context, slotElement) {
    const menuElement = document.createElement('div');
    menuElement.className = 'pokemon-menu';

    // Option: INFO (immer vorhanden)
    menuElement.appendChild(createMenuOption('INFO', (e) => {
        e.stopPropagation(); // Verhindert, dass der Slot-Klick das Menü sofort wieder schließt
        showPokemonInfoPanel(pokemon);
        closeAllPokemonMenus();
    }));

    // Option: GEBEN (nur im Team) -> Verschiebt ins Lager
    if (context === 'team') {
        menuElement.appendChild(createMenuOption('GEBEN', (e) => {
            e.stopPropagation();
            movePokemonToStorage(index);
            closeAllPokemonMenus();
        }));
    }

    // Option: INS TEAM (nur im Lager)
    if (context === 'storage') {
        menuElement.appendChild(createMenuOption('INS TEAM', (e) => {
            e.stopPropagation();
            movePokemonToTeam(index);
            closeAllPokemonMenus();
        }));
    }

    // Weitere Optionen könnten hier hinzugefügt werden (z.B. ITEM GEBEN, ATTACKEN)

    return menuElement;
}

/**
 * Erstellt eine einzelne Menüoption.
 * @param {string} text - Der Text der Option.
 * @param {function} onClickAction - Die Funktion, die bei Klick ausgeführt wird.
 * @returns {HTMLElement} Das Menüoptions-Element.
 */
function createMenuOption(text, onClickAction) {
    const option = document.createElement('div');
    option.className = 'menu-option';
    option.textContent = text;
    option.addEventListener('click', onClickAction);
    return option;
}

/**
 * Öffnet/Schließt das Menü für einen bestimmten Slot.
 * @param {HTMLElement} slotElement - Das Slot-Element.
 */
function togglePokemonMenu(slotElement) {
    // Schließe zuerst alle anderen offenen Menüs
    document.querySelectorAll('.pokemon-slot.active').forEach(activeSlot => {
        if (activeSlot !== slotElement) {
            activeSlot.classList.remove('active');
        }
    });
    // Toggle das geklickte Menü
    slotElement.classList.toggle('active');
}

/**
 * Schließt alle offenen Pokémon-Menüs.
 */
function closeAllPokemonMenus() {
    document.querySelectorAll('.pokemon-slot.active').forEach(slot => {
        slot.classList.remove('active');
    });
}

// --- Drag & Drop (nur für Team) ---

function addDragDropListeners(slot, index) {
    slot.addEventListener('dragstart', (e) => {
        slot.classList.add('dragging');
        // Setze den Index des gezogenen Elements
        draggedItemIndex = index;
        // Optional: Daten für den Transfer setzen (hier nicht unbedingt nötig, da wir den Index global speichern)
        // e.dataTransfer.setData('text/plain', index);
        e.dataTransfer.effectAllowed = 'move';
    });

    slot.addEventListener('dragend', () => {
        slot.classList.remove('dragging');
        draggedItemIndex = null; // Index zurücksetzen
        // Entferne Hervorhebungen von allen Slots
        document.querySelectorAll('.pokemon-slot.drag-over').forEach(s => s.classList.remove('drag-over'));
    });

    slot.addEventListener('dragover', (e) => {
        e.preventDefault(); // Notwendig, um 'drop' zu erlauben
        if (slot.dataset.index !== draggedItemIndex?.toString()) { // Nicht über sich selbst
             slot.classList.add('drag-over');
        }
        e.dataTransfer.dropEffect = 'move';
    });

    slot.addEventListener('dragleave', () => {
        slot.classList.remove('drag-over');
    });

    slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        const fromIndex = draggedItemIndex;
        const toIndex = index;

        if (fromIndex !== null && fromIndex !== toIndex) {
            // Tausche die Pokémon im Array
            const itemToMove = currentTeam.splice(fromIndex, 1)[0];
            currentTeam.splice(toIndex, 0, itemToMove);

            // Rendere das Team neu
            renderPokemonTeam();
            // TODO: Sende die neue Team-Reihenfolge an den Server
            console.log(`Pokémon von Index ${fromIndex} nach ${toIndex} verschoben.`);
        }
        draggedItemIndex = null; // Index zurücksetzen
    });
}

// --- Pokémon verschieben ---

/**
 * Verschiebt ein Pokémon vom Team ins Lager.
 * @param {number} teamIndex - Der Index des Pokémon im Team-Array.
 */
function movePokemonToStorage(teamIndex) {
    if (teamIndex >= 0 && teamIndex < currentTeam.length) {
        const [movedPokemon] = currentTeam.splice(teamIndex, 1); // Entferne aus Team
        currentStorage.push(movedPokemon); // Füge zum Lager hinzu
        currentStorage.sort((a, b) => a.id - b.id); // Optional: Lager sortieren

        renderPokemonTeam(); // Team neu rendern
        // Lager nur neu rendern, wenn sichtbar
        if (storageContainer && storageContainer.style.display !== 'none') {
            renderPokemonStorage();
        }

        // TODO: Server über die Änderung informieren
        console.log(`${movedPokemon.name} ins Lager verschoben.`);
        alert(`${movedPokemon.name} wurde ins Lager verschoben.`);
    }
}

/**
 * Verschiebt ein Pokémon vom Lager ins Team.
 * @param {number} storageIndex - Der Index des Pokémon im Lager-Array.
 */
function movePokemonToTeam(storageIndex) {
    if (currentTeam.length >= MAX_TEAM_SIZE) {
        alert(`Dein Team ist voll (Maximal ${MAX_TEAM_SIZE} Pokémon).`);
        return;
    }

    if (storageIndex >= 0 && storageIndex < currentStorage.length) {
        const [movedPokemon] = currentStorage.splice(storageIndex, 1); // Entferne aus Lager
        currentTeam.push(movedPokemon); // Füge zum Team hinzu

        renderPokemonStorage(); // Lager neu rendern
        renderPokemonTeam(); // Team neu rendern

        // Optional: Zur Team-Ansicht wechseln
        switchToTeamView();

        // TODO: Server über die Änderung informieren
        console.log(`${movedPokemon.name} ins Team verschoben.`);
        alert(`${movedPokemon.name} wurde ins Team aufgenommen.`);
    }
}