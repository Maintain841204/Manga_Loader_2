# 📚 Manga Downloader Bookmarklet

Ein JavaScript-Bookmarklet zum Batch-Download von Manga-Bildern von verschiedenen Websites.

## 🚀 Features

- **Automatische Bilderkennung**: Findet auch lazy-loaded und dynamisch geladene Bilder
- **Multi-Site Support**: Funktioniert mit bato.to, MangaDex, Mangakakalot und vielen anderen
- **Format-Filter**: Filtere Bilder nach JPG, PNG, WebP, GIF
- **Batch-Download**: Alle ausgewählten Bilder als ZIP oder PDF herunterladen
- **Format-Konvertierung**: Automatische WebP → JPEG Konvertierung für bessere Kompatibilität
- **CORS-Proxy**: Umgeht Cross-Origin-Beschränkungen über Vercel-Server
- **Mobile-Support**: Responsive UI für Smartphone-Nutzung

## 🔧 Setup & Deployment

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Bookmarklet bauen

```bash
npm run build
```

### 3. Auf Vercel deployen

```bash
# Vercel CLI installieren (falls nicht vorhanden)
npm i -g vercel

# Projekt deployen
vercel --prod
```

### 4. API-URL aktualisieren

Nach dem Deployment die URL in folgenden Dateien anpassen:
- `src/MangaDownloader.js` (apiBaseUrl)
- `build.js` (Bookmarklet-URL)

## 📖 Verwendung

### Installation des Bookmarklets

1. Öffne `https://your-app.vercel.app` nach dem Deployment
2. Ziehe den "Manga Downloader" Link in deine Lesezeichenleiste
3. Oder klicke rechts auf den Link → "Zu Lesezeichen hinzufügen"

### Bilder herunterladen

1. Öffne eine Manga-Kapitel-Seite
2. Klicke auf das Bookmarklet in der Lesezeichenleiste
3. Warte auf die automatische Bilderkennung
4. Wähle gewünschte Bilder aus (oder "Alle auswählen")
5. Klicke "Als ZIP herunterladen" oder "Als PDF herunterladen"

## 🌐 Unterstützte Websites

- **bato.to** - Vollständige Unterstützung mit Lazy-Loading
- **mangadx.org** - API-Integration für hochauflösende Bilder  
- **mangakakalot.com** - Reader-Integration
- **manganelo.com** - Ähnlich zu Mangakakalot
- **Weitere Sites** - Generische Bilderkennung funktioniert meist

## 🏗️ Architektur

```
┌─────────────────┐     ┌──────────────────┐
│   Bookmarklet   │────▶│  Image Scanner   │
│   (Frontend)    │     │   + UI Overlay   │
└─────────────────┘     └──────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │  Vercel Backend  │
                        │ ┌──────────────┐ │
                        │ │ Image Proxy  │ │
                        │ │ ZIP/PDF Gen  │ │
                        │ │ Format Conv  │ │
                        │ └──────────────┘ │
                        └──────────────────┘
```

### Frontend (Bookmarklet)
- **ImageScanner**: Findet Bilder mit verschiedenen Strategien
- **OverlayUI**: Benutzeroberfläche mit Shadow DOM
- **MangaDownloader**: Hauptklasse mit API-Integration

### Backend (Vercel)
- **`/api/proxy`**: CORS-Proxy für Cross-Origin-Bilder
- **`/api/download`**: Batch-Download als ZIP/PDF
- **Sharp**: Bildkonvertierung (WebP → JPEG)
- **JSZip/PDFKit**: Archiv-/PDF-Generierung

## 🔧 Development

### Lokale Entwicklung

```bash
# Development server starten
npm run dev

# In anderem Terminal: Build watcher
npm run build -- --watch
```

### Testing

```bash
# Unit tests
npm test

# Manuell auf verschiedenen Manga-Sites testen
npm run test:sites
```

### Code-Struktur

```
src/
├── components/
│   ├── ImageScanner.js    # Bilderkennung-Logik
│   └── OverlayUI.js       # Benutzeroberfläche
├── utils/                 # Helper-Funktionen
└── MangaDownloader.js     # Hauptlogik

api/
├── proxy.js              # CORS-Proxy-Endpoint
└── download.js           # Download-Service

public/
├── bookmarklet.js        # Generierte Bookmarklet-Datei
└── index.html           # Installations-Seite
```

## ⚠️ Wichtige Hinweise

### Sicherheit
- Nur whitelisted Domains werden unterstützt
- Keine Speicherung von Bildern auf dem Server
- CORS-Header korrekt konfiguriert

### Performance
- Maximale Batch-Größe: 100 Bilder
- Timeout pro Bild: 20 Sekunden
- Retry-Mechanismus mit exponential backoff

### Rechtliches
- Nur für den persönlichen Gebrauch
- Respektiere Urheberrechte der Manga-Autoren
- Keine kommerzielle Nutzung

## 🐛 Troubleshooting

### "Keine Bilder gefunden"
- Seite vollständig laden lassen
- Nach unten scrollen um Lazy-Loading zu triggern
- Entwicklertools → Console für Fehlermeldungen

### "Download fehlgeschlagen"
- Netzwerkverbindung prüfen
- Vercel-Server-Status überprüfen
- In den Entwicklertools Network-Tab checken

### "Domain nicht erlaubt"
- Gewünschte Domain in `allowedDomains` hinzufügen
- Neu deployen

## 📝 TODO

- [ ] Mehr Site-spezifische Handler
- [ ] Verbessertes Error-Handling
- [ ] Progress-Anzeige für einzelne Downloads
- [ ] Lokale Speicher-Option (ohne Server)
- [ ] Chrome Extension als Alternative

## 🤝 Contributing

1. Fork das Repository
2. Feature-Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Änderungen committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request erstellen

## 📄 License

MIT License - siehe LICENSE Datei für Details.

---

**⚠️ Disclaimer**: Dieses Tool ist für den persönlichen Gebrauch bestimmt. Bitte respektiere die Urheberrechte und Nutzungsbedingungen der jeweiligen Manga-Websites.