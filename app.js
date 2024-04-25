const express = require('express');
const { Pool } = require('pg');
const { scrapeTwitter } = require('./scrapper');
const nodemailer = require('nodemailer');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const app = express();
const pool = new Pool(); // Configure your Postgres connection parameters

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user:process.env.email,
        pass: process.env.password
    }
});

async function periodicScrape() {
    const tweets = await scrapeTwitter();
    for (const tweet of tweets) {
        const { textContent, images, has_video } = tweet;
        const queryText = 'INSERT INTO tweets(tweet_text, image_paths, has_video) VALUES($1, $2, $3) RETURNING *';
        const res = await pool.query(queryText, [textContent, images, has_video]);

        if (has_video) {
            transporter.sendMail({
                from: process.env.email,
                to: 'noniekwo@gmail.com',
                subject: 'New Video Post Detected',
                text: 'A new post with video has been detected and saved.'
            });
        }
    }
}

app.get('/api/tweets', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const result = await pool.query('SELECT * FROM tweets ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json(result.rows);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(3000, () => {
    console.log('Server running on port 3000');
    setInterval(periodicScrape, 3600000); // Run scraping every hour
});
