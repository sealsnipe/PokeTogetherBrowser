// client/js/data/spacebuilder/materials.js
export const materials = {
  IRON_SCRAP: {
    id: 'IRON_SCRAP',
    name: 'Eisenschrott',
    description: 'Gewöhnliches Metall, nützlich für grundlegende Strukturen.',
    rarity: 'common',
    // Weitere Eigenschaften könnten hier hin: element, wert, etc.
  },
  COPPER_WIRE: {
    id: 'COPPER_WIRE',
    name: 'Kupferdraht',
    description: 'Leitet Energie gut, wichtig für elektronische Systeme.',
    rarity: 'common',
  },
  CRYSTAL_SHARD: {
    id: 'CRYSTAL_SHARD',
    name: 'Kristallsplitter',
    description: 'Ein Fragment eines Energiekristalls.',
    rarity: 'uncommon',
    element: 'energy', // Beispiel für Element-Eigenschaft
  },
  ALIEN_ALLOY: {
    id: 'ALIEN_ALLOY',
    name: 'Alien-Legierung',
    description: 'Ein leichtes, aber extrem widerstandsfähiges Metall unbekannten Ursprungs.',
    rarity: 'rare',
  },
  // ... weitere Materialien
};

// Optional: Funktion zum Abrufen eines Materials anhand seiner ID
export function getMaterialById(id) {
  return materials[id];
}