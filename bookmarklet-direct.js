javascript:(function(){
    if(window.mangaDownloaderActive) {
        console.log('Manga Downloader already active');
        return;
    }
    
    console.log('Loading Manga Downloader...');
    window.mangaDownloaderActive = true;
    
    const script = document.createElement('script');
    script.src = 'https://manga-loader-2-ywpa.vercel.app/bookmarklet.js';
    script.onload = function() {
        console.log('✅ Manga Downloader loaded successfully');
    };
    script.onerror = function() {
        console.error('❌ Failed to load Manga Downloader');
        window.mangaDownloaderActive = false;
    };
    
    document.head.appendChild(script);
})();