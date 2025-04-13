// server/controllers/authController.js

const jwt = require('jsonwebtoken');
const db = require('../models');
const authConfig = require('../config/auth');
const { Op } = require('sequelize');
// Optional: const { validationResult } = require('express-validator');

// Hilfsfunktion: Starter-Items und Starter-Pokémon zuweisen
async function addStarterItems(playerId) {
    try {
        // Beispielhafte Starter-Items (IDs müssen existieren!)
        const starterItemIds = [1, 2]; // z.B. Pokéball, Trank
        const inventoryItems = starterItemIds.map(itemId => ({
            playerId,
            itemId,
            quantity: 1
        }));
        await db.InventoryItem.bulkCreate(inventoryItems);

        // Zufälliges Starter-Pokémon (IDs z.B. 1, 4, 7)
        const starterPokemonIds = [1, 4, 7];
        const randomId = starterPokemonIds[Math.floor(Math.random() * starterPokemonIds.length)];
        const base = await db.PokemonBase.findOne({ where: { id: randomId } });
        if (base) {
            await db.PlayerPokemon.create({
                playerId,
                pokemonBaseId: base.id,
                level: 5,
                currentHp: base.baseHp
            });
        }
    } catch (err) {
        console.error('Fehler bei addStarterItems:', err);
        // Registrierung nicht abbrechen, Fehler nur loggen
    }
}

// Registrierung
exports.register = async (req, res) => {
    try {
        // Optional: Validierungsfehler prüfen
        // const errors = validationResult(req);
        // if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { username, email, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username und Passwort sind erforderlich.' });
        }

        // Prüfen, ob User existiert
        const existingPlayer = await db.Player.findOne({
            where: {
                [Op.or]: [
                    { username },
                    { email: email || null }
                ]
            }
        });
        if (existingPlayer) {
            return res.status(400).json({ message: 'Benutzername oder E-Mail bereits vergeben.' });
        }

        // Player anlegen (Passwort wird im Hook gehasht)
        const newPlayer = await db.Player.create({
            username,
            email: email || null,
            password_hash: password,
            role: 'player',
            is_active: true,
            last_login: new Date()
        });

        // Starter-Items zuweisen (Fehler werden intern behandelt)
        await addStarterItems(newPlayer.id);

        // JWT erstellen
        const payload = { id: newPlayer.id, username: newPlayer.username, role: newPlayer.role };
        const token = jwt.sign(payload, authConfig.JWT_SECRET, { expiresIn: authConfig.JWT_EXPIRES_IN });

        // Cookie setzen
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // Beispiel: 7 Tage
            sameSite: 'Lax' // Geändert von Strict zu Lax
        });

        // Erfolgsantwort
        res.status(201).json({
            message: 'Registrierung erfolgreich',
            player: {
                id: newPlayer.id,
                username: newPlayer.username,
                email: newPlayer.email,
                role: newPlayer.role
            }
        });
    } catch (err) {
        console.error('Fehler bei der Registrierung:', err);
        res.status(500).json({ message: 'Serverfehler bei der Registrierung.' });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        // Optional: Validierungsfehler prüfen
        // const errors = validationResult(req);
        // if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { username, password } = req.body;
        console.log(`[AUTH DEBUG] Login attempt for username: ${username}`); // DEBUG LOG
        if (!username || !password) {
            console.log('[AUTH DEBUG] Missing username or password.'); // DEBUG LOG
            return res.status(400).json({ message: 'Username und Passwort sind erforderlich.' });
        }

        // Wichtig: Hier den Scope 'withPassword' verwenden, um den Hash zu laden!
        const player = await db.Player.scope('withPassword').findOne({ where: { username } });
        console.log(`[AUTH DEBUG] Player found in DB: ${player ? player.username : 'null'}`); // DEBUG LOG
        if (!player || !player.is_active) {
            console.log('[AUTH DEBUG] Player not found or inactive.'); // DEBUG LOG
            return res.status(401).json({ message: 'Ungültige Anmeldedaten oder Benutzer inaktiv.' });
        }
        console.log(`[AUTH DEBUG] Player password hash from DB: ${player.password_hash}`); // DEBUG LOG

        console.log(`[AUTH DEBUG] Password provided by user: ${password}`); // DEBUG LOG
        const isPasswordValid = await player.checkPassword(password);
        console.log(`[AUTH DEBUG] Result of checkPassword: ${isPasswordValid}`); // DEBUG LOG
        if (!isPasswordValid) {
            console.log('[AUTH DEBUG] Password check failed.'); // DEBUG LOG
            return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
        }

        player.last_login = new Date();
        await player.save();

        const payload = { id: player.id, username: player.username, role: player.role };
        const token = jwt.sign(payload, authConfig.JWT_SECRET, { expiresIn: authConfig.JWT_EXPIRES_IN });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: 'Lax' // Geändert von Strict zu Lax
        });

        res.status(200).json({
            message: 'Anmeldung erfolgreich',
            player: {
                id: player.id,
                username: player.username,
                email: player.email,
                role: player.role
            }
        });
    } catch (err) {
        console.error('Fehler beim Login:', err);
        res.status(500).json({ message: 'Serverfehler beim Login.' });
    }
};

// Logout
exports.logout = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
    });
    res.status(200).json({ message: 'Abmeldung erfolgreich' });
};

// Aktuellen Benutzer abrufen
exports.getCurrentUser = (req, res) => {
    console.log('[AUTH DEBUG] getCurrentUser called.'); // DEBUG LOG
    if (!req.player) {
        console.log('[AUTH DEBUG] getCurrentUser: req.player not found. Sending 401.'); // DEBUG LOG
        return res.status(401).json({ message: 'Nicht authentifiziert.' });
    }
    console.log('[AUTH DEBUG] getCurrentUser: Found req.player:', req.player); // DEBUG LOG
    res.status(200).json({ player: req.player });
};