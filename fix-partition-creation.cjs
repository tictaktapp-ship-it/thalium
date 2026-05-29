const fs = require('fs');
const path = 'E:/thalium/platform/src/routes/app/instances/new/+page.server.ts';
let c = fs.readFileSync(path, 'utf8');

// Add partition creation call after brainId is confirmed, before seeding
c = c.replace(
  `    // Trigger seeding via backend — fire and forget, never block redirect on failure`,
  `    // Create database partition for new Brain Instance (required for partitioned tables)
    if (brainId) {
      try {
        await fetch(\`\${base}/rest/v1/rpc/create_brain_partition\`, {
          method: 'POST',
          headers: { ...headers, Prefer: '' },
          body: JSON.stringify({ p_brain_id: brainId })
        });
      } catch (err) {
        console.error('[new-instance] Partition creation failed:', err);
      }
    }

    // Trigger seeding via backend — fire and forget, never block redirect on failure`
);

fs.writeFileSync(path, c, 'utf8');
console.log('Done:', c.includes('create_brain_partition'));