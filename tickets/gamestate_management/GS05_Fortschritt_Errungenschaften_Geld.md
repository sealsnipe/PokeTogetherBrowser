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
*   **Kontext:** Stelle sicher, dass der Kontext der recherchierten Informationen klar und verständlich ist.
*   **Programmiersprache:** Beachte die spezifischen Grundkonstrukte und Besonderheiten von JavaScript (ES6+) und Node.js.
*   **Sequelize:** Recherchiere spezifische Sequelize-Funktionen und -Methoden, die im Ticket verwendet werden.
*   **Datenbank:** Recherchiere datenbankspezifische Konzepte (z.B. Indizes, Transaktionen, Normalisierung), die für die Spielstand-Speicherung relevant sind.

**Zu dokumentierende Informationen:**

*   **Datenmodelle:** Beschreibe die Struktur der Datenmodelle (Tabellen, Spalten, Datentypen) und ihre Beziehungen zueinander.
*   **Funktionen:** Dokumentiere die Funktionsweise der relevanten Funktionen und Methoden.
*   **Klassen:** Beschreibe die Struktur und das Verhalten der relevanten Klassen.
*   **Module:** Erkläre die Rolle und den Zweck der relevanten Module.
*   **Konfiguration:** Dokumentiere alle relevanten Konfigurationseinstellungen.
*   **Abhängigkeiten:** Liste alle Abhängigkeiten zu anderen Modulen, Klassen oder Funktionen auf.
*   **Beispiele:** Füge Codebeispiele hinzu, um die Verwendung der recherchierten Konzepte zu veranschaulichen.
*   **Ressourcen:** Verlinke auf externe Ressourcen (z.B. Dokumentationen, Tutorials, Blog-Artikel), die für das Thema relevant sind.

**Grundkonstrukte der Programmiersprache (JavaScript/Node.js):**

*   **Asynchrone Programmierung:** Verstehe die Konzepte von Promises, async/await und Callbacks.
*   **Module:** Recherchiere, wie Module in Node.js verwendet werden (require, module.exports).
*   **ES6+ Features:** Beachte moderne JavaScript-Features wie arrow functions, classes, destructuring und spread operator.


**Ziel:**

Das Ziel dieser Recherche ist es, ein umfassendes Verständnis des Themas zu erlangen und alle notwendigen Informationen zu dokumentieren, um das Ticket allumfassend zu gestalten und zukünftigen Bearbeitern die Arbeit zu erleichtern.

---


---

# Ticket GS05: Fortschritt, Errungenschaften & Geld (Controller & Routen)

**Ziel:** Implementierung der serverseitigen Logik zur Verwaltung von Quest-Fortschritten, Errungenschaften und dem Geld des Spielers über dedizierte API-Routen. Anpassung der `loadGame`-Funktion, um diese Daten mitzuladen.

---

## 1. Grundprinzipien & Zielsetzung

Neben Inventar und Pokémon sind auch der Fortschritt in Quests, freigeschaltete Errungenschaften und der Kontostand (Geld) wichtige Bestandteile des Spielstands. Wir erstellen separate Controller-Funktionen im `saveController`, um diese Aspekte gezielt zu aktualisieren. `updateProgress` ermöglicht das Setzen oder Aktualisieren des Status einer Quest, `unlockAchievement` fügt eine neue Errungenschaft hinzu (falls noch nicht vorhanden), und `updateMoney` modifiziert den Geldbeutel des Spielers. Die `loadGame`-Funktion wird erneut erweitert, um auch diese Daten beim Laden des Spielstands abzurufen.

---

## 2. Detaillierte Logik & Schritt-für-Schritt-Erklärung

### 2.1. Controller-Funktionen implementieren (`server/controllers/saveController.js`)

- **Ziel:** Implementierung der serverseitigen Logik zur Verwaltung von Quest-Fortschritten, Errungenschaften und Geld.
- **Warum:** Diese Daten sind wichtige Bestandteile des Spielerfortschritts und müssen persistent gespeichert und verwaltet werden.
- **Details:**
    - **`updateProgress`-Funktion:**
        - Ermöglicht das Aktualisieren des Status einer Quest (z.B. von "in_progress" zu "completed").
        - Speichert optionale, quest-spezifische Daten (z.B. Anzahl der gesammelten Items).
        - Verwendet `findOrCreate`, um entweder einen bestehenden Fortschrittseintrag zu aktualisieren oder einen neuen zu erstellen.
        - Setzt den `completed_at`-Zeitstempel, wenn eine Quest abgeschlossen wird.
    - **`unlockAchievement`-Funktion:**
        - Fügt eine neue Errungenschaft zum Spielerprofil hinzu.
        - Verwendet `findOrCreate`, um sicherzustellen, dass jede Errungenschaft nur einmal freigeschaltet werden kann.
    - **`updateMoney`-Funktion:**
        - Ermöglicht das Hinzufügen, Abziehen oder Setzen des Geldbetrags des Spielers.
        - Stellt sicher, dass der Geldbetrag nicht negativ wird.
