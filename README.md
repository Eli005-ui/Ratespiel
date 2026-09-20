# Herbst-Schätzspiel

Eine kleine statische Web-App für ein Schätzspiel mit:

- Schätzformular mit Name und Slider
- automatischem Rücksprung zur Schätzseite nach dem Absenden
- Adminbereich mit Passwort
- Anzeige des richtigen Werts und Vergleich aller Einträge
- Gewinner und Rangliste nach geringster Abweichung
- Herbstliches Design

## Lokale Vorschau

1. Im Projektordner ausführen:
   ```bash
   python -m http.server 8000
   ```
2. Browser öffnen:
   ```text
   http://localhost:8000
   ```

## GitHub Pages

1. Repository auf GitHub pushen
2. In GitHub auf Settings → Pages gehen
3. Als Source den Branch `main` und den Ordner `/root` wählen
4. Die Seite wird veröffentlicht

## Admin-Passwort

Das Standard-Passwort ist in [script.js](script.js):

```js
adminPassword: "herbst2026"
```

## Hinweis

Da die App statisch ist, werden Schätzungen und der richtige Wert lokal im Browser gespeichert (`localStorage`). Das ist für GitHub Pages perfekt, aber die Daten sind pro Browser/Endgerät getrennt.
