const fs = require('fs');
const path = 'E:/thalium/scripts/db/Invoke-SeedDemoBrain.ps1';
let c = fs.readFileSync(path, 'utf8');
c = c.replace(/\[int\]\(Get-Date - \$start\)\.TotalMilliseconds/g, '[int]([datetime]::Now - $start).TotalMilliseconds');
c = c.replace(/\[int\]\(Get-Date - \$startAll\)\.TotalMilliseconds/g, '[int]([datetime]::Now - $startAll).TotalMilliseconds');
c = c.replace(/\$start = Get-Date/g, '$start = [datetime]::Now');
c = c.replace(/\$startAll = Get-Date/g, '$startAll = [datetime]::Now');
fs.writeFileSync(path, c, 'utf8');
console.log('Done');