- **Code:**
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
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Spielfortschritts' });
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

    // Prüfen, ob die Errungenschaft bereits freigeschaltet ist
    const existingAchievement = await db.Achievement.findOne({
      where: {
        PlayerId: playerId,
        achievement_key: achievementKey
      }
    });

    if (existingAchievement) {
      return res.status(200).json({
        message: 'Errungenschaft bereits freigeschaltet',
        achievement: {
          key: existingAchievement.achievement_key,
          unlockedAt: existingAchievement.unlocked_at
        }
      });
    }

    // Neue Errungenschaft freischalten
    const achievement = await db.Achievement.create({
      PlayerId: playerId,
      achievement_key: achievementKey,
      unlocked_at: new Date()
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

    // Spieler in der Datenbank suchen
    const player = await db.Player.findByPk(playerId);
    
    if (!player) {
      return res.status(404).json({ message: 'Spieler nicht gefunden.' });
    }

    // Geld aktualisieren
    let newMoney = player.money;
    switch (action) {
      case 'add':
        newMoney += amount;
        break;
      
      case 'subtract':
        newMoney -= amount;
        
        // Geld kann nicht negativ sein
        if (player.money < 0) {
          player.money = 0;
        }
        break;
      
      case 'set':
        newMoney = amount;
        break;
      
      default:
        return res.status(400).json({ message: 'Ungültige Geld-Aktion.' });
    }

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

### 2.2. Routen hinzufügen (`server/routes/saveRoutes.js`)

- **Ziel:** Definition der API-Endpunkte für die Verwaltung von Spielfortschritt, Errungenschaften und Geld.
- **Warum:** Diese Endpunkte ermöglichen es dem Client, Änderungen am Spielfortschritt persistent zu speichern.
- **Details:**
    - Öffne die Datei `server/routes/saveRoutes.js`.
    - Füge die Routen für Fortschritt, Errungenschaften und Geld hinzu:
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
    - **Methode:** `POST` (da der Client Daten zum Server sendet, um den Fortschritt zu aktualisieren).
    - **Pfade:** `/api/save/progress`, `/api/save/achievement`, `/api/save/money` (folgen der Konvention für Spielstand-bezogene Endpunkte).
    - **Middleware:** Die `authenticate`-Middleware wird automatisch angewendet (durch `router.use(authenticate)` am Anfang der Datei), um sicherzustellen, dass nur authentifizierte Benutzer auf diese Routen zugreifen können.
    - **Controller:** Die entsprechenden Funktionen im `saveController` werden aufgerufen, um die eigentliche Logik auszuführen.

### 2.3. `loadGame`-Funktion anpassen

- **Ziel:** Die `loadGame`-Funktion erweitern, um auch die Fortschritts- und Errungenschaftsdaten des Spielers aus der Datenbank abzurufen und an den Client zu senden.
- **Warum:** Beim Laden des Spielstands soll der Client den aktuellen Fortschritt und die freigeschalteten Errungenschaften des Spielers erhalten.
- **Details:**
    - Öffne die Datei `server/controllers/saveController.js`.
    - Erweitere die `include`-Option in `db.Player.findByPk` innerhalb der `loadGame`-Funktion, um `Progress` und `Achievement` mitzuladen:
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
    - `model: db.Progress`: Lädt die Einträge aus der `Progress`-Tabelle, die dem Spieler gehören.
        - `attributes: ['quest_key', 'status', 'progress_data', 'completed_at']`: Beschränkt die geladenen Spalten, um die Performance zu verbessern.
    - `model: db.Achievement`: Lädt die Einträge aus der `Achievement`-Tabelle, die dem Spieler gehören.
        - `attributes: ['achievement_key', 'unlocked_at']`: Beschränkt die geladenen Spalten, um die Performance zu verbessern.
    * Füge die formatierten Fortschritts- und Errungenschaftsdaten zur `gameData`-Antwort hinzu:
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
    - `player.Progresses.map(...)`: Durchläuft alle Fortschrittseinträge des Spielers und formatiert sie in ein einfacheres JSON-Format.
    - `player.Achievements.map(...)`: Durchläuft alle Errungenschaftseinträge des Spielers und formatiert sie in ein einfacheres JSON-Format.

---

## 3. Akzeptanzkriterien

*   Die Funktionen `updateProgress`, `unlockAchievement` und `updateMoney` existieren im `saveController` und funktionieren korrekt.
*   Die Routen `POST /api/save/progress`, `POST /api/save/achievement` und `POST /api/save/money` sind in `saveRoutes.js` definiert.
*   Authentifizierte POST-Requests an diese Routen mit gültigen Daten aktualisieren die entsprechenden Spielerdaten in der Datenbank.
*   Fehlerhafte Anfragen führen zu entsprechenden Fehler-Statuscodes (400, 500).
*   Die `loadGame`-Funktion lädt nun auch die Fortschritts- und Errungenschaftsdaten des Spielers und gibt sie im erwarteten Format zurück.
*   Der Server startet ohne Fehler.

---

## 4. Wichtige Hinweise

*   `findOrCreate` ist nützlich, um Duplikate bei Fortschritt und Errungenschaften zu vermeiden.
*   Die Validierung der Eingabedaten (z.B. gültiger `status`, positiver `amount`) ist wichtig.
*   Die `loadGame`-Funktion wird immer umfangreicher. Es ist entscheidend, nur die wirklich benötigten Attribute (`attributes: [...]`) in den `include`-Anweisungen zu spezifizieren, um die Performance nicht unnötig zu belasten.