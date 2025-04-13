# Spielstand-Speicherung für PokeTogetherBrowser - Teil 3

## Routen für die Spielstand-Verwaltung

Wir erstellen Routen für die Spielstand-Verwaltung:

```javascript
// routes/saveRoutes.js
const express = require('express');
const router = express.Router();
const saveController = require('../controllers/saveController');
const { authenticate } = require('../middleware/auth');

// Alle Routen mit Authentifizierung schützen
router.use(authenticate);

// Spielstand speichern
router.post('/save', saveController.saveGame);

// Spielstand laden
router.get('/load', saveController.loadGame);

// Inventar aktualisieren
router.post('/inventory', saveController.updateInventory);

// Pokémon-Team aktualisieren
router.post('/pokemon', saveController.updatePokemonTeam);

// Spielfortschritt aktualisieren
router.post('/progress', saveController.updateProgress);

// Errungenschaft freischalten
router.post('/achievement', saveController.unlockAchievement);

// Geld aktualisieren
router.post('/money', saveController.updateMoney);

module.exports = router;
```

## Integration in den Server

Wir integrieren die Spielstand-Routen in den Server:

```javascript
// server/index.js (Erweiterung)
const saveRoutes = require('./routes/saveRoutes');

// API-Routen
app.use('/api/auth', authRoutes);
app.use('/api/save', saveRoutes);
```

## Automatische Speicherung

Wir implementieren eine automatische Speicherung des Spielstands in regelmäßigen Abständen:

```javascript
// server/socket-handlers/saveHandler.js
const db = require('../models');

// Spielstand automatisch speichern
module.exports = (io, socket) => {
  // Spielstand speichern
  socket.on('save game', async (data) => {
    try {
      const playerId = socket.player.id;
      
      // Spieler in der Datenbank suchen
      const player = await db.Player.findByPk(playerId);
      
      if (!player) {
        socket.emit('error', { message: 'Spieler nicht gefunden' });
        return;
      }

      // Spieler-Grunddaten aktualisieren
      if (data.position) {
        player.position_x = data.position.x;
        player.position_y = data.position.y;
      }
      
      if (data.isRunning !== undefined) {
        player.is_running = data.isRunning;
      }
      
      if (data.currentMap) {
        player.current_map = data.currentMap;
      }
      
      // Spielzeit aktualisieren (falls vorhanden)
      if (data.playTime) {
        player.play_time += data.playTime;
      }
      
      // Letzten Speicherzeitpunkt aktualisieren
      player.last_save = new Date();
      
      await player.save();

      socket.emit('save success', {
        message: 'Spielstand erfolgreich gespeichert',
        timestamp: player.last_save
      });
    } catch (error) {
      console.error('Fehler beim Speichern des Spielstands:', error);
      socket.emit('error', { message: 'Fehler beim Speichern des Spielstands' });
    }
  });
};
```

## Client-seitige Implementierung

### Spielstand-Manager

