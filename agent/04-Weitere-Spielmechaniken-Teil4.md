# Weitere Spielmechaniken für PokeTogetherBrowser - Teil 4: Client-seitige Implementierung

## Übersicht

In diesem Abschnitt implementieren wir die client-seitige Logik für die Spielmechaniken, einschließlich Kampfsystem, Pokémon-Entwicklung und Erfahrungspunkte.

## Kampfsystem-UI

```javascript
// client/js/battle.js
class BattleSystem {
  constructor(socket, gameState) {
    this.socket = socket;
    this.gameState = gameState;
    this.currentBattle = null;
    this.battleContainer = document.getElementById('battleContainer');
    this.battleLog = document.getElementById('battleLog');
    this.actionButtons = document.getElementById('battleActions');
    this.moveButtons = document.getElementById('battleMoves');
    this.pokemonButtons = document.getElementById('battlePokemon');
    this.itemButtons = document.getElementById('battleItems');
    
    // Event-Listener für Socket-Events
    this.setupSocketListeners();
  }
  
  // Socket-Event-Listener einrichten
  setupSocketListeners() {
    // Kampf gestartet
    this.socket.on('battle started', (data) => {
      console.log('Kampf gestartet:', data);
      this.currentBattle = data;
      this.showBattleScreen();
    });
    
    // Kampfaktion ausgeführt
    this.socket.on('battle action', (data) => {
      console.log('Kampfaktion:', data);
      this.handleBattleAction(data);
    });
    
    // Kampf beendet
    this.socket.on('battle ended', (data) => {
      console.log('Kampf beendet:', data);
      this.handleBattleEnd(data);
    });
  }
  
  // Kampfbildschirm anzeigen
  showBattleScreen() {
    // Kampfbildschirm einblenden
    this.battleContainer.style.display = 'flex';
    
    // Kampflog leeren
    this.battleLog.innerHTML = '';
    
    // Kampfinformationen anzeigen
    this.addLogMessage(`Ein wilder ${this.currentBattle.wildPokemon.name} erscheint!`);
    this.addLogMessage(`Los, ${this.currentBattle.player1.activePokemon.name}!`);
    
    // Kampfbildschirm initialisieren
    this.renderBattleScreen();
    
    // Aktionsbuttons anzeigen
    this.showActionButtons();
  }
  
  // Kampfbildschirm rendern
  renderBattleScreen() {
    // Spieler-Pokémon anzeigen
    const playerPokemon = this.currentBattle.player1.activePokemon;
    document.getElementById('playerPokemonName').textContent = playerPokemon.name;
    document.getElementById('playerPokemonLevel').textContent = `Lv. ${playerPokemon.level}`;
    document.getElementById('playerPokemonHP').textContent = `${playerPokemon.hp}/${playerPokemon.maxHp}`;
    document.getElementById('playerPokemonHPBar').style.width = `${(playerPokemon.hp / playerPokemon.maxHp) * 100}%`;
    
    // Gegner-Pokémon anzeigen
    const opponentPokemon = this.currentBattle.wildPokemon || this.currentBattle.player2.activePokemon;
    document.getElementById('opponentPokemonName').textContent = opponentPokemon.name;
    document.getElementById('opponentPokemonLevel').textContent = `Lv. ${opponentPokemon.level}`;
    document.getElementById('opponentPokemonHP').textContent = `${opponentPokemon.hp}/${opponentPokemon.maxHp}`;
    document.getElementById('opponentPokemonHPBar').style.width = `${(opponentPokemon.hp / opponentPokemon.maxHp) * 100}%`;
  }
  
  // Aktionsbuttons anzeigen
  showActionButtons() {
    // Aktionsbuttons einblenden
    this.actionButtons.style.display = 'flex';
    this.moveButtons.style.display = 'none';
    this.pokemonButtons.style.display = 'none';
    this.itemButtons.style.display = 'none';
    
    // Aktionsbuttons leeren
    this.actionButtons.innerHTML = '';
    
    // Kampf-Button
    const fightButton = document.createElement('button');
    fightButton.className = 'battle-button fight';
    fightButton.textContent = 'Kampf';
    fightButton.addEventListener('click', () => {
      this.showMoveButtons();
    });
    
    // Pokémon-Button
    const pokemonButton = document.createElement('button');
    pokemonButton.className = 'battle-button pokemon';
    pokemonButton.textContent = 'Pokémon';
    pokemonButton.addEventListener('click', () => {
      this.showPokemonButtons();
    });
    
    // Item-Button
    const itemButton = document.createElement('button');
    itemButton.className = 'battle-button item';
    itemButton.textContent = 'Item';
    itemButton.addEventListener('click', () => {
      this.showItemButtons();
    });
    
    // Flucht-Button
    const fleeButton = document.createElement('button');
    fleeButton.className = 'battle-button flee';
    fleeButton.textContent = 'Flucht';
    fleeButton.addEventListener('click', () => {
      this.attemptFlee();
    });
    
    // Buttons hinzufügen
    this.actionButtons.appendChild(fightButton);
    this.actionButtons.appendChild(pokemonButton);
    this.actionButtons.appendChild(itemButton);
    this.actionButtons.appendChild(fleeButton);
  }
  
  // Attacken-Buttons anzeigen
  showMoveButtons() {
    // Aktionsbuttons ausblenden, Attacken-Buttons einblenden
    this.actionButtons.style.display = 'none';
    this.moveButtons.style.display = 'flex';
    
    // Attacken-Buttons leeren
    this.moveButtons.innerHTML = '';
    
    // Attacken des aktiven Pokémon abrufen
    const playerPokemon = this.currentBattle.player1.activePokemon;
    const moves = playerPokemon.moves || [];
    
    // Für jede Attacke einen Button erstellen
    moves.forEach(move => {
      const moveButton = document.createElement('button');
      moveButton.className = `battle-button move ${move.type.toLowerCase()}`;
      moveButton.innerHTML = `
        <span class="move-name">${move.name}</span>
        <span class="move-pp">${move.pp}/${move.maxPp}</span>
        <span class="move-type">${move.type}</span>
      `;
      
      // Attacke deaktivieren, wenn keine PP mehr übrig sind
      if (move.pp <= 0) {
        moveButton.disabled = true;
        moveButton.classList.add('disabled');
      }
      
      moveButton.addEventListener('click', () => {
        this.useMove(move.id);
      });
      
      this.moveButtons.appendChild(moveButton);
    });
    
    // Zurück-Button
    const backButton = document.createElement('button');
    backButton.className = 'battle-button back';
    backButton.textContent = 'Zurück';
    backButton.addEventListener('click', () => {
      this.showActionButtons();
    });
    
    this.moveButtons.appendChild(backButton);
  }
  
  // Pokémon-Buttons anzeigen
  showPokemonButtons() {
    // Aktionsbuttons ausblenden, Pokémon-Buttons einblenden
    this.actionButtons.style.display = 'none';
    this.pokemonButtons.style.display = 'flex';
    
    // Pokémon-Buttons leeren
    this.pokemonButtons.innerHTML = '';
    
    // Pokémon im Team abrufen
    const teamPokemon = this.gameState.pokemon.filter(p => p.isInTeam);
    
    // Für jedes Pokémon einen Button erstellen
    teamPokemon.forEach(pokemon => {
      const pokemonButton = document.createElement('button');
      pokemonButton.className = 'battle-button pokemon';
      
      // Aktives Pokémon markieren
      if (pokemon.id === this.currentBattle.player1.activePokemon.id) {
        pokemonButton.classList.add('active');
      }
      
      // Kampfunfähiges Pokémon markieren
      if (pokemon.hp <= 0) {
        pokemonButton.classList.add('fainted');
        pokemonButton.disabled = true;
      }
      
      pokemonButton.innerHTML = `
        <span class="pokemon-name">${pokemon.nickname || pokemon.name}</span>
        <span class="pokemon-level">Lv. ${pokemon.level}</span>
        <span class="pokemon-hp">${pokemon.hp}/${pokemon.maxHp}</span>
        <div class="pokemon-hp-bar">
          <div class="hp-fill" style="width: ${(pokemon.hp / pokemon.maxHp) * 100}%"></div>
        </div>
      `;
      
      pokemonButton.addEventListener('click', () => {
        this.switchPokemon(pokemon.id);
      });
      
      this.pokemonButtons.appendChild(pokemonButton);
    });
    
    // Zurück-Button
    const backButton = document.createElement('button');
    backButton.className = 'battle-button back';
    backButton.textContent = 'Zurück';
    backButton.addEventListener('click', () => {
      this.showActionButtons();
    });
    
    this.pokemonButtons.appendChild(backButton);
  }
  
  // Item-Buttons anzeigen
  showItemButtons() {
    // Aktionsbuttons ausblenden, Item-Buttons einblenden
    this.actionButtons.style.display = 'none';
    this.itemButtons.style.display = 'flex';
    
    // Item-Buttons leeren
    this.itemButtons.innerHTML = '';
    
    // Kampf-Items filtern (Bälle, Tränke, etc.)
    const battleItems = this.gameState.inventory.filter(item => 
      item.type === 'ball' || item.type === 'medicine'
    );
    
    // Für jedes Item einen Button erstellen
    battleItems.forEach(item => {
      const itemButton = document.createElement('button');
      itemButton.className = `battle-button item ${item.type}`;
      itemButton.innerHTML = `
        <span class="item-name">${item.name}</span>
        <span class="item-quantity">x${item.quantity}</span>
      `;
      
      itemButton.addEventListener('click', () => {
        this.useItem(item.id);
      });
      
      this.itemButtons.appendChild(itemButton);
    });
    
    // Zurück-Button
    const backButton = document.createElement('button');
    backButton.className = 'battle-button back';
    backButton.textContent = 'Zurück';
    backButton.addEventListener('click', () => {
      this.showActionButtons();
    });
    
    this.itemButtons.appendChild(backButton);
  }
  
  // Attacke verwenden
  useMove(moveId) {
    // Buttons deaktivieren
    this.disableAllButtons();
    
    // Kampfaktion an den Server senden
    this.socket.emit('battle action', {
      battleId: this.currentBattle.id,
      actionType: 'attack',
      moveId: moveId
    });
    
    // Nachricht im Kampflog anzeigen
    const playerPokemon = this.currentBattle.player1.activePokemon;
    const move = playerPokemon.moves.find(m => m.id === moveId);
    this.addLogMessage(`${playerPokemon.name} setzt ${move.name} ein!`);
  }
  
  // Pokémon wechseln
  switchPokemon(pokemonId) {
    // Buttons deaktivieren
    this.disableAllButtons();
    
    // Kampfaktion an den Server senden
    this.socket.emit('battle action', {
      battleId: this.currentBattle.id,
      actionType: 'switch',
      pokemonId: pokemonId
    });
    
    // Nachricht im Kampflog anzeigen
    const pokemon = this.gameState.pokemon.find(p => p.id === pokemonId);
    this.addLogMessage(`${pokemon.nickname || pokemon.name} wird in den Kampf geschickt!`);
  }
  
  // Item verwenden
  useItem(itemId) {
    // Buttons deaktivieren
    this.disableAllButtons();
    
    // Kampfaktion an den Server senden
    this.socket.emit('battle action', {
      battleId: this.currentBattle.id,
      actionType: 'item',
      itemId: itemId,
      targetPosition: 'active' // Standardmäßig auf das aktive Pokémon anwenden
    });
    
    // Nachricht im Kampflog anzeigen
    const item = this.gameState.inventory.find(i => i.id === itemId);
    this.addLogMessage(`${item.name} wird verwendet!`);
  }
  
  // Fluchtversuch
  attemptFlee() {
    // Buttons deaktivieren
    this.disableAllButtons();
    
    // Kampfaktion an den Server senden
    this.socket.emit('battle action', {
      battleId: this.currentBattle.id,
      actionType: 'flee'
    });
    
    // Nachricht im Kampflog anzeigen
    this.addLogMessage('Fluchtversuch...');
  }
  
  // Kampfaktion verarbeiten
  handleBattleAction(data) {
    // Aktion verarbeiten
    const action = data.action;
    
    // Nachricht im Kampflog anzeigen
    this.addLogMessage(action.result.message);
    
    // Kampfbildschirm aktualisieren
    this.updateBattleScreen(action.result);
    
    // Prüfen, ob der Kampf beendet ist
    if (action.result.battleEnded) {
      this.handleBattleEnd({
        battleId: this.currentBattle.id,
        result: action.result.battleResult,
        expGained: action.result.expGained,
        reward: action.result.reward
      });
      return;
    }
    
    // Prüfen, ob ein Pokémon gewechselt werden muss
    if (action.result.needsSwitch) {
      this.showPokemonButtons();
      return;
    }
    
    // Aktionsbuttons wieder anzeigen
    setTimeout(() => {
      this.showActionButtons();
    }, 1500);
  }
  
  // Kampfbildschirm aktualisieren
  updateBattleScreen(result) {
    // Spieler-Pokémon aktualisieren
    if (result.player1ActivePokemon) {
      const newActivePokemon = this.gameState.pokemon.find(p => p.id === result.player1ActivePokemon);
      if (newActivePokemon) {
        this.currentBattle.player1.activePokemon = newActivePokemon;
      }
    }
    
    // Gegner-Pokémon aktualisieren
    if (result.defenderHp !== undefined) {
      if (this.currentBattle.wildPokemon) {
        this.currentBattle.wildPokemon.hp = result.defenderHp;
      } else if (this.currentBattle.player2.activePokemon) {
        this.currentBattle.player2.activePokemon.hp = result.defenderHp;
      }
    }
    
    // Kampfbildschirm neu rendern
    this.renderBattleScreen();
  }
  
  // Kampfende verarbeiten
  handleBattleEnd(data) {
    // Nachricht im Kampflog anzeigen
    switch (data.result) {
      case 'player1_won':
        this.addLogMessage('Du hast gewonnen!');
        break;
      case 'player2_won':
        this.addLogMessage('Du hast verloren!');
        break;
      case 'draw':
        this.addLogMessage('Der Kampf endet unentschieden!');
        break;
      case 'fled':
        this.addLogMessage('Flucht erfolgreich!');
        break;
    }
    
    // Erfahrungspunkte anzeigen
    if (data.expGained) {
      this.addLogMessage(`${this.currentBattle.player1.activePokemon.name} erhält ${data.expGained} Erfahrungspunkte!`);
    }
    
    // Belohnung anzeigen
    if (data.reward) {
      this.addLogMessage(`Du erhältst ${data.reward.money} Pokédollar!`);
    }
    
    // Kampfbildschirm nach kurzer Verzögerung ausblenden
    setTimeout(() => {
      this.battleContainer.style.display = 'none';
      this.currentBattle = null;
    }, 3000);
  }
  
  // Alle Buttons deaktivieren
  disableAllButtons() {
    const buttons = document.querySelectorAll('.battle-button');
    buttons.forEach(button => {
      button.disabled = true;
    });
  }
  
  // Nachricht zum Kampflog hinzufügen
  addLogMessage(message) {
    const logEntry = document.createElement('div');
    logEntry.className = 'battle-log-entry';
    logEntry.textContent = message;
    this.battleLog.appendChild(logEntry);
    
    // Zum Ende des Logs scrollen
    this.battleLog.scrollTop = this.battleLog.scrollHeight;
  }
}

// Battle-System exportieren
export default BattleSystem;
```

