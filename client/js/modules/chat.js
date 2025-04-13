// modules/chat.js
// Verwaltet die Chat-Funktionalität

import { emitChatMessage } from './socketHandler.js';
import { getMyId } from './socketHandler.js'; // Um eigene Nachrichten zu identifizieren

// --- DOM Element References ---
let chatMessagesContainer = null;
let chatInputElement = null;
let sendButtonElement = null;

/**
 * Initialisiert das Chat-Modul, holt Referenzen und setzt Event-Listener.
 */
export function initChat() {
    chatMessagesContainer = document.getElementById('chatMessages');
    chatInputElement = document.getElementById('chatInput');
    sendButtonElement = document.getElementById('sendButton');

    if (!chatMessagesContainer || !chatInputElement || !sendButtonElement) {
        console.error("Chat UI elements not found!");
        return;
    }

    // Event-Listener für den Senden-Button
    sendButtonElement.addEventListener('click', handleSendMessage);

    // Event-Listener für die Enter-Taste im Input-Feld
    chatInputElement.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });

    console.log("Chat module initialized.");
}

/**
 * Verarbeitet das Senden einer Nachricht (Button-Klick oder Enter).
 */
function handleSendMessage() {
    if (!chatInputElement) return;
    const messageText = chatInputElement.value.trim();

    if (messageText) {
        emitChatMessage(messageText); // Sende Nachricht über den SocketHandler
        chatInputElement.value = ''; // Leere das Input-Feld
        chatInputElement.focus(); // Setze Fokus zurück auf Input
    }
}

/**
 * Zeigt eine empfangene Chat-Nachricht im Chat-Fenster an.
 * @param {object} message - Das Nachrichtenobjekt vom Server oder lokal generiert.
 *                           Erwartet: { text: string, sender: string, timestamp: number, senderId: string, isOwnMessage?: boolean }
 */
export function displayMessage(message) {
    if (!chatMessagesContainer) return;

    const myId = getMyId(); // Hole die eigene ID zum Vergleich
    const isOwn = message.senderId === myId;

    // Erstelle das Nachrichten-Element
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isOwn ? 'own' : 'other'}`;

    // Füge den Absender hinzu (nur bei fremden Nachrichten)
    if (!isOwn) {
        const senderDiv = document.createElement('div');
        senderDiv.className = 'message-sender';
        senderDiv.textContent = message.sender || 'Unbekannt'; // Fallback für Absender
        messageDiv.appendChild(senderDiv);
    }

    // Füge den Nachrichtentext hinzu
    const textDiv = document.createElement('div');
    // Hier könnte man später Links oder Emojis erkennen und umwandeln
    textDiv.textContent = message.text;
    messageDiv.appendChild(textDiv);

    // Füge den Zeitstempel hinzu
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    const date = message.timestamp ? new Date(message.timestamp) : new Date(); // Fallback auf aktuelle Zeit
    timeDiv.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageDiv.appendChild(timeDiv);

    // Füge die Nachricht zum Chat hinzu
    chatMessagesContainer.appendChild(messageDiv);

    // Scrolle zum Ende des Chats, damit die neueste Nachricht sichtbar ist
    scrollToBottom();
}

/**
 * Scrollt den Chat-Container zum Boden.
 */
function scrollToBottom() {
    if (chatMessagesContainer) {
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
}

/**
 * Fügt eine Systemnachricht zum Chat hinzu.
 * @param {string} text - Der Text der Systemnachricht.
 */
export function displaySystemMessage(text) {
     if (!chatMessagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message system'; // Eigene Klasse für Systemnachrichten
    messageDiv.style.fontStyle = 'italic';
    messageDiv.style.color = '#aaa';
    messageDiv.style.alignSelf = 'center'; // Zentriert
    messageDiv.style.maxWidth = '90%';
    messageDiv.style.textAlign = 'center';
    messageDiv.textContent = text;

    chatMessagesContainer.appendChild(messageDiv);
    scrollToBottom();
}