# Ticket GS03: Inventar-Speicherung (Controller & Route)

**Ziel:** Implementierung der serverseitigen Logik zum Aktualisieren des Spieler-Inventars über eine API-Route. Anpassung der `loadGame`-Funktion, um das Inventar mitzuladen.

**Hintergrund & Logik:**
Das Inventar eines Spielers ändert sich häufig (Items werden gefunden, gekauft, verbraucht). Wir benötigen eine dedizierte Funktion im `saveController`, um diese Änderungen effizient in der Datenbank zu speichern, ohne jedes Mal den gesamten Spielstand zu übertragen. Die Funktion `updateInventory` soll verschiedene Aktionen unterstützen (hinzufügen, entfernen, Anzahl setzen) und in einer Datenbank-Transaktion ausgeführt werden, um Datenkonsistenz zu gewährleisten. Beim Laden des Spielstands (`loadGame`) müssen die Inventardaten nun ebenfalls abgerufen und an den Client gesendet werden.

**Arbeitsschritte:**

1.  **`updateInventory`-Funktion implementieren (`server/controllers/saveController.js`):**
    *   Öffne die Datei `server/controllers/saveController.js`.
    *   Füge die folgende Funktion hinzu:
        ```javascript
        // Inventar aktualisieren
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
                      // Item existiert, Anzahl erhöhen
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

2.  **Route hinzufügen (`server/routes/saveRoutes.js`):**
    *   Öffne die Datei `server/routes/saveRoutes.js`.
    *   Füge die Route für das Inventar-Update hinzu:
        ```javascript
        // Inventar aktualisieren
        // POST /api/save/inventory
        router.post('/inventory', saveController.updateInventory);
        ```

3.  **`loadGame`-Funktion anpassen (`server/controllers/saveController.js`):**
    *   Öffne die Datei `server/controllers/saveController.js`.
    *   Erweitere die `include`-Option in `db.Player.findByPk` innerhalb der `loadGame`-Funktion, um `InventoryItem` und das zugehörige `Item`-Modell mitzuladen:
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
    *   Füge das formatierte Inventar zur `gameData`-Antwort hinzu:
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

**Akzeptanzkriterien:**

*   Die Funktion `updateInventory` existiert im `saveController` und verarbeitet die Aktionen `add`, `remove`, `set` korrekt innerhalb einer Transaktion.
*   Die Route `POST /api/save/inventory` ist in `saveRoutes.js` definiert und ruft `updateInventory` auf.
*   Ein authentifizierter POST-Request an `/api/save/inventory` mit einem gültigen `items`-Array aktualisiert das Inventar des Spielers in der Datenbank korrekt.
*   Fehlerhafte Anfragen (ungültiges Format, negative Menge etc.) führen zu einem 400-Statuscode.
*   Die `loadGame`-Funktion lädt nun auch das Inventar des Spielers (inkl. Item-Details) und gibt es im erwarteten Format zurück.
*   Der Server startet ohne Fehler.

**Wichtige Hinweise:**
*   Die Verwendung einer Datenbank-Transaktion in `updateInventory` ist entscheidend, um sicherzustellen, dass entweder alle Änderungen erfolgreich sind oder keine davon (Atomarität).
*   Die `loadGame`-Funktion wird schrittweise erweitert. In diesem Ticket wird nur das Inventar hinzugefügt.
*   Die Client-Seite muss das `items`-Array im korrekten Format an `/api/save/inventory` senden.