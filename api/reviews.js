const fs = require('fs');
const path = require('path');

let Redis = null;
try {
  Redis = require('ioredis');
} catch (e) {
  Redis = null;
}

let redisClient = null;

function getRedisClient() {
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
  if (!redisUrl || !Redis) return null;

  if (!redisClient) {
    try {
      const isSsl = redisUrl.startsWith('rediss://');
      redisClient = new Redis(redisUrl, {
        connectTimeout: 5000,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableAutoPipelining: true,
        tls: isSsl ? { rejectUnauthorized: false } : undefined
      });
      redisClient.on('error', (err) => {
        console.warn('ioredis background error:', err.message);
      });
    } catch (e) {
      console.warn('Failed to initialize ioredis client:', e.message);
      return null;
    }
  }
  return redisClient;
}

function getKvCredentials() {
  let url = process.env.KV_REST_API_URL ||
            process.env.UPSTASH_REDIS_REST_URL ||
            process.env.UPSTASH_REST_API_URL;

  let token = process.env.KV_REST_API_TOKEN ||
              process.env.UPSTASH_REDIS_REST_TOKEN ||
              process.env.UPSTASH_REST_API_TOKEN;

  if (!url || !token) {
    for (const [key, val] of Object.entries(process.env)) {
      if (typeof val !== 'string') continue;
      if (!url && val.startsWith('https://') && (key.includes('REDIS') || key.includes('KV') || key.includes('UPSTASH'))) {
        url = val;
      }
      if (!token && (key.includes('TOKEN') || key.includes('SECRET')) && (key.includes('REDIS') || key.includes('KV') || key.includes('UPSTASH'))) {
        token = val;
      }
    }
  }

  if (url && !url.startsWith('http')) {
    url = null;
  }

  return { url, token };
}

async function getStoredReviews(fallbackFile) {
  // Method 1: TCP Redis (Redis Cloud / Redis URL)
  const client = getRedisClient();
  if (client) {
    try {
      if (client.status === 'wait') await client.connect();
      const raw = await client.get('dreamy_needle_reviews');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.warn('Redis TCP read error:', err.message);
    }
  }

  // Method 2: Upstash REST API / Vercel KV
  const { url, token } = getKvCredentials();
  if (url && token) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['GET', 'dreamy_needle_reviews']),
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.result !== undefined && data.result !== null) {
          const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (err) {
      console.warn('Cloud KV read error:', err.message);
    }
  }

  // Method 3: Fallback to local reviews.json bundled with deployment
  try {
    if (fs.existsSync(fallbackFile)) {
      const data = fs.readFileSync(fallbackFile, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (e) {}

  return [];
}

async function saveReviews(reviews, fallbackFile) {
  let saved = false;

  // Method 1: TCP Redis (Redis Cloud / Redis URL)
  const client = getRedisClient();
  if (client) {
    try {
      if (client.status === 'wait') await client.connect();
      await client.set('dreamy_needle_reviews', JSON.stringify(reviews));
      saved = true;
    } catch (err) {
      console.warn('Redis TCP write error:', err.message);
    }
  }

  // Method 2: Upstash REST API / Vercel KV
  const { url, token } = getKvCredentials();
  if (url && token) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', 'dreamy_needle_reviews', JSON.stringify(reviews)])
      });
      if (res.ok) saved = true;
    } catch (err) {
      console.warn('Cloud KV write error:', err.message);
    }
  }

  // Fallback: Local file
  try {
    fs.writeFileSync(fallbackFile, JSON.stringify(reviews, null, 2), 'utf8');
    saved = true;
  } catch (e) {}

  return saved;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const reviewsFilePath = path.join(process.cwd(), 'reviews.json');

  // Diagnostic check: GET /api/reviews?check=1
  if (req.method === 'GET' && (req.url.includes('check=1') || req.url.includes('status=1'))) {
    const creds = getKvCredentials();
    const detected = Object.keys(process.env).filter(k => k.includes('REDIS') || k.includes('KV') || k.includes('UPSTASH'));
    let pingResult = null;
    let pingError = null;
    let connectionType = 'none';

    // 1. Test TCP Redis client
    const client = getRedisClient();
    if (client) {
      try {
        if (client.status === 'wait') await client.connect();
        pingResult = await client.ping();
        connectionType = 'tcp-redis (Redis Cloud)';
      } catch (err) {
        pingError = 'TCP: ' + err.message;
      }
    }

    // 2. Test Upstash REST if TCP didn't succeed
    if (!pingResult && creds.url && creds.token) {
      try {
        const pingRes = await fetch(creds.url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${creds.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(['PING'])
        });
        const pingData = await pingRes.json();
        pingResult = pingData.result || pingData;
        connectionType = 'rest-kv (Upstash)';
      } catch (err) {
        pingError = (pingError ? pingError + ' | ' : '') + 'REST: ' + err.message;
      }
    }

    return res.status(200).json({
      status: 'active',
      databaseConnected: Boolean(pingResult === 'PONG' || pingResult === 'OK'),
      connectionType,
      ping: pingResult,
      error: pingError,
      detectedEnvVars: detected
    });
  }

  if (req.method === 'GET') {
    const reviews = await getStoredReviews(reviewsFilePath);
    return res.status(200).json(reviews);
  }

  if (req.method === 'POST') {
    try {
      const newReview = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const currentReviews = await getStoredReviews(reviewsFilePath);
      currentReviews.unshift(newReview);
      await saveReviews(currentReviews, reviewsFilePath);
      return res.status(200).json({ success: true, reviews: currentReviews });
    } catch (err) {
      return res.status(200).json({ success: true, reviews: [] });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const reviewId = url.searchParams.get('id');
      const adminKey = url.searchParams.get('secret') || req.headers['x-admin-key'];
      const expectedKey = process.env.ADMIN_SECRET || 'dreamy-admin';

      if (adminKey !== expectedKey) {
        return res.status(401).json({ error: 'Unauthorized: invalid or missing admin secret.' });
      }

      if (!reviewId) {
        return res.status(400).json({ error: 'Missing review id parameter (?id=...)' });
      }

      let currentReviews = await getStoredReviews(reviewsFilePath);
      const initialCount = currentReviews.length;
      currentReviews = currentReviews.filter(r => String(r.id) !== String(reviewId));
      await saveReviews(currentReviews, reviewsFilePath);

      return res.status(200).json({
        success: true,
        removed: initialCount - currentReviews.length,
        remaining: currentReviews.length,
        reviews: currentReviews
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
