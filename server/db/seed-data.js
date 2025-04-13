module.exports = {
  items: [
    { name: 'Pokéball', type: 'ball', description: 'Ein Gerät zum Fangen von Pokémon.', icon: '⬤', usable: true },
    { name: 'Superball', type: 'ball', description: 'Ein hochwertiger Ball mit höherer Erfolgsrate als ein normaler Pokéball.', icon: '⬤', usable: true },
    { name: 'Hyperball', type: 'ball', description: 'Ein sehr leistungsstarker Ball mit höherer Erfolgsrate als ein Superball.', icon: '⬤', usable: true },
    { name: 'Trank', type: 'medicine', description: 'Ein Spray-Typ-Medizin für Wunden. Es heilt die KP eines Pokémon um 20 Punkte.', icon: '⚕', usable: true },
    { name: 'Supertrank', type: 'medicine', description: 'Ein Spray-Typ-Medizin für Wunden. Es heilt die KP eines Pokémon um 50 Punkte.', icon: '⚕', usable: true },
    { name: 'Beleber', type: 'medicine', description: 'Ein Medikament, das ein kampfunfähiges Pokémon wiederbelebt.', icon: '⚕', usable: true },
    { name: 'Kampfknochen', type: 'hold', description: 'Ein Halte-Item, das die Stärke von Boden-Attacken erhöht.', icon: '⚔', usable: false },
    { name: 'Giftstich', type: 'tm', description: 'Eine TM, die die Attacke Giftstich enthält.', icon: 'TM', usable: true },
    { name: 'Surfer', type: 'hm', description: 'Eine VM, die die Attacke Surfer enthält.', icon: 'VM', usable: true },
    { name: 'Eichs Paket', type: 'quest', description: 'Ein Paket, das Professor Eich gehört.', icon: '✉', usable: false },
    { name: 'Prunusbeere', type: 'berry', description: 'Eine Beere, die ein Pokémon im Kampf heilt.', icon: '●', usable: true },
    { name: 'Amrenabeere', type: 'berry', description: 'Eine Beere, die ein Pokémon von Paralyse heilt.', icon: '●', usable: true },
    { name: 'Fahrrad', type: 'other', description: 'Ein Fahrrad, mit dem man schneller reisen kann.', icon: '⛹', usable: true },
    { name: 'Angelrute', type: 'other', description: 'Eine Rute zum Angeln von Wasser-Pokémon.', icon: '⸙', usable: true },
    { name: 'Flöte', type: 'other', description: 'Eine Flöte, die schlafende Pokémon aufweckt.', icon: '♫', usable: true }
  ],
  
  pokemonBase: [
    { pokedex_number: 1, name: 'Bisasam', primary_type: 'Pflanze', secondary_type: 'Gift', base_hp: 45, base_attack: 49, base_defense: 49, base_special_attack: 65, base_special_defense: 65, base_speed: 45, evolution_level: 16, description: 'Auf seinem Rücken trägt es einen Samen, der langsam wächst.' },
    { pokedex_number: 4, name: 'Glumanda', primary_type: 'Feuer', secondary_type: null, base_hp: 39, base_attack: 52, base_defense: 43, base_special_attack: 60, base_special_defense: 50, base_speed: 65, evolution_level: 16, description: 'Die Flamme auf seiner Schwanzspitze zeigt seine Lebensenergie an.' },
    { pokedex_number: 7, name: 'Schiggy', primary_type: 'Wasser', secondary_type: null, base_hp: 44, base_attack: 48, base_defense: 65, base_special_attack: 50, base_special_defense: 64, base_speed: 43, evolution_level: 16, description: 'Wenn es sich in seinen Panzer zurückzieht, spritzt es Wasser mit unglaublichem Druck.' },
    { pokedex_number: 25, name: 'Pikachu', primary_type: 'Elektro', secondary_type: null, base_hp: 35, base_attack: 55, base_defense: 40, base_special_attack: 50, base_special_defense: 50, base_speed: 90, evolution_level: null, description: 'Wenn es wütend ist, entlädt es sofort die Energie, die in den Elektrosäcken in seinen Wangen gespeichert ist.' },
    { pokedex_number: 16, name: 'Taubsi', primary_type: 'Normal', secondary_type: 'Flug', base_hp: 40, base_attack: 45, base_defense: 40, base_special_attack: 35, base_special_defense: 35, base_speed: 56, evolution_level: 18, description: 'Sehr freundlich und ein guter Sucher. Es kann seinen Weg nach Hause finden, egal wie weit es entfernt ist.' },
    { pokedex_number: 10, name: 'Raupy', primary_type: 'Käfer', secondary_type: null, base_hp: 45, base_attack: 30, base_defense: 35, base_special_attack: 20, base_special_defense: 20, base_speed: 45, evolution_level: 7, description: 'Es hat einen enormen Appetit. Es kann mehr als sein eigenes Gewicht an Blättern fressen.' }
  ],
  
  moves: [
    { name: 'Tackle', type: 'Normal', category: 'physical', power: 40, accuracy: 100, pp: 35, description: 'Ein körperlicher Angriff, bei dem der Anwender in das Ziel stürmt.' },
    { name: 'Kratzer', type: 'Normal', category: 'physical', power: 40, accuracy: 100, pp: 35, description: 'Harte, scharfe Krallen werden benutzt, um das Ziel zu kratzen.' },
    { name: 'Glut', type: 'Feuer', category: 'special', power: 40, accuracy: 100, pp: 25, description: 'Der Gegner wird mit kleinen Flammen attackiert, die ihn eventuell verbrennen.' },
    { name: 'Aquaknarre', type: 'Wasser', category: 'special', power: 40, accuracy: 100, pp: 25, description: 'Der Gegner wird mit einem Wasserstrahl attackiert.' },
    { name: 'Rankenhieb', type: 'Pflanze', category: 'physical', power: 45, accuracy: 100, pp: 25, description: 'Der Gegner wird mit rankenartigen Peitschen attackiert.' },
    { name: 'Donnerschock', type: 'Elektro', category: 'special', power: 40, accuracy: 100, pp: 30, description: 'Ein elektrischer Angriff, der den Gegner manchmal paralysiert.' },
    { name: 'Windstoss', type: 'Flug', category: 'special', power: 40, accuracy: 100, pp: 35, description: 'Der Gegner wird mit einem scharfen Windstoß attackiert.' },
    { name: 'Fadenschuss', type: 'Käfer', category: 'status', power: null, accuracy: 95, pp: 40, description: 'Der Gegner wird mit einem klebrigen Faden eingewickelt, der seine Initiative senkt.' }
  ]
};
