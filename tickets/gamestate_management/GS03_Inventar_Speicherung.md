## Einführung für neue Bearbeiter

Dieses Ticket befasst sich mit der Erweiterung und Erstellung von Datenmodellen für die Spielstand-Speicherung im PokeTogetherBrowser-Projekt. Das Projekt verwendet Node.js, Express, Sequelize (ORM) und eine relationale Datenbank (wahrscheinlich PostgreSQL oder MySQL).

**Wichtige Konzepte:**

*   **Sequelize:** Ein ORM (Object-Relational Mapper), der die Interaktion mit der Datenbank vereinfacht. Modelle definieren Tabellen und Beziehungen.
*   **Datenbank-Migrationen:** Änderungen an der Datenbankstruktur sollten idealerweise über Migrationen erfolgen, um die Konsistenz zu gewährleisten.
*   **Spielstand-Speicherung:** Die persistente Speicherung des Spielerfortschritts ist entscheidend für ein ansprechendes Spielerlebnis.

**Relevante Technologien:**

*   JavaScript (ES6+)
*   Node.js
*   Express
*   Sequelize
*   PostgreSQL oder MySQL
## Anweisungen für Deep Research

Dieses Kapitel richtet sich an Bearbeiter, die das Ticket durch umfassende Recherche weiter ausführen sollen. Ziel ist es, alle notwendigen Informationen zu sammeln und zu dokumentieren, um das Ticket allumfassend zu gestalten.

**Wichtige Aspekte:**

*   **Vollständigkeit:** Stelle sicher, dass alle relevanten Informationen zum Thema recherchiert und dokumentiert werden.
*   **Genauigkeit:** Überprüfe die recherchierten Informationen auf ihre Richtigkeit und Glaubwürdigkeit.
*   **Bezüge:** Dokumentiere alle Bezüge zu anderen Tickets, Modulen, Klassen oder Funktionen im Projekt.
*   Kontext: Stelle sicher, dass der Kontext der recherchierten Informationen klar und verständlich ist.
*   Programmiersprache: Beachte die spezifischen Grundkonstrukte und Besonderheiten von JavaScript (ES6+) und Node.js.
*   Sequelize: Recherchiere spezifische Sequelize-Funktionen und -Methoden, die im Ticket verwendet werden.
*   Datenbank: Recherchiere datenbankspezifische Konzepte (z.B. Indizes, Transaktionen, Normalisierung), die für die Spielstand-Speicherung relevant sind.

**Zu dokumentierende Informationen:**

*   Datenmodelle: Beschreibe die Struktur der Datenmodelle (Tabellen, Spalten, Datentypen) und ihre Beziehungen zueinander.
*   Funktionen: Dokumentiere die Funktionsweise der relevanten Funktionen und Methoden.
*   Klassen: Beschreibe die Struktur und das Verhalten der relevanten Klassen.
*   Module: Erkläre die Rolle und den Zweck der relevanten Module.
*   Konfiguration: Dokumentiere alle relevanten Konfigurationseinstellungen.
*   Abhängigkeiten: Liste alle Abhängigkeiten zu anderen Modulen, Klassen oder Funktionen auf.
*   Beispiele: Füge Codebeispiele hinzu, um die Verwendung der recherchierten Konzepte zu veranschaulichen.
*   Ressourcen: Verlinke auf externe Ressourcen (z.B. Dokumentationen, Tutorials, Blog-Artikel), die für das Thema relevant sind.

**Grundkonstrukte der Programmiersprache (JavaScript/Node.js):**

*   Asynchrone Programmierung: Verstehe die Konzepte von Promises, async/await und Callbacks.
*   Module: Recherchiere, wie Module in Node.js verwendet werden (require, module.exports).
*   ES6+ Features: Beachte moderne JavaScript-Features wie arrow functions, classes, destructuring und spread operator.



**Ziel:**

Das Ziel dieser Recherche ist es, ein umfassendes Verständnis des Themas zu erlangen und alle notwendigen Informationen zu dokumentieren, um das Ticket allumfassend zu gestalten und zukünftigen Bearbeitern die Arbeit zu erleichtern.

---


---

# Ticket GS03: Inventar-Speicherung (Controller & Route)

**Ziel:** Implementierung der serverseitigen Logik zum Aktualisieren des Spieler-Inventars über eine API-Route. Anpassung der `loadGame`-Funktion, um das Inventar mitzuladen.

