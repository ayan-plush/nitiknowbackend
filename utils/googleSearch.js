const axios = require('axios');
const cheerio = require('cheerio');

class GoogleSearch {
    static getRandomUserAgent() {
        const lynxVersion = `Lynx/${2 + Math.floor(Math.random() * 2)}.${8 + Math.floor(Math.random() * 2)}.${Math.floor(Math.random() * 3)}`;
        const libwwwVersion = `libwww-FM/${2 + Math.floor(Math.random() * 2)}.${13 + Math.floor(Math.random() * 3)}`;
        const sslMmVersion = `SSL-MM/${1 + Math.floor(Math.random())}.${3 + Math.floor(Math.random() * 3)}`;
        const opensslVersion = `OpenSSL/${1 + Math.floor(Math.random() * 3)}.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`;
        return `${lynxVersion} ${libwwwVersion} ${sslMmVersion} ${opensslVersion}`;
    }

    static async makeRequest(term, options = {}) {
        const {
            numResults = 10,
            lang = 'en',
            proxy,
            timeout = 5000,
            safe = 'active',
            region,
            start = 0,
        } = options;

        const url = 'https://www.google.com/search';
        const params = new URLSearchParams({
            q: term,
            num: (numResults + 2).toString(),
            hl: lang,
            start: start.toString(),
            safe: safe,
            ...(region && { gl: region }),
        });
        params.set('tbm', 'nws');

        const headers = {
            'User-Agent': GoogleSearch.getRandomUserAgent(),
            'Accept': '*/*',
            'Cookie': 'CONSENT=PENDING+987; SOCS=CAESHAgBEhIaAB'
        };

        const axiosConfig = {
            headers,
            timeout,
            validateStatus: status => status === 200,
            maxRedirects: 5,
            decompress: true
        };

        if (proxy) {
            const proxyUrl = new URL(proxy);
            axiosConfig.proxy = {
                protocol: proxyUrl.protocol.replace(':', ''),
                host: proxyUrl.hostname,
                port: parseInt(proxyUrl.port) || (proxyUrl.protocol === 'https:' ? 443 : 80)
            };
        }

        try {
            const response = await axios.get(`${url}?${params.toString()}`, axiosConfig);
            return response.data;
        } catch (error) {
            throw new Error(`Google search request failed: ${error.message}`);
        }
    }

    static parseResults(html, unique = false) {
        const $ = cheerio.load(html);
        const results = [];
        const seenUrls = new Set();

        const resultBlocks = $('div.g, div.ezO2md, div.MjjYud');

        resultBlocks.each((_, element) => {
            
            const linkElement = $(element).find('a[href]').first();
            const titleElement = $(element).find('h3, span.CVA68e').first();
            const descriptionElement = $(element).find('div.VwiC3b, span.FrIlee, div.s').first();
            let img = $(element).find('img').attr('src') || $(element).find('img').attr('data-src') || null;

            if (linkElement.length && titleElement.length) {
                const rawUrl = linkElement.attr('href');
                if (rawUrl) {
                    const url = decodeURIComponent(
                        rawUrl.startsWith('/url?q=') ?
                            rawUrl.split('&')[0].replace('/url?q=', '') :
                            rawUrl
                    );

                    if (unique && seenUrls.has(url)) return;
                    seenUrls.add(url);

                    if (url.startsWith('http')) {
                        results.push({
                            url,
                            title: titleElement.text().trim(),
                            description: descriptionElement.text().trim() || '',
                            img
                        });
                    }
                }
            }
        });

        return results;
    }

    static async getOGImage(articleUrl) {
        try {
            const res = await axios.get(articleUrl, { timeout: 5000 });
            const $ = cheerio.load(res.data);
            const ogImage = $('meta[property="og:image"]').attr('content');
            return ogImage || null;
        } catch (err) {
            console.error(`Failed to fetch OG image for ${articleUrl}`);
            return null;
        }
    }

    static async getArticleText(articleUrl) {
        try {
            const res = await axios.get(articleUrl, { timeout: 8000 });
            const $ = cheerio.load(res.data);

            let articleText = '';

            $('article p').each((i, el) => {
                const text = $(el).text().trim();
                if (text.length > 50) articleText += text + '\n';
            });

            if (!articleText || articleText.length < 200) {
                $('div p').each((i, el) => {
                    const text = $(el).text().trim();
                    if (text.length > 50) articleText += text + '\n';
                });
            }

            return articleText.trim() || null;

        } catch (err) {
            console.error(`Failed to fetch article text for ${articleUrl}:`, err.message);
            return null;
        }
    }

    static async search(term, options = {}) {
        const html = await GoogleSearch.makeRequest(term, options);
        const results =  GoogleSearch.parseResults(html, options.unique);
        await Promise.all(results.map(async (result) => {
            const actualImg = await GoogleSearch.getOGImage(result.url);
            if(actualImg){
                result.img = await GoogleSearch.getOGImage(result.url);
            }                
            result.articleText = await GoogleSearch.getArticleText(result.url);
        }));
        return results

    }
}

module.exports = GoogleSearch;
