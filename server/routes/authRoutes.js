// Import von Express und weiteren Modulen
const express = require('express');
const router = express.Router();

// Controller und Middleware aus vorherigen Tickets importieren
const authController = require('../controllers/authController');  // Ticket 0003: enthält register, login, logout, getCurrentUser
const { authenticate } = require('../middleware/authMiddleware'); // Ticket 0004: Middleware zum JWT-/Session-Check
// Optional: Validatoren aus Ticket 0005 (falls implementiert)
const { registerValidator, loginValidator } = require('../validators/authValidators'); 

// Route: Registrierung eines neuen Users
// Optional Validator vorschalten (registerValidator) zur Prüfung von req.body
router.post('/register', /* registerValidator, */ authController.register);

// Route: Login eines Users (Session/Token erstellen)
// Optional Validator (loginValidator) zur Prüfung von Logindaten
router.post('/login', /* loginValidator, */ authController.login);

// Route: Logout des aktuellen Users (Session/Token beenden)
// Geschützt durch authenticate-Middleware (nur eingeloggte Benutzer)
// Controller löscht z.B. das JWT-Cookie oder die Session
router.post('/logout', authenticate, authController.logout);

// Route: Aktuellen (eingeloggten) Benutzer abfragen
// Geschützt durch authenticate-Middleware 
// Controller liest `req.player` (vom Middleware gesetzt) und gibt User-Daten zurück
router.get('/me', authenticate, authController.getCurrentUser);

// Router exportieren, damit er in der Hauptanwendung eingebunden werden kann
module.exports = router;