---

## 1. Grundprinzipien & Zielsetzung

Die Inventarverwaltung ist ein Kernfeature, das es Spielern ermöglicht, Items zu sammeln, zu verwenden und zu verwalten. Dieses Ticket konzentriert sich auf die serverseitige Implementierung, die folgende Prinzipien erfüllen muss:

- **Datenkonsistenz:** Änderungen am Inventar müssen atomar sein, d.h. entweder alle Änderungen werden erfolgreich durchgeführt oder keine davon. Dies wird durch Datenbanktransaktionen erreicht.
- **Validierung:** Die Eingabedaten vom Client müssen validiert werden, um ungültige Zustände zu verhindern (z.B. negative Item-Anzahlen).
- **Effizienz:** Die API soll effizient sein und nur die notwendigen Daten übertragen.
- **Sicherheit:** Nur authentifizierte Benutzer sollen ihr Inventar verändern können.

---

## 2. Detaillierte Logik & Schritt-für-Schritt-Erklärung

### 2.1. `updateInventory`-Funktion implementieren (`server/controllers/saveController.js`)

- **Ziel:** Implementierung der serverseitigen Logik, um Änderungen am Inventar eines Spielers zu verarbeiten (Hinzufügen, Entfernen, Setzen der Anzahl).
- **Warum:** Das Inventar ist ein dynamischer Teil des Spielstands, der sich ständig ändert. Eine dedizierte Funktion ermöglicht es dem Client, Änderungen effizient an den Server zu übertragen.
- **Details:**
    - Die Funktion erwartet ein Array von Item-Änderungen im Request-Body. Jede Änderung wird als Objekt mit den Eigenschaften `itemId`, `quantity` und `action` übergeben.
    - Die `action` kann einen der folgenden Werte haben:
        - `add`: Fügt dem Inventar eine bestimmte Anzahl von Items hinzu.
        - `remove`: Entfernt eine bestimmte Anzahl von Items aus dem Inventar.
        - `set`: Setzt die Anzahl eines Items auf einen bestimmten Wert.
    - Die Funktion muss sicherstellen, dass die Daten valide sind (z.B. `itemId` und `quantity` sind Zahlen, `quantity` ist nicht negativ).
    - Die Funktion muss für jede Änderung den entsprechenden Inventareintrag in der Datenbank suchen und die Änderung entsprechend anwenden.
    - Wenn ein Item hinzugefügt wird, das noch nicht im Inventar vorhanden ist, muss ein neuer Eintrag erstellt werden.
    - Wenn ein Item entfernt wird und die Anzahl auf 0 oder weniger sinkt, muss der Eintrag aus dem Inventar gelöscht werden.
    - Um Datenkonsistenz zu gewährleisten, müssen alle Änderungen innerhalb einer Datenbank-Transaktion durchgeführt werden.
    - Schließlich wird eine Erfolgsantwort mit dem aktualisierten Inventar zurückgegeben.
    - Ein `try...catch`-Block fängt alle potenziellen Fehler ab und gibt einen entsprechenden Fehlercode zurück.
