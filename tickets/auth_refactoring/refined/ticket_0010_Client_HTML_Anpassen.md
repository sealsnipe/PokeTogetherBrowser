Implementierungsplan für Ticket 0010: Client-seitige Authentifizierungs-Oberflächen (Login & Registrierung)
I. Einleitung
A. Zielsetzung
Dieses Dokument beschreibt einen detaillierten technischen Implementierungsplan für Ticket 0010 im Rahmen des PokeTogetherBrowser-Projekts. Das Kernziel dieses Tickets ist die Anpassung der bestehenden Benutzeroberfläche für die Anmeldung (login.html) und die Erstellung einer neuen Benutzeroberfläche für die Registrierung (register.html). Diese Anpassungen sind notwendig, um die clientseitigen Interaktionen mit dem neu zu implementierenden Authentifizierungssystem zu ermöglichen. Angesichts der Projektstruktur wird dieser Plan von einer Implementierung mittels React/Next.js ausgehen, anstatt statischer HTML-Dateien.

B. Kontext innerhalb der Authentifizierungs-Überarbeitung
Ticket 0010 ist ein fundamentaler Baustein im Rahmen der strategischen Umstellung des Authentifizierungssystems von PokeTogetherBrowser. Das Projekt bewegt sich weg von einer einfachen, speicherbasierten Session-Authentifizierung hin zu einem robusteren, sichereren und skalierbareren Ansatz mittels JSON Web Tokens (JWT), die über HTTP-only Cookies verwaltet werden. Die in diesem Ticket beschriebenen Login- und Registrierungsseiten (bzw. deren React-Komponenten-Äquivalente) stellen die primären Schnittstellen dar, über die Endbenutzer mit diesem neuen Authentifizierungsfluss interagieren. Eine korrekte und benutzerfreundliche Implementierung ist daher entscheidend für die Akzeptanz und Sicherheit des gesamten Systems.

C. Kritische Abhängigkeiten
Die erfolgreiche Umsetzung dieses Tickets hängt maßgeblich von der Fertigstellung von Ticket 0008 ab. Dieses vorausgehende Ticket definiert und implementiert die clientseitigen JavaScript-Funktionen (login, register), welche die eigentliche Kommunikation mit den Backend-API-Endpunkten für Authentifizierung kapseln. Es wird angenommen, dass diese Funktionen (z.B. mittels fetch implementiert) Promises zurückgeben, die bei Erfolg resolven (z.B. mit true oder Benutzerdaten) und bei Fehlern rejecten, idealerweise mit einem Error-Objekt, das detaillierte Fehlermeldungen vom Server enthält. Die in diesem Plan beschriebene UI-Logik wird diese Funktionen aufrufen und deren Ergebnisse verarbeiten.

II. Analyse der Anforderungen & Diskrepanz im Projektkontext
A. Dekonstruktion der Anforderungen von Ticket 0010
Die Anforderungen aus Ticket 0010 lassen sich wie folgt detaillieren:

Login-Seite (login.html / Login-Komponente):

Integration der login-Funktion: Der Formular-Submit-Handler muss die (in Ticket 0008 definierte) asynchrone login-Funktion aufrufen.
Entfernung veralteter Logik: Jeglicher Code, der versucht, Session-IDs oder ähnliche Authentifizierungs-Tokens im localStorage zu speichern oder zu lesen, muss entfernt werden. Der neue Ansatz basiert auf vom Browser verwalteten HTTP-only Cookies.
Fehleranzeige: Ein dedizierter Bereich (z.B. ein div mit der ID generalError) muss implementiert werden, um allgemeine Fehlermeldungen anzuzeigen, die von der login-Funktion zurückgegeben werden (z.B. "Ungültige Anmeldedaten", "Serverfehler").
Formularfelder: Die notwendigen Eingabefelder für Benutzername (username) und Passwort (password) müssen vorhanden und korrekt an die Logik angebunden sein.
Navigation: Ein Link zur Registrierungsseite muss vorhanden sein.
Registrierungs-Seite (register.html / Registrierungs-Komponente):

Neuerstellung: Diese Seite/Komponente muss neu erstellt werden.
Formularstruktur: Ein HTML/JSX-Formular mit Eingabefeldern für Benutzername (username), E-Mail (email - Optionalität gemäß Serverkonfiguration prüfen), Passwort (password) und Passwortbestätigung (confirmPassword) ist erforderlich.
Fehlercontainer: Es müssen sowohl ein Container für allgemeine Fehler (generalError) als auch feldspezifische Container (z.B. usernameError, emailError, passwordError, confirmPasswordError) implementiert werden, um detailliertes Feedback zu ermöglichen.
Integration der register-Funktion: Der Formular-Submit-Handler muss die (in Ticket 0008 definierte) asynchrone register-Funktion aufrufen.
Clientseitige Validierung: Eine grundlegende Prüfung, ob die eingegebenen Passwörter übereinstimmen, sollte clientseitig erfolgen, um unnötige API-Anfragen zu vermeiden.
Erfolgsbehandlung: Bei erfolgreicher Registrierung (Rückgabe von true durch die register-Funktion) muss eine Weiterleitung zur Spielseite erfolgen.
Fehlerbehandlung (Server): Die Komponente muss in der Lage sein, vom Server zurückgegebene Fehler (sowohl allgemeine als auch Validierungsfehler, potenziell im Format von express-validator) zu parsen und in den entsprechenden Fehlercontainern anzuzeigen.
Navigation: Ein Link zurück zur Login-Seite muss vorhanden sein.
Konsistenz:

