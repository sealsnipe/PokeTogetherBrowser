# Plan: Sentry MCP-Server (Hosted)

1.  **Ziel:** Ein MCP-Server, der mit der Sentry Cloud API interagiert, um Informationen über Fehler und Issues abzurufen.
2.  **Name:** `sentry-mcp-server`.
3.  **Voraussetzung:** Ein Sentry.io Account (kostenloser "Developer"-Tarif reicht) und ein angelegtes Projekt für die Anwendung.
4.  **Benötigte Informationen (aus Sentry Account):**
    *   **Sentry Auth Token:** Ein API-Authentifizierungstoken (Internal Integration Token) aus den Sentry Developer Settings. Benötigt mindestens `project:read` und `event:read` Berechtigungen.
    *   **Sentry Organization Slug:** Der Kurzname der Organisation in Sentry (aus der URL).
    *   **Sentry Project Slug:** Der Kurzname des Sentry-Projekts (aus der URL oder Projekteinstellungen).
5.  **Geplante Tools (Initial):**
    *   **`get_latest_issues`**:
        *   **Zweck:** Ruft eine Liste der neuesten/häufigsten Fehler-Issues aus einem Sentry-Projekt ab.
        *   **Parameter:**
            *   `project_slug` (optional, falls nur ein Projekt konfiguriert ist, sonst erforderlich): Der Slug des Sentry-Projekts.
            *   `limit` (optional, Standard z.B. 10): Maximale Anzahl der abzurufenden Issues.
            *   `environment` (optional): Filtert nach einer bestimmten Umgebung (z.B. "production", "local").
            *   `query` (optional): Eine Sentry-Suchanfrage (z.B. `is:unresolved level:error`).
        *   **Rückgabe:** Eine Liste von Issues mit Details wie ID, Titel, Fehlertyp, Anzahl der Events, Zeitpunkt des letzten Auftretens, Level (error, warning, etc.).
6.  **Umsetzung (im Code-Modus):**
    1.  Server-Grundgerüst `sentry-mcp-server` erstellen (`npx @modelcontextprotocol/create-server sentry-mcp-server` im Verzeichnis `C:\Users\Matthias\AppData\Roaming\Roo-Code\MCP`).
    2.  Abhängigkeiten installieren (`axios` im neuen Server-Verzeichnis).
    3.  Server-Logik in `src/index.ts` implementieren (Tool-Definition, Sentry API-Aufrufe).
    4.  Server bauen (`npm run build` im Server-Verzeichnis).
    5.  Server in `mcp_settings.json` konfigurieren (Pfad, Umgebungsvariablen für Token, Org/Project Slug).
    6.  Tool `get_latest_issues` testen.