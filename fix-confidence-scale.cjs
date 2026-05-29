const fs = require('fs');

// Fix lib/seeder.ts — find confidence values and divide by 100
const seederPath = 'E:/thalium/src/lib/seeder.ts';
let seeder = fs.readFileSync(seederPath, 'utf8');
// Replace confidence: 75 -> confidence: 0.75, confidence: 80 -> confidence: 0.80 etc
seeder = seeder.replace(/confidence:\s*(\d+)(?=[,\s}])/g, (match, val) => {
    const n = parseInt(val);
    if (n > 1) return `confidence: ${(n/100).toFixed(2)}`;
    return match;
});
fs.writeFileSync(seederPath, seeder, 'utf8');
console.log('Seeder fixed');

// Fix roles/librarian.ts — confidence: 75 -> confidence: 0.75
const libPath = 'E:/thalium/src/roles/librarian.ts';
let lib = fs.readFileSync(libPath, 'utf8');
lib = lib.replace(/confidence:\s*75/g, 'confidence: 0.75');
fs.writeFileSync(libPath, lib, 'utf8');
console.log('Librarian fixed');

// Fix schemas/ring.ts — update validation range to 0-1
const ringPath = 'E:/thalium/src/schemas/ring.ts';
let ring = fs.readFileSync(ringPath, 'utf8');
ring = ring.replace('confidence: z.number().min(0).max(100)', 'confidence: z.number().min(0).max(1)');
fs.writeFileSync(ringPath, ring, 'utf8');
console.log('Ring schema fixed — confidence now 0-1');

// Fix coverage_map schema too
const covPath = 'E:/thalium/src/schemas/ring.ts';
let cov = fs.readFileSync(covPath, 'utf8');
cov = cov.replace('avg_confidence: z.number().min(0).max(100)', 'avg_confidence: z.number().min(0).max(1)');
fs.writeFileSync(covPath, cov, 'utf8');
console.log('Coverage map schema fixed');