Beide Seiten/Komponenten sollten ein einheitliches visuelles Erscheinungsbild (CSS) aufweisen.
Die Benutzerführung, insbesondere das Feedback bei Aktionen (Laden, Erfolg, Fehler) und die Navigation zwischen Login und Registrierung, muss konsistent und intuitiv sein.
B. Adressierung der Diskrepanz: .html vs. Next.js/React
Evidenz: Die Projektübersicht weist explizit auf das Vorhandensein von Verzeichnissen wie .next/, pages/ und components/ hin. Diese Strukturen sind charakteristisch für Projekte, die mit Next.js und React aufgebaut sind. Demgegenüber referenziert Ticket 0010 explizit statische .html-Dateien (login.html, register.html).

Analyse der Diskrepanz: Diese Diskrepanz legt nahe, dass die Beschreibung in Ticket 0010 entweder veraltet ist oder den technischen Unterbau vereinfacht darstellt. Die Wahrscheinlichkeit, dass das Projekt tatsächlich Next.js/React verwendet, ist aufgrund der Verzeichnisstruktur sehr hoch. Die Implikation für die Implementierung von Ticket 0010 ist signifikant: Statt einfacher HTML-Dateien mit eingebetteten <script>-Tags und direkter DOM-Manipulation muss die Implementierung im Rahmen einer komponentenbasierten Architektur erfolgen. Dies bedeutet die Erstellung von React-Komponenten (z.B. funktionale Komponenten in pages/auth/login.js und pages/auth/register.js oder dedizierte Komponenten in components/auth/), die Verwendung von React Hooks für die Zustandsverwaltung (useState für Formularwerte, Fehler, Ladezustände) und Event-Handling (z.B. onSubmit am Formular), sowie die Nutzung des Next.js-Routers (useRouter) für Weiterleitungen. Die in Ticket 0010 bereitgestellten JavaScript-Codebeispiele dienen somit als logische Vorlage, müssen aber in das reaktive Paradigma von React übersetzt werden.

Empfehlung: Die Implementierung sollte unter der Annahme erfolgen, dass eine Next.js/React-Umgebung vorliegt. Der nachfolgende Plan ist darauf ausgerichtet und verwendet entsprechende Terminologie und Konzepte (JSX, Hooks, Komponenten). Sollte sich wider Erwarten herausstellen, dass doch statische HTML-Dateien verwendet werden, bleiben die Grundprinzipien (Formularstruktur, API-Aufrufe, Fehlerbehandlung) ähnlich, die konkrete Umsetzung (direkte DOM-Manipulation statt State Management) würde sich jedoch unterscheiden.

III. Implementierungsplan: Anpassung der Login-Seite/Komponente
A. Komponentenstruktur (JSX/HTML)
Es wird empfohlen, eine React-Komponente zu erstellen oder anzupassen, z.B. unter pages/auth/login.js.

JSX-Struktur:

Ein <form>-Element mit einem onSubmit-Handler, der an eine handleSubmit-Funktion gebunden ist: <form id="loginForm" onSubmit={handleSubmit}>.
Eingabefelder für Benutzername und Passwort, deren value an React-State-Variablen gebunden ist und deren onChange-Handler die State-Updates durchführen:
JavaScript

<label htmlFor="username">Benutzername:</label>
<input type="text" id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} required />

<label htmlFor="password">Passwort:</label>
<input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
Ein Container zur Anzeige allgemeiner Fehler, dessen Sichtbarkeit und Inhalt an eine React-State-Variable gebunden sind:
JavaScript

<div id="generalError" style={{ display: error? 'block' : 'none', color: 'red' }}>
  {error}
</div>
Ein Submit-Button, dessen disabled-Zustand an eine isLoading-State-Variable gebunden ist:
JavaScript

<button type="submit" disabled={isLoading}>
  {isLoading? 'Anmelden...' : 'Anmelden'}
</button>
Ein Navigationslink zur Registrierungsseite unter Verwendung der Next.js <Link>-Komponente:
JavaScript

<p>
  Noch kein Konto? <Link href="/auth/register"><a>Registrieren</a></Link>
</p>
(Tabelle) Vorgeschlagene HTML/JSX-Element-IDs und Zweck (Login):

ID	Elementtyp	Zweck
loginForm	form	Das Hauptformular für die Anmeldung
username	input	Eingabefeld für den Benutzernamen
password	input	Eingabefeld für das Passwort
generalError	div	Container zur Anzeige allgemeiner Fehler (API, Netzwerk)

