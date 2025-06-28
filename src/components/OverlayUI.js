class OverlayUI {
    constructor(onDownload) {
        this.onDownload = onDownload;
        this.selectedImages = new Set();
        this.allImages = [];
        this.filters = {
            jpg: true,
            jpeg: true,
            png: true,
            webp: true,
            gif: false
        };
        this.shadowRoot = null;
        this.isVisible = false;
    }

    show(images) {
        this.allImages = images;
        this.selectedImages.clear();
        
        if (!this.shadowRoot) {
            this.createShadowDOM();
        }
        
        this.updateImageGrid();
        this.updateCounter();
        this.isVisible = true;
        
        // Animate in
        const overlay = this.shadowRoot.querySelector('.manga-downloader-overlay');
        overlay.style.display = 'flex';
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            overlay.style.transform = 'scale(1)';
        });
    }

    hide() {
        if (!this.shadowRoot) return;
        
        const overlay = this.shadowRoot.querySelector('.manga-downloader-overlay');
        overlay.style.opacity = '0';
        overlay.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            overlay.style.display = 'none';
            this.isVisible = false;
        }, 200);
    }

    createShadowDOM() {
        // Create shadow host
        const host = document.createElement('div');
        host.id = 'manga-downloader-host';
        document.body.appendChild(host);
        
        // Create shadow root for style isolation
        this.shadowRoot = host.attachShadow({ mode: 'open' });
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = this.getStyles();
        
        // Create main overlay
        const overlay = document.createElement('div');
        overlay.className = 'manga-downloader-overlay';
        overlay.innerHTML = this.getHTML();
        
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(overlay);
        
        this.attachEventListeners();
    }

    getStyles() {
        return `
            :host {
                all: initial;
            }
            
            .manga-downloader-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                display: none;
                flex-direction: column;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                color: white;
                opacity: 0;
                transform: scale(0.95);
                transition: all 0.2s ease;
            }
            
            .header {
                background: #1a1a1a;
                padding: 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid #333;
            }
            
            .header h3 {
                margin: 0;
                font-size: 18px;
            }
            
            .filters {
                display: flex;
                gap: 15px;
            }
            
            .filters label {
                display: flex;
                align-items: center;
                gap: 5px;
                cursor: pointer;
            }
            
            .filters input[type="checkbox"] {
                margin: 0;
            }
            
            .close-btn {
                background: #ff4444;
                border: none;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .close-btn:hover {
                background: #ff6666;
            }
            
            .image-grid-container {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }
            
            .image-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 15px;
                max-height: none;
            }
            
            .image-item {
                background: #2a2a2a;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                transition: all 0.2s ease;
                border: 2px solid transparent;
            }
            
            .image-item:hover {
                background: #333;
                transform: translateY(-2px);
            }
            
            .image-item.selected {
                border-color: #4CAF50;
                background: #1a4a1a;
            }
            
            .image-preview {
                width: 100%;
                height: 150px;
                object-fit: cover;
                display: block;
            }
            
            .image-info {
                padding: 10px;
            }
            
            .image-info .format {
                background: #666;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 11px;
                text-transform: uppercase;
            }
            
            .image-info .format.webp { background: #ff9800; }
            .image-info .format.jpg,
            .image-info .format.jpeg { background: #2196f3; }
            .image-info .format.png { background: #9c27b0; }
            .image-info .format.gif { background: #4caf50; }
            
            .image-info .dimensions {
                font-size: 12px;
                color: #ccc;
                margin-top: 4px;
            }
            
            .actions {
                background: #1a1a1a;
                padding: 20px;
                display: flex;
                gap: 15px;
                justify-content: center;
                border-top: 1px solid #333;
                flex-wrap: wrap;
            }
            
            .btn {
                background: #4CAF50;
                border: none;
                color: white;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
                min-width: 120px;
            }
            
            .btn:hover {
                background: #45a049;
            }
            
            .btn:disabled {
                background: #666;
                cursor: not-allowed;
            }
            
            .btn.secondary {
                background: #666;
            }
            
            .btn.secondary:hover {
                background: #777;
            }
            
            .btn.danger {
                background: #f44336;
            }
            
            .btn.danger:hover {
                background: #da190b;
            }
            
            .progress {
                display: none;
                background: #333;
                height: 4px;
                margin: 10px 0;
                border-radius: 2px;
                overflow: hidden;
            }
            
            .progress-bar {
                background: #4CAF50;
                height: 100%;
                width: 0%;
                transition: width 0.3s ease;
            }
            
            @media (max-width: 768px) {
                .header {
                    flex-direction: column;
                    gap: 15px;
                    align-items: stretch;
                }
                
                .filters {
                    justify-content: center;
                }
                
                .image-grid {
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 10px;
                }
                
                .actions {
                    flex-direction: column;
                }
            }
        `;
    }

    getHTML() {
        return `
            <div class="header">
                <div>
                    <h3>Gefundene Manga-Bilder: <span id="image-count">0</span></h3>
                    <div class="progress" id="progress">
                        <div class="progress-bar" id="progress-bar"></div>
                    </div>
                </div>
                <div class="filters">
                    <label><input type="checkbox" data-format="jpg" checked> JPG</label>
                    <label><input type="checkbox" data-format="png" checked> PNG</label>
                    <label><input type="checkbox" data-format="webp" checked> WebP</label>
                    <label><input type="checkbox" data-format="gif"> GIF</label>
                </div>
                <button class="close-btn" id="close-overlay">✕</button>
            </div>
            <div class="image-grid-container">
                <div class="image-grid" id="image-grid">
                </div>
            </div>
            <div class="actions">
                <button class="btn secondary" id="select-all">Alle auswählen</button>
                <button class="btn secondary" id="select-none">Auswahl aufheben</button>
                <button class="btn" id="download-zip" disabled>Als ZIP herunterladen</button>
                <button class="btn" id="download-pdf" disabled>Als PDF herunterladen</button>
            </div>
        `;
    }

    attachEventListeners() {
        const shadowRoot = this.shadowRoot;
        
        // Close button
        shadowRoot.getElementById('close-overlay').addEventListener('click', () => {
            this.hide();
        });
        
        // Filter checkboxes
        shadowRoot.querySelectorAll('.filters input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', (e) => {
                this.filters[e.target.dataset.format] = e.target.checked;
                this.updateImageGrid();
            });
        });
        
        // Action buttons
        shadowRoot.getElementById('select-all').addEventListener('click', () => {
            this.selectAll();
        });
        
        shadowRoot.getElementById('select-none').addEventListener('click', () => {
            this.selectNone();
        });
        
        shadowRoot.getElementById('download-zip').addEventListener('click', () => {
            this.downloadSelected('zip');
        });
        
        shadowRoot.getElementById('download-pdf').addEventListener('click', () => {
            this.downloadSelected('pdf');
        });
        
        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    updateImageGrid() {
        const grid = this.shadowRoot.getElementById('image-grid');
        const filteredImages = this.allImages.filter(img => 
            this.filters[img.format] || this.filters[img.format.toLowerCase()]
        );
        
        grid.innerHTML = '';
        
        filteredImages.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'image-item';
            item.dataset.index = index;
            
            const isSelected = this.selectedImages.has(image.url);
            if (isSelected) item.classList.add('selected');
            
            item.innerHTML = `
                <img class="image-preview" src="${image.url}" alt="Manga page" loading="lazy">
                <div class="image-info">
                    <span class="format ${image.format}">${image.format.toUpperCase()}</span>
                    <div class="dimensions">${image.width} × ${image.height}</div>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.toggleImageSelection(image, item);
            });
            
            grid.appendChild(item);
        });
        
        this.updateCounter();
    }

    toggleImageSelection(image, element) {
        if (this.selectedImages.has(image.url)) {
            this.selectedImages.delete(image.url);
            element.classList.remove('selected');
        } else {
            this.selectedImages.add(image.url);
            element.classList.add('selected');
        }
        
        this.updateActionButtons();
    }

    selectAll() {
        const filteredImages = this.allImages.filter(img => 
            this.filters[img.format] || this.filters[img.format.toLowerCase()]
        );
        
        filteredImages.forEach(image => {
            this.selectedImages.add(image.url);
        });
        
        this.shadowRoot.querySelectorAll('.image-item').forEach(item => {
            item.classList.add('selected');
        });
        
        this.updateActionButtons();
    }

    selectNone() {
        this.selectedImages.clear();
        
        this.shadowRoot.querySelectorAll('.image-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        this.updateActionButtons();
    }

    updateCounter() {
        const counter = this.shadowRoot.getElementById('image-count');
        const filteredCount = this.allImages.filter(img => 
            this.filters[img.format] || this.filters[img.format.toLowerCase()]
        ).length;
        
        counter.textContent = `${filteredCount} (${this.selectedImages.size} ausgewählt)`;
    }

    updateActionButtons() {
        const hasSelection = this.selectedImages.size > 0;
        this.shadowRoot.getElementById('download-zip').disabled = !hasSelection;
        this.shadowRoot.getElementById('download-pdf').disabled = !hasSelection;
        this.updateCounter();
    }

    showProgress(show = true) {
        const progress = this.shadowRoot.getElementById('progress');
        progress.style.display = show ? 'block' : 'none';
    }

    updateProgress(percent) {
        const bar = this.shadowRoot.getElementById('progress-bar');
        bar.style.width = `${percent}%`;
    }

    async downloadSelected(format) {
        if (this.selectedImages.size === 0) return;
        
        const selectedUrls = Array.from(this.selectedImages);
        const selectedImageData = this.allImages.filter(img => 
            this.selectedImages.has(img.url)
        );
        
        this.showProgress(true);
        this.updateProgress(0);
        
        try {
            if (this.onDownload) {
                await this.onDownload({
                    urls: selectedUrls,
                    images: selectedImageData,
                    format: format,
                    onProgress: (percent) => this.updateProgress(percent)
                });
            }
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download fehlgeschlagen: ' + error.message);
        } finally {
            this.showProgress(false);
        }
    }

    destroy() {
        const host = document.getElementById('manga-downloader-host');
        if (host) {
            host.remove();
        }
        this.shadowRoot = null;
        this.isVisible = false;
    }
}