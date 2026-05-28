const fs = require('fs');
const path = String.raw`E:/thalium/platform/src/routes/app/instances/[id]/keys/+page.svelte`;
let c = fs.readFileSync(path, 'utf8');

// Replace plain use:enhance with a callback version that closes the form on success
c = c.replace(
  '      <form method="POST" action="?/create" use:enhance class="space-y-4">',
  '      <form method="POST" action="?/create" use:enhance={() => { return async ({ update }) => { await update(); showCreate = false; }; }} class="space-y-4">'
);

fs.writeFileSync(path, c, 'utf8');
console.log('Done:', c.includes('showCreate = false'));