# 🚀 Deployment Guide

## 1. Vorbereitung

```bash
# Repository klonen
git clone <your-repo>
cd manga-downloader

# Abhängigkeiten installieren
npm install

# Bookmarklet bauen
npm run build
```

## 2. Vercel Deployment

### Option A: Vercel CLI (Empfohlen)

```bash
# Vercel CLI installieren
npm i -g vercel

# Deployment starten
vercel

# Bei der ersten Ausführung:
# ? Set up and deploy "~/manga-downloader"? Y
# ? Which scope do you want to deploy to? (Wähle deinen Account)
# ? Link to existing project? N
# ? What's your project's name? manga-downloader
# ? In which directory is your code located? ./

# Production deployment
vercel --prod
```

### Option B: GitHub Integration

1. Repository zu GitHub pushen
2. Vercel Dashboard öffnen: https://vercel.com/dashboard
3. "New Project" → GitHub Repository auswählen
4. Auto-Deploy ist aktiviert

## 3. Post-Deployment Setup

### API URLs aktualisieren

Nach dem Deployment erhältst du eine URL wie `https://manga-downloader-abc123.vercel.app`.

**Wichtig**: Diese URL in folgenden Dateien ersetzen:

1. **src/MangaDownloader.js** (Zeile 2):
```javascript
constructor(apiBaseUrl = 'https://manga-downloader-abc123.vercel.app') {
```

2. **build.js** (Zeile 58):
```javascript
s.src='https://manga-downloader-abc123.vercel.app/bookmarklet.js';
```

3. Neu bauen und deployen:
```bash
npm run build
vercel --prod
```

## 4. Verifikation

### Endpoints testen

```bash
# Proxy endpoint
curl "https://your-app.vercel.app/api/proxy?url=https://bato.to/test.jpg"

# Download endpoint
curl -X POST "https://your-app.vercel.app/api/download" \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://bato.to/test.jpg"],"format":"zip"}'
```

### Bookmarklet testen

1. Öffne `https://your-app.vercel.app`
2. Ziehe den Bookmarklet-Link in die Lesezeichenleiste
3. Gehe zu einer Manga-Seite (z.B. bato.to)
4. Klicke auf das Bookmarklet
5. Teste Bilderkennung und Download

## 5. Monitoring & Logs

### Vercel Dashboard
- Deployments: https://vercel.com/dashboard
- Funktions-Logs: Functions → View Function Logs
- Analytics: Analytics Tab

### Lokale Logs
```bash
# Vercel Logs anzeigen
vercel logs

# Spezifische Function
vercel logs --function=api/download
```

## 6. Troubleshooting

### Häufige Probleme

**1. "Domain not allowed" Fehler**
```javascript
// In api/proxy.js und api/download.js
const allowedDomains = [
    'bato.to',
    'neue-domain.com'  // Hinzufügen
];
```

**2. CORS Probleme**
```json
// vercel.json prüfen
{
  "headers": [{
    "source": "/api/**",
    "headers": [
      {"key": "Access-Control-Allow-Origin", "value": "*"}
    ]
  }]
}
```

**3. Function Timeout**
```json
// vercel.json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### Debug-Modus

Entwicklertools öffnen und Console-Logs prüfen:
```javascript
// Im Bookmarklet für mehr Logs
localStorage.setItem('manga-downloader-debug', 'true');
```

## 7. Updates

### Code-Updates
```bash
git add .
git commit -m "Update features"
git push origin main
# Auto-deployment durch Vercel GitHub Integration
```

### Manueller Deployment
```bash
npm run build
vercel --prod
```

## 8. Environment Variables (Optional)

Für erweiterte Konfiguration:

```bash
# Vercel Environment Variables setzen
vercel env add MAX_IMAGES_PER_REQUEST
# Wert: 100

vercel env add ALLOWED_DOMAINS
# Wert: bato.to,mangadex.org,mangakakalot.com
```

Dann in den API-Files verwenden:
```javascript
const maxImages = process.env.MAX_IMAGES_PER_REQUEST || 100;
const allowedDomains = (process.env.ALLOWED_DOMAINS || '').split(',');
```

## 9. Custom Domain (Optional)

```bash
# Custom Domain hinzufügen
vercel domains add manga-downloader.deine-domain.com
vercel alias manga-downloader-abc123.vercel.app manga-downloader.deine-domain.com
```

## 10. Finale Checkliste

- [ ] Vercel Deployment erfolgreich
- [ ] API URLs in Code aktualisiert
- [ ] Bookmarklet neu gebaut und deployed
- [ ] Proxy-Endpoint funktioniert
- [ ] Download-Endpoint funktioniert
- [ ] Bookmarklet auf Test-Sites getestet
- [ ] ZIP-Download funktioniert
- [ ] PDF-Download funktioniert
- [ ] Mobile Interface getestet
- [ ] Error-Handling getestet

---

🎉 **Deployment erfolgreich!** Du kannst jetzt dein Manga-Downloader Bookmarklet verwenden.