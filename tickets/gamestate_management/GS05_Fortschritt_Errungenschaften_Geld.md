# Ticket GS05: Fortschritt, Errungenschaften & Geld (Controller & Routen)

**Ziel:** Implementierung der serverseitigen Logik zur Verwaltung von Quest-Fortschritten, Errungenschaften und dem Geld des Spielers über dedizierte API-Routen. Anpassung der `loadGame`-Funktion, um diese Daten mitzuladen.

**Hintergrund & Logik:**
Neben Inventar und Pokémon sind auch der Fortschritt in Quests, freigeschaltete Errungenschaften und der Kontostand (Geld) wichtige Bestandteile des Spielstands. Wir erstellen separate Controller-Funktionen im `saveController`, um diese Aspekte gezielt zu aktualisieren. `updateProgress` ermöglicht das Setzen oder Aktualisieren des Status einer Quest, `unlockAchievement` fügt eine neue Errungenschaft hinzu (falls noch nicht vorhanden), und `updateMoney` modifiziert den Geldbeutel des Spielers. Die `loadGame`-Funktion wird erneut erweitert, um auch diese Daten beim Laden des Spielstands abzurufen.

**Arbeitsschritte:**

1.  **Controller-Funktionen implementieren (`server/controllers/saveController.js`):**
    *   Öffne die Datei `server/controllers/saveController.js`.
    *   Füge die folgenden Funktionen hinzu:
        ```javascript
        // Spielfortschritt (Quest-Status) aktualisieren
        exports.updateProgress = async (req, res) => {
          try {
            const playerId = req.player.id;
            const { questKey, status, data } = req.body; // data ist optional für quest-spezifische Infos

            if (!questKey || !status) {
              return res.status(400).json({ message: 'Quest-Schlüssel und Status sind erforderlich.' });
            }
            // Optional: Status validieren
            const validStatuses = ['not_started', 'in_progress', 'completed', 'failed'];
            if (!validStatuses.includes(status)) {
               return res.status(400).json({ message: `Ungültiger Status: ${status}` });
            }

            // Finde oder erstelle den Fortschrittseintrag
            const [progress, created] = await db.Progress.findOrCreate({
              where: { PlayerId: playerId, quest_key: questKey },
              defaults: {
                PlayerId: playerId,
                quest_key: questKey,
                status: status,
                progress_data: data || {},
                completed_at: status === 'completed' ? new Date() : null
              }
            });

            // Wenn der Eintrag bereits existierte, aktualisiere ihn
            if (!created) {
              progress.status = status;
              if (data) {
                // Vorsichtiges Mergen von JSON-Daten, falls nötig
                progress.progress_data = { ...(progress.progress_data || {}), ...data };
              }
              if (status === 'completed' && !progress.completed_at) {
                progress.completed_at = new Date();
              }
              await progress.save();
            }

            res.status(200).json({
              message: 'Spielfortschritt erfolgreich aktualisiert',
              progress: { // Nur die relevanten Daten zurücksenden
                questKey: progress.quest_key,
                status: progress.status,
                data: progress.progress_data,
                completedAt: progress.completed_at
              }
            });
          } catch (error) {
            console.error('Fehler beim Aktualisieren des Spielfortschritts:', error);
            res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Spielfortschritts.' });
          }
        };

        // Errungenschaft freischalten
        exports.unlockAchievement = async (req, res) => {
          try {
            const playerId = req.player.id;
            const { achievementKey } = req.body;

            if (!achievementKey) {
              return res.status(400).json({ message: 'Errungenschaften-Schlüssel ist erforderlich.' });
            }

            // Finde oder erstelle den Errungenschaftseintrag
            // findOrCreate verhindert, dass dieselbe Errungenschaft mehrfach hinzugefügt wird
            const [achievement, created] = await db.Achievement.findOrCreate({
              where: { PlayerId: playerId, achievement_key: achievementKey },
              defaults: {
                PlayerId: playerId,
                achievement_key: achievementKey
                // unlocked_at wird durch defaultValue im Modell gesetzt
              }
            });

            res.status(created ? 201 : 200).json({ // 201 wenn neu, 200 wenn schon vorhanden
              message: created ? 'Errungenschaft erfolgreich freigeschaltet' : 'Errungenschaft bereits freigeschaltet',
              achievement: {
                key: achievement.achievement_key,
                unlockedAt: achievement.unlocked_at
              }
            });
          } catch (error) {
            console.error('Fehler beim Freischalten der Errungenschaft:', error);
            res.status(500).json({ message: 'Serverfehler beim Freischalten der Errungenschaft.' });
          }
        };

        // Geld aktualisieren
        exports.updateMoney = async (req, res) => {
          try {
            const playerId = req.player.id;
            const { amount, action } = req.body; // action: 'add', 'subtract', 'set'

            if (typeof amount !== 'number' || !action) {
              return res.status(400).json({ message: 'Betrag (Zahl) und Aktion sind erforderlich.' });
            }

            const player = await db.Player.findByPk(playerId);
            if (!player) {
              return res.status(404).json({ message: 'Spieler nicht gefunden.' });
            }

            let newMoney = player.money;
            switch (action) {
              case 'add':
                newMoney += amount;
                break;
              case 'subtract':
                newMoney -= amount;
                break;
              case 'set':
                newMoney = amount;
                break;
              default:
                return res.status(400).json({ message: 'Ungültige Geld-Aktion.' });
            }

            // Sicherstellen, dass Geld nicht negativ wird
            player.money = Math.max(0, newMoney);
            await player.save();

            res.status(200).json({
              message: 'Geld erfolgreich aktualisiert',
              money: player.money
            });
          } catch (error) {
            console.error('Fehler beim Aktualisieren des Geldes:', error);
            res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Geldes.' });
          }
        };
        ```

