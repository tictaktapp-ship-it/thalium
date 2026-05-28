const fs = require('fs');

// Fix 1: keys server action — scope -> scopes array with correct values
const serverPath = String.raw`E:/thalium/platform/src/routes/app/instances/[id]/keys/+page.server.ts`;
let server = fs.readFileSync(serverPath, 'utf8');

// Fix the insert body — replace scope field with scopes array
server = server.replace(
  `        brain_id: id,
        name: name.trim(),
        key_prefix: prefix,
        key_hash: keyHash,
        scope: scope || 'invocation-only'`,
  `        brain_id: id,
        name: name.trim(),
        key_prefix: prefix,
        key_hash: keyHash,
        scopes: scope === 'invocation-only' ? ['invoke'] :
                scope === 'read-only' ? ['invoke', 'memory:read', 'audit:read'] :
                scope === 'full-access' ? ['invoke', 'memory:read', 'memory:write', 'memory:admin', 'audit:read', 'config:write', 'admin'] :
                ['invoke']`
);

// Fix the keys load query — select scopes not scope
server = server.replace(
  'select=id,name,key_prefix,scope,last_used_at,created_at',
  'select=id,name,key_prefix,scopes,last_used_at,created_at'
);

fs.writeFileSync(serverPath, server, 'utf8');
console.log('Server fixed:', server.includes("scopes: scope ==="));

// Fix 2: keys svelte — scopeLabels uses scopes array, display correctly
const sveltePath = String.raw`E:/thalium/platform/src/routes/app/instances/[id]/keys/+page.svelte`;
let svelte = fs.readFileSync(sveltePath, 'utf8');

// Replace scopeLabels lookup with array-based display
svelte = svelte.replace(
  `  const scopeLabels: Record<string, string> = {
    'invocation-only': 'Invocation only',
    'read-only':       'Read only',
    'full-access':     'Full access',
  }`,
  `  function scopeLabel(scopes: string[]): string {
    if (!scopes || scopes.length === 0) return 'No scope';
    if (scopes.includes('admin')) return 'Full access';
    if (scopes.includes('memory:write')) return 'Read + write';
    if (scopes.includes('memory:read')) return 'Read only';
    return 'Invoke only';
  }`
);

// Replace the scopeLabels usage in the template
svelte = svelte.replace(
  '{scopeLabels[key.scope] ?? key.scope}',
  '{scopeLabel(key.scopes ?? [])}'
);

fs.writeFileSync(sveltePath, svelte, 'utf8');
console.log('Svelte keys fixed:', svelte.includes('scopeLabel(key.scopes'));

// Fix 3: instance dashboard — add instance ID display
const dashPath = String.raw`E:/thalium/platform/src/routes/app/instances/[id]/+page.svelte`;
let dash = fs.readFileSync(dashPath, 'utf8');

// Add instance ID after the status/domain line
dash = dash.replace(
  `        <span class="font-mono text-xs text-ink/30">{formatDate(data.instance.created_at)}</span>`,
  `        <span class="font-mono text-xs text-ink/30">{formatDate(data.instance.created_at)}</span>
        <span class="font-mono text-xs text-ink/20 select-all" title="Brain Instance ID">{data.instance.id}</span>`
);

fs.writeFileSync(dashPath, dash, 'utf8');
console.log('Dashboard ID fixed:', dash.includes('data.instance.id}'));