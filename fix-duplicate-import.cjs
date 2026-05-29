const fs = require('fs');
const path = 'E:/thalium/src/api/routes.ts';
let c = fs.readFileSync(path, 'utf8');

// Remove duplicate import lines, keep only one
const importLine = "import { handleChainInvocation } from './chain-executor';";
const count = (c.match(/import \{ handleChainInvocation \}/g) || []).length;
console.log('Duplicate imports found:', count);

if (count > 1) {
  // Remove all instances then add back once
  c = c.replace(/import \{ handleChainInvocation \} from '\.\/chain-executor';\n/g, '');
  c = c.replace("import { z } from 'zod';", "import { z } from 'zod';\n" + importLine);
}

fs.writeFileSync(path, c, 'utf8');
console.log('Imports now:', (c.match(/import \{ handleChainInvocation \}/g) || []).length);