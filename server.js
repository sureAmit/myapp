const http = require('http');

let current = 'Nothing selected yet';
const watchers = [];

const userPage = `<!doctype html>
<h2>Your answer</h2>
<select id="choice">
  <option value="" disabled selected>Choose...</option>
  <option>Yes</option>
  <option>No</option>
  <option>Other</option>
</select>
<script>
  document.getElementById('choice').onchange = (e) => {
    fetch('/select', { method: 'POST', body: e.target.value });
  };
</script>`;

const providerPage = `<!doctype html>
<h2>User selected:</h2>
<h1 id="out">...</h1>
<script>
  const feed = new EventSource('/stream');
  feed.onmessage = (e) => { document.getElementById('out').textContent = e.data; };
</script>`;

http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(userPage);

  } else if (req.method === 'GET' && req.url === '/provider') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(providerPage);

  } else if (req.method === 'POST' && req.url === '/select') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      current = body;
      watchers.forEach((w) => w.write(`data: ${current}\n\n`));
      res.writeHead(200);
      res.end('ok');
    });

  } else if (req.method === 'GET' && req.url === '/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(`data: ${current}\n\n`);
    watchers.push(res);
    req.on('close', () => watchers.splice(watchers.indexOf(res), 1));

  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(process.env.PORT || 3000, () => console.log('Server running'));