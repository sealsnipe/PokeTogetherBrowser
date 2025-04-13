# Analyse des dokumentierten Stands (basierend auf agent/*.md)

Diese Datei fasst den Entwicklungsstand zusammen, wie er in den Markdown-Dateien im `agent/`-Verzeichnis dokumentiert ist. Es ist wichtig zu beachten, dass der tatsächliche Code-Stand abweichen kann, da seit der Erstellung dieser Dokumente möglicherweise Refactorings und Bugfixes stattgefunden haben.

## Zusammenfassung der dokumentierten Features

1.  **Datenbank & ORM (`01-*.md`):**
    *   Verwendet **SQLite** für die Entwicklung und **Sequelize** als ORM.
    *   Definiert Modelle für `Player`, `Item`, `InventoryItem`, `PokemonBase`, `PlayerPokemon`, `Move`, `PokemonMove`, `Progress`, `Achievement`, `Battle`, `BattleAction`.
    *   Beschreibt die Beziehungen zwischen diesen Modellen (z.B. 1 Spieler hat viele Pokémon, 1 Pokémon hat viele Attacken).
    *   Enthält Logik zur Initialisierung der Datenbank und zum Einfügen von Beispieldaten (`seed-data.js`).
    *   *Anmerkung:* Das Server-Integrationsbeispiel in diesem Dokument scheint eine veraltete Login-Logik ohne Passwortprüfung/JWT zu zeigen, was im Widerspruch zu den Authentifizierungsdokumenten steht.

2.  **Benutzerauthentifizierung (`02-*.md`):**
    *   **Server:** Implementiert sicheres Passwort-Hashing mit `bcrypt`, JWT-Erstellung und -Validierung für Sitzungen (über Cookies), Middleware zum Schutz von Routen (`authenticate`) und zur Rollenprüfung (`authorize`), sowie eine separate Authentifizierung für Socket.io-Verbindungen.
    *   **Client:** Enthält HTML-Formulare (`login.html`, `register.html`) und JavaScript (`auth.js`) zur Abwicklung von Login/Registrierung über `fetch`-Anfragen, zur Verwaltung des Tokens und zur Herstellung der authentifizierten Socket.io-Verbindung.

3.  **Spielstand-Speicherung (`03-*.md`):**
    *   **Server:** Erweitert das `Player`-Modell und fügt `Progress`/`Achievement`-Modelle hinzu. Implementiert einen `saveController` mit Funktionen zum Speichern/Laden des gesamten Spielstands (`saveGame`, `loadGame`) sowie zum Aktualisieren spezifischer Teile wie Inventar (`updateInventory`), Pokémon-Team (`updatePokemonTeam`), Fortschritt (`updateProgress`), Errungenschaften (`unlockAchievement`) und Geld (`updateMoney`). Nutzt Transaktionen für Inventar-Updates.
    *   **Client:** Implementiert einen `SaveManager` (`saveManager.js`) für automatische Speicherung (über Socket.io `save game`-Event), manuelles Speichern, Tracking ungespeicherter Änderungen und UI-Feedback. Ein `InventoryManager` (`inventory.js`) kümmert sich um die Anzeige und Interaktion mit dem Inventar (Filtern, Sortieren, Optionsmenü).
    *   *Anmerkung:* Es scheint redundante Mechanismen zur Speicherung (HTTP-Route `/api/save/save` vs. Socket.io-Event `save game`) und Inventaraktualisierung (HTTP-Route `/api/save/inventory` vs. Socket.io-Event `update inventory`) zu geben.

4.  **Weitere Spielmechaniken (`04-*.md`):**
    *   **Kampfsystem (Server):** Definiert `Battle`/`BattleAction`-Modelle. Implementiert einen `battleController` zum Starten von Kämpfen (Wild, Spieler; *Trainer nicht implementiert*), Ausführen von Aktionen (`performAttack`, `switchPokemon`, `useItem`, `attemptFlee`) und Abrufen von Kampfdetails. Enthält Logik für Schadensberechnung (inkl. Typ-Effektivität, STAB, Krit), PP-Verbrauch, Besiegen von Pokémon, Kampfende, Erfahrungsgewinn und Belohnungen. Definiert `calculateTypeEffectiveness` in `battleUtils.js`. *Mehrere Hilfsfunktionen (z.B. für EP/Belohnungsberechnung, Fangchance) werden aufgerufen, aber nicht definiert.*
    *   **Pokémon-Entwicklung (Server):** Erweitert `PokemonBase` um Entwicklungsdaten. Implementiert einen `evolutionController` zum Prüfen von Entwicklungsbedingungen (`checkEvolution`) und Durchführen der Entwicklung (`evolvePokemon`), inklusive Item-Verbrauch, HP-Anpassung und Lernen neuer Attacken (über angenommene `EvolutionMove`/`LevelMove`-Modelle). *Spezielle Bedingungen sind vereinfacht.*
    *   **EP & Level-Up (Server):** Implementiert einen `experienceController` zum Hinzufügen von EP (`addExperience`), Berechnen des nächsten Levels (`calculateExperienceForLevel`) und Handhaben von Level-Ups (inkl. HP-Anpassung und Lernen neuer Attacken via `learnMoveIfPossible`). *Kein Ersetzen alter Attacken bei vollem Moveset.*
    *   **Client-UI:** Beschreibt einen `BattleSystem` (`battle.js`) zur Anzeige des Kampfbildschirms, der Pokémon-Infos, HP-Balken und Aktions-/Attacken-/Pokémon-/Item-Buttons. Sendet Aktionen an den Server und verarbeitet Updates. Beginnt mit der Beschreibung einer UI für die Pokémon-Entwicklung.

