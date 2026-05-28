const fs = require('fs');

// Add Linup.io proof line to homepage pricing teaser
const homePath = 'E:/thalium/platform/src/routes/(marketing)/+page.svelte';
let home = fs.readFileSync(homePath, 'utf8');
home = home.replace(
  '<div style="text-align:center;margin-top:40px;display:flex;flex-direction:column;align-items:center;gap:16px;">',
  '<div style="text-align:center;margin-top:8px;margin-bottom:32px;">\n      <p style="font-family:\'DM Mono\',monospace;font-size:11px;color:rgba(13,13,13,0.35);">Used in production by <a href="https://linup.io" style="color:#1A3AFF;text-decoration:none;">Linup.io</a> \u2014 powering ORIGIN, FORGE, and PULSE.</p>\n    </div>\n    <div style="text-align:center;margin-top:0;display:flex;flex-direction:column;align-items:center;gap:16px;">'
);
fs.writeFileSync(homePath, home, 'utf8');
console.log('Homepage done');

// Fix company page encoding
const compPath = 'E:/thalium/platform/src/routes/(marketing)/company/+page.svelte';
let comp = fs.readFileSync(compPath, 'utf8');
comp = comp.replace(/â€"/g, '—');
comp = comp.replace(/â€˜/g, '\u2018');
comp = comp.replace(/â€™/g, '\u2019');
fs.writeFileSync(compPath, comp, 'utf8');
console.log('Company encoding done');