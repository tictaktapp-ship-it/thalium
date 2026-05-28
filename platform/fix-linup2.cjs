const fs = require('fs');
const homePath = 'E:/thalium/platform/src/routes/(marketing)/+page.svelte';
let home = fs.readFileSync(homePath, 'utf8');

// Find the index of the pricing CTA div directly
const marker = '      <div style="text-align:center;margin-top:40px;">';
const idx = home.indexOf(marker);
console.log('Marker found at index:', idx);
if (idx > -1) {
  const linupLine = '      <p style="font-family:\'DM Mono\',monospace;font-size:11px;color:rgba(13,13,13,0.35);text-align:center;margin-top:32px;">Used in production by <a href="https://linup.io" style="color:#1A3AFF;text-decoration:none;">Linup.io</a> \u2014 powering ORIGIN, FORGE, and PULSE.</p>\r\n';
  home = home.slice(0, idx) + linupLine + home.slice(idx);
  fs.writeFileSync(homePath, home, 'utf8');
  console.log('Linup present:', home.includes('Linup'));
} else {
  // Show what is actually there around pricing
  const pricingIdx = home.indexOf('See full pricing');
  console.log('Surrounding chars (hex) before pricing div:');
  console.log(JSON.stringify(home.slice(pricingIdx - 120, pricingIdx)));
}