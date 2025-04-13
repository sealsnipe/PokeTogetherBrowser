# PokeTogetherBrowser - Detaillierter Projektbericht

## Übersicht

PokeTogetherBrowser ist ein Multiplayer-Pokémon-Browser-Spiel, das es Spielern ermöglicht, in einer gemeinsamen Welt zu interagieren, Pokémon zu fangen, zu trainieren und gegen andere Spieler anzutreten. Das Spiel kombiniert klassische Pokémon-Spielmechaniken mit modernen Multiplayer-Funktionen und ist vollständig im Browser spielbar.

## Technische Grundlagen

### Architektur

Das Projekt basiert auf einer Client-Server-Architektur:

- **Backend**: Node.js mit Express.js als Web-Framework
- **Frontend**: HTML, CSS und JavaScript mit Next.js für die Komponenten-Struktur
- **Echtzeit-Kommunikation**: Socket.io für Multiplayer-Funktionen und Chat
- **Datenbank**: SQLite mit Sequelize als ORM für die Datenpersistenz

### Hauptkomponenten

1. **Server**: Verwaltet die Spiellogik, Datenbankoperationen und Echtzeit-Kommunikation
2. **Client**: Rendert die Spielwelt, verarbeitet Benutzereingaben und kommuniziert mit dem Server
3. **Datenbank**: Speichert Spielerdaten, Pokémon, Items und andere Spielinformationen

## Spieler-Management und Authentifizierung

### Benutzerverwaltung

- **Registrierung und Login**: Spieler können sich mit Benutzername und Passwort registrieren und anmelden
- **Sitzungsverwaltung**: Verwendung von Session-IDs für die Authentifizierung
- **Testbenutzer**: Vordefinierte Testkonten (test1, test2, test3) mit dem Passwort "test"
- **Sicherheit**: Passwörter werden mit bcrypt gehasht gespeichert

### Spielerprofil

- **Spielerposition**: Die Position des Spielers wird in der Datenbank gespeichert und bei der Anmeldung wiederhergestellt
- **Spielstatistiken**: Spielzeit, Geldbestand und andere Statistiken werden verfolgt
- **Letzter Speicherstand**: Datum und Uhrzeit des letzten Speicherns werden aufgezeichnet

## Spielwelt und Bewegung

### Spielumgebung

- **Karte**: Eine 2D-Spielwelt, in der sich Spieler frei bewegen können
- **Kollisionserkennung**: Verhindert, dass Spieler die Grenzen der Karte verlassen
- **Skalierbare Auflösung**: Die Spielwelt passt sich an verschiedene Bildschirmgrößen an

### Bewegungsmechanik

- **Steuerung**: Spieler können sich mit den Pfeiltasten oder WASD-Tasten bewegen
- **Laufmodus**: Mit der Umschalttaste können Spieler zwischen Gehen und Laufen wechseln
- **Gleichmäßige Geschwindigkeit**: Die Bewegungsgeschwindigkeit ist konstant, ohne Beschleunigung oder Verzögerung
- **Optimierte Bewegung**: Die Bewegungsgeschwindigkeit ist auf das Dreifache der ursprünglichen Implementierung reduziert, um eine bessere Kontrolle zu ermöglichen

## Pokémon-System

### Pokémon-Verwaltung

- **Team-System**: Spieler können bis zu 10 Pokémon in ihrem aktiven Team haben
- **Lager-System**: Zusätzliche Pokémon werden im Lager aufbewahrt
- **Drag-and-Drop**: Pokémon können per Drag-and-Drop im Team neu angeordnet werden
- **Detailansicht**: Detaillierte Informationen zu jedem Pokémon werden in einem Seitenpanel angezeigt

### Pokémon-Eigenschaften

- **Grundattribute**: Name, Typ, Level, HP, Erfahrungspunkte
- **Typdarstellung**: Pokémon-Typen werden durch spezifische Symbole dargestellt (Käfer, Blitz, Flamme, Faust usw.)
- **Dual-Typ-Unterstützung**: Pokémon können zwei Typen haben, die beide angezeigt werden
- **Typ-Schwächen**: Die Detailansicht zeigt Typenschwächen mit 2x und 4x Schadensmodifikatoren

### Pokémon-Interaktionen

- **INFO-Option**: Zeigt detaillierte Informationen über das Pokémon an
- **GEBEN-Option**: Ermöglicht es, dem Pokémon Items zu geben
- **Team/Lager-Wechsel**: Pokémon können zwischen aktivem Team und Lager verschoben werden

## Kampfsystem

### Kampftypen

- **Wilde Pokémon**: Kämpfe gegen zufällig erscheinende wilde Pokémon
- **Trainer**: Kämpfe gegen computergesteuerte Trainer
- **Spieler**: PvP-Kämpfe gegen andere Spieler

### Kampfmechanik

