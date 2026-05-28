const fs = require('fs');
const homePath = 'E:/thalium/platform/src/routes/(marketing)/+page.svelte';
let home = fs.readFileSync(homePath, 'utf8');
home = home.replace(
  '      <div style="text-align:center;margin-top:40px;">\n      <a href="/pricing" class="cta-secondary">',
  '      <p style="font-family:\'DM Mono\',monospace;font-size:11px;color:rgba(13,13,13,0.35);text-align:center;margin-top:32px;">Used in production by <a href="https://linup.io" style="color:#1A3AFF;text-decoration:none;">Linup.io</a> \u2014 powering ORIGIN, FORGE, and PULSE.</p>\n      <div style="text-align:center;margin-top:12px;">\n      <a href="/pricing" class="cta-secondary">'
);
fs.writeFileSync(homePath, home, 'utf8');
console.log('Linup present:', home.includes('Linup'));