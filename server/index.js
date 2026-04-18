import http from 'node:http';
import { topicEngine } from './topic-engine.js';

const PORT = Number(process.env.PORT || 8787);

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function routeTopic(pathname, body) {
  const { term, topic, targetNode, userContext, signal } = body;
  const resolvedTopic = topic || topicEngine.resolveTopic(term || '', targetNode || null);

  switch (pathname) {
    case '/api/topic/resolve':
      return { topic: topicEngine.resolveTopic(term || '', targetNode || null) };
    case '/api/topic/children':
      return { topic: resolvedTopic, children: topicEngine.getChildren(resolvedTopic) };
    case '/api/topic/explainer':
      return { topic: resolvedTopic, explainer: topicEngine.getExplainer(resolvedTopic, userContext || {}) };
    case '/api/topic/predictions':
      return { topic: resolvedTopic, predictions: topicEngine.getPredictions(resolvedTopic) };
    case '/api/topic/warm':
      return topicEngine.warmTopic(resolvedTopic, userContext || {});
    case '/api/topic/signal':
      topicEngine.rememberSignal(resolvedTopic, signal);
      return { ok: true };
    default:
      return null;
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'spark-topic-api',
      mode: 'local-predictive-graph',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (req.method === 'POST' && req.url?.startsWith('/api/topic/')) {
    try {
      const body = await readBody(req);
      const payload = routeTopic(req.url, body);
      if (!payload) {
        sendJson(res, 404, { error: 'Unknown topic route' });
        return;
      }
      sendJson(res, 200, payload);
    } catch (error) {
      sendJson(res, 400, { error: error.message || 'Request failed' });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Spark topic API listening on http://127.0.0.1:${PORT}`);
});
