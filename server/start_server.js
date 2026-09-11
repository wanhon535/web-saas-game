const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = path.resolve(__dirname, '..');

const files = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/p0.css': 'p0.css',
  '/p0.js': 'p0.js',
  '/p1-data.js': 'p1-data.js'
};

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8'
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end('Method Not Allowed');
    return;
  }

  const pathname = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`).pathname;
  const filename = files[pathname];
  if (!filename) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  const filePath = path.join(ROOT_DIR, filename);
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('试玩文件加载失败，请检查项目文件是否完整。');
      return;
    }

    res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filename)] || 'text/plain; charset=utf-8' });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    res.end(content);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('《修仙御兽：万剑封妖》客户端试玩服务已启动');
  console.log(`打开浏览器访问：http://127.0.0.1:${PORT}/`);
});
