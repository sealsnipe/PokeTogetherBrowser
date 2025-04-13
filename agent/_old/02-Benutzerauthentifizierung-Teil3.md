# Benutzerauthentifizierung für PokeTogetherBrowser - Teil 3

## Client-seitige Implementierung

Für die Client-seitige Implementierung der Authentifizierung erstellen wir HTML-Formulare für die Registrierung und das Login sowie JavaScript-Funktionen für die Kommunikation mit dem Server.

### Login-Formular

```html
<!-- client/login.html -->
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PokéTogether - Login</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #2A2A2A;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        
        .auth-container {
            background-color: #333;
            border-radius: 8px;
            padding: 20px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .auth-header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .auth-header h1 {
            margin: 0;
            color: #4CAF50;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #aaa;
        }
        
        .form-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #555;
            border-radius: 4px;
            background-color: #444;
            color: white;
            box-sizing: border-box;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #4CAF50;
        }
        
        .error-message {
            color: #F44336;
            font-size: 14px;
            margin-top: 5px;
            display: none;
        }
        
        .auth-button {
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 12px;
            width: 100%;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .auth-button:hover {
            background-color: #45a049;
        }
        
        .auth-footer {
            text-align: center;
            margin-top: 20px;
            font-size: 14px;
            color: #aaa;
        }
        
        .auth-footer a {
            color: #4CAF50;
            text-decoration: none;
        }
        
        .auth-footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-header">
            <h1>PokéTogether</h1>
            <p>Melde dich an, um zu spielen</p>
        </div>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="username">Benutzername</label>
                <input type="text" id="username" name="username" required>
                <div class="error-message" id="usernameError"></div>
            </div>
            
            <div class="form-group">
                <label for="password">Passwort</label>
                <input type="password" id="password" name="password" required>
                <div class="error-message" id="passwordError"></div>
            </div>
            
            <div class="error-message" id="generalError"></div>
            
            <button type="submit" class="auth-button">Anmelden</button>
        </form>
        
        <div class="auth-footer">
            <p>Noch kein Konto? <a href="register.html">Registrieren</a></p>
        </div>
    </div>
    
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Fehler zurücksetzen
            document.querySelectorAll('.error-message').forEach(el => {
                el.style.display = 'none';
                el.textContent = '';
            });
            
            // Formulardaten sammeln
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                // Login-Anfrage senden
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    // Fehler anzeigen
                    if (data.errors) {
                        data.errors.forEach(error => {
                            const field = error.param;
                            const message = error.msg;
                            
                            if (field === 'username') {
                                document.getElementById('usernameError').textContent = message;
                                document.getElementById('usernameError').style.display = 'block';
                            } else if (field === 'password') {
                                document.getElementById('passwordError').textContent = message;
                                document.getElementById('passwordError').style.display = 'block';
                            } else {
                                document.getElementById('generalError').textContent = message;
                                document.getElementById('generalError').style.display = 'block';
                            }
                        });
                    } else {
                        document.getElementById('generalError').textContent = data.message || 'Ein Fehler ist aufgetreten';
                        document.getElementById('generalError').style.display = 'block';
                    }
                    return;
                }
                
                // Erfolgreicher Login, zur Spielseite weiterleiten
                window.location.href = '/game.html';
            } catch (error) {
                console.error('Login-Fehler:', error);
                document.getElementById('generalError').textContent = 'Ein Netzwerkfehler ist aufgetreten';
                document.getElementById('generalError').style.display = 'block';
            }
        });
    </script>
</body>
</html>
```

### Registrierungs-Formular