```javascript
// client/js/saveManager.js
class SaveManager {
  constructor(socket, gameState) {
    this.socket = socket;
    this.gameState = gameState;
    this.autoSaveInterval = null;
    this.lastSaveTime = null;
    this.unsavedChanges = false;
    
    // Event-Listener für Socket-Events
    this.setupSocketListeners();
  }
  
  // Socket-Event-Listener einrichten
  setupSocketListeners() {
    // Erfolgreiche Speicherung
    this.socket.on('save success', (data) => {
      console.log('Spielstand gespeichert:', data);
      this.lastSaveTime = new Date(data.timestamp);
      this.unsavedChanges = false;
      
      // Speicher-Indikator aktualisieren
      this.updateSaveIndicator();
      
      // Speicher-Nachricht anzeigen
      this.showSaveMessage('Spielstand gespeichert');
    });
    
    // Fehler beim Speichern
    this.socket.on('error', (error) => {
      if (error.message.includes('Speichern')) {
        console.error('Fehler beim Speichern:', error);
        
        // Fehler-Nachricht anzeigen
        this.showSaveMessage('Fehler beim Speichern', true);
      }
    });
  }
  
  // Automatische Speicherung starten
  startAutoSave(interval = 5 * 60 * 1000) { // Standardmäßig alle 5 Minuten
    // Bestehenden Intervall löschen, falls vorhanden
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    // Neuen Intervall einrichten
    this.autoSaveInterval = setInterval(() => {
      if (this.unsavedChanges) {
        this.saveGame();
      }
    }, interval);
    
    console.log(`Automatische Speicherung aktiviert (Intervall: ${interval / 1000} Sekunden)`);
  }
  
  // Automatische Speicherung stoppen
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('Automatische Speicherung deaktiviert');
    }
  }
  
  // Spielstand speichern
  saveGame() {
    // Spielstand-Daten sammeln
    const saveData = {
      position: {
        x: this.gameState.player.x,
        y: this.gameState.player.y
      },
      isRunning: this.gameState.player.isRunning,
      currentMap: this.gameState.currentMap,
      playTime: this.calculatePlayTime()
    };
    
    // Spielstand an den Server senden
    this.socket.emit('save game', saveData);
  }
  
  // Spielzeit seit dem letzten Speichern berechnen
  calculatePlayTime() {
    if (!this.lastSaveTime) {
      return 0;
    }
    
    const now = new Date();
    const timeDiff = now - this.lastSaveTime;
    
    // Zeit in Sekunden zurückgeben
    return Math.floor(timeDiff / 1000);
  }
  
  // Änderungen markieren
  markUnsavedChanges() {
    this.unsavedChanges = true;
    
    // Speicher-Indikator aktualisieren
    this.updateSaveIndicator();
  }
  
  // Speicher-Indikator aktualisieren
  updateSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    if (!indicator) return;
    
    if (this.unsavedChanges) {
      indicator.classList.add('unsaved');
      indicator.title = 'Ungespeicherte Änderungen';
    } else {
      indicator.classList.remove('unsaved');
      indicator.title = `Letzter Speicherstand: ${this.lastSaveTime ? this.lastSaveTime.toLocaleString() : 'Nie'}`;
    }
  }
  
  // Speicher-Nachricht anzeigen
  showSaveMessage(message, isError = false) {
    const messageContainer = document.getElementById('saveMessage');
    if (!messageContainer) return;
    
    // Nachrichtenklasse setzen
    messageContainer.className = isError ? 'save-message error' : 'save-message';
    messageContainer.textContent = message;
    
    // Nachricht anzeigen
    messageContainer.style.opacity = '1';
    
    // Nachricht nach 3 Sekunden ausblenden
    setTimeout(() => {
      messageContainer.style.opacity = '0';
    }, 3000);
  }
}

// Spielstand-Manager exportieren
export default SaveManager;
```

### Integration in die Spielseite

```javascript
// client/js/game.js (Erweiterung)
import SaveManager from './saveManager.js';

// Spielzustand
const gameState = {
  player: {
    x: 250,
    y: 250,
    isRunning: false
  },
  currentMap: 'starter_town',
  inventory: [],
  pokemon: [],
  progress: {},
  achievements: []
};

// Socket.io-Verbindung herstellen
const socket = connectSocket();

// Spielstand-Manager initialisieren
const saveManager = new SaveManager(socket, gameState);

// Automatische Speicherung starten (alle 5 Minuten)
saveManager.startAutoSave();

// Spielerdaten empfangen
socket.on('player data', (data) => {
  // Spielerdaten verarbeiten
  console.log('Spielerdaten empfangen:', data);
  
  // Spieler-ID und Benutzername speichern
  myId = data.id;
  username = data.username;
  
  // Position setzen
  if (data.position) {
    players[myId] = {
      x: data.position.x,
      y: data.position.y,
      username: username
    };
    
    // Spielzustand aktualisieren
    gameState.player.x = data.position.x;
    gameState.player.y = data.position.y;
  }
  
  // Inventar aktualisieren
  updateInventory(data.inventory);
  gameState.inventory = data.inventory;
  
  // Pokémon-Team aktualisieren
  updatePokemonTeam(data.pokemon);
  gameState.pokemon = data.pokemon;
  
  // Spielername anzeigen
  document.getElementById('playerName').textContent = username;
  
  // Letzten Speicherzeitpunkt setzen
  if (data.lastSave) {
    saveManager.lastSaveTime = new Date(data.lastSave);
    saveManager.updateSaveIndicator();
  }
});

// Bewegungs-Handler
socket.on('move', async (data) => {
  // Position aktualisieren
  gameState.player.x = data.x;
  gameState.player.y = data.y;
  
  // Ungespeicherte Änderungen markieren
  saveManager.markUnsavedChanges();
});

// Speichern-Button
document.getElementById('saveButton').addEventListener('click', () => {
  saveManager.saveGame();
});

// Vor dem Verlassen der Seite speichern
window.addEventListener('beforeunload', (event) => {
  if (saveManager.unsavedChanges) {
    // Spielstand speichern
    saveManager.saveGame();
    
    // Bestätigungsdialog anzeigen
    event.preventDefault();
    event.returnValue = 'Du hast ungespeicherte Änderungen. Möchtest du die Seite wirklich verlassen?';
  }
});
```

