// client/js/data/spacebuilder/parts.js

export const partTypes = {
  HULL: 'HULL', // Rumpf
  ENGINE: 'ENGINE', // Antrieb
  WEAPON: 'WEAPON', // Waffe
  SHIELD: 'SHIELD', // Schild
  MODULE: 'MODULE', // Sonstige Module (Scanner, etc.)
};

export const parts = {
  // --- Rümpfe ---
  BASIC_HULL_S: {
    id: 'BASIC_HULL_S',
    name: 'Kleiner Basisrumpf',
    type: partTypes.HULL,
    description: 'Ein einfacher, kleiner Rumpf.',
    baseStats: { hp: 50, defense: 5 },
    slots: { // Definiert, welche anderen Teile angebaut werden können
      [partTypes.ENGINE]: 1,
      [partTypes.WEAPON]: 1,
      [partTypes.SHIELD]: 0,
      [partTypes.MODULE]: 1,
    },
    rarity: 'common',
  },
  ARMORED_HULL_M: {
    id: 'ARMORED_HULL_M',
    name: 'Mittlerer Panzer-Rumpf',
    type: partTypes.HULL,
    description: 'Ein robuster Rumpf mittlerer Größe mit guter Panzerung.',
    baseStats: { hp: 100, defense: 15 },
    slots: {
      [partTypes.ENGINE]: 1,
      [partTypes.WEAPON]: 2,
      [partTypes.SHIELD]: 1,
      [partTypes.MODULE]: 1,
    },
    rarity: 'uncommon',
    element: 'metal', // Beispiel Element
  },

  // --- Antriebe ---
  BASIC_ENGINE: {
    id: 'BASIC_ENGINE',
    name: 'Basis-Antrieb',
    type: partTypes.ENGINE,
    description: 'Standardantrieb.',
    baseStats: { speed: 10 },
    rarity: 'common',
  },
  ION_DRIVE: {
    id: 'ION_DRIVE',
    name: 'Ionenantrieb',
    type: partTypes.ENGINE,
    description: 'Effizienter Antrieb für lange Strecken.',
    baseStats: { speed: 15 },
    rarity: 'uncommon',
    element: 'energy',
  },

  // --- Waffen ---
  LASER_CANNON: {
    id: 'LASER_CANNON',
    name: 'Laserkanone',
    type: partTypes.WEAPON,
    description: 'Standard-Energiewaffe.',
    baseStats: { attack: 10 },
    attackId: 'LASER_SHOT', // Referenz auf eine Attacke (muss noch definiert werden)
    rarity: 'common',
    element: 'energy',
  },
  PLASMA_TORPEDO: {
    id: 'PLASMA_TORPEDO',
    name: 'Plasma-Torpedo',
    type: partTypes.WEAPON,
    description: 'Verursacht hohen Schaden, hat aber begrenzte Munition (Konzept).',
    baseStats: { attack: 25 },
    attackId: 'PLASMA_BURST',
    rarity: 'rare',
    element: 'plasma', // Beispiel für neues Element
  },

  // --- Schilde ---
  DEFLECTOR_SHIELD: {
    id: 'DEFLECTOR_SHIELD',
    name: 'Deflektorschild',
    type: partTypes.SHIELD,
    description: 'Ein einfacher Energieschild.',
    baseStats: { shieldHp: 30, shieldRegen: 5 }, // Beispiel für Schild-Stats
    rarity: 'common',
  },

  // --- Module ---
  CARGO_EXPANSION: {
    id: 'CARGO_EXPANSION',
    name: 'Frachtraum-Erweiterung',
    type: partTypes.MODULE,
    description: 'Erhöht die Kapazität für Materialien.',
    // Keine Kampfstats, beeinflusst andere Spielmechaniken
    rarity: 'common',
  }
  // ... weitere Teile
};

// Optional: Funktion zum Abrufen eines Teils anhand seiner ID
export function getPartById(id) {
  return parts[id];
}