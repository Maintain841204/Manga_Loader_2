const JSZip = require('jszip');
const sharp = require('sharp');
const PDFDocument = require('pdfkit');

const allowedDomains = [
    'bato.to',
    'mangadex.org', 
    'mangakakalot.com',
    'manganelo.com',
    'mangastream.to',
    'readmanga.today',
    'mangafreak.net'
];

async function fetchImageWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const urlObj = new URL(url);
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': urlObj.origin,
                    'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9'
                },
                timeout: 20000
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const buffer = await response.buffer();
            return buffer;

        } catch (error) {
            console.error(`Attempt ${i + 1} failed for ${url}:`, error.message);
            
            if (i === retries - 1) {
                throw error;
            }
            
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
}

async function convertImageFormat(buffer, targetFormat = 'jpeg') {
    try {
        if (targetFormat === 'jpeg' || targetFormat === 'jpg') {
            return await sharp(buffer)
                .jpeg({ quality: 90, progressive: true })
                .toBuffer();
        } else if (targetFormat === 'png') {
            return await sharp(buffer)
                .png({ compressionLevel: 6 })
                .toBuffer();
        } else if (targetFormat === 'webp') {
            return await sharp(buffer)
                .webp({ quality: 85 })
                .toBuffer();
        }
        
        return buffer; // Return original if no conversion needed
    } catch (error) {
        console.error('Image conversion failed:', error);
        return buffer; // Return original if conversion fails
    }
}

async function createZipArchive(images, options = {}) {
    const zip = new JSZip();
    const { prefix = 'manga-page-', convertToJpeg = true } = options;
    
    for (let i = 0; i < images.length; i++) {
        const { buffer, originalUrl } = images[i];
        
        try {
            let finalBuffer = buffer;
            let extension = 'jpg';
            
            if (convertToJpeg) {
                finalBuffer = await convertImageFormat(buffer, 'jpeg');
                extension = 'jpg';
            } else {
                // Try to determine original extension
                const urlExtension = originalUrl.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
                extension = urlExtension ? urlExtension[1] : 'jpg';
            }
            
            const filename = `${prefix}${String(i + 1).padStart(3, '0')}.${extension}`;
            zip.file(filename, finalBuffer);
            
        } catch (error) {
            console.error(`Failed to process image ${i + 1}:`, error);
            // Skip this image but continue with others
        }
    }
    
    return await zip.generateAsync({ 
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
    });
}

async function createPDFDocument(images, options = {}) {
    const { title = 'Manga Pages', author = 'Manga Downloader' } = options;
    
    const doc = new PDFDocument({
        info: {
            Title: title,
            Author: author,
            Creator: 'Manga Downloader Bookmarklet'
        },
        autoFirstPage: false
    });
    
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    
    return new Promise(async (resolve, reject) => {
        doc.on('end', () => {
            const buffer = Buffer.concat(chunks);
            resolve(buffer);
        });
        
        doc.on('error', reject);
        
        try {
            for (let i = 0; i < images.length; i++) {
                const { buffer } = images[i];
                
                // Convert to JPEG for PDF compatibility
                const jpegBuffer = await convertImageFormat(buffer, 'jpeg');
                
                // Get image dimensions
                const metadata = await sharp(jpegBuffer).metadata();
                const { width, height } = metadata;
                
                // Calculate page size (A4 max, but preserve aspect ratio)
                const maxWidth = 595; // A4 width in points
                const maxHeight = 842; // A4 height in points
                
                let pageWidth = width;
                let pageHeight = height;
                
                // Scale down if too large
                if (width > maxWidth || height > maxHeight) {
                    const scale = Math.min(maxWidth / width, maxHeight / height);
                    pageWidth = width * scale;
                    pageHeight = height * scale;
                }
                
                // Add new page
                doc.addPage({ size: [pageWidth, pageHeight] });
                
                // Add image to page
                doc.image(jpegBuffer, 0, 0, {
                    fit: [pageWidth, pageHeight],
                    align: 'center',
                    valign: 'center'
                });
            }
            
            doc.end();
            
        } catch (error) {
            reject(error);
        }
    });
}

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { urls, format = 'zip', options = {} } = req.body;

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'URLs array is required' });
        }

        if (urls.length > 100) {
            return res.status(400).json({ error: 'Too many URLs (max 100)' });
        }

        // Validate all URLs are from allowed domains
        for (const url of urls) {
            try {
                const urlObj = new URL(url);
                const isAllowed = allowedDomains.some(domain => 
                    urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
                );
                
                if (!isAllowed) {
                    return res.status(403).json({ 
                        error: `Domain not allowed: ${urlObj.hostname}` 
                    });
                }
            } catch (error) {
                return res.status(400).json({ 
                    error: `Invalid URL: ${url}` 
                });
            }
        }

        // Download all images
        console.log(`Starting download of ${urls.length} images`);
        const images = [];
        
        for (let i = 0; i < urls.length; i++) {
            try {
                const buffer = await fetchImageWithRetry(urls[i]);
                images.push({ buffer, originalUrl: urls[i] });
                
                // Log progress
                if ((i + 1) % 10 === 0 || i === urls.length - 1) {
                    console.log(`Downloaded ${i + 1}/${urls.length} images`);
                }
            } catch (error) {
                console.error(`Failed to download image ${i + 1} (${urls[i]}):`, error.message);
                // Continue with other images
            }
        }

        if (images.length === 0) {
            return res.status(400).json({ error: 'No images could be downloaded' });
        }

        console.log(`Successfully downloaded ${images.length}/${urls.length} images`);

        // Generate output based on format
        if (format === 'zip') {
            const zipBuffer = await createZipArchive(images, options);
            
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename="manga-pages.zip"');
            res.setHeader('Content-Length', zipBuffer.length);
            
            return res.send(zipBuffer);
            
        } else if (format === 'pdf') {
            const pdfBuffer = await createPDFDocument(images, options);
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename="manga-pages.pdf"');
            res.setHeader('Content-Length', pdfBuffer.length);
            
            return res.send(pdfBuffer);
            
        } else {
            return res.status(400).json({ 
                error: 'Invalid format. Supported formats: zip, pdf' 
            });
        }

    } catch (error) {
        console.error('Download API error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
}