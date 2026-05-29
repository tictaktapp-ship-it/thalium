const fs = require('fs');
const path = 'E:/thalium/src/api/routes.ts';
let c = fs.readFileSync(path, 'utf8');

// Just replace the two stub lines directly
c = c.replace(
  "res.status(202).json({ status: 'accepted', message: 'chain dispatch not yet wired' });",
  "await handleChainInvocation(req, res);"
);
c = c.replace(
  "res.status(202).json({ status: 'accepted', message: 'stream not yet wired' });",
  "await handleChainInvocation(req, res);"
);

// Add import after zod import
c = c.replace(
  "import { z } from 'zod';",
  "import { z } from 'zod';\nimport { handleChainInvocation } from './chain-executor';"
);

fs.writeFileSync(path, c, 'utf8');
console.log('Invoke wired:', c.includes('await handleChainInvocation'));
console.log('Import added:', c.includes("from './chain-executor'"));
console.log('Stub removed:', !c.includes('not yet wired'));