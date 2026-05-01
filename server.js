import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function resolvePath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0]);
  const requested = decodedPath === '/' ? '/index.html' : decodedPath;
  const normalized = normalize(requested).replace(/^(\.\.[/\\])+/, '');
  return join(root, normalized);
}

const server = http.createServer(async (request, response) => {
  if (!request.url) {
    response.writeHead(400).end('Bad request');
    return;
  }

  const filePath = resolvePath(request.url);

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }

    const contentType = mimeTypes[extname(filePath)] || 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': contentType });
    if (extname(filePath) === '.json') {
      const content = await readFile(filePath, 'utf8');
      response.end(content.replace(/^\uFEFF/, ''));
      return;
    }

    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
