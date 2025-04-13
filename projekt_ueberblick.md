# Projektüberblick: PokeTogetherBrowser

## 1. Projektziel

PokeTogetherBrowser ist ein webbasiertes Multiplayer-Spiel, das von Pokémon inspiriert ist. Ziel ist es, Spielern zu ermöglichen, sich in einer gemeinsamen Online-Welt zu bewegen, zu interagieren (Chat), Pokémon zu fangen, zu trainieren, zu entwickeln und gegeneinander oder gegen wilde Pokémon zu kämpfen. Das Spiel soll persistent sein, d.h. der Fortschritt der Spieler (Position, Inventar, Pokémon, Quests) wird gespeichert.

## 2. Kernfeatures

Basierend auf der Analyse der Dokumentation (`agent/*.md`) und des aktuellen Codes (Stand: 2025-04-13 ca. 15:30 Uhr) ergibt sich folgendes Bild:

**Aktuell implementierte Features (im Code vorhanden):**

*   **Client-Server-Architektur:** Grundlegender Aufbau mit Node.js/Express-Server und Client-Anwendung.
*   **Echtzeit-Kommunikation:** Nutzung von Socket.io für die Synchronisation von Spielerpositionen und Chat-Nachrichten.
*   **Spielerbewegung:** Spieler können sich auf einer 2D-Karte bewegen, ihre Position wird mit anderen Spielern synchronisiert.
*   **Chat:** Spieler können Nachrichten senden, die allen angezeigt werden.
*   **Datenbank:** SQLite mit Sequelize als ORM ist eingerichtet. Grundlegende Modelle für Spieler, Items, Pokémon etc. sind vorhanden.
*   **Authentifizierung (Basis):** Ein Session-basiertes Login/Logout über eine HTTP-API ist implementiert. Die Socket.io-Verbindung wird über diese Session authentifiziert. **(Hinweis: Weicht stark von der Dokumentation ab!)**
*   **Client-Struktur:** Modularer Aufbau im `client/js/modules`-Verzeichnis. Verwendung von Canvas für das Rendering. (Hinweis: Die Anwesenheit von `.next/`, `pages/`, `components/` deutet stark auf die Verwendung von **Next.js/React** hin, was über eine einfache HTML/JS-Struktur hinausgeht).

**Geplante/Dokumentierte Features (in `agent/*.md`, aber aktuell *nicht* im Code implementiert):**

*   **JWT/Cookie-Authentifizierung:** Ein robusteres Authentifizierungssystem basierend auf JSON Web Tokens und Cookies.
*   **Registrierung:** Möglichkeit für neue Benutzer, ein Konto zu erstellen.
*   **Detailliertes Spielstand-Management:** Speichern und Laden von Inventar, Pokémon-Team/Lager, Geld, Spielzeit, Quests, Errungenschaften über eine API.
*   **Inventar-System:** Vollständige Verwaltung von Items (Anzeigen, Benutzen, Wegwerfen, Geben).
*   **Pokémon-Management:** Team-Zusammenstellung, Lagerung, Attacken lernen/vergessen.
*   **Kampfsystem:** Rundenbasierte Kämpfe gegen wilde Pokémon und andere Spieler (Trainer-Kämpfe waren geplant, aber nicht detailliert). Inklusive Schadensberechnung, Typ-Effektivität, Status-Effekten (nicht detailliert), Erfahrungspunkten.
*   **Pokémon-Entwicklung:** Entwicklung basierend auf Level, Items oder speziellen Bedingungen.
*   **Level-Up-System:** Sammeln von Erfahrungspunkten, Levelaufstiege mit Status-Verbesserungen und Erlernen neuer Attacken.
*   **Fortschrittssystem:** Verfolgung von Quests und Errungenschaften.

## 3. Architektur & Technologien

*   **Backend (Server):**
    *   **Laufzeitumgebung:** Node.js
    *   **Web-Framework:** Express.js (für HTTP API und statische Dateien)
    *   **Echtzeit-Kommunikation:** Socket.io
    *   **Datenbank:** SQLite (für Entwicklung)
    *   **ORM:** Sequelize
    *   **Authentifizierung (aktuell):** Serverseitige Sessions (im Speicher)
    *   **Authentifizierung (geplant):** JWT (JSON Web Tokens) via Cookies, bcrypt (Passwort-Hashing)
*   **Frontend (Client):**
    *   **Sprache:** JavaScript (ES Modules)
    *   **Rendering:** HTML Canvas API (über `client/js/modules/renderer.js`)
    *   **Framework (vermutet):** Next.js / React (basierend auf Verzeichnisstruktur `.next/`, `pages/`, `components/`)
    *   **Kommunikation:** Socket.io-Client, Fetch API (für HTTP-Anfragen)
    *   **Authentifizierung (aktuell):** Sendet Session-ID aus `localStorage` an Socket.io.
    *   **Authentifizierung (geplant):** Sendet JWT aus Cookie (via `credentials: 'include'`) an HTTP API, sendet JWT manuell an Socket.io.
*   **Kommunikationswege:**
    *   **HTTP API (`/api/*`):** Für Login, Logout (aktuell); geplant für Registrierung, Spielstand-Management, etc.
    *   **WebSockets (Socket.io):** Für Echtzeit-Events wie Spielerbewegung, Chat, Spieler beitreten/verlassen; geplant für Kampf-Updates.

## 4. Aktueller Stand & Diskrepanzen (Zusammenfassung der Analyse)

Der wichtigste Punkt ist die **signifikante Diskrepanz zwischen der detaillierten Dokumentation in `agent/*.md` und dem tatsächlichen Code-Stand**.

