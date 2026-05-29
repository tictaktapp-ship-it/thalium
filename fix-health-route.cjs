const fs = require('fs');
const path = 'E:/thalium/src/app-chain-executor.ts';
let c = fs.readFileSync(path, 'utf8');

// Move health check before the router middleware
c = c.replace(
  "app.use(createRouter());\napp.get('/health', (_, res) => {\n  res.json({ status: 'ok', app: 'chain-executor' });\n});",
  "app.get('/health', (_, res) => {\n  res.json({ status: 'ok', app: 'chain-executor' });\n});\napp.use(createRouter());"
);

fs.writeFileSync(path, c, 'utf8');
console.log('Done:', c.includes("app.get('/health'") && c.indexOf("app.get('/health'") < c.indexOf("app.use(createRouter())"));