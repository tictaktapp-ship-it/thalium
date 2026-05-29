const fs = require('fs');
const path = 'E:/thalium/scripts/db/Invoke-SeedDemoBrain.ps1';
let c = fs.readFileSync(path, 'utf8');

// Replace the input object structure with flat string structure
// Each entry has: session_id, domain, input: { type, content }
// Should be: session_id, domain, brain_id, input (string)

// Fix the body construction - replace nested input object with flat string
c = c.replace(
  `$body = $inv | ConvertTo-Json -Depth 5`,
  `$flat = @{
        session_id = $inv.session_id
        brain_id   = $BrainId
        domain     = $inv.domain
        input      = $inv.input_text
    }
    $body = $flat | ConvertTo-Json -Depth 3`
);

// Fix each input entry - replace input = @{ type content } with input_text = "..."
c = c.replace(/input\s*=\s*@\{\s*\n\s*type\s*=\s*'text'\s*\n\s*content\s*=\s*'([^']+)'\s*\n\s*\}/g, "input_text = '$1'");

fs.writeFileSync(path, c, 'utf8');
console.log('Done');
console.log('Has input_text:', c.includes('input_text'));
console.log('Has brain_id in flat:', c.includes('brain_id   = $BrainId'));