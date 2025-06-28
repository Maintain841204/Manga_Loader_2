const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

async function buildBookmarklet() {
    console.log('Building bookmarklet...');
    
    // Read source files
    const imageScannerCode = fs.readFileSync(path.join(__dirname, 'src/components/ImageScanner.js'), 'utf8');
    const overlayUICode = fs.readFileSync(path.join(__dirname, 'src/components/OverlayUI.js'), 'utf8');
    const mainCode = fs.readFileSync(path.join(__dirname, 'src/MangaDownloader.js'), 'utf8');
    
    // Combine all code
    const combinedCode = `
        (function() {
            'use strict';
            
            // Prevent multiple instances
            if (window.mangaDownloaderActive) {
                console.log('Manga Downloader already active');
                return;
            }
            window.mangaDownloaderActive = true;
            
            ${imageScannerCode}
            
            ${overlayUICode}
            
            ${mainCode}
        })();
    `;
    
    // Minify the code
    const minified = await minify(combinedCode, {
        compress: {
            drop_console: false, // Keep console logs for debugging
            drop_debugger: true,
            pure_funcs: ['console.debug']
        },
        mangle: {
            reserved: ['ImageScanner', 'OverlayUI', 'MangaDownloader']
        },
        format: {
            comments: false
        }
    });
    
    if (minified.error) {
        throw minified.error;
    }
    
    // Write the bookmarklet file
    fs.writeFileSync(path.join(__dirname, 'public/bookmarklet.js'), minified.code);
    
    // Create the bookmarklet URL
    const bookmarkletURL = `javascript:(function(){
        if(window.mangaDownloaderActive) return;
        const s=document.createElement('script');
        s.src='https://your-app.vercel.app/bookmarklet.js';
        s.onload=()=>console.log('Manga Downloader loaded');
        s.onerror=()=>console.error('Failed to load Manga Downloader');
        document.head.appendChild(s);
    })();`;
    
    // Write bookmarklet HTML page
    const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manga Downloader Bookmarklet</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .bookmarklet {
            display: inline-block;
            background: #4CAF50;
            color: white;
            padding: 15px 25px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
            border: 2px dashed #2E7D32;
        }
        .bookmarklet:hover {
            background: #45a049;
        }
        .instructions {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .supported-sites {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #2196F3;
        }
        code {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <h1>📚 Manga Downloader Bookmarklet</h1>
    
    <p>Dieses Bookmarklet ermöglicht es, Manga-Bilder von verschiedenen Websites batch-weise herunterzuladen.</p>
    
    <div class="instructions">
        <h3>🔧 Installation</h3>
        <ol>
            <li>Ziehe den unten stehenden Link in deine Lesezeichenleiste</li>
            <li>Oder klicke mit der rechten Maustaste und wähle "Link zu Lesezeichen hinzufügen"</li>
            <li>Gehe zu einer Manga-Seite und klicke auf das Lesezeichen</li>
        </ol>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
        <a href="${bookmarkletURL}" class="bookmarklet">
            📥 Manga Downloader
        </a>
        <p><small>⬆️ Ziehe diesen Link in deine Lesezeichenleiste</small></p>
    </div>
    
    <div class="supported-sites">
        <h3>🌐 Unterstützte Websites</h3>
        <ul>
            <li>bato.to</li>
            <li>mangadex.org</li>
            <li>mangakakalot.com</li>
            <li>manganelo.com</li>
            <li>Und viele weitere...</li>
        </ul>
    </div>
    
    <div class="instructions">
        <h3>📖 Verwendung</h3>
        <ol>
            <li>Öffne eine Manga-Kapitel-Seite</li>
            <li>Klicke auf das Bookmarklet in deiner Lesezeichenleiste</li>
            <li>Warte, bis alle Bilder gefunden wurden</li>
            <li>Wähle die gewünschten Bilder aus</li>
            <li>Klicke auf "Als ZIP herunterladen" oder "Als PDF herunterladen"</li>
        </ol>
    </div>
    
    <div class="instructions">
        <h3>⚡ Features</h3>
        <ul>
            <li><strong>Automatische Bilderkennung:</strong> Findet auch lazy-loaded Bilder</li>
            <li><strong>Format-Filter:</strong> Filtere nach JPG, PNG, WebP, etc.</li>
            <li><strong>Batch-Download:</strong> Alle Bilder auf einmal als ZIP oder PDF</li>
            <li><strong>Format-Konvertierung:</strong> Automatische WebP → JPEG Konvertierung</li>
            <li><strong>Mobile-freundlich:</strong> Funktioniert auch auf Smartphones</li>
        </ul>
    </div>
    
    <footer style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
        <p>Manga Downloader Bookmarklet v1.0</p>
        <p><small>Für den persönlichen Gebrauch. Respektiere die Urheberrechte der Manga-Autoren.</small></p>
    </footer>
</body>
</html>`;
    
    fs.writeFileSync(path.join(__dirname, 'public/index.html'), htmlContent);
    
    console.log('✅ Bookmarklet built successfully!');
    console.log('📄 Files created:');
    console.log('  - public/bookmarklet.js');
    console.log('  - public/index.html');
    console.log(`📊 Minified size: ${minified.code.length} bytes`);
}

buildBookmarklet().catch(console.error);