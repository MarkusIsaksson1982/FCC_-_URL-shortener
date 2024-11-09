require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const urlParser = require('url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// In-memory URL store
let urlDatabase = [];
let idCounter = 1;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

// Serve the HTML file
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Utility function to validate URL format
const isValidUrl = (url) => {
  const regex = /^(https?:\/\/)(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+/;
  return regex.test(url);
};

// Endpoint to shorten URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Validate the URL format first
  if (!isValidUrl(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  // Parse the URL after validating format
  const urlObject = urlParser.parse(originalUrl);

  // Perform DNS lookup to ensure hostname is valid
  dns.lookup(urlObject.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Add URL to database
    const shortUrl = idCounter++;
    urlDatabase.push({ original_url: originalUrl, short_url: shortUrl });

    res.json({ original_url: originalUrl, short_url: shortUrl });
  });
});

// Endpoint to redirect to original URL
app.get('/api/shorturl/:shorturl', (req, res) => {
  const shortUrl = parseInt(req.params.shorturl);
  const urlEntry = urlDatabase.find(entry => entry.short_url === shortUrl);

  if (urlEntry) {
    return res.redirect(urlEntry.original_url);
  } else {
    res.json({ error: 'No short URL found for the given input' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
