# Grober Plan: SpaceBuilder (Arbeitstitel)

Dieses Dokument beschreibt den groben Plan zur Entwicklung des Spielkonzepts "SpaceBuilder", das auf dem bestehenden PokeTogetherBrowser-Framework aufbaut.

## Kernidee

Spieler fliegen als Raumschiff durch den Weltall, sammeln Materialien und bauen daraus eigene Kampf-Raumschiffe ("Builder"). Diese Builder haben Stats, Elemente und Attacken, die sich aus den verbauten Teilen ergeben. Kämpfe finden rundenbasiert statt, ähnlich wie im ursprünglichen Spiel. Das Inventar- und Kampfsystem des bestehenden Spiels sollen angepasst und wiederverwendet werden.

## Phasen

1.  **Phase 1: Konzept & Datenstrukturen**
    *   **Materialien definieren:** Festlegen, welche Arten von Materialien es gibt (z.B. Metall, Kristall, Energiequelle) und welche Eigenschaften sie haben (z.B. Seltenheit, Element).
    *   **Raumschiff-Teile definieren:** Festlegen, welche Arten von Teilen es gibt (z.B. Rumpf, Antrieb, Waffe, Schild), welche "Slots" sie belegen, welche Basis-Stats (Angriff, Verteidigung etc.), Elemente oder Attacken-Bezüge sie haben.
    *   **Gebautes Raumschiff definieren:** Festlegen, wie ein fertiges Raumschiff repräsentiert wird – als eine Sammlung von Teilen, die zusammen resultierende Stats, Elemente (max. 2) und verfügbare Attacken ergeben.
    *   **Templates definieren:** Grundlegende Vorlagen für Raumschiffe festlegen, die als Startpunkt oder Bauplan dienen können.

2.  **Phase 2: Kernmechaniken - Sammeln & Inventar**
    *   **Inventar anpassen:** Das bestehende Inventarsystem erweitern, sodass es Materialien und Raumschiff-Teile speichern und anzeigen kann. Die Logik für Stacking, Sortierung etc. anpassen.
    *   **Sammelmechanik (Prototyp):** Eine einfache Methode implementieren, um Materialien zu erhalten. *Details (Top-Down, Minispiel etc.) werden später festgelegt.* Zunächst könnte dies eine Interaktion mit Objekten in der Welt sein (z.B. Klick auf "Asteroiden").
    *   **Server-Logik (Sammeln):** Serverseitige Logik zur Generierung und Verteilung von Materialien in der Spielwelt oder durch Aktionen.

3.  **Phase 3: Kernmechaniken - Bauen & Editor**
    *   **Raumschiff-Editor (Grundgerüst):** Ein einfaches UI erstellen, das verfügbare Materialien und Teile aus dem Inventar anzeigt.
    *   **Bau-Logik:** Implementieren der Logik, um Teile zu einem Raumschiff zusammenzufügen (basierend auf Templates oder freien Slots). Berechnung der resultierenden Stats/Elemente/Attacken.
    *   **Speicherung:** Die gebauten Raumschiffe müssen gespeichert werden, eventuell als eine neue Art von Entität, die ähnlich wie Pokémon behandelt werden kann (z.B. im "Team" des Spielers).

4.  **Phase 4: Anpassung des Kampfsystems**
    *   **Kämpfer-Datenmodell:** Das Kampfsystem so anpassen, dass es die Datenstruktur der gebauten Raumschiffe anstelle der Pokémon-Daten verwendet.
    *   **Attacken-Logik:** Sicherstellen, dass die Attacken korrekt basierend auf den Teilen und Elementen des Raumschiffs funktionieren.
    *   **Kampf-UI:** Die Benutzeroberfläche im Kampf anpassen, um Raumschiffe, ihre Teile (optional) und ihre spezifischen Stats/Attacken anzuzeigen.

5.  **Phase 5: Theming & Integration**
    *   **Assets austauschen:** Grafiken und Sounds ersetzen, um das Weltraum-Thema widerzuspiegeln (Spieler-Sprite -> Raumschiff, Weltkarte -> Sternenkarte, Pokémon-Sprites -> Raumschiff-Sprites, etc.).
    *   **Texte anpassen:** Alle relevanten Texte im Spiel ändern (z.B. "Fangen" -> "Sammeln", "Pokémon" -> "Raumschiff", "Pokéball" -> "Materialcontainer" etc.).
    *   **Server-Anpassungen:** Sicherstellen, dass der Server die neuen Datenstrukturen (Materialien, Teile, gebaute Raumschiffe) korrekt speichert und über die Socket-Verbindung synchronisiert.

## Visueller Überblick (Grober Ablauf)

```mermaid
graph TD
    A[Spieler im Weltall] --> B(Sammeln von Materialien);
    B --> C[Inventar];
    C --> D(Raumschiff-Editor);
    D -- Baut/Modifiziert --> E[Gebautes Raumschiff];
    E --> C;
    E --> F(Kampfsystem);
    A --> F;
    F -- Kämpft mit --> E;