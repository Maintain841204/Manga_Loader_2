const allowedDomains = [
    'bato.to',
    'mangadex.org',
    'mangakakalot.com',
    'manganelo.com',
    'mangastream.to',
    'readmanga.today',
    'mangafreak.net'
];

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
        const urlObj = new URL(url);
        
        // Security check: only allow whitelisted domains
        const isAllowed = allowedDomains.some(domain => 
            urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
        );

        if (!isAllowed) {
            return res.status(403).json({ 
                error: 'Domain not allowed',
                domain: urlObj.hostname,
                allowed: allowedDomains
            });
        }

        // Fetch the image with appropriate headers
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': urlObj.origin,
                'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            timeout: 15000
        });

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: `Failed to fetch image: ${response.status} ${response.statusText}`,
                url: url
            });
        }

        const contentType = response.headers.get('content-type');
        
        // Verify it's actually an image
        if (!contentType || !contentType.startsWith('image/')) {
            return res.status(400).json({ 
                error: 'URL does not point to an image',
                contentType: contentType
            });
        }

        const buffer = await response.buffer();

        // Set appropriate headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // Add filename if available
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
            res.setHeader('Content-Disposition', contentDisposition);
        }

        return res.send(buffer);

    } catch (error) {
        console.error('Proxy error:', error);
        
        if (error.name === 'AbortError') {
            return res.status(408).json({ error: 'Request timeout' });
        }
        
        return res.status(500).json({ 
            error: 'Failed to proxy image',
            message: error.message
        });
    }
}