2.  **Routen hinzufügen (`server/routes/saveRoutes.js`):**
    *   Öffne die Datei `server/routes/saveRoutes.js`.
    *   Füge die Routen für Fortschritt, Errungenschaften und Geld hinzu:
        ```javascript
        // Spielfortschritt aktualisieren
        // POST /api/save/progress
        router.post('/progress', saveController.updateProgress);

        // Errungenschaft freischalten
        // POST /api/save/achievement
        router.post('/achievement', saveController.unlockAchievement);

        // Geld aktualisieren
        // POST /api/save/money
        router.post('/money', saveController.updateMoney);
        ```

3.  **`loadGame`-Funktion anpassen (`server/controllers/saveController.js`):**
    *   Öffne die Datei `server/controllers/saveController.js`.
    *   Erweitere die `include`-Option in `db.Player.findByPk` innerhalb der `loadGame`-Funktion, um `Progress` und `Achievement` mitzuladen:
        ```javascript
        // Innerhalb von exports.loadGame = async (req, res) => { ... }
        const player = await db.Player.findByPk(playerId, {
          include: [
            { /* ... Inventar Include ... */ },
            { /* ... Pokémon Include ... */ },
            { model: db.Progress, attributes: ['quest_key', 'status', 'progress_data', 'completed_at'] }, // NEU
            { model: db.Achievement, attributes: ['achievement_key', 'unlocked_at'] } // NEU
          ],
          order: [ /* ... Pokémon Sortierung ... */ ]
        });
        ```
    *   Füge die formatierten Fortschritts- und Errungenschaftsdaten zur `gameData`-Antwort hinzu:
        ```javascript
        // Innerhalb von exports.loadGame, nach gameData.pokemon
        progress: (player.Progresses || []).map(p => ({
          questKey: p.quest_key,
          status: p.status,
          data: p.progress_data,
          completedAt: p.completed_at
        })),
        achievements: (player.Achievements || []).map(a => ({
          key: a.achievement_key,
          unlockedAt: a.unlocked_at
        }))
        ```

**Akzeptanzkriterien:**

*   Die Funktionen `updateProgress`, `unlockAchievement` und `updateMoney` existieren im `saveController` und funktionieren korrekt.
*   Die Routen `POST /api/save/progress`, `POST /api/save/achievement` und `POST /api/save/money` sind in `saveRoutes.js` definiert.
*   Authentifizierte POST-Requests an diese Routen mit gültigen Daten aktualisieren die entsprechenden Spielerdaten in der Datenbank.
*   Fehlerhafte Anfragen führen zu entsprechenden Fehler-Statuscodes (400, 500).
*   Die `loadGame`-Funktion lädt nun auch die Fortschritts- und Errungenschaftsdaten des Spielers und gibt sie im erwarteten Format zurück.
*   Der Server startet ohne Fehler.

**Wichtige Hinweise:**
*   `findOrCreate` ist nützlich, um Duplikate bei Fortschritt und Errungenschaften zu vermeiden.
*   Die Validierung der Eingabedaten (z.B. gültiger `status`, positiver `amount`) ist wichtig.
*   Die `loadGame`-Funktion wird immer umfangreicher. Es ist entscheidend, nur die wirklich benötigten Attribute (`attributes: [...]`) in den `include`-Anweisungen zu spezifizieren, um die Performance nicht unnötig zu belasten.