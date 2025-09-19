import express from 'express';
import 'dotenv/config';
import { AddonInterface, serveHTTP } from 'stremio-addon-sdk';
import tmdbScrape from './src/vidsrc.js';
import fetch from 'node-fetch';

const { TMDB_API_KEY } = process.env;
if (!TMDB_API_KEY) {
  console.error('TMDB_API_KEY is not set. Please create a .env file.');
  process.exit(1);
}

async function getTmdbId(imdbId) {
  try {
    const url = `https://api.themoviedb.org/3/find/${imdbId}?api_key=${TMDB_API_KEY}&external_source=imdb_id`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.movie_results && data.movie_results.length > 0) {
      return data.movie_results[0].id.toString();
    }
    if (data.tv_results && data.tv_results.length > 0) {
      return data.tv_results[0].id.toString();
    }
    return null;
  } catch (error) {
    console.error('Error converting IMDb ID to TMDB ID:', error);
    return null;
  }
}

const manifest = {
  id: 'community.vidsrc.ts.addon',
  version: '1.0.3',
  name: 'VidSrc Scraper (Self-Contained)',
  description: 'Provides streams from the vidsrc.ts scraper.',
  resources: ['stream'],
  types: ['movie', 'tv'],
  idPrefixes: ['tt'],
  catalogs: [],
};

const builder = new AddonInterface(manifest);

builder.defineStreamHandler(async ({ type, id }) => {
  console.log(`Received request for: ${type} ${id}`);
  const [imdbId_full, season, episode] = id.split(':');
  const tmdbId = await getTmdbId(imdbId_full);
  if (!tmdbId) {
    console.log(`Could not find TMDB ID for ${id}`);
    return { streams: [] };
  }
  console.log(`Found TMDB ID: ${tmdbId}`);
  let scrapedSources = [];
  try {
    if (type === 'movie') {
      scrapedSources = await tmdbScrape(tmdbId, 'movie');
    } else if (type === 'tv') {
      scrapedSources = await tmdbScrape(tmdbId, 'tv', season, episode);
    }
  } catch (e) {
    console.error('Scraper failed:', e.message);
    return { streams: [] };
  }
  if (!scrapedSources || scrapedSources.length === 0) {
    console.log('Scraper returned no sources.');
    return { streams: [] };
  }
  const streams = scrapedSources
    .filter(item => item && item.stream)
    .map(item => ({
      name: 'VidSrc',
      title: item.name || 'VidSrc Stream',
      url: item.stream,
    }));
  console.log(`Responding with ${streams.length} streams.`);
  return { streams: streams };
});

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/:configuration?/manifest.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(builder.getInterface());
});

app.get('/:configuration?/stream/:type/:id.json', async (req, res) => {
    try {
        const { type, id } = req.params;
        const resp = await builder.get('stream', type, id);
        res.setHeader('Content-Type', 'application/json');
        res.send(resp);
    } catch(err) {
        console.error(err);
        res.status(500).send({ err: 'handler error' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Stremio add-on server running on all interfaces at http://<YOUR_IP>:${PORT}`);
});