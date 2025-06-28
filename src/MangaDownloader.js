class MangaDownloader {
    constructor(apiBaseUrl = 'https://manga-loader-2-ywpa.vercel.app') {
        this.apiBaseUrl = apiBaseUrl;
        this.scanner = new ImageScanner();
        this.ui = new OverlayUI(this.handleDownload.bind(this));
        this.isActive = false;
    }

    async init() {
        if (this.isActive) {
            console.log('Manga Downloader is already active');
            return;
        }

        this.isActive = true;
        console.log('Initializing Manga Downloader...');
        
        try {
            // Show loading indicator
            this.showNotification('Suche nach Manga-Bildern...', 'info');
            
            // Scan for images
            const images = await this.scanner.scanForImages();
            
            if (images.length === 0) {
                this.showNotification('Keine Manga-Bilder gefunden', 'warning');
                return;
            }

            console.log(`Found ${images.length} images`);
            
            // Show UI with found images
            this.ui.show(images);
            
            this.showNotification(`${images.length} Bilder gefunden!`, 'success');
            
        } catch (error) {
            console.error('Failed to scan for images:', error);
            this.showNotification('Fehler beim Suchen nach Bildern: ' + error.message, 'error');
        }
    }

    async handleDownload({ urls, images, format, onProgress }) {
        console.log(`Downloading ${urls.length} images as ${format}`);
        
        try {
            // Use proxy for cross-origin images if needed
            const processedUrls = await this.processUrls(urls);
            
            const response = await fetch(`${this.apiBaseUrl}/api/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    urls: processedUrls,
                    format: format,
                    options: {
                        prefix: this.generateFilePrefix(),
                        convertToJpeg: format === 'zip' && this.shouldConvertToJpeg(images),
                        title: this.generateTitle()
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            // Update progress
            onProgress && onProgress(100);

            // Download the file
            const blob = await response.blob();
            const filename = format === 'zip' ? 'manga-pages.zip' : 'manga-pages.pdf';
            
            await this.downloadBlob(blob, filename);
            
            this.showNotification(`${format.toUpperCase()} erfolgreich heruntergeladen!`, 'success');
            
        } catch (error) {
            console.error('Download failed:', error);
            throw error;
        }
    }

    async processUrls(urls) {
        // Check if URLs need to be proxied (cross-origin)
        const processedUrls = [];
        
        for (const url of urls) {
            try {
                const urlObj = new URL(url);
                
                // If URL is from a different origin, use proxy
                if (urlObj.origin !== window.location.origin) {
                    const proxyUrl = `${this.apiBaseUrl}/api/proxy?url=${encodeURIComponent(url)}`;
                    processedUrls.push(proxyUrl);
                } else {
                    processedUrls.push(url);
                }
            } catch (error) {
                console.warn('Invalid URL, skipping:', url);
            }
        }
        
        return processedUrls;
    }

    shouldConvertToJpeg(images) {
        // Convert to JPEG if more than 50% are WebP
        const webpCount = images.filter(img => 
            img.format.toLowerCase() === 'webp'
        ).length;
        
        return webpCount / images.length > 0.5;
    }

    generateFilePrefix() {
        const siteName = window.location.hostname
            .replace(/^www\./, '')
            .replace(/\./g, '-');
        
        const timestamp = new Date().toISOString().slice(0, 10);
        
        return `${siteName}-${timestamp}-page-`;
    }

    generateTitle() {
        // Try to extract title from page
        const title = document.title || 
                     document.querySelector('h1')?.textContent ||
                     window.location.hostname;
        
        return title.slice(0, 100); // Limit length
    }

    async downloadBlob(blob, filename) {
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000000;
            padding: 15px 20px;
            border-radius: 6px;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 300px;
            word-wrap: break-word;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Set color based on type
        const colors = {
            info: '#2196F3',
            success: '#4CAF50',
            warning: '#FF9800',
            error: '#F44336'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    destroy() {
        this.ui.destroy();
        this.isActive = false;
    }
}

// Global instance management
if (typeof window.mangaDownloaderInstance !== 'undefined') {
    window.mangaDownloaderInstance.destroy();
}

// Initialize
window.mangaDownloaderInstance = new MangaDownloader();
window.mangaDownloaderInstance.init();