In Google Sheets exportieren
*Begründung:* Die Standardisierung von IDs erleichtert die Verknüpfung von JSX-Elementen mit State und Logik, verbessert die Testbarkeit und ermöglicht konsistentes CSS-Styling. Es formalisiert die im Ticket beschriebene Struktur.
B. CSS-Styling
Es wird empfohlen, einen konsistenten Styling-Ansatz zu verwenden (z.B. globale CSS-Datei, CSS Modules, Tailwind CSS oder eine im Projekt bereits etablierte UI-Bibliothek), um ein einheitliches Erscheinungsbild mit der Registrierungskomponente und dem Rest der Anwendung sicherzustellen.
Besonderes Augenmerk sollte auf das Styling von Fehlerzuständen gelegt werden (z.B. rote Textfarbe für Fehlermeldungen).
Der disabled-Zustand des Submit-Buttons während des Ladevorgangs sollte visuell kenntlich gemacht werden (z.B. ausgegraut, anderer Cursor).
C. State Management (React Hooks)
Die Verwaltung des Komponentenzustands sollte über React Hooks erfolgen:

useState für die Werte der Eingabefelder:
JavaScript

const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
useState für die Verwaltung von Fehlermeldungen:
JavaScript

const [error, setError] = useState(null);
useState für die Verwaltung des Ladezustands während API-Aufrufen:
JavaScript

const [isLoading, setIsLoading] = useState(false);
useRouter von Next.js für die programmatische Weiterleitung:
JavaScript

import { useRouter } from 'next/router';
//... innerhalb der Komponente:
const router = useRouter();
D. Logik (JavaScript/React)
Die Kernlogik befindet sich in der handleSubmit-Funktion:

