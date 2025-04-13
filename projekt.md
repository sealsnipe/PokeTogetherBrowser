# Projektüberblick: PokeTogetherBrowser



## 1. Projektziel



PokeTogetherBrowser ist ein webbasiertes Multiplayer-Spiel, das von Pokémon inspiriert ist. Ziel ist es, Spielern zu ermöglichen, sich in einer gemeinsamen Online-Welt zu bewegen, zu interagieren (Chat), Pokémon zu fangen, zu trainieren, zu entwickeln und gegeneinander oder gegen wilde Pokémon zu kämpfen. Das Spiel soll persistent sein, d.h. der Fortschritt der Spieler (Position, Inventar, Pokémon, Quests) wird gespeichert.



## 2. Kernfeatures



Basierend auf der Analyse der Dokumentation (`agent/*.md`) und des aktuellen Codes (Stand: 2025-04-13 ca. 15:30 Uhr) ergibt sich folgendes Bild:



**Aktuell implementierte Features (im Code vorhanden):**



I  **Client-Server-Architektur:** Grundlegender Aufbau mit Node.js/Express-Server und Client-Anwendung.

II  **Echtzeit-Kommunikation:** Nutzung von Socket.io für die Synchronisation von Spielerpositionen und Chat-Nachrichten.

III  **Spielerbewegung:** Spieler können sich auf einer 2D-Karte bewegen, ihre Position wird mit anderen Spielern synchronisiert.

IV  **Chat:** Spieler können Nachrichten senden, die allen angezeigt werden.

V  **Datenbank:** SQLite mit Sequelize als ORM ist eingerichtet. Grundlegende Modelle für Spieler, Items, Pokémon etc. sind vorhanden.

VI  **Authentifizierung:** Umgestellt auf JWT/Cookie-basiertes System (Tickets 7-11). Login, Logout, Registrierung und Session-Prüfung (`/api/auth/me`) implementiert. Socket.io-Authentifizierung erfolgt über das Cookie.

VII  **Client-Struktur:** Modularer Aufbau im `client/js/modules`-Verzeichnis. Verwendung von Canvas für das Rendering. (Hinweis: Die Anwesenheit von `.next/`, `pages/`, `components/` deutet stark auf die Verwendung von **Next.js/React** hin, was über eine einfache HTML/JS-Struktur hinausgeht).

VIII  **JWT/Cookie-Authentifizierung:** Implementiert (Tickets 7-11).
IX  **Registrierung:** Implementiert (Tickets 8, 10).
X   **Registrierung:** Implementiert (Tickets 8, 10).


**Geplante/Dokumentierte Features (in `agent/*.md`, aber aktuell *nicht* im Code implementiert):**


1.  **Spielstand-Management (API-basiert):**
    1.1  Speichern/Laden des Spieler-Inventars.
    1.2  Speichern/Laden des Pokémon-Teams und des Pokémon-Lagers.
    1.3  Speichern/Laden von Spielerdaten (Geld, Spielzeit, Position).
    1.4  Speichern/Laden des Quest-Fortschritts.
    1.5  Speichern/Laden von Errungenschaften.

2.  **Inventar-System:** Vollständige Verwaltung von Items (Anzeigen, Benutzen, Wegwerfen, Geben).

3.  **Pokémon-Management:** Team-Zusammenstellung, Lagerung, Attacken lernen/vergessen.

4.  **Kampfsystem:** Rundenbasierte Kämpfe gegen wilde Pokémon und andere Spieler (Trainer-Kämpfe waren geplant, aber nicht detailliert). Inklusive Schadensberechnung, Typ-Effektivität, Status-Effekten (nicht detailliert), Erfahrungspunkten.

5.  **Pokémon-Entwicklung:** Entwicklung basierend auf Level, Items oder speziellen Bedingungen.

6.  **Level-Up-System:** Sammeln von Erfahrungspunkten, Levelaufstiege mit Status-Verbesserungen und Erlernen neuer Attacken.

7.  **Fortschrittssystem:** Verfolgung von Quests und Errungenschaften.



## 3. Architektur & Technologien



1.  **Backend (Server):**
    1.  **Laufzeitumgebung:** Node.js
    2.  **Web-Framework:** Express.js (für HTTP API und statische Dateien)
    3.  **Echtzeit-Kommunikation:** Socket.io
    4.  **Datenbank:** SQLite (für Entwicklung)
    5.  **ORM:** Sequelize
    6.  **Authentifizierung:** JWT (JSON Web Tokens) via Cookies (HttpOnly, SameSite=Lax), bcrypt (Passwort-Hashing).

    *   **Datenbank:** SQLite (für Entwicklung)

    *   **ORM:** Sequelize

    *   **Authentifizierung:** JWT (JSON Web Tokens) via Cookies (HttpOnly, SameSite=Lax), bcrypt (Passwort-Hashing).