### Inventar-Verwaltung

```javascript
// client/js/inventory.js
class InventoryManager {
  constructor(socket, gameState) {
    this.socket = socket;
    this.gameState = gameState;
    this.inventoryContainer = document.getElementById('inventoryItems');
    this.sortBySelect = document.getElementById('sortBy');
    this.filterTypeSelect = document.getElementById('filterType');
    
    // Event-Listener für Filter und Sortierung
    this.setupEventListeners();
  }
  
  // Event-Listener einrichten
  setupEventListeners() {
    // Sortierung
    this.sortBySelect.addEventListener('change', () => {
      this.renderInventory();
    });
    
    // Filterung
    this.filterTypeSelect.addEventListener('change', () => {
      this.renderInventory();
    });
  }
  
  // Inventar rendern
  renderInventory() {
    if (!this.inventoryContainer) return;
    
    // Container leeren
    this.inventoryContainer.innerHTML = '';
    
    // Sortierung und Filterung anwenden
    const sortBy = this.sortBySelect.value;
    const filterType = this.filterTypeSelect.value;
    
    // Items filtern
    let filteredItems = [...this.gameState.inventory];
    if (filterType !== 'all') {
      filteredItems = filteredItems.filter(item => item.type === filterType);
    }
    
    // Items sortieren
    filteredItems.sort((a, b) => {
      switch(sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'quantity-desc':
          return b.quantity - a.quantity;
        case 'quantity-asc':
          return a.quantity - b.quantity;
        default:
          return 0;
      }
    });
    
    // Keine Items gefunden
    if (filteredItems.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-inventory';
      emptyMessage.textContent = 'Keine Items gefunden';
      this.inventoryContainer.appendChild(emptyMessage);
      return;
    }
    
    // Items rendern
    filteredItems.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'inventory-item';
      itemElement.dataset.id = item.id;
      itemElement.dataset.type = item.type;
      
      const iconElement = document.createElement('div');
      iconElement.className = 'item-icon';
      iconElement.textContent = item.icon;
      
      // Farbkodierung basierend auf dem Typ
      switch(item.type) {
        case 'ball':
          iconElement.style.backgroundColor = '#e53935';
          break;
        case 'medicine':
          iconElement.style.backgroundColor = '#43a047';
          break;
        case 'hold':
          iconElement.style.backgroundColor = '#1e88e5';
          break;
        case 'tm':
          iconElement.style.backgroundColor = '#8e24aa';
          break;
        case 'hm':
          iconElement.style.backgroundColor = '#6a1b9a';
          break;
        case 'quest':
          iconElement.style.backgroundColor = '#ff8f00';
          break;
        case 'berry':
          iconElement.style.backgroundColor = '#d81b60';
          break;
        default:
          iconElement.style.backgroundColor = '#757575';
      }
      
      const detailsElement = document.createElement('div');
      detailsElement.className = 'item-details';
      
      const nameElement = document.createElement('div');
      nameElement.className = 'item-name';
      nameElement.textContent = item.name;
      
      const typeElement = document.createElement('div');
      typeElement.className = 'item-type';
      typeElement.textContent = this.getTypeLabel(item.type);
      
      detailsElement.appendChild(nameElement);
      detailsElement.appendChild(typeElement);
      
      const quantityElement = document.createElement('div');
      quantityElement.className = 'item-quantity';
      quantityElement.textContent = `x${item.quantity}`;
      
      itemElement.appendChild(iconElement);
      itemElement.appendChild(detailsElement);
      itemElement.appendChild(quantityElement);
      
      // Klick-Event hinzufügen
      itemElement.addEventListener('click', () => {
        this.showItemOptions(item);
      });
      
      this.inventoryContainer.appendChild(itemElement);
    });
  }
  
  // Typ-Label abrufen
  getTypeLabel(type) {
    switch(type) {
      case 'ball': return 'Ball';
      case 'medicine': return 'Erste Hilfe';
      case 'hold': return 'Halte-Item';
      case 'tm': return 'TM';
      case 'hm': return 'VM';
      case 'quest': return 'Quest';
      case 'berry': return 'Beere';
      case 'other': return 'Sonstiges';
      default: return type;
    }
  }
  
  // Item-Optionen anzeigen
  showItemOptions(item) {
    // Optionen basierend auf dem Item-Typ anzeigen
    const options = [];
    
    if (item.type === 'medicine') {
      options.push({ label: 'Verwenden', action: 'use' });
    }
    
    if (item.type === 'hold') {
      options.push({ label: 'Geben', action: 'give' });
    }
    
    if (item.type === 'tm' || item.type === 'hm') {
      options.push({ label: 'Lehren', action: 'teach' });
    }
    
    // Allgemeine Optionen
    options.push({ label: 'Info', action: 'info' });
    options.push({ label: 'Wegwerfen', action: 'discard' });
    
    // Optionen-Menü erstellen
    const menu = document.createElement('div');
    menu.className = 'item-options-menu';
    
    options.forEach(option => {
      const optionElement = document.createElement('div');
      optionElement.className = 'item-option';
      optionElement.textContent = option.label;
      
      optionElement.addEventListener('click', () => {
        this.handleItemAction(option.action, item);
        menu.remove();
      });
      
      menu.appendChild(optionElement);
    });
    
    // Menü positionieren und anzeigen
    document.body.appendChild(menu);
    
    // Menü schließen, wenn außerhalb geklickt wird
    const closeMenu = (event) => {
      if (!menu.contains(event.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    
    // Verzögerung hinzufügen, um sofortiges Schließen zu verhindern
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 100);
  }
  
  // Item-Aktion behandeln
  handleItemAction(action, item) {
    switch(action) {
      case 'use':
        this.useItem(item);
        break;
      
      case 'give':
        this.giveItemToPokemon(item);
        break;
      
      case 'teach':
        this.teachMoveToPokemon(item);
        break;
      
      case 'info':
        this.showItemInfo(item);
        break;
      
      case 'discard':
        this.discardItem(item);
        break;
    }
  }
  
  // Item verwenden
  useItem(item) {
    // Implementierung je nach Item-Typ
    console.log(`Item ${item.name} verwenden`);
  }
  
  // Item einem Pokémon geben
  giveItemToPokemon(item) {
    // Pokémon-Auswahl anzeigen
    console.log(`Item ${item.name} einem Pokémon geben`);
  }
  
  // Attacke einem Pokémon beibringen
  teachMoveToPokemon(item) {
    // Pokémon-Auswahl anzeigen
    console.log(`Attacke aus ${item.name} einem Pokémon beibringen`);
  }
  
  // Item-Informationen anzeigen
  showItemInfo(item) {
    // Item-Informationen anzeigen
    console.log(`Informationen zu ${item.name} anzeigen`);
  }
  
  // Item wegwerfen
  discardItem(item) {
    // Bestätigung anfordern
    if (confirm(`Möchtest du ${item.name} wirklich wegwerfen?`)) {
      // Item aus dem Inventar entfernen
      this.updateInventory(item.id, 0, 'set');
    }
  }
  
  // Inventar aktualisieren
  updateInventory(itemId, quantity, action = 'set') {
    // Anfrage an den Server senden
    this.socket.emit('update inventory', {
      items: [
        { itemId, quantity, action }
      ]
    });
  }
}

// Inventar-Manager exportieren
export default InventoryManager;
```

## Zusammenfassung

Die Spielstand-Speicherung umfasst:

1. **Server-seitige Implementierung**:
   - Erweiterung der Datenmodelle für Spielfortschritt und Errungenschaften
   - Controller für die Spielstand-Verwaltung
   - Routen für die Spielstand-API
   - Socket.io-Handler für die automatische Speicherung

2. **Client-seitige Implementierung**:
   - Spielstand-Manager für die automatische Speicherung
   - Inventar-Verwaltung mit Filterung und Sortierung
   - Integration in die Spielseite

Diese Implementierung ermöglicht:

- Persistente Speicherung des Spielfortschritts
- Automatische Speicherung in regelmäßigen Abständen
- Verwaltung von Inventar und Pokémon-Team
- Verfolgung von Quests und Errungenschaften

Im nächsten Schritt werden wir weitere Spielmechaniken wie Kämpfe und Pokémon-Entwicklung implementieren.