JavaScript

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
// Annahme: login-Funktion ist aus einem Service-Modul importiert
import { login } from '../services/authService'; // Pfad anpassen

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault(); // Standard-Formularabsendung verhindern
    setError(null); // Vorherige Fehler zurücksetzen
    setIsLoading(true); // Ladezustand aktivieren

    try {
      // Aufruf der login-Funktion aus Ticket 0008
      const success = await login(username, password);

      if (success) {
        // Erfolgreiche Anmeldung -> Weiterleitung zur Spielseite
        // Pfad '/game' an die tatsächliche Route anpassen
        router.push('/game');
      } else {
         // Sollte nicht passieren, wenn login() bei Fehler einen Error wirft
         setError('Anmeldung fehlgeschlagen. Unbekannter Grund.');
      }
    } catch (err) {
      // Fehlerbehandlung
      console.error('Login-Fehler:', err);
      // Anzeige der Fehlermeldung aus dem Error-Objekt
      setError(err.message |
| 'Ein unbekannter Fehler ist aufgetreten.');
    } finally {
      // Ladezustand immer deaktivieren
      setIsLoading(false);
    }
  };

  // JSX Struktur wie in III.A beschrieben
  return (
    <form id="loginForm" onSubmit={handleSubmit}>
      {/*... Labels und Inputs für username, password... */}
       <label htmlFor="username">Benutzername:</label>
       <input type="text" id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={isLoading} />

       <label htmlFor="password">Passwort:</label>
       <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />

      {/* Fehleranzeige */}
      {error && (
        <div id="generalError" style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button type="submit" disabled={isLoading}>
        {isLoading? 'Anmelden...' : 'Anmelden'}
      </button>

      {/* Link zur Registrierung */}
      <p>
        Noch kein Konto? <Link href="/auth/register"><a>Registrieren</a></Link>
      </p>
    </form>
  );
}
Es ist entscheidend, dass die login-Funktion (aus Ticket 0008) bei API-Fehlern (z.B. 401 Unauthorized, 500 Internal Server Error) einen Error wirft, dessen message-Eigenschaft die vom Server gesendete Fehlermeldung enthält. Der catch-Block in der Komponente fängt diese Fehler sowie potenzielle Netzwerkfehler ab und zeigt die entsprechende Nachricht dem Benutzer an. Jegliche Logik bezüglich localStorage ist hier obsolet.

IV. Implementierungsplan: Erstellung der Registrierungs-Seite/Komponente
A. Komponentenstruktur (JSX/HTML)
Es wird empfohlen, eine neue React-Komponente unter pages/auth/register.js zu erstellen.

JSX-Struktur:

Ein <form>-Element: <form id="registerForm" onSubmit={handleSubmit}>.
Eingabefelder für username, email, password, confirmPassword, jeweils mit <label> und an React-State gebunden. type="email" und type="password" verwenden.
JavaScript

<label htmlFor="username">Benutzername:</label>
<input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
<div id="usernameError" style={{ color: 'red' }}>{errors.username}</div>

<label htmlFor="email">E-Mail (optional):</label>
<input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
<div id="emailError" style={{ color: 'red' }}>{errors.email}</div>

<label htmlFor="password">Passwort:</label>
<input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
<div id="passwordError" style={{ color: 'red' }}>{errors.password}</div>

<label htmlFor="confirmPassword">Passwort bestätigen:</label>
<input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
<div id="confirmPasswordError" style={{ color: 'red' }}>{errors.confirmPassword}</div>
Ein Container für allgemeine Fehler:
JavaScript

<div id="generalError" style={{ display: errors.general? 'block' : 'none', color: 'red' }}>
  {errors.general}
</div>
Ein Submit-Button: <button type="submit" disabled={isLoading}>Registrieren</button>.
Ein Navigationslink zur Login-Seite: <Link href="/auth/login"><a>Bereits ein Konto? Anmelden</a></Link>.
(Tabelle) Vorgeschlagene HTML/JSX-Element-IDs und Zweck (Registrierung):

ID	Elementtyp	Zweck
registerForm	form	Das Hauptformular für die Registrierung
username	input	Eingabefeld für den Benutzernamen
email	input	Eingabefeld für die E-Mail-Adresse
password	input	Eingabefeld für das Passwort
confirmPassword	input	Eingabefeld für die Passwortbestätigung
usernameError	div	Container für feldspezifische Fehler (Benutzername)
emailError	div	Container für feldspezifische Fehler (E-Mail)
passwordError	div	Container für feldspezifische Fehler (Passwort)
confirmPasswordError	div	Container für feldspezifische Fehler (Passwortbestätigung)
generalError	div	Container für allgemeine Fehler (API, Server, nicht feldbezogen)

In Google Sheets exportieren
*Begründung:* Die Registrierung hat mehr potenzielle Fehlerquellen (Validierung pro Feld, Passwort-Mismatch). Die explizite Zuordnung von IDs zu Fehlercontainern ist essentiell für die Implementierung einer differenzierten Fehleranzeige und verbessert die Übersichtlichkeit.
B. CSS-Styling
Die Styling-Konsistenz mit der Login-Komponente ist wichtig. Der gewählte Ansatz (Global, Modules, etc.) sollte beibehalten werden.
Es muss sichergestellt werden, dass auch mehrere gleichzeitig auftretende (feldbezogene) Fehlermeldungen klar und übersichtlich dargestellt werden können, ohne das Layout zu zerstören.
C. State Management (React Hooks)
useState für die Formularwerte, idealerweise in einem Objekt zusammengefasst:
JavaScript

const [formData, setFormData] = useState({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
});
useState für die Verwaltung eines strukturierten Fehlerobjekts, das sowohl feldbezogene als auch allgemeine Fehler aufnehmen kann:
JavaScript

const initialErrors = { username: null, email: null, password: null, confirmPassword: null, general: null };
const [errors, setErrors] = useState(initialErrors);
useState für den Ladezustand:
JavaScript

const [isLoading, setIsLoading] = useState(false);
useRouter für die Weiterleitung:
JavaScript

import { useRouter } from 'next/router';
const router = useRouter();
D. Logik (JavaScript/React)
Die handleSubmit-Funktion wird komplexer, insbesondere die Fehlerbehandlung:

JavaScript

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
// Annahme: register-Funktion ist aus einem Service-Modul importiert
import { register } from '../services/authService'; // Pfad anpassen

export default function RegisterPage() {
  const [formData, setFormData] = useState({ /*... initial state... */ });
  const initialErrors = { username: null, email: null, password: null, confirmPassword: null, general: null };
  const [errors, setErrors] = useState(initialErrors);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors(initialErrors); // Fehler zurücksetzen
    setIsLoading(true);

    const { username, email, password, confirmPassword } = formData;

    // 1. Client-seitige Validierung (UX-Verbesserung)
    if (password!== confirmPassword) {
      setErrors(prev => ({...prev, confirmPassword: 'Passwörter stimmen nicht überein.' }));
      setIsLoading(false);
      return; // Abbruch
    }

    try {
      // 2. Aufruf der register-Funktion (Ticket 0008)
      const success = await register(username, email, password, confirmPassword);

      if (success) {
        // Erfolgreiche Registrierung -> Weiterleitung
        router.push('/game'); // Pfad anpassen
      } else {
         // Sollte nicht passieren, wenn register() bei Fehler einen Error wirft
         setErrors(prev => ({...prev, general: 'Registrierung fehlgeschlagen. Unbekannter Grund.' }));
      }
    } catch (err) {
      // 3. Detaillierte Fehlerbehandlung (Server-Antwort)
      console.error('Registrierungs-Fehler:', err);
      let errorMessage = err.message |
| 'Ein unbekannter Fehler ist aufgetreten.';
      let parsedErrors = {...initialErrors }; // Temporäres Fehlerobjekt

      // Versuch, die Fehlermeldung als JSON-Array (von express-validator) zu parsen
      try {
        const errorData = JSON.parse(errorMessage);
        if (Array.isArray(errorData)) {
          // Es ist ein Array, vermutlich von express-validator
          errorData.forEach(validationError => {
            if (validationError.param && parsedErrors.hasOwnProperty(validationError.param)) {
              // Fehler einem spezifischen Feld zuordnen
              parsedErrors[validationError.param] = validationError.msg;
            } else {
              // Feld nicht bekannt oder kein 'param', als allgemeiner Fehler behandeln
              parsedErrors.general = (parsedErrors.general? parsedErrors.general + ' ' : '') + validationError.msg;
            }
          });
          if (!parsedErrors.general && Object.values(parsedErrors).every(v => v === null)) {
             // Fallback, falls Parsing erfolgreich war, aber keine Fehler zugeordnet wurden
             parsedErrors.general = "Validierungsfehler aufgetreten.";
          }
        } else {
          // JSON, aber kein Array - als allgemeiner Fehler
          parsedErrors.general = errorMessage;
        }
      } catch (parseError) {
        // Kein valides JSON - ursprüngliche Nachricht als allgemeiner Fehler
        parsedErrors.general = errorMessage;
      }
       // Fehler im State setzen, um die UI zu aktualisieren
      setErrors(parsedErrors);

    } finally {
      // 4. Ladezustand zurücksetzen
      setIsLoading(false);
    }
  };

  // JSX Struktur wie in IV.A beschrieben
  return (
    <form id="registerForm" onSubmit={handleSubmit}>
      {/*... Labels, Inputs und Fehler-Divs für username, email, password, confirmPassword... */}
      <label htmlFor="username">Benutzername:</label>
      <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required disabled={isLoading} />
      {errors.username && <div id="usernameError" style={{ color: 'red' }}>{errors.username}</div>}

      <label htmlFor="email">E-Mail (optional):</label>
      <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} disabled={isLoading}/>
      {errors.email && <div id="emailError" style={{ color: 'red' }}>{errors.email}</div>}

      <label htmlFor="password">Passwort:</label>
      <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required disabled={isLoading}/>
      {errors.password && <div id="passwordError" style={{ color: 'red' }}>{errors.password}</div>}

      <label htmlFor="confirmPassword">Passwort bestätigen:</label>
      <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading}/>
      {errors.confirmPassword && <div id="confirmPasswordError" style={{ color: 'red' }}>{errors.confirmPassword}</div>}


      {/* Allgemeine Fehleranzeige */}
      {errors.general && (
        <div id="generalError" style={{ color: 'red', marginTop: '10px' }}>
          {errors.general}
        </div>
      )}

      {/* Submit Button */}
      <button type="submit" disabled={isLoading}>
        {isLoading? 'Registrieren...' : 'Registrieren'}
      </button>

      {/* Link zum Login */}
      <p>
        Bereits ein Konto? <Link href="/auth/login"><a>Anmelden</a></Link>
      </p>
    </form>
  );
}
Die Fehlerbehandlung im catch-Block ist hier zentral. Sie antizipiert, dass die register-Funktion bei Validierungsfehlern (die serverseitig durch Ticket 0005 via express-validator entstehen) einen Fehler wirft, dessen message ein JSON-String eines Arrays ist. Dieses Array enthält Objekte mit param (dem Feldnamen) und msg (der Fehlermeldung). Die Logik versucht, dieses Format zu parsen und die Fehler den entsprechenden Feldern im errors-State zuzuordnen. Falls das Parsing fehlschlägt oder die Fehlermeldung ein anderes Format hat (z.B. einfacher Text bei "Benutzername bereits vergeben"), wird die Meldung dem general-Fehler zugewiesen. Diese differenzierte Behandlung ist entscheidend für eine gute User Experience, da sie dem Benutzer genau anzeigt, welche Eingaben korrigiert werden müssen.