```html
<!-- client/register.html -->
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PokéTogether - Registrierung</title>
    <style>
        /* Gleiche Styles wie in login.html */
        body {
            font-family: Arial, sans-serif;
            background-color: #2A2A2A;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        
        .auth-container {
            background-color: #333;
            border-radius: 8px;
            padding: 20px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .auth-header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .auth-header h1 {
            margin: 0;
            color: #4CAF50;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #aaa;
        }
        
        .form-group input {
            width: 100%;
            padding: 10px;
            border: 1px solid #555;
            border-radius: 4px;
            background-color: #444;
            color: white;
            box-sizing: border-box;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #4CAF50;
        }
        
        .error-message {
            color: #F44336;
            font-size: 14px;
            margin-top: 5px;
            display: none;
        }
        
        .auth-button {
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 12px;
            width: 100%;
            font-size: 16px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .auth-button:hover {
            background-color: #45a049;
        }
        
        .auth-footer {
            text-align: center;
            margin-top: 20px;
            font-size: 14px;
            color: #aaa;
        }
        
        .auth-footer a {
            color: #4CAF50;
            text-decoration: none;
        }
        
        .auth-footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-header">
            <h1>PokéTogether</h1>
            <p>Erstelle ein Konto, um zu spielen</p>
        </div>
        
        <form id="registerForm">
            <div class="form-group">
                <label for="username">Benutzername</label>
                <input type="text" id="username" name="username" required>
                <div class="error-message" id="usernameError"></div>
            </div>
            
            <div class="form-group">
                <label for="email">E-Mail (optional)</label>
                <input type="email" id="email" name="email">
                <div class="error-message" id="emailError"></div>
            </div>
            
            <div class="form-group">
                <label for="password">Passwort</label>
                <input type="password" id="password" name="password" required>
                <div class="error-message" id="passwordError"></div>
            </div>
            
            <div class="form-group">
                <label for="confirmPassword">Passwort bestätigen</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required>
                <div class="error-message" id="confirmPasswordError"></div>
            </div>
            
            <div class="error-message" id="generalError"></div>
            
            <button type="submit" class="auth-button">Registrieren</button>
        </form>
        
        <div class="auth-footer">
            <p>Bereits ein Konto? <a href="login.html">Anmelden</a></p>
        </div>
    </div>
    
    <script>
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Fehler zurücksetzen
            document.querySelectorAll('.error-message').forEach(el => {
                el.style.display = 'none';
                el.textContent = '';
            });
            
            // Formulardaten sammeln
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Einfache Client-seitige Validierung
            if (password !== confirmPassword) {
                document.getElementById('confirmPasswordError').textContent = 'Passwörter stimmen nicht überein';
                document.getElementById('confirmPasswordError').style.display = 'block';
                return;
            }
            
            try {
                // Registrierungs-Anfrage senden
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password, confirmPassword })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    // Fehler anzeigen
                    if (data.errors) {
                        data.errors.forEach(error => {
                            const field = error.param;
                            const message = error.msg;
                            
                            if (field === 'username') {
                                document.getElementById('usernameError').textContent = message;
                                document.getElementById('usernameError').style.display = 'block';
                            } else if (field === 'email') {
                                document.getElementById('emailError').textContent = message;
                                document.getElementById('emailError').style.display = 'block';
                            } else if (field === 'password') {
                                document.getElementById('passwordError').textContent = message;
                                document.getElementById('passwordError').style.display = 'block';
                            } else if (field === 'confirmPassword') {
                                document.getElementById('confirmPasswordError').textContent = message;
                                document.getElementById('confirmPasswordError').style.display = 'block';
                            } else {
                                document.getElementById('generalError').textContent = message;
                                document.getElementById('generalError').style.display = 'block';
                            }
                        });
                    } else {
                        document.getElementById('generalError').textContent = data.message || 'Ein Fehler ist aufgetreten';
                        document.getElementById('generalError').style.display = 'block';
                    }
                    return;
                }
                
                // Erfolgreiche Registrierung, zur Spielseite weiterleiten
                window.location.href = '/game.html';
            } catch (error) {
                console.error('Registrierungsfehler:', error);
                document.getElementById('generalError').textContent = 'Ein Netzwerkfehler ist aufgetreten';
                document.getElementById('generalError').style.display = 'block';
            }
        });
    </script>
</body>
</html>
```

### Socket.io-Client mit Authentifizierung

```javascript
// client/js/auth.js
// Hilfsfunktionen für die Authentifizierung

// Token aus Cookies abrufen
function getToken() {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'token') {
            return value;
        }
    }
    return null;
}

// Prüfen, ob der Benutzer angemeldet ist
function isAuthenticated() {
    return getToken() !== null;
}

// Benutzer zur Login-Seite umleiten, wenn nicht angemeldet
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Benutzer zur Spielseite umleiten, wenn bereits angemeldet
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = '/game.html';
        return true;
    }
    return false;
}

// Abmelden
async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Abmeldefehler:', error);
    }
}

// Socket.io-Verbindung mit Authentifizierung herstellen
function connectSocket() {
    const token = getToken();
    
    if (!token) {
        console.error('Keine Authentifizierung für Socket.io-Verbindung');
        return null;
    }
    
    const socket = io({
        auth: {
            token: token
        }
    });
    
    socket.on('connect_error', (error) => {
        console.error('Socket.io-Verbindungsfehler:', error.message);
        
        if (error.message === 'Nicht authentifiziert') {
            // Token ist ungültig oder abgelaufen, zur Login-Seite umleiten
            window.location.href = '/login.html';
        }
    });
    
    return socket;
}
```

