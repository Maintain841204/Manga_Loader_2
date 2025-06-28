class ImageScanner {
    constructor() {
        this.foundImages = new Set();
        this.isScanning = false;
        this.siteHandlers = {
            'bato.to': this.handleBatoTo.bind(this),
            'mangadex.org': this.handleMangaDex.bind(this),
            'mangakakalot.com': this.handleMangakakalot.bind(this),
            'manganelo.com': this.handleManganelo.bind(this)
        };
    }

    async scanForImages() {
        if (this.isScanning) return Array.from(this.foundImages);
        
        this.isScanning = true;
        this.foundImages.clear();
        
        try {
            // Run multiple scanning strategies in parallel
            const strategies = [
                this.scanVisibleImages(),
                this.scanLazyLoadAttributes(),
                this.scanBackgroundImages(),
                this.scanSiteSpecific()
            ];
            
            const results = await Promise.allSettled(strategies);
            
            // Merge results from all strategies
            results.forEach(result => {
                if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                    result.value.forEach(img => this.foundImages.add(JSON.stringify(img)));
                }
            });
            
            // Force load lazy images
            await this.forceLazyLoad();
            
            // Convert back to objects and filter duplicates
            const uniqueImages = Array.from(this.foundImages)
                .map(imgStr => JSON.parse(imgStr))
                .filter(img => this.isValidMangaImage(img));
            
            return uniqueImages;
        } finally {
            this.isScanning = false;
        }
    }

    scanVisibleImages() {
        const images = [];
        const imgElements = document.querySelectorAll('img');
        
        imgElements.forEach(img => {
            if (img.src && !this.isPlaceholder(img.src)) {
                images.push({
                    url: img.src,
                    width: img.naturalWidth || img.width,
                    height: img.naturalHeight || img.height,
                    format: this.detectFormat(img.src)
                });
            }
        });
        
        return images;
    }

    scanLazyLoadAttributes() {
        const images = [];
        const lazyAttrs = [
            'data-src', 'data-lazy', 'data-original', 'data-srcset',
            'data-url', 'data-image', 'data-bg', 'data-full'
        ];
        
        lazyAttrs.forEach(attr => {
            document.querySelectorAll(`[${attr}]`).forEach(el => {
                const url = el.getAttribute(attr);
                if (url && !this.isPlaceholder(url)) {
                    images.push({
                        url: url,
                        width: el.getAttribute('width') || 0,
                        height: el.getAttribute('height') || 0,
                        format: this.detectFormat(url)
                    });
                }
            });
        });
        
        return images;
    }

    scanBackgroundImages() {
        const images = [];
        const elements = document.querySelectorAll('*');
        
        elements.forEach(el => {
            const style = window.getComputedStyle(el);
            const bgImage = style.backgroundImage;
            
            if (bgImage && bgImage !== 'none') {
                const urlMatch = bgImage.match(/url\(["']?(.*?)["']?\)/);
                if (urlMatch && urlMatch[1] && !this.isPlaceholder(urlMatch[1])) {
                    images.push({
                        url: urlMatch[1],
                        width: el.offsetWidth,
                        height: el.offsetHeight,
                        format: this.detectFormat(urlMatch[1])
                    });
                }
            }
        });
        
        return images;
    }

    async scanSiteSpecific() {
        const hostname = window.location.hostname;
        const handler = this.siteHandlers[hostname];
        
        if (handler) {
            return await handler();
        }
        
        return [];
    }

    async handleBatoTo() {
        const images = [];
        const imageContainers = document.querySelectorAll('.page-img, .chapter-image');
        
        for (const container of imageContainers) {
            container.scrollIntoView({ behavior: 'smooth' });
            await this.wait(500);
            
            const img = container.querySelector('img');
            if (img && img.src && !this.isPlaceholder(img.src)) {
                images.push({
                    url: img.src,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    format: this.detectFormat(img.src)
                });
            }
        }
        
        return images;
    }

    async handleMangaDex() {
        const images = [];
        const imageElements = document.querySelectorAll('.page-image img, .manga-page img');
        
        for (const img of imageElements) {
            if (img.src && !this.isPlaceholder(img.src)) {
                images.push({
                    url: img.src,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    format: this.detectFormat(img.src)
                });
            }
        }
        
        return images;
    }

    async handleMangakakalot() {
        const images = [];
        const imageElements = document.querySelectorAll('.container-chapter-reader img');
        
        for (const img of imageElements) {
            if (img.src && !this.isPlaceholder(img.src)) {
                images.push({
                    url: img.src,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    format: this.detectFormat(img.src)
                });
            }
        }
        
        return images;
    }

    async handleManganelo() {
        return this.handleMangakakalot(); // Similar structure
    }

    async forceLazyLoad() {
        const scrollStep = window.innerHeight;
        const maxScroll = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        const currentScroll = window.pageYOffset;
        
        // Scroll to trigger lazy loading
        for (let i = 0; i < maxScroll; i += scrollStep) {
            window.scrollTo(0, i);
            await this.wait(300);
            
            // Trigger intersection observer events
            document.querySelectorAll('img[data-src], img[data-lazy]').forEach(img => {
                if (this.isInViewport(img)) {
                    img.dispatchEvent(new Event('scroll'));
                    img.dispatchEvent(new Event('load'));
                }
            });
        }
        
        // Restore original scroll position
        window.scrollTo(0, currentScroll);
        await this.wait(500);
    }

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    isPlaceholder(url) {
        const placeholderPatterns = [
            'placeholder', 'loading', 'spinner', 'blank', 'empty',
            'data:image', '1x1', 'transparent', 'pixel'
        ];
        
        return placeholderPatterns.some(pattern => 
            url.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    isValidMangaImage(img) {
        // Filter out very small images (likely icons/buttons)
        if (img.width < 100 || img.height < 100) return false;
        
        // Filter out non-image formats
        if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(img.format)) return false;
        
        // Filter out known ad/banner patterns
        const adPatterns = ['banner', 'ad', 'advertisement', 'promo'];
        if (adPatterns.some(pattern => img.url.toLowerCase().includes(pattern))) return false;
        
        return true;
    }

    detectFormat(url) {
        const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
        return match ? match[1].toLowerCase() : 'unknown';
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}