V. Integration von Best Practices
A. User Experience (UX)
Ladeindikatoren: Die Verwendung des isLoading-States zum Deaktivieren des Submit-Buttons und potenziell zur Anzeige eines Spinners gibt dem Benutzer klares Feedback, dass eine Aktion im Gange ist. Dies verhindert doppelte Submits und reduziert Unsicherheit.
Klares Feedback: Eindeutige Erfolgs- (Weiterleitung) und Fehlermeldungen (spezifisch vs. allgemein) sind essentiell. Die Fehlermeldungen sollten benutzerfreundlich formuliert sein.
Eingabefeedback (Optional): Echtzeit-Validierung während der Eingabe (z.B. Passwortstärkeanzeige, E-Mail-Formatprüfung) kann die UX verbessern, sollte aber performant implementiert sein.
Wiederverwendbarkeit: Die Muster für Formularbehandlung (State-Management, Validierung, API-Aufruf, Fehleranzeige, Ladezustand) sind in Login und Registrierung sehr ähnlich. Es sollte erwogen werden, diese Logik in eine wiederverwendbare React Hook (z.B. useAuthForm) oder eine Basis-Komponente zu extrahieren. Dies fördert Konsistenz, reduziert Code-Duplizierung (DRY-Prinzip) und erleichtert die Wartung sowie die Implementierung zukünftiger Formulare in der Anwendung.
B. Barrierefreiheit (Accessibility, a11y)
Semantisches HTML/JSX: Korrekte Verwendung von <form>, <label>, <input>, <button>.
Label-Verknüpfung: Sicherstellen, dass jedes <label> mittels htmlFor korrekt mit der id des zugehörigen <input>-Elements verknüpft ist.
ARIA-Attribute: Bei Bedarf ARIA-Attribute verwenden, um die Zugänglichkeit für Screenreader zu verbessern. Insbesondere aria-invalid="true" für Felder mit Fehlern und aria-describedby können nützlich sein, um Eingabefelder programmatisch mit ihren Fehlermeldungs-Containern zu verknüpfen.
Tastaturbedienbarkeit: Sicherstellen, dass alle Formularelemente per Tastatur erreichbar und bedienbar sind (Tab-Reihenfolge, Enter zum Absenden).
C. Client-seitige Validierung
Zweck: Dient primär der Verbesserung der User Experience durch sofortiges Feedback (z.B. Passwort-Mismatch, leere Pflichtfelder) und der Reduzierung unnötiger Serverlast.
Einschränkung: Darf niemals die serverseitige Validierung (implementiert in Ticket 0005) ersetzen. Die serverseitige Validierung ist die einzige verlässliche Instanz zur Sicherstellung der Datenintegrität und Sicherheit.
D. Code-Wartbarkeit
Komponentenstruktur: Bei Verwendung von React sollten die Login- und Registrierungslogik in klar definierte, fokussierte Komponenten aufgeteilt werden (Single Responsibility Principle).
Service-Schicht: Die API-Aufruffunktionen (login, register aus Ticket 0008) sollten idealerweise in einem separaten Service-Modul gekapselt sein (z.B. client/src/services/authService.js), um die UI-Komponenten von der direkten API-Kommunikationslogik zu entkoppeln.
VI. Potenzielle Herausforderungen und Lösungsstrategien
A. Asynchrone Operationen
Herausforderung: Korrekte Handhabung von Zustandsänderungen und UI-Updates im Kontext asynchroner API-Aufrufe. Race Conditions oder inkonsistente Zustände können auftreten, wenn z.B. der Benutzer schnell hintereinander klickt oder die Netzwerkantwort verzögert ist.
Lösungsstrategie: Konsequente Nutzung von async/await mit try...catch...finally-Blöcken. Sorgfältige Verwaltung des isLoading-Zustands, um Mehrfachsendungen zu verhindern. Sicherstellen, dass State-Updates (Fehler, Formularwerte) korrekt innerhalb der asynchronen Logik und im finally-Block gehandhabt werden.
B. Handhabung von Server-Fehlerformaten
Herausforderung: Das Backend-API liefert möglicherweise Fehler in unterschiedlichen oder unerwarteten Formaten zurück, oder das Format ändert sich im Laufe der Entwicklung. Die im Registrierungs-Handler implementierte Parsing-Logik ist anfällig dafür.
Lösungsstrategie:
Klare API-Verträge: Eine eindeutige Definition der erwarteten Fehlerformate (Statuscodes und Response Bodies) zwischen Frontend und Backend ist essentiell.
Robuste Parsing-Logik: Die Fehlerbehandlung im catch-Block (siehe IV.D) muss robust implementiert sein und einen Fallback auf eine allgemeine Fehlermeldung vorsehen, falls das erwartete Format (z.B. JSON-Array von express-validator) nicht erkannt wird.
Logging: Ausführliches Logging der empfangenen Fehlerobjekte im Frontend (console.error) hilft bei der Fehlersuche.
(Tabelle) Vorgeschlagene Abbildung von Server-Fehlern auf Client-Aktionen:
HTTP Status	Erwartetes Body-Format (Beispiele)	Client-Aktion	Betroffener Error-State Key(s)
400	[{ param: 'field', msg: 'message' },...] (Validator)	Parse Array, zeige msg bei field an	errors[field]
400 / 409	{ message: 'Benutzer existiert bereits' } o.ä.	Zeige Nachricht im allgemeinen Fehlerbereich an	errors.general
401	{ message: 'Ungültige Anmeldedaten' }	Zeige Nachricht im allgemeinen Fehlerbereich an (Login)	errors.general
422	(Alternative für Validierungsfehler)	Ähnlich wie 400 Validator Array	errors[field]
500	{ message: 'Internal Server Error' } oder Text	Zeige generische Server-Fehlermeldung an	errors.general
Netzwerkerr.	(Fetch wirft Fehler)	Zeige generische Netzwerk-Fehlermeldung an	errors.general

