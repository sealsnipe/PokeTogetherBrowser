// Pokémon Typ-Informationen

// Typ-Icons für Pokémon
export const typeIcons = {
    'Elektro': '⚡',     // Blitz
    'Feuer': '🔥',     // Feuer
    'Pflanze': '🌿',   // Blatt
    'Wasser': '💧',    // Wassertropfen
    'Normal': '⬤',      // Kreis
    'Flug': '🕊️',      // Taube
    'Käfer': '🐛',     // Raupe
    'Gift': '☠️',      // Totenkopf
    'Boden': '🚷',     // Schlammspritzer // TODO: Besseres Icon finden?
    'Gestein': '🪨',   // Stein
    'Kampf': '🥊',     // Faust
    'Psycho': '👁️',    // Auge
    'Geist': '👻',     // Geist
    'Eis': '❄️',       // Schneeflocke
    'Drache': '🐉',    // Drache
    'Unlicht': '🌙',   // Mond
    'Stahl': '⚙️',     // Zahnrad
    'Fee': '✨'         // Stern
};

// Typ-Schwächen-Tabelle (Basis)
const baseWeaknesses = {
    'Normal': { x2: ['Kampf'], x4: [] },
    'Feuer': { x2: ['Wasser', 'Boden', 'Gestein'], x4: [] },
    'Wasser': { x2: ['Elektro', 'Pflanze'], x4: [] },
    'Elektro': { x2: ['Boden'], x4: [] },
    'Pflanze': { x2: ['Feuer', 'Eis', 'Gift', 'Flug', 'Käfer'], x4: [] },
    'Eis': { x2: ['Feuer', 'Kampf', 'Gestein', 'Stahl'], x4: [] },
    'Kampf': { x2: ['Flug', 'Psycho', 'Fee'], x4: [] },
    'Gift': { x2: ['Boden', 'Psycho'], x4: [] },
    'Boden': { x2: ['Wasser', 'Pflanze', 'Eis'], x4: [] },
    'Flug': { x2: ['Elektro', 'Eis', 'Gestein'], x4: [] },
    'Psycho': { x2: ['Käfer', 'Geist', 'Unlicht'], x4: [] },
    'Käfer': { x2: ['Feuer', 'Flug', 'Gestein'], x4: [] },
    'Gestein': { x2: ['Wasser', 'Pflanze', 'Kampf', 'Boden', 'Stahl'], x4: [] },
    'Geist': { x2: ['Geist', 'Unlicht'], x4: [] },
    'Drache': { x2: ['Eis', 'Drache', 'Fee'], x4: [] },
    'Unlicht': { x2: ['Kampf', 'Käfer', 'Fee'], x4: [] },
    'Stahl': { x2: ['Feuer', 'Kampf', 'Boden'], x4: [] },
    'Fee': { x2: ['Gift', 'Stahl'], x4: [] }
};

// Berechne und exportiere die vollständige Schwächen-Tabelle (inkl. Dual-Typen)
export const typeWeaknesses = { ...baseWeaknesses };

Object.keys(baseWeaknesses).forEach(type1 => {
    Object.keys(baseWeaknesses).forEach(type2 => {
        if (type1 !== type2) {
            // Erstelle Schlüssel für beide Reihenfolgen (z.B. "Pflanze/Gift" und "Gift/Pflanze")
            const dualTypeKey1 = `${type1}/${type2}`;
            const dualTypeKey2 = `${type2}/${type1}`;

            const calculatedWeaknesses = { x2: [], x4: [] };
            const allWeaknesses = {};

            // Füge Schwächen des ersten Typs hinzu
            baseWeaknesses[type1].x2.forEach(weakness => {
                allWeaknesses[weakness] = (allWeaknesses[weakness] || 0) + 1;
            });

            // Füge Schwächen des zweiten Typs hinzu
            baseWeaknesses[type2].x2.forEach(weakness => {
                allWeaknesses[weakness] = (allWeaknesses[weakness] || 0) + 1;
            });

            // Sortiere nach Schwächegrad
            Object.keys(allWeaknesses).forEach(weakness => {
                // Ignoriere Resistenzen oder Immunitäten (vereinfacht)
                // Eine genauere Berechnung würde auch Resistenzen berücksichtigen
                if (allWeaknesses[weakness] === 2) {
                    calculatedWeaknesses.x4.push(weakness);
                } else if (allWeaknesses[weakness] === 1) {
                    calculatedWeaknesses.x2.push(weakness);
                }
            });

            typeWeaknesses[dualTypeKey1] = calculatedWeaknesses;
            typeWeaknesses[dualTypeKey2] = calculatedWeaknesses; // Füge auch die umgekehrte Reihenfolge hinzu
        }
    });
});