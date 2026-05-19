Set-StrictMode -Version Latest

# Invoke-Migration001.ps1
# Description: Runs the 001_create_institutional_ring.sql migration against the Supabase database.
# Created: 2026-05-19
# Reversible: no

$ErrorActionPreference = "Stop"

$supabaseUrl = $env:SUPABASE_URL
$supabaseServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl) {
    throw "Environment variable SUPABASE_URL is not set."
}
if (-not $supabaseServiceRoleKey) {
    throw "Environment variable SUPABASE_SERVICE_ROLE_KEY is not set."
}

# Parse SUPABASE_URL to extract the host and assume standard PostgreSQL connection details.
# Example SUPABASE_URL: https://<project-ref>.supabase.co
# We will assume user 'postgres', database 'postgres', and port '5432' for psql.

$uri = New-Object System.Uri($supabaseUrl)
$pgHost = $uri.Host
$pgPort = 5432 # Standard PostgreSQL port
$pgUser = "postgres" # Standard Supabase PostgreSQL user
$pgDatabase = "postgres" # Standard Supabase default database

Write-Host "Parsed components:"
Write-Host "  Host: $pgHost"
Write-Host "  Port: $pgPort"
Write-Host "  User: $pgUser"
Write-Host "  Database: $pgDatabase"

# Construct psql command with SSL mode
$psqlCommand = "psql -h $($pgHost) -p $($pgPort) -U $($pgUser) -d $($pgDatabase) -f db/migrations/001_create_institutional_ring.sql -o "" -q -v ON_ERROR_STOP=1 `
    `"sslmode=require"`"




# Set the password securely via environment variable for psql
$env:PGPASSWORD = $supabaseServiceRoleKey

try {
    # Execute psql command
    Invoke-Expression $psqlCommand
    Write-Host "Migration 001 applied successfully."
}
catch {
    Write-Error "Failed to apply Migration 001: $_"
    throw
}
finally {
    # Clear the password from environment variables
    Remove-Item Env:PGPASSWORD
}