In Google Sheets exportieren
    *Begründung:* Diese Tabelle dient als expliziter Leitfaden für Entwickler bei der Implementierung der `catch`-Logik. Sie reduziert Unklarheiten und stellt sicher, dass verschiedene Fehlerszenarien konsistent und benutzerfreundlich behandelt werden, was direkt die Robustheit der Fehlerbehandlung verbessert.
C. Weiterleitung und Zustand
Herausforderung: Sicherstellen, dass nach erfolgreicher Anmeldung/Registrierung und Weiterleitung zur Spielseite (/game) der notwendige Anwendungszustand korrekt initialisiert wird. Die Spielseite benötigt möglicherweise sofort Zugriff auf Benutzerdaten.
Lösungsstrategie: Die Authentifizierung basiert auf dem JWT-Cookie, das der Browser automatisch mitsendet. Die Zielseite (/game) sollte bei Bedarf (z.B. in einem useEffect-Hook) eine Anfrage an einen geschützten API-Endpunkt senden (z.B. /api/user/profile), um aktuelle Benutzerdaten abzurufen. Die Authentifizierung erfolgt über das Cookie. Sensible Daten sollten nicht über URL-Parameter übergeben werden.
D. Cross-Browser-Kompatibilität
Herausforderung: Geringfügige Unterschiede im Verhalten von Browsern bezüglich Formular-Handling, CSS-Rendering oder JavaScript-APIs.
Lösungsstrategie: Verwendung von Standard-Web-APIs wie fetch. Einsatz von CSS-Resets oder Frameworks (wie Tailwind CSS, falls verwendet), die Normalisierung bieten. Regelmäßige Tests in den Zielbrowsern. Bei Verwendung von Next.js ist die Notwendigkeit für Polyfills für moderne JavaScript-Features in der Regel geringer.
E. Adaption an Next.js/React
Herausforderung: Entwickler, die weniger vertraut mit React/Next.js sind, könnten Schwierigkeiten haben, die prozeduralen JavaScript-Beispiele aus dem Ticket in die Komponenten- und Hook-basierte Struktur zu übersetzen.
Lösungsstrategie: Bereitstellung klarer, auf React basierender konzeptioneller Code-Beispiele (siehe Abschnitt VII). Verweis auf die offizielle Dokumentation von React (Hooks: useState, useEffect) und Next.js (useRouter, <Link>, Seitenstruktur). Paarprogrammierung oder Code-Reviews können ebenfalls unterstützen.
VII. Konzeptionelle Code-Konstrukte (React/Next.js)
Die folgenden Snippets illustrieren die Kernkonzepte für die Implementierung in einer Next.js/React-Umgebung. Sie gehen davon aus, dass login und register Funktionen aus ../services/authService importiert werden und Promises zurückgeben/werfen, wie in Ticket 0008 vorgesehen.

