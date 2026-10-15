const fs = require('fs');
const path = require('path');

function getKvCredentials() {
  let url = process.env.KV_REST_API_URL ||
            process.env.UPSTASH_REDIS_REST_URL ||
            process.env.UPSTASH_REST_API_URL;

  let token = process.env.KV_REST_API_TOKEN ||
              process.env.UPSTASH_REDIS_REST_TOKEN ||
              process.env.UPSTASH_REST_API_TOKEN;

  // Fallback 1: check REDIS_URL or UPSTASH_REDIS_URL connection string
  const rawRedisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;
  if ((!url || !token) && rawRedisUrl) {
    if (rawRedisUrl.startsWith('http')) {
      url = url || rawRedisUrl;
    } else if (rawRedisUrl.startsWith('redis://') || rawRedisUrl.startsWith('rediss://')) {
      try {
        const parsedUrl = new URL(rawRedisUrl);
        if (!url && parsedUrl.hostname) {
          url = `https://${parsedUrl.hostname}`;
        }
        if (!token && parsedUrl.password) {
          token = parsedUrl.password;
        }
      } catch (e) {}
    }
  }

  // Fallback 2: dynamically scan all process.env
  if (!url || !token) {
    for (const [key, val] of Object.entries(process.env)) {
      if (typeof val !== 'string') continue;
      if (!url && val.startsWith('https://') && (key.includes('REDIS') || key.includes('KV') || key.includes('UPSTASH'))) {
        url = val;
      }
      if (!token && (key.includes('TOKEN') || key.includes('SECRET')) && (key.includes('REDIS') || key.includes('KV') || key.includes('UPSTASH'))) {
        token = val;
      }
      if ((!url || !token) && (val.startsWith('redis://') || val.startsWith('rediss://'))) {
        try {
          const parsed = new URL(val);
          if (!url && parsed.hostname) url = `https://${parsed.hostname}`;
          if (!token && parsed.password) token = parsed.password;
        } catch (e) {}
      }
    }
  }

  // Ensure url is valid HTTP/HTTPS
  if (url && !url.startsWith('http')) {
    url = null;
  }

  return { url, token };
}

async function getStoredReviews(fallbackFile) {
  const { url, token } = getKvCredentials();

  // If cloud database is configured in Vercel, fetch from cloud
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
      console.warn('Cloud KV read error, falling back to local reviews.json', err);
    }
  }

  // Fallback to local reviews.json bundled with the deployment
  try {
    if (fs.existsSync(fallbackFile)) {
      const data = fs.readFileSync(fallbackFile, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (e) {}

  return [];
}

async function saveReviews(reviews, fallbackFile) {
  const { url, token } = getKvCredentials();

  // If cloud database is configured, persist to cloud
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
      if (res.ok) return true;
    } catch (err) {
      console.warn('Cloud KV write error:', err);
    }
  }

  // If local server (writeable disk), write to disk
  try {
    fs.writeFileSync(fallbackFile, JSON.stringify(reviews, null, 2), 'utf8');
    return true;
  } catch (e) {
    // Read-only filesystem on serverless without cloud database
    return false;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const reviewsFilePath = path.join(process.cwd(), 'reviews.json');

  // Diagnostic check
  if (req.method === 'GET' && (req.url.includes('check=1') || req.url.includes('status=1'))) {
    const creds = getKvCredentials();
    const detected = Object.keys(process.env).filter(k => k.includes('REDIS') || k.includes('KV') || k.includes('UPSTASH'));
    let kvPing = null;
    let kvError = null;

    if (creds.url && creds.token) {
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
        kvPing = pingData.result || pingData;
      } catch (err) {
        kvError = err.message;
      }
    }

    return res.status(200).json({
      status: 'active',
      databaseConnected: Boolean(creds.url && creds.token),
      kvPing,
      kvError,
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