- **Rundenbasiert**: Abwechselnde Züge zwischen den Kämpfern
- **Aktionen**: Angreifen, Pokémon wechseln, Item verwenden, Fliehen
- **Typ-Effektivität**: Implementierung des Pokémon-Typsystems mit Stärken und Schwächen
- **Schadenberechnung**: Berücksichtigt Angriffsstärke, Verteidigung und Typ-Effektivität

### Kampfbelohnungen

- **Erfahrungspunkte**: Pokémon erhalten EP nach gewonnenen Kämpfen
- **Level-Aufstieg**: Pokémon können im Level aufsteigen und werden stärker
- **Items**: Möglichkeit, nach Kämpfen Items zu erhalten

## Inventarsystem

### Item-Verwaltung

- **Kategorisierung**: Items sind in verschiedene Kategorien eingeteilt (Bälle, Medizin, Halte-Items, TMs, HMs, Quest-Items)
- **Sortierung**: Items können nach Name (aufsteigend/absteigend) und Typ sortiert werden
- **Filterung**: Items können nach Typ gefiltert werden

### Item-Interaktionen

- **Verwendung**: Items können auf Pokémon angewendet werden
- **Info-Anzeige**: Detaillierte Informationen zu jedem Item
- **Wegwerfen**: Unerwünschte Items können entfernt werden

## Benutzeroberfläche

### Layout

- **Dreispalten-Layout**: Inventar links, Spielfeld in der Mitte, Pokémon-Team rechts
- **Responsive Design**: Die UI passt sich an verschiedene Bildschirmgrößen an
- **Skalierbare Komponenten**: Container-Dimensionen werden angepasst, nicht nur Schriftgrößen

### Optionsmenü

- **Zugänglichkeit**: Über ein Zahnrad-Symbol außerhalb des Spielfensters erreichbar
- **Auflösungseinstellungen**: Verschiedene Auflösungsoptionen für das Spielfenster
- **Einstellungsspeicherung**: Benutzereinstellungen werden lokal gespeichert

### Chat-System

- **Spielerliste**: Schmale Spalte mit aktiven Spielern
- **Chat-Bereich**: Breiter Bereich für Chatnachrichten
- **Scrollfunktion**: Automatisches Scrollen bei neuen Nachrichten
- **Zeitstempel**: Nachrichten werden mit Zeitstempeln angezeigt

## Spielerfahrung

### Multiplayer-Aspekte

- **Echtzeit-Interaktion**: Spieler sehen die Bewegungen anderer Spieler in Echtzeit
- **Soziale Komponente**: Chat-System ermöglicht Kommunikation zwischen Spielern
- **Gemeinsame Welt**: Alle Spieler teilen sich dieselbe Spielwelt

### Progression

- **Pokémon-Entwicklung**: Pokémon können sich entwickeln und stärker werden
- **Sammelsystem**: Anreiz, verschiedene Pokémon zu fangen und zu sammeln
- **Teambuilding**: Strategisches Zusammenstellen eines ausgewogenen Teams

### Benutzerfreundlichkeit

- **Intuitive Steuerung**: Einfache Tastatursteuerung für die Bewegung
- **Klare Menüführung**: Übersichtliche Menüs für verschiedene Spielfunktionen
- **Visuelle Rückmeldung**: Deutliche visuelle Hinweise bei Aktionen

## Technische Besonderheiten

### Datenpersistenz

- **Automatisches Speichern**: Spielerposition und -status werden automatisch gespeichert
- **Datenbank-Integration**: Alle Spielerdaten werden in einer SQLite-Datenbank gespeichert
- **Beziehungsmodell**: Komplexes Datenbankschema mit Beziehungen zwischen Spielern, Pokémon und Items

### Netzwerk-Optimierung

- **Ratenbegrenzung**: Bewegungsupdates werden mit einer Ratenbegrenzung gesendet, um die Netzwerklast zu reduzieren
- **Effiziente Datenübertragung**: Nur notwendige Daten werden zwischen Client und Server übertragen

### Sicherheit

- **Authentifizierung**: Sichere Benutzerauthentifizierung mit Passwort-Hashing
- **Eingabevalidierung**: Validierung aller Benutzereingaben zur Verhinderung von Injection-Angriffen
- **Zugriffskontrolle**: Überprüfung der Berechtigungen für alle Aktionen

## Zusammenfassung

PokeTogetherBrowser ist ein umfangreiches Multiplayer-Pokémon-Spiel, das klassische Pokémon-Spielmechaniken mit modernen Webtechnologien kombiniert. Es bietet ein vollständiges Spielerlebnis mit Pokémon-Fangen, -Training und -Kämpfen in einer gemeinsamen Spielwelt. Die Implementierung umfasst ein detailliertes Pokémon-System, ein Inventarsystem, ein Kampfsystem und soziale Funktionen wie Chat, die zusammen ein reichhaltiges und interaktives Spielerlebnis schaffen.
