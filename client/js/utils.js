// Utility-Funktionen

import { typeIcons } from './data/typeInfo.js';

/**
 * Gibt das lesbare Label für einen Item-Typ zurück.
 * @param {string} type - Der interne Typ-Name (z.B. 'ball', 'medicine').
 * @returns {string} Das lesbare Label (z.B. 'Ball', 'Erste Hilfe').
 */
export function getTypeLabel(type) {
    switch(type) {
        case 'ball': return 'Ball';
        case 'medicine': return 'Erste Hilfe';
        case 'hold': return 'Halte-Item';
        case 'tm': return 'TM';
        case 'hm': return 'VM';
        case 'quest': return 'Quest';
        case 'berry': return 'Beere';
        case 'other': return 'Sonstiges';
        default: return type; // Fallback
    }
}

/**
 * Gibt das passende Icon (oder Icons bei Dual-Typ) für einen Pokémon-Typ zurück.
 * @param {string} type - Der Pokémon-Typ (z.B. 'Feuer', 'Pflanze/Gift').
 * @returns {string} Das Icon-Emoji oder Emojis.
 */
export function getTypeIcon(type) {
    if (!type) return '❓'; // Fallback für undefinierten Typ

    // Prüfe, ob es sich um einen Dual-Typ handelt
    if (type.includes('/')) {
        const types = type.split('/').map(t => t.trim());
        // Stelle sicher, dass beide Typen im typeIcons Objekt existieren
        const icon1 = typeIcons[types[0]] || '❓';
        const icon2 = typeIcons[types[1]] || '❓';
        return icon1 + icon2; // Kombiniere Icons
    }

    return typeIcons[type] || '❓'; // Fragezeichen als Fallback für einzelne Typen
}

/**
 * Gibt die entsprechende CSS-Klasse für die HP-Balkenfarbe zurück.
 * @param {number} currentHp - Aktuelle HP.
 * @param {number} maxHp - Maximale HP.
 * @returns {string} CSS-Klasse ('red', 'yellow' oder '').
 */
export function getHpBarClass(currentHp, maxHp) {
    if (maxHp <= 0) return ''; // Vermeide Division durch Null
    const percentage = (currentHp / maxHp) * 100;
    if (percentage <= 25) {
        return 'red';
    } else if (percentage <= 50) {
        return 'yellow';
    }
    return ''; // Standard (grün)
}

/**
 * Gibt die Hintergrundfarbe für ein Pokémon-Icon basierend auf dem Primärtyp zurück.
 * @param {string} type - Der Pokémon-Typ (z.B. 'Feuer', 'Pflanze/Gift').
 * @returns {string} CSS-Farbwert (Hex-Code).
 */
export function getPokemonIconColor(type) {
    if (!type) return '#757575'; // Fallback-Farbe

    const primaryType = type.split('/')[0].trim();
    switch(primaryType) {
        case 'Feuer': return '#F44336';
        case 'Wasser': return '#2196F3';
        case 'Pflanze': return '#4CAF50';
        case 'Elektro': return '#FFC107';
        case 'Käfer': return '#8BC34A';
        case 'Normal': return '#9E9E9E';
        case 'Gift': return '#9C27B0';
        case 'Psycho': return '#FF5722'; // War vorher orange, evtl. anpassen?
        case 'Kampf': return '#795548';
        case 'Boden': return '#FF9800'; // War vorher orange, evtl. anpassen?
        case 'Fee': return '#E91E63';
        case 'Gestein': return '#A1887F'; // Farbe hinzugefügt
        case 'Flug': return '#90A4AE'; // Farbe hinzugefügt
        case 'Geist': return '#7E57C2'; // Farbe hinzugefügt
        case 'Eis': return '#4FC3F7'; // Farbe hinzugefügt
        case 'Drache': return '#5C6BC0'; // Farbe hinzugefügt
        case 'Unlicht': return '#616161'; // Farbe hinzugefügt
        case 'Stahl': return '#B0BEC5'; // Farbe hinzugefügt
        default: return '#757575'; // Fallback
    }
}

/**
 * Gibt die Hintergrundfarbe für ein Item-Icon basierend auf dem Item-Typ zurück.
 * @param {string} type - Der Item-Typ (z.B. 'ball', 'medicine').
 * @returns {string} CSS-Farbwert (Hex-Code).
 */
export function getItemIconColor(type) {
    switch(type) {
        case 'ball': return '#e53935';
        case 'medicine': return '#43a047';
        case 'hold': return '#1e88e5';
        case 'tm': return '#8e24aa';
        case 'hm': return '#6a1b9a';
        case 'quest': return '#ff8f00';
        case 'berry': return '#d81b60';
        default: return '#757575'; // Fallback für 'other' etc.
    }
}