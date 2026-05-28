const fs = require('fs');

// Fix 1: docs server files have wrong import path
const fixes = [
  'E:/thalium/platform/src/routes/(marketing)/docs/quickstart/+page.server.ts',
  'E:/thalium/platform/src/routes/(marketing)/docs/concepts/+page.server.ts',
  'E:/thalium/platform/src/routes/(marketing)/docs/api/+page.server.ts',
  'E:/thalium/platform/src/routes/(marketing)/docs/changelog/+page.server.ts',
];
fixes.forEach(p => {
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace("from '/docs'", "from '$lib/docs'");
  fs.writeFileSync(p, c, 'utf8');
  console.log('Fixed import in:', p.split('/').pop());
});

// Fix 2: escape all apostrophes in industry string literals in product page
const productPath = 'E:/thalium/platform/src/routes/(marketing)/product/+page.svelte';
let prod = fs.readFileSync(productPath, 'utf8');

// Find the industries array and replace curly apostrophes and straight apostrophes
// inside single-quoted JS string values with escaped versions
// Strategy: replace the whole industries const block with backtick template literals
// First find the block boundaries
const startMarker = '  const industries = [';
const endMarker = '  ];';
const startIdx = prod.indexOf(startMarker);
// Find the matching end - the ]; that closes the industries array
let depth = 0;
let endIdx = -1;
for (let i = startIdx; i < prod.length; i++) {
  if (prod[i] === '[') depth++;
  if (prod[i] === ']') {
    depth--;
    if (depth === 0) { endIdx = i + 2; break; } // +2 for ];
  }
}
const industriesBlock = prod.slice(startIdx, endIdx);

// Replace all right single quotes (U+2019) and straight apostrophes within string values
// by converting single-quoted strings to use escaped apostrophes
const fixed = industriesBlock
  .replace(/\u2019/g, "\\'")  // curly apostrophe
  .replace(/([^\\])'/g, (match, before) => {
    // Only replace apostrophes that are mid-word (preceded by a letter)
    if (/[a-zA-Z]/.test(before)) return before + "\\'";
    return match;
  });

prod = prod.slice(0, startIdx) + fixed + prod.slice(endIdx);
fs.writeFileSync(productPath, prod, 'utf8');
console.log('Product page apostrophes fixed');
console.log('Sample check:', prod.includes("client\\'s") || prod.includes("Brain\\'s"));