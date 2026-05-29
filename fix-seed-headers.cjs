const fs = require('fs');
const path = 'E:/thalium/scripts/db/Invoke-SeedDemoBrain.ps1';
let c = fs.readFileSync(path, 'utf8');

// Add InternalSecret parameter
c = c.replace(
  '    [Parameter()]\n    [string]$ApiUrl = $env:THALIUM_API_URL\n)',
  '    [Parameter()]\n    [string]$ApiUrl = $env:THALIUM_API_URL,\n\n    [Parameter()]\n    [string]$InternalSecret = $env:THALIUM_INTERNAL_SECRET\n)'
);

// Add internal secret to headers
c = c.replace(
  `$Headers = @{\n    'Authorization' = "Bearer $ApiKey"\n    'Content-Type'  = 'application/json'\n}`,
  `# Load internal secret from .env.local if not provided\nif ([string]::IsNullOrWhiteSpace($InternalSecret)) {\n    $envPath = Join-Path $PSScriptRoot '..\\..\\platform\\.env.local'\n    if (Test-Path $envPath) {\n        $line = Get-Content $envPath | Where-Object { $_ -match '^THALIUM_INTERNAL_SECRET=' }\n        if ($line) { $InternalSecret = ($line -split '=',2)[1].Trim() }\n    }\n}\n\n$Headers = @{\n    'Authorization'      = "Bearer $ApiKey"\n    'X-Thalium-Internal' = $InternalSecret\n    'Content-Type'       = 'application/json'\n}`
);

fs.writeFileSync(path, c, 'utf8');
console.log('Done');
console.log('Has X-Thalium-Internal:', c.includes('X-Thalium-Internal'));