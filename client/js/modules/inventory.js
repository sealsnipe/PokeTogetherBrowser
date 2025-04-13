// modules/inventory.js
// Verwaltet die Inventar-Anzeige und -Interaktion

import { exampleInventoryItems } from '../data/exampleData.js'; // Beispiel-Daten (später durch Server-Daten ersetzen)
import { getTypeLabel, getItemIconColor } from '../utils.js';

// --- DOM Element References ---
let inventoryItemsContainer = null;
let sortBySelect = null;
let filterTypeSelect = null;

// --- State ---
let currentInventory = []; // Aktueller Inventarstatus (wird später vom Server befüllt)

/**
 * Initialisiert das Inventar-Modul.
 */
export function initInventory() {
    inventoryItemsContainer = document.getElementById('inventoryItems');
    sortBySelect = document.getElementById('sortBy');
    filterTypeSelect = document.getElementById('filterType');

    if (!inventoryItemsContainer || !sortBySelect || !filterTypeSelect) {
        console.error("Inventory UI elements not found!");
        return;
    }

    // Lade initiale (Beispiel-)Daten
    // In einer echten Anwendung würde man hier auf Daten vom Server warten
    setInventory(exampleInventoryItems);

    // Event-Listener für Filter und Sortierung
    sortBySelect.addEventListener('change', filterAndSortInventory);
    filterTypeSelect.addEventListener('change', filterAndSortInventory);

    console.log("Inventory module initialized.");
}

/**
 * Setzt die Inventar-Daten (z.B. vom Server empfangen).
 * @param {Array<object>} items - Array von Item-Objekten.
 */
export function setInventory(items) {
    currentInventory = items;
    filterAndSortInventory(); // Wende aktuelle Filter/Sortierung an und rendere neu
}

/**
 * Filtert und sortiert das aktuelle Inventar basierend auf den Select-Einstellungen
 * und rendert es neu.
 */
function filterAndSortInventory() {
    if (!sortBySelect || !filterTypeSelect) return;

    const sortBy = sortBySelect.value;
    const filterType = filterTypeSelect.value;

    // 1. Filtern
    let filteredItems = [...currentInventory]; // Kopie erstellen
    if (filterType !== 'all') {
        filteredItems = filteredItems.filter(item => item.type === filterType);
    }

    // 2. Sortieren
    filteredItems.sort((a, b) => {
        switch(sortBy) {
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'type':
                // Sortiere nach Typ-Label für bessere Lesbarkeit
                return getTypeLabel(a.type).localeCompare(getTypeLabel(b.type));
            case 'quantity-desc':
                return b.quantity - a.quantity;
            case 'quantity-asc':
                return a.quantity - b.quantity;
            default:
                return 0;
        }
    });

    // 3. Rendern
    renderInventory(filteredItems);
}

/**
 * Rendert die übergebenen Inventar-Items in der UI.
 * @param {Array<object>} itemsToRender - Das zu rendernde Array von Item-Objekten.
 */
function renderInventory(itemsToRender) {
    if (!inventoryItemsContainer) return;
    inventoryItemsContainer.innerHTML = ''; // Leere den Container

    if (itemsToRender.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-inventory'; // Eigene Klasse für Styling?
        emptyMessage.textContent = 'Keine Items gefunden';
        emptyMessage.style.color = '#aaa';
        emptyMessage.style.textAlign = 'center';
        emptyMessage.style.padding = '20px';
        inventoryItemsContainer.appendChild(emptyMessage);
        return;
    }

    itemsToRender.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'inventory-item';
        itemElement.dataset.id = item.id; // Item-ID für spätere Interaktion
        itemElement.dataset.type = item.type;
        itemElement.title = `Item: ${item.name}\nTyp: ${getTypeLabel(item.type)}\nAnzahl: ${item.quantity}`; // Tooltip

        const iconElement = document.createElement('div');
        iconElement.className = 'item-icon';
        iconElement.textContent = item.icon || '?'; // Fallback-Icon
        iconElement.style.backgroundColor = getItemIconColor(item.type); // Farbe basierend auf Typ

        const detailsElement = document.createElement('div');
        detailsElement.className = 'item-details';

        const nameElement = document.createElement('div');
        nameElement.className = 'item-name';
        nameElement.textContent = item.name;

        const typeElement = document.createElement('div');
        typeElement.className = 'item-type';
        typeElement.textContent = getTypeLabel(item.type);

        detailsElement.appendChild(nameElement);
        detailsElement.appendChild(typeElement);

        const quantityElement = document.createElement('div');
        quantityElement.className = 'item-quantity';
        quantityElement.textContent = `x${item.quantity}`;

        itemElement.appendChild(iconElement);
        itemElement.appendChild(detailsElement);
        itemElement.appendChild(quantityElement);

        // Füge Klick-Event hinzu (Beispiel-Aktion)
        itemElement.addEventListener('click', () => {
            handleItemClick(item);
        });

        inventoryItemsContainer.appendChild(itemElement);
    });
}

/**
 * Behandelt den Klick auf ein Inventar-Item.
 * @param {object} item - Das geklickte Item-Objekt.
 */
function handleItemClick(item) {
    // TODO: Implementiere tatsächliche Item-Nutzung oder Detailansicht
    console.log(`Item geklickt: ${item.name} (ID: ${item.id})`);
    alert(`${item.name} ausgewählt! (Funktion noch nicht implementiert)`);
}