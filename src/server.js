const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const SOURCE_DIR = path.join(__dirname, 'sources');
const SOURCE_INDEX = require('./sources.json');

function readSourceCatalog(fileName) {
  const filePath = path.join(SOURCE_DIR, fileName);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Failed to read ${fileName}:`, error.message);
    return [];
  }
}

function getAllSourceEntries() {
  const categories = SOURCE_INDEX.categories || [];
  let all = [];
  for (const category of categories) {
    const entries = readSourceCatalog(category.file);
    if (Array.isArray(entries)) {
      all = all.concat(entries.map((entry) => ({ ...entry, category: category.name })));
    }
  }
  return all;
}

const allSources = getAllSourceEntries();

const sampleResults = [
  {
    title: 'Example YouTube video',
    type: 'video',
    language: 'en',
    source: 'youtube-metadata',
    sourceUrl: 'https://github.com/mattwright324/youtube-metadata',
    mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    poster: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    subtitleUrl: 'https://example.com/subtitles/en/dQw4w9WgXcQ.vtt',
    legal: true
  },
  {
    title: 'Example podcast episode',
    type: 'audio',
    language: 'en',
    source: 'podcastindex-api',
    sourceUrl: 'https://podcastindex.org',
    mediaUrl: 'https://example.com/podcast/episode.mp3',
    poster: 'https://example.com/posters/podcast.jpg',
    subtitleUrl: '',
    legal: true
  },
  {
    title: 'CC media sample',
    type: 'audio',
    language: 'en',
    source: 'cccatalog-api',
    sourceUrl: 'https://api.creativecommons.engineering',
    mediaUrl: 'https://example.com/audio/cc-track.mp3',
    poster: 'https://example.com/posters/cc-track.jpg',
    subtitleUrl: '',
    legal: true
  },
  {
    title: 'Internet Archive sample',
    type: 'video',
    language: 'en',
    source: 'internetarchive-iaux',
    sourceUrl: 'https://archive.org',
    mediaUrl: 'https://archive.org/details/example',
    poster: 'https://archive.org/services/img/example',
    subtitleUrl: '',
    legal: true
  }
];

function buildRecord(record = {}) {
  return {
    title: record.title || '',
    type: record.type || '',
    language: record.language || 'unknown',
    source: record.source || '',
    sourceUrl: record.sourceUrl || '',
    mediaUrl: record.mediaUrl || '',
    poster: record.poster || '',
    subtitleUrl: record.subtitleUrl || '',
    legal: record.legal !== false
  };
}

function matchesQuery(item, q) {
  if (!q) return true;
  const haystack = [
    item.title,
    item.type,
    item.language,
    item.source,
    item.sourceUrl
  ].join(' ').toLowerCase();
  return haystack.includes(q.toLowerCase());
}

function getSourceByName(name) {
  const target = String(name || '').trim().toLowerCase();
  return allSources.find((source) => String(source.name || '').trim().toLowerCase() === target);
}

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'nanojet-media-catalog',
    legalOnly: true
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'NanoJet Media Catalog',
    legalOnly: true,
    version: '1.0.0',
    endpoints: [
      '/api/search?q=',
      '/api/turkish',
      '/api/movies',
      '/api/series',
      '/api/anime',
      '/api/music',
      '/api/podcasts',
      '/api/subtitles',
      '/api/public-domain',
      '/api/creative-commons',
      '/api/live',
      '/api/source/:name',
      '/api/sources'
    ]
  });
});

app.get('/api/search', (req, res) => {
  const q = String(req.query.q || '').trim();
  const results = sampleResults.filter((item) => matchesQuery(item, q));
  res.json(results.map(buildRecord));
});

app.get('/api/turkish', (req, res) => {
  const items = sampleResults.filter((item) => item.language === 'tr' || item.language === 'tr-TR');
  res.json(items.map(buildRecord));
});

app.get('/api/movies', (req, res) => {
  const items = sampleResults.filter((item) => item.type === 'movie');
  res.json(items.map(buildRecord));
});

app.get('/api/series', (req, res) => {
  const items = sampleResults.filter((item) => item.type === 'series');
  res.json(items.map(buildRecord));
});

app.get('/api/anime', (req, res) => {
  const items = sampleResults.filter((item) => item.source === 'jikan');
  res.json(items.map(buildRecord));
});

app.get('/api/music', (req, res) => {
  const items = sampleResults.filter((item) => item.type === 'audio' || item.type === 'music');
  res.json(items.map(buildRecord));
});

app.get('/api/podcasts', (req, res) => {
  const items = sampleResults.filter((item) => item.source === 'podcastindex-api');
  res.json(items.map(buildRecord));
});

app.get('/api/subtitles', (req, res) => {
  const items = sampleResults.filter((item) => item.source === 'opensubtitles-api');
  res.json(items.map(buildRecord));
});

app.get('/api/public-domain', (req, res) => {
  const items = sampleResults.filter((item) => item.source === 'public-domain-catalog');
  res.json(items.map(buildRecord));
});

app.get('/api/creative-commons', (req, res) => {
  const items = sampleResults.filter((item) => item.source === 'cccatalog-api');
  res.json(items.map(buildRecord));
});

app.get('/api/live', (req, res) => {
  const items = sampleResults.filter((item) => item.source === 'iptv-org-iptv');
  res.json(items.map(buildRecord));
});

app.get('/api/sources', (req, res) => {
  res.json(
    allSources.map((source) => ({
      name: source.name,
      github: source.github,
      homepage: source.homepage,
      license: source.license,
      lastCommit: source.lastCommit,
      status: source.status,
      type: source.type,
      api: source.api,
      nanojetCompatible: source.nanojetCompatible,
      category: source.category
    }))
  );
});

app.get('/api/source/:name', (req, res) => {
  const source = getSourceByName(req.params.name);
  if (!source) {
    return res.status(404).json({ error: 'Source not found' });
  }
  return res.json({
    name: source.name,
    github: source.github,
    homepage: source.homepage,
    license: source.license,
    lastCommit: source.lastCommit,
    status: source.status,
    type: source.type,
    api: source.api,
    nanojetCompatible: source.nanojetCompatible,
    category: source.category
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`NanoJet media catalog running on http://localhost:${PORT}`);
  });
}

module.exports = { app, buildRecord, sampleResults };