A. Login-Komponente Snippet (pages/auth/login.js)
JavaScript

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { login } from '../services/authService'; // Pfad anpassen

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(username, password);
      router.push('/game'); // Zielroute anpassen
    } catch (err) {
      console.error('Login Error:', err);
      setError(err.message |
| 'Anmeldung fehlgeschlagen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Anmelden</h1>
      <form id="loginForm" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Benutzername:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password">Passwort:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        {error && (
          <div id="generalError" style={{ color: 'red', marginTop: '10px' }}>
            {error}
          </div>
        )}
        <button type="submit" disabled={isLoading}>
          {isLoading? 'Anmelden...' : 'Anmelden'}
        </button>
      </form>
      <p>
        Noch kein Konto? <Link href="/auth/register"><a>Registrieren</a></Link>
      </p>
    </div>
  );
}
B. Registrierungs-Komponente Snippet (pages/auth/register.js)
JavaScript

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { register } from '../services/authService'; // Pfad anpassen

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: ''
  });
  const initialErrors = { username: null, email: null, password: null, confirmPassword: null, general: null };
  const [errors, setErrors] = useState(initialErrors);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors(initialErrors);
    setIsLoading(true);

    const { username, email, password, confirmPassword } = formData;

    if (password!== confirmPassword) {
      setErrors(prev => ({...prev, confirmPassword: 'Passwörter stimmen nicht überein.' }));
      setIsLoading(false);
      return;
    }

    try {
      await register(username, email, password, confirmPassword);
      router.push('/game'); // Zielroute anpassen
    } catch (err) {
      console.error('Registration Error:', err);
      let errorMessage = err.message |
| 'Registrierung fehlgeschlagen.';
      let parsedErrors = {...initialErrors };

      try {
        const errorData = JSON.parse(errorMessage);
        if (Array.isArray(errorData)) {
          errorData.forEach(valErr => {
            if (valErr.param && parsedErrors.hasOwnProperty(valErr.param)) {
              parsedErrors[valErr.param] = valErr.msg;
            } else {
              parsedErrors.general = (parsedErrors.general? parsedErrors.general + ' ' : '') + valErr.msg;
            }
          });
           if (!parsedErrors.general && Object.values(parsedErrors).every(v => v === null)) {
             parsedErrors.general = "Validierungsfehler.";
           }
        } else {
          parsedErrors.general = errorMessage; // JSON, aber kein Array
        }
      } catch (parseError) {
         parsedErrors.general = errorMessage; // Kein JSON
      }
      setErrors(parsedErrors);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1>Registrieren</h1>
      <form id="registerForm" onSubmit={handleSubmit}>
        {/* Input für username mit Label und Fehleranzeige */}
        <div>
          <label htmlFor="username">Benutzername:</label>
          <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} required disabled={isLoading} />
          {errors.username && <div id="usernameError" style={{ color: 'red' }}>{errors.username}</div>}
        </div>
        {/* Input für email mit Label und Fehleranzeige */}
        <div>
          <label htmlFor="email">E-Mail (optional):</label>
          <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} disabled={isLoading}/>
          {errors.email && <div id="emailError" style={{ color: 'red' }}>{errors.email}</div>}
        </div>
        {/* Input für password mit Label und Fehleranzeige */}
         <div>
          <label htmlFor="password">Passwort:</label>
          <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required disabled={isLoading}/>
          {errors.password && <div id="passwordError" style={{ color: 'red' }}>{errors.password}</div>}
        </div>
        {/* Input für confirmPassword mit Label und Fehleranzeige */}
        <div>
          <label htmlFor="confirmPassword">Passwort bestätigen:</label>
          <input type="password" name="confirmPassword" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading}/>
          {errors.confirmPassword && <div id="confirmPasswordError" style={{ color: 'red' }}>{errors.confirmPassword}</div>}
        </div>

        {/* Allgemeine Fehleranzeige */}
        {errors.general && (
          <div id="generalError" style={{ color: 'red', marginTop: '10px' }}>
            {errors.general}
          </div>
        )}
        <button type="submit" disabled={isLoading}>
          {isLoading? 'Registrieren...' : 'Registrieren'}
        </button>
      </form>
      <p>
        Bereits ein Konto? <Link href="/auth/login"><a>Anmelden</a></Link>
      </p>
    </div>
  );
}
C. CSS/Styling Snippets (Konzeptionell)
Beispielhafte CSS-Regeln (z.B. in einer globalen CSS-Datei oder als CSS Module):

CSS

