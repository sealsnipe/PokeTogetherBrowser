// Beispiel-Daten für Inventar und Pokémon
// HINWEIS: In einer echten Anwendung würden diese Daten vom Server geladen.

import { getTypeIcon } from '../utils.js'; // Importiere Hilfsfunktion

// Beispiel-Inventardaten
export const exampleInventoryItems = [
    { id: 1, name: 'Pokéball', type: 'ball', quantity: 15, icon: '⬤' }, // Icon evtl. anpassen oder dynamisch generieren
    { id: 2, name: 'Superball', type: 'ball', quantity: 8, icon: '⬤' },
    { id: 3, name: 'Hyperball', type: 'ball', quantity: 3, icon: '⬤' },
    { id: 4, name: 'Trank', type: 'medicine', quantity: 10, icon: '⚕' },
    { id: 5, name: 'Supertrank', type: 'medicine', quantity: 5, icon: '⚕' },
    { id: 6, name: 'Beleber', type: 'medicine', quantity: 2, icon: '⚕' },
    { id: 7, name: 'Kampfknochen', type: 'hold', quantity: 1, icon: '⚔' },
    { id: 8, name: 'Giftstich', type: 'tm', quantity: 1, icon: 'TM' },
    { id: 9, name: 'Surfer', type: 'hm', quantity: 1, icon: 'VM' },
    { id: 10, name: 'Eichs Paket', type: 'quest', quantity: 1, icon: '✉' },
    { id: 11, name: 'Prunusbeere', type: 'berry', quantity: 7, icon: '●' },
    { id: 12, name: 'Amrenabeere', type: 'berry', quantity: 4, icon: '●' },
    { id: 13, name: 'Fahrrad', type: 'other', quantity: 1, icon: '🚲' }, // Besseres Icon
    { id: 14, name: 'Angelrute', type: 'other', quantity: 1, icon: '🎣' }, // Besseres Icon
    { id: 15, name: 'Flöte', type: 'other', quantity: 1, icon: '♫' }
];

// Beispiel-Pokémon-Daten (Team)
// Icons werden jetzt dynamisch mit getTypeIcon geholt
export const examplePokemonTeam = [
    { id: 1, name: 'Pikachu', level: 25, type: 'Elektro', hp: 45, maxHp: 60 },
    { id: 2, name: 'Glumanda', level: 18, type: 'Feuer', hp: 30, maxHp: 50 },
    { id: 3, name: 'Bisasam', level: 20, type: 'Pflanze/Gift', hp: 40, maxHp: 55 }, // Typ korrigiert
    { id: 4, name: 'Schiggy', level: 15, type: 'Wasser', hp: 25, maxHp: 45 },
    { id: 5, name: 'Taubsi', level: 14, type: 'Normal/Flug', hp: 10, maxHp: 40 },
    { id: 6, name: 'Raupy', level: 5, type: 'Käfer', hp: 15, maxHp: 30 }
].map(p => ({ ...p, icon: getTypeIcon(p.type) })); // Füge Icons hinzu

// Beispiel-Pokémon-Daten (Lager)
export const examplePokemonStorage = [
    { id: 7, name: 'Smogon', level: 22, type: 'Gift', hp: 35, maxHp: 55 },
    { id: 8, name: 'Knofensa', level: 17, type: 'Pflanze/Gift', hp: 28, maxHp: 45 },
    { id: 9, name: 'Piepi', level: 12, type: 'Fee', hp: 30, maxHp: 40 },
    { id: 10, name: 'Digda', level: 19, type: 'Boden', hp: 25, maxHp: 35 },
    { id: 11, name: 'Magnetilo', level: 21, type: 'Elektro/Stahl', hp: 32, maxHp: 50 },
    { id: 12, name: 'Sleima', level: 24, type: 'Gift', hp: 40, maxHp: 65 },
    { id: 13, name: 'Abra', level: 10, type: 'Psycho', hp: 15, maxHp: 30 },
    { id: 14, name: 'Menki', level: 16, type: 'Kampf', hp: 30, maxHp: 45 },
    { id: 15, name: 'Ponita', level: 20, type: 'Feuer', hp: 35, maxHp: 50 },
    { id: 16, name: 'Enton', level: 14, type: 'Wasser', hp: 25, maxHp: 40 },
    { id: 17, name: 'Jurob', level: 22, type: 'Wasser', hp: 40, maxHp: 60 },
    { id: 18, name: 'Quaputzi', level: 18, type: 'Wasser', hp: 35, maxHp: 55 }, // Typ korrigiert
    { id: 19, name: 'Kadabra', level: 25, type: 'Psycho', hp: 30, maxHp: 50 },
    { id: 20, name: 'Sandan', level: 15, type: 'Boden', hp: 28, maxHp: 45 }
].map(p => ({ ...p, icon: getTypeIcon(p.type) })); // Füge Icons hinzu