- **Code:**
```javascript
// server/controllers/saveController.js

exports.updateInventory = async (req, res) => {
  try {
    const playerId = req.player.id;
    // Erwartet ein Array von Item-Änderungen im Body
    // Beispiel: [{ itemId: 1, quantity: 5, action: 'add' }, { itemId: 2, quantity: 1, action: 'remove' }]
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'Ungültiges Format für Items. Ein Array wird erwartet.' });
    }

    // Transaktion starten, um atomare Operationen sicherzustellen
    const transaction = await db.sequelize.transaction();

    try {
      // Jede Item-Änderung verarbeiten
      for (const itemChange of items) {
        const { itemId, quantity, action } = itemChange;

        if (typeof itemId !== 'number' || typeof quantity !== 'number' || quantity < 0) {
           throw new Error(`Ungültige Daten für Item ${itemId}: quantity muss eine positive Zahl sein.`);
        }

        // Aktuellen Inventareintrag für dieses Item finden
        const inventoryItem = await db.InventoryItem.findOne({
          where: {
            PlayerId: playerId,
            ItemId: itemId
          },
          transaction
        });

        switch (action) {
          case 'add':
            if (inventoryItem) {
              // Item bereits vorhanden, Anzahl erhöhen
              inventoryItem.quantity += quantity;
              await inventoryItem.save({ transaction });
            } else {
              // Neues Item hinzufügen
              await db.InventoryItem.create({
                PlayerId: playerId,
                ItemId: itemId,
                quantity: quantity
              }, { transaction });
            }
            break;

          case 'remove':
            if (!inventoryItem) {
               console.warn(`Versuch, Item ${itemId} zu entfernen, das Spieler ${playerId} nicht besitzt.`);
               continue; // Nächstes Item bearbeiten
            }
            inventoryItem.quantity -= quantity;
            if (inventoryItem.quantity <= 0) {
              // Item komplett entfernen
              await inventoryItem.destroy({ transaction });
            } else {
              await inventoryItem.save({ transaction });
            }
            break;

          case 'set':
            if (inventoryItem) {
              if (quantity <= 0) {
                // Item entfernen, wenn Anzahl 0 oder weniger
                await inventoryItem.destroy({ transaction });
              } else {
                // Anzahl direkt setzen
                inventoryItem.quantity = quantity;
                await inventoryItem.save({ transaction });
              }
            } else if (quantity > 0) {
              // Neues Item hinzufügen, wenn es vorher nicht existierte
              await db.InventoryItem.create({
                PlayerId: playerId,
                ItemId: itemId,
                quantity: quantity
              }, { transaction });
            }
            break;

          default:
            // Unbekannte Aktion ignorieren oder Fehler werfen
            console.warn(`Unbekannte Inventar-Aktion '${action}' für Item ${itemId}.`);
            // Optional: throw new Error(`Unbekannte Aktion: ${action}`);
        }
      } // Ende der for-Schleife

      // Wenn alle Änderungen erfolgreich waren, Transaktion bestätigen
      await transaction.commit();

      // Optional: Aktualisiertes Inventar zurücksenden (oder nur Erfolgsmeldung)
      const updatedInventory = await db.InventoryItem.findAll({
        where: { PlayerId: playerId },
        include: [{ model: db.Item, attributes: ['id', 'name', 'type', 'icon'] }] // Nur relevante Item-Daten
      });

      res.status(200).json({
        message: 'Inventar erfolgreich aktualisiert',
        inventory: updatedInventory.map(item => ({
          id: item.Item.id,
          name: item.Item.name,
          type: item.Item.type,
          quantity: item.quantity,
          icon: item.Item.icon
        }))
      });

    } catch (error) {
      // Bei Fehlern innerhalb der Schleife, Transaktion zurückrollen
      await transaction.rollback();
      console.error('Fehler während der Inventar-Transaktion:', error);
      // Unterscheiden, ob es ein Client-Fehler (z.B. ungültige Daten) oder Server-Fehler war
      if (error.message.startsWith('Ungültige Daten')) {
         res.status(400).json({ message: error.message });
      } else {
         res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Inventars.' });
      }
    }
  } catch (error) {
    // Fängt Fehler ab, die vor der Transaktion auftreten (z.B. ungültiges Body-Format)
    console.error('Fehler beim Aktualisieren des Inventars (vor Transaktion):', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Inventars.' });
  }
};
```

### 2.2. Route hinzufügen (`server/routes/saveRoutes.js`)

- **Ziel:** Definition eines neuen API-Endpunkts, über den der Client Inventaränderungen an den Server senden kann.
- **Warum:** Dies ermöglicht es dem Client, Änderungen am Inventar (z.B. durch Item-Verbrauch oder -Erwerb) persistent zu speichern.
- **Details:**
    - Öffne die Datei `server/routes/saveRoutes.js`.
    - Füge die Route für das Inventar-Update hinzu:
    ```javascript
    // server/routes/saveRoutes.js
    const express = require('express');
    const router = express.Router();
    const saveController = require('../controllers/saveController');
    const { authenticate } = require('../middleware/authMiddleware');

    router.use(authenticate); // Alle Routen sind geschützt

    // Inventar aktualisieren
    // POST /api/save/inventory
    router.post('/inventory', saveController.updateInventory);
    ```
    - **Methode:** `POST` (da der Client Daten zum Server sendet, um das Inventar zu aktualisieren).
    - **Pfad:** `/api/save/inventory` (folgt der Konvention für Spielstand-bezogene Endpunkte).
    - **Middleware:** Die `authenticate`-Middleware wird automatisch angewendet (durch `router.use(authenticate)` am Anfang der Datei), um sicherzustellen, dass nur authentifizierte Benutzer auf diese Route zugreifen können.
    - **Controller:** Die `updateInventory`-Funktion im `saveController` wird aufgerufen, um die eigentliche Logik auszuführen.

