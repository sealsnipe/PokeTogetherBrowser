// client/js/authService.js

const API_BASE_URL = '/api/auth';

/**
 * Versucht, einen Benutzer über die API anzumelden.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object|boolean>}
 */
export async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        return data.user || true;
    } catch (error) {
        throw error;
    }
}

/**
 * Versucht, einen neuen Benutzer zu registrieren.
 * @param {object} userData { username, email, password, confirmPassword }
 * @returns {Promise<boolean>}
 */
export async function register(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(userData),
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || JSON.stringify(data.errors) || `HTTP error! status: ${response.status}`);
        }
        return true;
    } catch (error) {
        throw error;
    }
}

/**
 * Sendet eine Logout-Anfrage an den Server und leitet immer zur Login-Seite weiter.
 * @returns {Promise<void>}
 */
export async function logout() {
    try {
        await fetch(`${API_BASE_URL}/logout`, {
            method: 'POST',
            credentials: 'include',
        });
    } catch (error) {
        // Fehler loggen, aber trotzdem weiterleiten
    } finally {
        window.location.href = '/login.html';
    }
}

/**
 * Überprüft den aktuellen Authentifizierungsstatus.
 * @returns {Promise<object|null>}
 */
export async function checkAuth() {
    try {
        console.log("[AUTH DEBUG] checkAuth: Sending request to /api/auth/me"); // DEBUG LOG
        const response = await fetch(`${API_BASE_URL}/me`, {
            method: 'GET',
            credentials: 'include',
        });
        console.log(`[AUTH DEBUG] checkAuth: Received response status: ${response.status}`); // DEBUG LOG

        if (response.ok) { // Status 200-299
            console.log("[AUTH DEBUG] checkAuth: Response OK. Trying to parse JSON..."); // DEBUG LOG
            const data = await response.json();
            console.log("[AUTH DEBUG] checkAuth: JSON parsed successfully. Data:", data); // DEBUG LOG
            // Prüfe, ob das erwartete Feld 'player' existiert (basierend auf Server-Antwort)
            if (data && data.player) {
                 console.log("[AUTH DEBUG] checkAuth: Returning player data:", data.player); // DEBUG LOG
                 return data.player;
            } else {
                 console.error("[AUTH DEBUG] checkAuth: Response OK, but 'player' field missing in data:", data); // DEBUG LOG
                 return null; // Behandle fehlende Daten wie einen Fehler
            }
        } else if (response.status === 401) {
            console.log("[AUTH DEBUG] checkAuth: Received 401 Unauthorized."); // DEBUG LOG
            return null;
        } else {
            // Anderer Fehlerstatus (z.B. 500)
            console.error(`[AUTH DEBUG] checkAuth: Received unexpected status: ${response.status}`); // DEBUG LOG
            return null;
        }
    } catch (error) {
        console.error("[AUTH DEBUG] checkAuth: Network error or fetch failed:", error); // DEBUG LOG
        return null;
    }
}