/* Basis-Styling für Formulare */
form {
  display: flex;
  flex-direction: column;
  gap: 15px; /* Abstand zwischen Formularelementen */
  max-width: 400px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

form div { /* Container für Label + Input + Fehler */
  display: flex;
  flex-direction: column;
  gap: 5px;
}

label {
  font-weight: bold;
}

input[type="text"],
input[type="email"],
input[type="password"] {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* Styling für Fehlertexte */
div[id$="Error"] { /* Wählt alle divs, deren ID auf "Error" endet */
  color: #D8000C; /* Rote Farbe für Fehler */
  font-size: 0.9em;
  /* Standardmäßig nicht angezeigt, wenn kein Fehlertext vorhanden ist (wird durch JS gesteuert) */
}

/* Styling für den Submit-Button */
button[type="submit"] {
  padding: 12px 20px;
  background-color: #4CAF50; /* Grüne Farbe */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s ease;
}

button[type="submit"]:hover {
  background-color: #45a049;
}

/* Styling für den deaktivierten Zustand des Buttons */
button[type="submit"]:disabled {
  background-color: #cccccc; /* Graue Farbe */
  cursor: not-allowed;
}

/* Styling für Links */
p a {
  color: #007bff;
  text-decoration: none;
}

p a:hover {
  text-decoration: underline;
}

Diese CSS-Regeln bieten eine grundlegende Struktur und visuelles Feedback. Sie sollten an das Gesamtdesign der PokeTogetherBrowser-Anwendung angepasst werden.

VIII. Abschluss und Verifizierung
A. Zusammenfassung der Implementierung
Die Umsetzung von Ticket 0010 erfordert die Anpassung der Login-Komponente und die Neuerstellung der Registrierungs-Komponente innerhalb der angenommenen Next.js/React-Architektur. Kernpunkte sind:

Komponentenerstellung/-anpassung: Aufbau der JSX-Struktur für beide Formulare.
State Management: Einsatz von React Hooks (useState, useRouter) zur Verwaltung von Eingaben, Fehlern und Ladezuständen.
Formularlogik: Implementierung von onSubmit-Handlern, die event.preventDefault() aufrufen, clientseitige Validierungen durchführen (Passwort-Mismatch) und die asynchronen Authentifizierungsfunktionen (login, register aus Ticket 0008) mittels async/await und try...catch...finally aufrufen.
Fehlerbehandlung: Implementierung einer robusten Logik zur Verarbeitung und Anzeige von Fehlern, insbesondere das Parsen potenzieller JSON-Fehlerarrays vom Server für die Registrierung, um feldbezogenes Feedback zu ermöglichen.
Erfolgsbehandlung: Weiterleitung zur Spielseite (/game) nach erfolgreicher Authentifizierung mittels Next.js Router.
Best Practices: Berücksichtigung von UX (Ladezustände, klares Feedback), Barrierefreiheit (semantisches HTML, Labels) und Code-Struktur (Komponenten, Service-Schicht).
B. Testen und Verifizierung
Eine gründliche Verifizierung ist entscheidend, um die korrekte Funktion sicherzustellen:

Funktionale Tests:
Testen des Login-Vorgangs mit korrekten und inkorrekten Anmeldedaten. Überprüfung der Fehleranzeige und der erfolgreichen Weiterleitung.
Testen des Registrierungs-Vorgangs mit gültigen Daten, bereits vergebenen Benutzernamen/E-Mails und verschiedenen Validierungsfehlern (z.B. zu kurzes Passwort, ungültige E-Mail, nicht übereinstimmende Passwörter). Überprüfung der feldbezogenen und allgemeinen Fehleranzeige sowie der erfolgreichen Weiterleitung.
Testen der Navigation zwischen Login- und Registrierungsseite.
API-Integrationstests: Sicherstellen, dass die Komponenten korrekt mit den tatsächlichen (oder gemockten) Backend-API-Endpunkten für /api/auth/login und /api/auth/register interagieren und die Antworten wie erwartet verarbeiten.
Authentifizierungsstatus: Überprüfen, ob nach erfolgreichem Login/Registrierung das HTTP-only Cookie korrekt gesetzt wird und bei nachfolgenden Anfragen (z.B. beim Laden der Spielseite oder bei der Socket.io-Verbindung) vom Browser gesendet wird.
UI-Tests: Überprüfung der visuellen Konsistenz, Responsivität auf verschiedenen Bildschirmgrößen und der Barrierefreiheit (Tastaturnavigation, Screenreader-Kompatibilität).
Fehlerszenarien: Explizites Testen von Netzwerkfehlern (z.B. durch Simulation einer unterbrochenen Verbindung) und Serverfehlern (Status 500), um sicherzustellen, dass die Anwendung darauf angemessen reagiert (Anzeige einer generischen Fehlermeldung).
C. Nächste Schritte
Die erfolgreiche Implementierung von Ticket 0010 schafft die notwendigen Benutzeroberflächen für das neue JWT/Cookie-basierte Authentifizierungssystem. Dies ist eine grundlegende Voraussetzung für die nächsten Schritte im Projekt, insbesondere:

Sicherung weiterer API-Endpunkte mittels der in Ticket 0006 definierten Authentifizierungs-Middleware.
Implementierung der Socket.io-Authentifizierung (Ticket 0007), die das vom Login/Registrierungsprozess erhaltene JWT verwendet.
Entwicklung von Features, die einen authentifizierten Benutzerstatus erfordern (z.B. Speichern/Laden des Spielstands, Inventarverwaltung).