### Integration in die Spielseite

```javascript
// client/js/game.js
// Spiel-Initialisierung mit Authentifizierung

// Prüfen, ob der Benutzer angemeldet ist
if (!requireAuth()) {
    // Die Funktion leitet bereits zur Login-Seite um
    throw new Error('Nicht authentifiziert');
}

// Socket.io-Verbindung herstellen
const socket = connectSocket();

if (!socket) {
    // Keine Verbindung möglich, zur Login-Seite umleiten
    window.location.href = '/login.html';
    throw new Error('Keine Socket.io-Verbindung möglich');
}

// Spielerdaten empfangen
socket.on('player data', (data) => {
    // Spielerdaten verarbeiten
    console.log('Spielerdaten empfangen:', data);
    
    // Spieler-ID und Benutzername speichern
    myId = data.id;
    username = data.username;
    
    // Position setzen
    if (data.position) {
        players[myId] = {
            x: data.position.x,
            y: data.position.y,
            username: username
        };
    }
    
    // Inventar aktualisieren
    updateInventory(data.inventory);
    
    // Pokémon-Team aktualisieren
    updatePokemonTeam(data.pokemon);
    
    // Spielername anzeigen
    document.getElementById('playerName').textContent = username;
});

// Verbundene Spieler empfangen
socket.on('connected players', (connectedPlayers) => {
    console.log('Verbundene Spieler:', connectedPlayers);
    
    // Andere Spieler zur Spielerliste hinzufügen
    connectedPlayers.forEach(player => {
        players[player.id] = {
            x: player.position.x,
            y: player.position.y,
            username: player.username
        };
    });
    
    // Spielerliste aktualisieren
    updatePlayersList();
});

// Neuer Spieler verbunden
socket.on('player joined', (player) => {
    console.log('Spieler verbunden:', player);
    
    // Spieler zur Spielerliste hinzufügen
    players[player.id] = {
        x: player.position.x,
        y: player.position.y,
        username: player.username
    };
    
    // Spielerliste aktualisieren
    updatePlayersList();
    
    // Chat-Nachricht anzeigen
    addChatMessage({
        username: 'System',
        message: `${player.username} hat das Spiel betreten`
    });
});

// Spieler hat sich bewegt
socket.on('player moved', (player) => {
    // Spielerposition aktualisieren
    if (players[player.id]) {
        players[player.id].x = player.position.x;
        players[player.id].y = player.position.y;
    }
});

// Spieler hat das Spiel verlassen
socket.on('player left', (player) => {
    console.log('Spieler getrennt:', player);
    
    // Spieler aus der Spielerliste entfernen
    delete players[player.id];
    
    // Spielerliste aktualisieren
    updatePlayersList();
    
    // Chat-Nachricht anzeigen
    addChatMessage({
        username: 'System',
        message: `${player.username} hat das Spiel verlassen`
    });
});

// Chat-Nachricht empfangen
socket.on('chat message', (data) => {
    addChatMessage(data);
});

// Fehler empfangen
socket.on('error', (error) => {
    console.error('Socket.io-Fehler:', error);
    alert(`Fehler: ${error.message}`);
});

// Abmelde-Button
document.getElementById('logoutButton').addEventListener('click', () => {
    logout();
});
```

## Zusammenfassung

Die Benutzerauthentifizierung umfasst:

1. **Server-seitige Implementierung**:
   - Benutzermodell mit Passwort-Hashing
   - Authentifizierungs-Controller für Registrierung, Login und Logout
   - JWT-basierte Authentifizierung
   - Middleware für geschützte Routen
   - Socket.io-Authentifizierung

2. **Client-seitige Implementierung**:
   - Login- und Registrierungsformulare
   - Client-seitige Validierung
   - Token-Verwaltung
   - Socket.io-Integration mit Authentifizierung

Diese Implementierung bietet ein sicheres und benutzerfreundliches Authentifizierungssystem, das sowohl für HTTP-Anfragen als auch für Socket.io-Verbindungen funktioniert.

Im nächsten Schritt werden wir die Spielstand-Speicherung implementieren, um den Fortschritt der Spieler zu verfolgen und zu speichern.
