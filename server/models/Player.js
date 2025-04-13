// server/models/Player.js

// Importiere notwendige Module
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

// Definiere den bcrypt Cost Factor als Konstante
const SALT_ROUNDS = 10;

module.exports = (sequelize) => {
  // Definiere das Player-Modell mit sequelize.define
  const Player = sequelize.define('Player', {
    // Primärschlüssel
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    // Benutzername
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        msg: 'Dieser Benutzername ist bereits vergeben.'
      },
      validate: { // Added validation
        notEmpty: {
          msg: 'Benutzername darf nicht leer sein.'
        },
        len: {
          args: [3, 50],
          msg: 'Benutzername muss zwischen 3 und 50 Zeichen lang sein.'
        }
      }
    },
    // NEU: E-Mail-Adresse
    email: {
      type: DataTypes.STRING(100),
      allowNull: true, // Keep nullable as per plan
      unique: {
        msg: 'Diese E-Mail-Adresse wird bereits verwendet.'
      },
      validate: {
        isEmail: {
          msg: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.'
        }
      }
    },
    // Passwort-Hash
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    // NEU: Benutzerrolle
    role: {
      type: DataTypes.STRING(20),
      defaultValue: 'player',
      allowNull: false,
      validate: {
        isIn: {
          args: [['player', 'moderator', 'admin']],
          msg: 'Ungültige Benutzerrolle.'
        }
      }
    },
    // NEU: Account-Status
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    // NEU: Letzter Login-Zeitpunkt
    last_login: {
      type: DataTypes.DATE,
      allowNull: true // Explicitly set allowNull: true
    },
    // Bestehende Felder
    position_x: {
      type: DataTypes.FLOAT,
      defaultValue: 0, // Changed default from 250 to 0 as per example
      allowNull: false // Added allowNull: false as per example
    },
    position_y: {
      type: DataTypes.FLOAT,
      defaultValue: 0, // Changed default from 250 to 0 as per example
      allowNull: false // Added allowNull: false as per example
    },
    // Added map_id as per example
    map_id: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'default_map'
    },
    is_running: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false // Added allowNull: false as per example
    }
    // Removed created_at field, timestamps: true will handle it
  }, {
    // Optionen für das Modell (Added this whole block)
    timestamps: true, // Fügt createdAt und updatedAt automatisch hinzu
    underscored: true, // Konvertiert camelCase zu snake_case (z.B. passwordHash -> password_hash)

    // Sequelize Hooks für automatische Aktionen
    hooks: {
      beforeCreate: async (player, options) => {
        if (player.password_hash) {
          if (!player.password_hash.match(/^\$2[aby]\$\d{2}\$/)) {
             player.password_hash = await bcrypt.hash(player.password_hash, SALT_ROUNDS);
          } else {
             console.warn(`Attempted to hash an already hashed password during creation for user ${player.username}. Ensure plaintext password is provided.`);
          }
        } else {
           throw new Error("Password cannot be empty.");
        }
      },
      beforeUpdate: async (player, options) => {
        if (player.changed('password_hash') && player.password_hash) {
          if (!player.password_hash.match(/^\$2[aby]\$\d{2}\$/)) {
            player.password_hash = await bcrypt.hash(player.password_hash, SALT_ROUNDS);
          } else {
            console.warn(`Attempt to set an already hashed value during update for Player ID ${player.id}. Skipping hash.`);
          }
        }
      }
    },

    // Standard-Scope, um den Passwort-Hash standardmäßig NICHT bei Abfragen zurückzugeben
    defaultScope: {
      attributes: { exclude: ['password_hash'] }
    },
    // Benannte Scopes, um den Hash gezielt abfragen zu können
    scopes: {
      withPassword: {
        attributes: { include: ['password_hash'] }
      }
    }
  });

  // Instanzmethode zum Vergleichen des eingegebenen Passworts mit dem gespeicherten Hash (Added this method)
  Player.prototype.checkPassword = async function(password) {
    if (!password || !this.password_hash) {
      return false;
    }
    try {
      return await bcrypt.compare(password, this.password_hash);
    } catch (error) {
      console.error(`Error comparing password for user ${this.username}:`, error);
      return false;
    }
  };

  // Assoziationen (Beispiel, falls vorhanden - kept commented out)
  // Player.associate = (models) => {
  //   Player.hasMany(models.PlayerPokemon, { foreignKey: 'player_id' });
  //   // Weitere Assoziationen...
  // };

  // Gib das definierte Modell zurück
  return Player;
};