### 2.3. `loadGame`-Funktion anpassen

- **Ziel:** Die `loadGame`-Funktion erweitern, um auch die Inventardaten des Spielers aus der Datenbank abzurufen und an den Client zu senden.
- **Warum:** Beim Laden des Spielstands soll der Client das aktuelle Inventar des Spielers erhalten, um es in der UI anzuzeigen.
- **Details:**
    - Öffne die Datei `server/controllers/saveController.js`.
    - Erweitere die `include`-Option in `db.Player.findByPk` innerhalb der `loadGame`-Funktion, um `InventoryItem` und das zugehörige `Item`-Modell mitzuladen:
    ```javascript
    // Innerhalb von exports.loadGame = async (req, res) => { ... }
    const player = await db.Player.findByPk(playerId, {
      include: [
        {
          model: db.InventoryItem,
          include: [{ model: db.Item, attributes: ['id', 'name', 'type', 'icon'] }] // Item-Details mitladen
        }
        // Weitere Includes für Pokémon etc. kommen in späteren Tickets
      ]
    });
    ```
    - `model: db.InventoryItem`: Lädt die Einträge aus der `InventoryItem`-Tabelle, die dem Spieler gehören.
    - `include: [{ model: db.Item, attributes: ['id', 'name', 'type', 'icon'] }]`: Lädt für jeden Inventareintrag auch die zugehörigen Daten aus der `Item`-Tabelle (ID, Name, Typ, Icon). Die `attributes`-Option beschränkt die geladenen Spalten, um die Performance zu verbessern.
    * Füge das formatierte Inventar zur `gameData`-Antwort hinzu:
    ```javascript
    // Innerhalb von exports.loadGame, nach der Definition von gameData.player
    inventory: player.InventoryItems.map(item => ({
      id: item.Item.id,
      name: item.Item.name,
      type: item.Item.type,
      quantity: item.quantity,
      icon: item.Item.icon
    })),
    // Weitere Daten (Pokemon etc.) werden später hinzugefügt
    ```
    - `player.InventoryItems.map(...)`: Durchläuft alle Inventareinträge des Spielers und formatiert sie in ein einfacheres JSON-Format, das für den Client geeignet ist.
    - `id: item.Item.id`, `name: item.Item.name`, `type: item.Item.type`, `quantity: item.quantity`, `icon: item.Item.icon`: Diese Zeilen extrahieren die relevanten Daten aus den verknüpften Tabellen und erstellen ein neues Objekt für jedes Item.

---

## 3. Akzeptanzkriterien

*   Die Funktion `updateInventory` existiert im `saveController` und verarbeitet die Aktionen `add`, `remove`, `set` korrekt innerhalb einer Transaktion.
*   Die Route `POST /api/save/inventory` ist in `saveRoutes.js` definiert und ruft `updateInventory` auf.
*   Ein authentifizierter POST-Request an `/api/save/inventory` mit einem gültigen `items`-Array aktualisiert das Inventar des Spielers in der Datenbank korrekt.
*   Fehlerhafte Anfragen (ungültiges Format, negative Menge etc.) führen zu einem 400-Statuscode.
*   Die `loadGame`-Funktion lädt nun auch das Inventar des Spielers (inkl. Item-Details) und gibt es im erwarteten Format zurück.
*   Der Server startet ohne Fehler.

---

## 4. Wichtige Hinweise

*   Die Verwendung einer Datenbank-Transaktion in `updateInventory` ist entscheidend, um sicherzustellen, dass entweder alle Änderungen erfolgreich sind oder keine davon (Atomarität). Dies verhindert Inkonsistenzen im Inventar, falls während der Verarbeitung ein Fehler auftritt.
*   Die `loadGame`-Funktion wird schrittweise erweitert. In diesem Ticket wird nur das Inventar hinzugefügt. Die Performance sollte im Auge behalten werden, da die Funktion immer mehr Daten laden muss. Ggf. Caching-Strategien prüfen.
*   Die Client-Seite muss das `items`-Array im korrekten Format an `/api/save/inventory` senden. Eine Validierung auf Client-Seite kann helfen, unnötige API-Aufrufe zu vermeiden.
