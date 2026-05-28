const fs = require('fs');
const path = 'E:/thalium/platform/src/routes/(marketing)/+page.svelte';

// Read as latin1 to preserve raw bytes, then fix as string
let c = fs.readFileSync(path, 'latin1');

// Fix all mojibake sequences
c = c.replace(/\xc3\xa2\xc2\x80\xc2\x94/g, '\u2014'); // â€" -> —
c = c.replace(/\xc3\xaf\xc2\xbf\xc2\xbd/g, '\u2014'); // ï¿½ -> —
c = c.replace(/\xc3\xa2\xc2\x80\xc2\x98/g, '\u2018'); // â€˜ -> '
c = c.replace(/\xc3\xa2\xc2\x80\xc2\x99/g, '\u2019'); // â€™ -> '
c = c.replace(/\xc3\xa2\xc2\x80\xc2\x9c/g, '\u201c'); // â€œ -> "
c = c.replace(/\xc3\xa2\xc2\x80\xc2\x9d/g, '\u201d'); // â€ -> "
c = c.replace(/\xc3\xa2\xc2\x86\xc2\x92/g, '\u2192'); // â†' -> →

// Fix subhead - use the exact corrupted string
c = c.replace(
  'Persistent memory, structured reasoning, and governance \u2014 delivered via API.\n          Give your application the intelligence layer it was always missing.',
  'Stop rebuilding state management, orchestration, and audit infrastructure. One API call gives your application persistent memory, structured reasoning, and governance \u2014 permanently.'
);

// Fix pricing £ signs
c = c.replace("price:'\u201429/mo'", "price:'\u00a329/mo'");
c = c.replace("price:'\u2014199/mo'", "price:'\u00a3199/mo'");
c = c.replace("price:'\u2014599/mo'", "price:'\u00a3599/mo'");

// Write back as utf8
fs.writeFileSync(path, c, 'utf8');
console.log('Done');