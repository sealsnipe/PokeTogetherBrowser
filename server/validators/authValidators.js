// server/validators/authValidators.js

const { body } = require('express-validator');
const { User } = require('../models');  // Sequelize User-Modell, für DB-Abfragen

// Validierungsregeln für die Registrierung
const registerValidator = [
  // 1. Benutzername: trimmen, Pflicht, Länge 3-20, nur Alphanumerisch, und Einzigartigkeit prüfen
  body('username')
    .trim()  // entfernt überflüssige Leerzeichen
    .notEmpty().withMessage('Benutzername darf nicht leer sein.')
    .isLength({ min: 3, max: 20 }).withMessage('Benutzername muss 3-20 Zeichen lang sein.')
    .isAlphanumeric().withMessage('Benutzername darf nur Buchstaben und Zahlen enthalten.')
    .custom(async (value) => {               // Asynchroner Custom-Validator für Einzigartigkeit
      const user = await User.findOne({ where: { username: value } });
      if (user) {
        // Benutzername bereits vergeben -> Fehler werfen
        throw new Error('Benutzername ist bereits vergeben.');
      }
      return true;                           // alles ok -> Validation erfolgreich
    }),

  // 2. E-Mail: optional, wenn angegeben Format prüfen und Einzigartigkeit sicherstellen
  body('email')
    .optional({ checkFalsy: true })          // wenn Feld fehlt oder leer ist, überspringen
    .trim()
    .isEmail().withMessage('E-Mail-Adresse ist ungültig.')
    .normalizeEmail()                        // normalisiert z.B. Groß-/Kleinschreibung
    .custom(async (value) => {               // Custom-Validator für einzigartige E-Mail
      const user = await User.findOne({ where: { email: value } });
      if (user) {
        throw new Error('E-Mail-Adresse wird bereits verwendet.');
      }
      return true;
    }),

  // 3. Passwort: Mindestlänge und Komplexitätsregeln (Zahl, Groß-, Kleinbuchstabe, Sonderzeichen)
  body('password')
    .isLength({ min: 8 }).withMessage('Passwort muss mindestens 8 Zeichen lang sein.')
    .matches(/\d/).withMessage('Passwort muss mindestens eine Zahl enthalten.')
    .matches(/[A-Z]/).withMessage('Passwort muss mindestens einen Großbuchstaben enthalten.')
    .matches(/[a-z]/).withMessage('Passwort muss mindestens einen Kleinbuchstaben enthalten.')
    .matches(/\W/).withMessage('Passwort muss mindestens ein Sonderzeichen enthalten.'),

  // 4. Passwortbestätigung: muss ausgefüllt sein und mit Passwort übereinstimmen
  body('passwordConfirm')
    .trim()
    .notEmpty().withMessage('Passwortbestätigung darf nicht leer sein.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        // stimmt nicht mit Passwort überein
        throw new Error('Passwörter stimmen nicht überein.');
      }
      return true;
    })
];

// Validierungsregeln für den Login
const loginValidator = [
  // 1. Benutzername oder E-Mail (Identifier): Pflicht
  body('username')  // hier angenommen, dass Nutzer entweder Benutzername oder E-Mail in 'username' schickt
    .trim()
    .notEmpty().withMessage('Benutzername oder E-Mail ist erforderlich.'),

  // 2. Passwort: Pflicht
  body('password')
    .notEmpty().withMessage('Passwort ist erforderlich.')
];

module.exports = { registerValidator, loginValidator };