2.  **Frontend (Client):**
    1.  **Sprache:** JavaScript (ES Modules)
    2.  **Rendering:** HTML Canvas API (über `client/js/modules/renderer.js`)
    3.  **Framework (vermutet):** Next.js / React (basierend auf Verzeichnisstruktur `.next/`, `pages/`, `components/`)
    4.  **Kommunikation:** Socket.io-Client, Fetch API (für HTTP-Anfragen)
    5.  **Authentifizierung:** Sendet Cookie automatisch an HTTP API (via `credentials: 'include'`) und Socket.io (via `withCredentials: true`). Kein `localStorage` mehr für Auth-Daten.
    *   **Framework (vermutet):** Next.js / React (basierend auf Verzeichnisstruktur `.next/`, `pages/`, `components/`)

    *   **Kommunikation:** Socket.io-Client, Fetch API (für HTTP-Anfragen)

    *   **Authentifizierung:** Sendet Cookie automatisch an HTTP API (via `credentials: 'include'`) und Socket.io (via `withCredentials: true`). Kein `localStorage` mehr für Auth-Daten.

3.  **Kommunikationswege:**
    1.  **HTTP API (`/api/*`):** Für Login, Logout, Registrierung, Session-Prüfung (`/api/auth/*`); geplant für Spielstand-Management, etc.
    2.  **WebSockets (Socket.io):** Für Echtzeit-Events wie Spielerbewegung, Chat, Spieler beitreten/verlassen; geplant für Kampf-Updates.

    *   **WebSockets (Socket.io):** Für Echtzeit-Events wie Spielerbewegung, Chat, Spieler beitreten/verlassen; geplant für Kampf-Updates.



## 4. Aktueller Stand & Diskrepanzen (Zusammenfassung der Analyse)



Der wichtigste Punkt ist die **signifikante Diskrepanz zwischen der detaillierten Dokumentation in `agent/*.md` und dem tatsächlichen Code-Stand**.



1.  **Authentifizierung:** Das System wurde erfolgreich auf JWT/Cookie-Authentifizierung umgestellt (Tickets 7-11). Login, Logout und Registrierung sind implementiert und entsprechen der Zielarchitektur. Die Diskrepanz wurde behoben.
2.  **Fehlende Kernfeatures:** Die meisten in der Dokumentation beschriebenen Gameplay-Features (Kämpfe, Entwicklung, detaillierter Spielstand, Fortschritt, Inventar-/Pokémon-Management über Server) sind im aktuellen Code nicht implementiert. Die Datenbankmodelle dafür fehlen teilweise ebenfalls.
3.  **Client-Technologie:** Der Client scheint Next.js/React zu verwenden, was fortschrittlicher ist als die in der Dokumentation implizierte einfache HTML/JS-Struktur.
4.  **Redundanzen/Inkonsistenzen in der Doku:** Die Dokumentation selbst enthält Hinweise auf potenziell redundante Ansätze (z.B. Speichern über HTTP vs. Socket.io).
5.   **Client-Technologie:** Der Client scheint Next.js/React zu verwenden, was fortschrittlicher ist als die in der Dokumentation implizierte einfache HTML/JS-Struktur.

*   **Redundanzen/Inkonsistenzen in der Doku:** Die Dokumentation selbst enthält Hinweise auf potenziell redundante Ansätze (z.B. Speichern über HTTP vs. Socket.io).



**Das Authentifizierungssystem wurde erfolgreich gemäß der Dokumentation umgestellt (Tickets 7-11). Die Basis für die Implementierung weiterer Features ist nun geschaffen.**



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
        AuthForms --> ClientAuth[auth.js (Login/Register/Register/Logout/Check)]
        ClientAuth --> ServerAPIAuth
        SaveMgr -.-> ServerAPISave
        InvMgr -.-> ServerAPISave
        BattleSys -.-> ServerAPIBattle
        EvoUI -.-> ServerAPIEvo
        ClientAuth -- HTTP (mit Cookie) --> ServerAPIAuth

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



    SocketClient -- WebSocket (mit Cookie) --> SocketServer



    classDef client fill:#D6EAF8,stroke:#3498DB

    classDef server fill:#D5F5E3,stroke:#2ECC71

    classDef db fill:#FCF3CF,stroke:#F1C40F

    class UI,AuthForms,GameScreen,SaveMgr,InvMgr,BattleSys,EvoUI,ClientAuth,SocketClient client

    class ServerAPI,ServerAPIAuth,ServerAPISave,ServerAPIBattle,ServerAPIEvo,ServerAPIExp,AuthCtrl,SaveCtrl,BattleCtrl,EvoCtrl,ExpCtrl,AuthMiddleware,SocketServer,SocketAuthMiddleware,SocketHandlers,BattleUtils server

    class DBLayer,PlayerTbl,ItemTbl,InvTbl,PokemonBaseTbl,PlayerPokemonTbl,MoveTbl,PokemonMoveTbl,ProgressTbl,AchievementTbl,BattleTbl,BattleActionTbl,EvoMoveTbl,LevelMoveTbl db



```



*(Hinweis: Fragezeichen im Diagramm deuten auf Modelle/Routen hin, die dokumentiert, aber aktuell nicht im Code gefunden wurden).*