## Diagramm der Hauptkomponenten (basierend auf Dokumentation)

```mermaid
graph LR
    subgraph Client
        direction LR
        UI[HTML/CSS/JS] --> AuthForms[Login/Register Forms]
        UI --> GameScreen[Game Screen (game.js)]
        GameScreen --> SaveMgr[SaveManager]
        GameScreen --> InvMgr[InventoryManager]
        GameScreen --> BattleSys[BattleSystem]
        GameScreen --> EvoUI[Evolution UI]
        AuthForms --> ClientAuth[auth.js]
        ClientAuth --> ServerAPI
        SaveMgr -.-> ServerAPI
        InvMgr -.-> ServerAPI
        BattleSys -.-> ServerAPI
        EvoUI -.-> ServerAPI
        ClientAuth --> SocketClient[Socket.io Client]
        SaveMgr --> SocketClient
        InvMgr --> SocketClient
        BattleSys --> SocketClient
    end

    subgraph Server (Node.js/Express)
        direction TB
        ServerAPI[API Routes (/api)] --> AuthCtrl[Auth Controller]
        ServerAPI --> SaveCtrl[Save Controller]
        ServerAPI --> BattleCtrl[Battle Controller]
        ServerAPI --> EvoCtrl[Evolution Controller]
        ServerAPI --> ExpCtrl[Experience Controller]
        SocketServer[Socket.io Server] --> SocketAuth[Socket Auth Middleware]
        SocketServer --> SocketHandlers[Socket Event Handlers (save, battle)]
        AuthCtrl --> DBLayer
        SaveCtrl --> DBLayer
        BattleCtrl --> DBLayer
        EvoCtrl --> DBLayer
        ExpCtrl --> DBLayer
        SocketHandlers --> DBLayer
        BattleCtrl --> BattleUtils[battleUtils.js]
    end

    subgraph Database (SQLite/Sequelize)
        direction TB
        DBLayer[Models/Sequelize] --> PlayerTbl[(Players)]
        DBLayer --> ItemTbl[(Items)]
        DBLayer --> InvTbl[(Inventory)]
        DBLayer --> PokemonBaseTbl[(PokemonBase)]
        DBLayer --> PlayerPokemonTbl[(PlayerPokemon)]
        DBLayer --> MoveTbl[(Moves)]
        DBLayer --> PokemonMoveTbl[(PokemonMoves)]
        DBLayer --> ProgressTbl[(Progress)]
        DBLayer --> AchievementTbl[(Achievements)]
        DBLayer --> BattleTbl[(Battles)]
        DBLayer --> BattleActionTbl[(BattleActions)]
        DBLayer --> EvoMoveTbl[(EvolutionMoves?)]
        DBLayer --> LevelMoveTbl[(LevelMoves?)]
    end

    ClientAuth -- HTTP --> ServerAPI
    SaveMgr -- HTTP --> ServerAPI
    InvMgr -- HTTP --> ServerAPI
    BattleSys -- HTTP --> ServerAPI
    EvoUI -- HTTP --> ServerAPI

    SocketClient -- WebSocket --> SocketServer

    classDef client fill:#D6EAF8,stroke:#3498DB
    classDef server fill:#D5F5E3,stroke:#2ECC71
    classDef db fill:#FCF3CF,stroke:#F1C40F
    class UI,AuthForms,GameScreen,SaveMgr,InvMgr,BattleSys,EvoUI,ClientAuth,SocketClient client
    class ServerAPI,AuthCtrl,SaveCtrl,BattleCtrl,EvoCtrl,ExpCtrl,SocketServer,SocketAuth,SocketHandlers,BattleUtils server
    class DBLayer,PlayerTbl,ItemTbl,InvTbl,PokemonBaseTbl,PlayerPokemonTbl,MoveTbl,PokemonMoveTbl,ProgressTbl,AchievementTbl,BattleTbl,BattleActionTbl,EvoMoveTbl,LevelMoveTbl db