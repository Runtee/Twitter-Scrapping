const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
const path = require('path');
const url = 'https://twitter.com/coindesk';

async function downloadImage(url, outputPath, retries = 3) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, { timeout: 10000 }, (res) => {
            if (res.statusCode === 200) {
                const fileStream = fs.createWriteStream(outputPath);
                res.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log('Downloaded image:', outputPath);
                    resolve();
                });
            } else {
                res.resume(); // Consume response data to free up memory
                reject(new Error(`Request Failed. Status Code: ${res.statusCode}`));
            }
        });

        request.on('timeout', () => {
            request.destroy();
            reject(new Error('Request timed out.'));
        });

        request.on('error', (err) => {
            fs.unlink(outputPath, () => {
                if (retries > 0) {
                    console.log(`Retrying image download for ${url}, ${retries} retries left.`);
                    downloadImage(url, outputPath, retries - 1).then(resolve).catch(reject);
                } else {
                    console.log('Error downloading the image:', err);
                    reject(err);
                }
            });
        });
    });
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeTwitter() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    let lastHeight = await page.evaluate('document.body.scrollHeight');
    while (true) {
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await sleep(2000);
        let newHeight = await page.evaluate('document.body.scrollHeight');
        if (newHeight === lastHeight) {
            break;
        }
        lastHeight = newHeight;
    }

    const imagesDir = path.join(__dirname, 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir);
    }

    const tweets = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('article[data-testid="tweet"]')).map(tweet => {
            const textContent = tweet.querySelector('div[lang]').innerText;
            const images = Array.from(tweet.querySelectorAll('img')).slice(1).map(img => img.src);
            const has_video = Boolean(tweet.querySelector('video'));
            return { textContent, images, has_video };
        });
    });

    await browser.close();
    return tweets;
}

module.exports = { scrapeTwitter, downloadImage };
