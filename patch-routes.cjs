const fs = require('fs');
const path = 'E:/thalium/src/api/routes.ts';
let c = fs.readFileSync(path, 'utf8');

// Add import for handleChainInvocation after existing imports
c = c.replace(
  "import { z } from 'zod';",
  "import { z } from 'zod';\nimport { handleChainInvocation } from './chain-executor';"
);

// Wire invoke route
c = c.replace(
  `  router.post('/v1/brain/:brainId/invoke', requireScope('invoke'), async (req, res) => {
    try {
      InvokeBodySchema.parse(req.body);
      res.status(202).json({ status: 'accepted', message: 'chain dispatch not yet wired' });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'bad_request', code: 'invalid_input', detail: err.errors[0]?.message });
        return;
      }
      res.status(500).json({ error: 'internal_error' });
    }
  });`,
  `  router.post('/v1/brain/:brainId/invoke', requireScope('invoke'), async (req, res) => {
    try {
      InvokeBodySchema.parse(req.body);
      await handleChainInvocation(req, res);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'bad_request', code: 'invalid_input', detail: err.errors[0]?.message });
        return;
      }
      res.status(500).json({ error: 'internal_error' });
    }
  });`
);

// Wire stream route
c = c.replace(
  `  router.post('/v1/brain/:brainId/invoke/stream', requireScope('invoke'), async (req, res) => {
    try {
      InvokeBodySchema.parse(req.body);
      res.status(202).json({ status: 'accepted', message: 'stream not yet wired' });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'bad_request', code: 'invalid_input', detail: err.errors[0]?.message });
        return;
      }
      res.status(500).json({ error: 'internal_error' });
    }
  });`,
  `  router.post('/v1/brain/:brainId/invoke/stream', requireScope('invoke'), async (req, res) => {
    try {
      InvokeBodySchema.parse(req.body);
      await handleChainInvocation(req, res);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: 'bad_request', code: 'invalid_input', detail: err.errors[0]?.message });
        return;
      }
      res.status(500).json({ error: 'internal_error' });
    }
  });`
);

fs.writeFileSync(path, c, 'utf8');
console.log('Done — lines:', c.split('\n').length);
console.log('Import added:', c.includes("import { handleChainInvocation }"));
console.log('Invoke wired:', c.includes('await handleChainInvocation(req, res)'));
console.log('Stub removed:', !c.includes('chain dispatch not yet wired'));