## Pokémon-Entwicklungs-UI

```javascript
// client/js/evolution.js
class EvolutionSystem {
  constructor(socket, gameState) {
    this.socket = socket;
    this.gameState = gameState;
    this.evolutionContainer = document.getElementById('evolutionContainer');
    this.evolutionAnimation = document.getElementById('evolutionAnimation');
    this.evolutionInfo = document.getElementById('evolutionInfo');
    
    // Event-Listener für Socket-Events
    this.setupSocketListeners();
  }
  
  // Socket-Event-Listener einrichten
  setupSocketListeners() {
    // Entwicklung gestartet
    this.socket.on('evolution started', (data) => {
      console.log('Entwicklung gestartet:', data);
      this.showEvolutionScreen(data);
    });
    
    // Entwicklung abgeschlossen
    this.socket.on('evolution completed', (data) => {
      console.log('Entwicklung abgeschlossen:', data);
      this.completeEvolution(data);
    });
  }
  
  // Entwicklungsbildschirm anzeigen
  showEvolutionScreen(data) {
    // Entwicklungsbildschirm einblenden
    this.evolutionContainer.style.display = 'flex';
    
    // Entwicklungsinformationen anzeigen
    this.evolutionInfo.innerHTML = `
      <div class="evolution-pokemon">
        <div class="pokemon-image">
          <div class="pokemon-sprite" data-pokemon="${data.pokemon.name}"></div>
        </div>
        <div class="pokemon-name">${data.pokemon.name}</div>
      </div>
      <div class="evolution-arrow">→</div>
      <div class="evolution-pokemon">
        <div class="pokemon-image">
          <div class="pokemon-sprite" data-pokemon="${data.evolution.name}"></div>
        </div>
        <div class="pokemon-name">${data.evolution.name}</div>
      </div>
    `;
    
    // Entwicklungsanimation starten
    this.startEvolutionAnimation(data);
  }
  
  // Entwicklungsanimation starten
  startEvolutionAnimation(data) {
    // Animation-Container leeren
    this.evolutionAnimation.innerHTML = '';
    
    // Hintergrund erstellen
    const background = document.createElement('div');
    background.className = 'evolution-background';
    
    // Pokémon-Sprite erstellen
    const pokemonSprite = document.createElement('div');
    pokemonSprite.className = 'evolution-sprite';
    pokemonSprite.dataset.pokemon = data.pokemon.name;
    
    // Lichteffekt erstellen
    const lightEffect = document.createElement('div');
    lightEffect.className = 'evolution-light';
    
    // Elemente zum Container hinzufügen
    this.evolutionAnimation.appendChild(background);
    this.evolutionAnimation.appendChild(pokemonSprite);
    this.evolutionAnimation.appendChild(lightEffect);
    
    // Animation starten
    setTimeout(() => {
      this.evolutionAnimation.classList.add('evolving');
      
      // Nach 3 Sekunden das Pokémon wechseln
      setTimeout(() => {
        pokemonSprite.dataset.pokemon = data.evolution.name;
        
        // Nach weiteren 2 Sekunden die Animation beenden
        setTimeout(() => {
          this.evolutionAnimation.classList.remove('evolving');
          this.evolutionAnimation.classList.add('evolved');
          
          // Entwicklung abschließen
          this.completeEvolution(data);
        }, 2000);
      }, 3000);
    }, 1000);
  }
  
  // Entwicklung abschließen
  completeEvolution(data) {
    // Nachricht anzeigen
    const message = document.createElement('div');
    message.className = 'evolution-message';
    message.textContent = `Glückwunsch! ${data.pokemon.name} hat sich zu ${data.evolution.name} entwickelt!`;
    this.evolutionInfo.appendChild(message);
    
    // Neue Attacken anzeigen
    if (data.newMoves && data.newMoves.length > 0) {
      const newMovesContainer = document.createElement('div');
      newMovesContainer.className = 'new-moves';
      
      const newMovesTitle = document.createElement('div');
      newMovesTitle.className = 'new-moves-title';
      newMovesTitle.textContent = 'Neue Attacken:';
      
      const movesList = document.createElement('ul');
      movesList.className = 'moves-list';
      
      data.newMoves.forEach(move => {
        const moveItem = document.createElement('li');
        moveItem.className = `move-item ${move.type.toLowerCase()}`;
        moveItem.textContent = `${move.name} (${move.type})`;
        movesList.appendChild(moveItem);
      });
      
      newMovesContainer.appendChild(newMovesTitle);
      newMovesContainer.appendChild(movesList);
      this.evolutionInfo.appendChild(newMovesContainer);
    }
    
    // Schließen-Button
    const closeButton = document.createElement('button');
    closeButton.className = 'evolution-close';
    closeButton.textContent = 'Schließen';
    closeButton.addEventListener('click', () => {
      this.evolutionContainer.style.display = 'none';
    });
    
    this.evolutionInfo.appendChild(closeButton);
  }
  
  // Entwicklungsmöglichkeiten prüfen
  checkEvolution(pokemonId) {
    return new Promise((resolve, reject) => {
      this.socket.emit('check evolution', { pokemonId }, (response) => {
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response);
        }
      });
    });
  }
  
  // Entwicklung starten
  startEvolution(pokemonId) {
    this.socket.emit('evolve pokemon', { pokemonId });
  }
}

// Evolution-System exportieren
export default EvolutionSystem;
```

## Zusammenfassung

Die implementierten Spielmechaniken umfassen:

1. **Kampfsystem**:
   - Rundenbasierte Kämpfe gegen wilde Pokémon und andere Spieler
   - Attacken mit Typ-Effektivität
   - Items im Kampf verwenden
   - Pokémon wechseln
   - Fluchtmöglichkeit

2. **Pokémon-Entwicklung**:
   - Entwicklung basierend auf Level, Items oder speziellen Bedingungen
   - Visuelle Entwicklungsanimation
   - Neue Attacken beim Entwickeln lernen

3. **Erfahrungspunkte und Level-Up**:
   - Erfahrungspunkte durch Kämpfe gewinnen
   - Level-Up mit verbesserten Statistiken
   - Neue Attacken beim Level-Up lernen

Diese Mechaniken bilden das Herzstück des Spielerlebnisses und ermöglichen es den Spielern, ihre Pokémon zu trainieren, zu entwickeln und in Kämpfen einzusetzen.

Die client-seitige Implementierung sorgt für eine ansprechende Benutzeroberfläche und flüssige Interaktionen, während die server-seitige Logik die Spielregeln durchsetzt und die Daten persistent speichert.
