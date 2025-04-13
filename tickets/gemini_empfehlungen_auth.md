# Empfehlungen & Hinweise von Gemini für Auth-Tickets

Diese Empfehlungen betreffen insbesondere die sichere und performante Implementierung der Authentifizierung, Fehlerbehandlung, Datenvalidierung und den Umgang mit Sequelize Hooks und Bulk-Operationen. Sie sollten bei der Umsetzung aller Auth-Tickets konsequent beachtet werden.

---

## 1. Abhängigkeitsmanagement (bcrypt vs. bcryptjs)
- bcrypt benötigt native C++-Kompilierung und kann in manchen Umgebungen zu Problemen führen.
- bcryptjs ist eine reine JS-Alternative, aber deutlich langsamer.
- Die Wahl sollte bewusst getroffen werden, abhängig von Deployment-Umgebung und Performance-Anforderungen.

## 2. Hook-Logik und Asynchronität
- Fehlende await-Aufrufe bei bcrypt.hash/compare führen zu fehlerhafter Verarbeitung.
- Die Prüfung auf player.changed('password_hash') ist bei beforeUpdate wichtig, um unnötiges Re-Hashing zu vermeiden.
- Doppel-Hashing vermeiden: Prüfen, ob bereits ein Hash übergeben wird.
- Korrekte Validierungsreihenfolge: allowNull: false-Constraints können Hooks verhindern, wenn kein Wert gesetzt ist.
- Richtiger Datenzugriff im Hook (z.B. Tippfehler vermeiden, ggf. getDataValue nutzen).

## 3. Fehlerbehandlung und Constraints
- Datenbank-Constraint-Verletzungen (unique, allowNull) müssen im Controller abgefangen und in sinnvolle Client-Fehlermeldungen übersetzt werden.

## 4. Performance
- Zu hohe SALT_ROUNDS verlangsamen Registrierung/Passwortänderung. Benchmarking ist wichtig.

## 5. Bulk-Operationen
- Bulk-Operationen (bulkCreate, bulkUpdate) umgehen Hooks, wenn keine Bulk-Hooks oder individualHooks: true gesetzt sind. Gefahr: Passwörter werden im Klartext gespeichert.

## 6. Best Practices für das Player-Modell
- Felder: email, password_hash, role, is_active, last_login.
- Passwort-Hashing über Sequelize Hooks (beforeCreate, beforeUpdate) mit bcrypt.
- Instanzmethode checkPassword für Passwortvergleich.
- Angemessener Cost Factor, robuste Validierung, korrekte Hook-Implementierung, Scopes gegen Hash-Leaks.

## 7. Nächste Schritte für weitere Tickets
- Ticket 0003: Registrierung (API-Route, Player.create, Passwort-Hashing, JWT).
- Ticket 0004: Login (API-Route, Passwortprüfung, JWT als Cookie).
- Ticket 0005: Authentifizierungs-Middleware (JWT prüfen, User an Request anhängen).

---