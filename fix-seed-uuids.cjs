const fs = require('fs');
const { randomUUID } = require('crypto');
const path = 'E:/thalium/scripts/db/Invoke-SeedDemoBrain.ps1';
let c = fs.readFileSync(path, 'utf8');

// Replace all seed-xxx-NNN session IDs with proper UUIDs
// They follow pattern: session_id = 'seed-domain-NNN'
c = c.replace(/session_id\s*=\s*'seed-[a-z]+-\d+'/g, () => `session_id = '${randomUUID()}'`);

fs.writeFileSync(path, c, 'utf8');
console.log('Done');
console.log('Sample:', c.match(/session_id\s*=\s*'[^']+'/)?.[0]);