Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Load platform .env into process environment
Get-Content "E:\thalium\platform\.env" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
    }
}

Set-Location E:\thalium\platform
npx vite dev