*   **Authentifizierung:** Der Code verwendet ein einfaches, im Speicher gehaltenes Session-System, während die Dokumentation ein JWT/Cookie-System beschreibt. Eine Registrierungsfunktion fehlt im Code komplett.
*   **Fehlende Kernfeatures:** Die meisten in der Dokumentation beschriebenen Gameplay-Features (Kämpfe, Entwicklung, detaillierter Spielstand, Fortschritt, Inventar-/Pokémon-Management über Server) sind im aktuellen Code nicht implementiert. Die Datenbankmodelle dafür fehlen teilweise ebenfalls.
*   **Client-Technologie:** Der Client scheint Next.js/React zu verwenden, was fortschrittlicher ist als die in der Dokumentation implizierte einfache HTML/JS-Struktur.
*   **Redundanzen/Inkonsistenzen in der Doku:** Die Dokumentation selbst enthält Hinweise auf potenziell redundante Ansätze (z.B. Speichern über HTTP vs. Socket.io).

**Die unmittelbare Aufgabe (wie in den `tickets/` beschrieben) ist es, das Authentifizierungssystem gemäß der Dokumentation umzustellen und die Registrierung hinzuzufügen, um eine solide Basis für die Implementierung der weiteren Features zu schaffen.**

## 5. Diagramm (Basierend auf dokumentiertem/geplantem Stand)

```mermaid
graph LR
    subgraph Client
        direction LR
        UI[HTML/CSS/JS/React?] --> AuthForms[Login/Register Forms]
        UI --> GameScreen[Game Screen (game.js)]
        GameScreen --> SaveMgr[SaveManager]
        GameScreen --> InvMgr[InventoryManager]
        GameScreen --> BattleSys[BattleSystem]
        GameScreen --> EvoUI[Evolution UI]
        AuthForms --> ClientAuth[auth.js (Login/Register/Logout/Check)]
        ClientAuth --> ServerAPIAuth
        SaveMgr -.-> ServerAPISave
        InvMgr -.-> ServerAPISave
        BattleSys -.-> ServerAPIBattle
        EvoUI -.-> ServerAPIEvo
        ClientAuth --> SocketClient[Socket.io Client (socketHandler.js)]
        SaveMgr --> SocketClient
        InvMgr --> SocketClient
        BattleSys --> SocketClient
    end

    subgraph Server (Node.js/Express)
        direction TB
        ServerAPI[API Routes (/api)]
        ServerAPIAuth[Auth Routes (/api/auth)] --> AuthCtrl[Auth Controller (JWT, Cookie)]
        ServerAPISave[Save Routes (/api/save)] --> SaveCtrl[Save Controller]
        ServerAPIBattle[Battle Routes (/api/battle)] --> BattleCtrl[Battle Controller]
        ServerAPIEvo[Evo Routes (/api/evolution)] --> EvoCtrl[Evolution Controller]
        ServerAPIExp[Exp Routes (/api/experience)] --> ExpCtrl[Experience Controller]
        ServerAPIAuth --> AuthMiddleware[Auth Middleware (authenticate)]
        ServerAPISave --> AuthMiddleware
        ServerAPIBattle --> AuthMiddleware
        ServerAPIEvo --> AuthMiddleware
        ServerAPIExp --> AuthMiddleware
        AuthCtrl --> DBLayer
        SaveCtrl --> DBLayer
        BattleCtrl --> DBLayer
        EvoCtrl --> DBLayer
        ExpCtrl --> DBLayer
        SocketServer[Socket.io Server] --> SocketAuthMiddleware[Socket Auth Middleware (JWT)]
        SocketServer --> SocketHandlers[Socket Event Handlers (move, chat, save?, battle?)]
        SocketAuthMiddleware --> DBLayer
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
        DBLayer --> ProgressTbl[(Progress?)]
        DBLayer --> AchievementTbl[(Achievements?)]
        DBLayer --> BattleTbl[(Battles?)]
        DBLayer --> BattleActionTbl[(BattleActions?)]
        DBLayer --> EvoMoveTbl[(EvolutionMoves?)]
        DBLayer --> LevelMoveTbl[(LevelMoves?)]
    end

    ClientAuth -- HTTP (mit Cookie) --> ServerAPIAuth
    SaveMgr -- HTTP (mit Cookie) --> ServerAPISave
    InvMgr -- HTTP (mit Cookie) --> ServerAPISave
    BattleSys -- HTTP (mit Cookie) --> ServerAPIBattle
    EvoUI -- HTTP (mit Cookie) --> ServerAPIEvo

    SocketClient -- WebSocket (mit Token im Auth-Objekt) --> SocketServer

    classDef client fill:#D6EAF8,stroke:#3498DB
    classDef server fill:#D5F5E3,stroke:#2ECC71
    classDef db fill:#FCF3CF,stroke:#F1C40F
    class UI,AuthForms,GameScreen,SaveMgr,InvMgr,BattleSys,EvoUI,ClientAuth,SocketClient client
    class ServerAPI,ServerAPIAuth,ServerAPISave,ServerAPIBattle,ServerAPIEvo,ServerAPIExp,AuthCtrl,SaveCtrl,BattleCtrl,EvoCtrl,ExpCtrl,AuthMiddleware,SocketServer,SocketAuthMiddleware,SocketHandlers,BattleUtils server
    class DBLayer,PlayerTbl,ItemTbl,InvTbl,PokemonBaseTbl,PlayerPokemonTbl,MoveTbl,PokemonMoveTbl,ProgressTbl,AchievementTbl,BattleTbl,BattleActionTbl,EvoMoveTbl,LevelMoveTbl db

```

*(Hinweis: Fragezeichen im Diagramm deuten auf Modelle/Routen hin, die dokumentiert, aber aktuell nicht im Code gefunden wurden).*