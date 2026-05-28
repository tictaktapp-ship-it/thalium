const fs = require('fs');
const path = 'E:/thalium/platform/src/routes/(marketing)/+page.svelte';
let c = fs.readFileSync(path, 'utf8');
// C3A2 C280 C294 is the mojibake sequence for em dash
const bad = '\u00c3\u00a2\u00c2\u0080\u00c2\u0094';
c = c.replace(new RegExp(bad, 'g'), '\u2014');
fs.writeFileSync(path, c, 'utf8');
console.log('Done');
console.log(c.match(/tier .{1,5} full/));