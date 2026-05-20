param (
    [string]$Environment = "staging",
    [switch]$DryRun
)

Set-StrictMode -Version Latest

$requiredEnvVars = @(
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "REDIS_SHARD_A_URL",
    "REDIS_SHARD_A_TOKEN",
    "REDIS_SHARD_B_URL",
    "REDIS_SHARD_B_TOKEN",
    "REDIS_SHARD_C_URL",
    "REDIS_SHARD_C_TOKEN",
    "OPENROUTER_API_KEY",
    "X_THALIUM_INTERNAL"
)

foreach ($envVar in $requiredEnvVars) {
    if (-not (Test-Path "env:$envVar")) {
        Write-Error "Missing required environment variable: $envVar"
        exit 1
    }
}

if (-not $DryRun) {
    try {
        $secrets = @{
            SUPABASE_URL = $env:SUPABASE_URL
            SUPABASE_SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY
            REDIS_SHARD_A_URL = $env:REDIS_SHARD_A_URL
            REDIS_SHARD_A_TOKEN = $env:REDIS_SHARD_A_TOKEN
            REDIS_SHARD_B_URL = $env:REDIS_SHARD_B_URL
            REDIS_SHARD_B_TOKEN = $env:REDIS_SHARD_B_TOKEN
            REDIS_SHARD_C_URL = $env:REDIS_SHARD_C_URL
            REDIS_SHARD_C_TOKEN = $env:REDIS_SHARD_C_TOKEN
            OPENROUTER_API_KEY = $env:OPENROUTER_API_KEY
            X_THALIUM_INTERNAL = $env:X_THALIUM_INTERNAL
        }

        foreach ($key in $secrets.Keys) {
            flyctl secrets set "$key=$($secrets[$key])" --app thalium-chain-executor
        }

        flyctl deploy --app thalium-chain-executor --config fly.chain-executor.toml

        Write-Host "Chain Executor deployed successfully to $Environment environment."
        exit 0
    } catch {
        Write-Error "Failed to deploy Chain Executor: $_"
        exit 1
    }
} else {
    Write-Host "Dry run completed successfully. All required environment variables are present."
    exit 0
}param (
    [string]$Environment = "staging",
    [switch]$DryRun
)

Set-StrictMode -Version Latest

$requiredEnvVars = @(
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "REDIS_SHARD_A_URL",
    "REDIS_SHARD_A_TOKEN",
    "REDIS_SHARD_B_URL",
    "REDIS_SHARD_B_TOKEN",
    "REDIS_SHARD_C_URL",
    "REDIS_SHARD_C_TOKEN",
    "OPENROUTER_API_KEY",
    "X_THALIUM_INTERNAL"
)

foreach ($envVar in $requiredEnvVars) {
    if (-not (Test-Path "env:$envVar")) {
        Write-Error "Missing required environment variable: $envVar"
        exit 1
    }
}

if (-not $DryRun) {
    try {
        $secrets = @{
            SUPABASE_URL = $env:SUPABASE_URL
            SUPABASE_SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY
            REDIS_SHARD_A_URL = $env:REDIS_SHARD_A_URL
            REDIS_SHARD_A_TOKEN = $env:REDIS_SHARD_A_TOKEN
            REDIS_SHARD_B_URL = $env:REDIS_SHARD_B_URL
            REDIS_SHARD_B_TOKEN = $env:REDIS_SHARD_B_TOKEN
            REDIS_SHARD_C_URL = $env:REDIS_SHARD_C_URL
            REDIS_SHARD_C_TOKEN = $env:REDIS_SHARD_C_TOKEN
            OPENROUTER_API_KEY = $env:OPENROUTER_API_KEY
            X_THALIUM_INTERNAL = $env:X_THALIUM_INTERNAL
        }

        foreach ($key in $secrets.Keys) {
            flyctl secrets set "$key=$($secrets[$key])" --app thalium-instance-manager
        }

        flyctl deploy --app thalium-instance-manager --config fly.instance-manager.toml

        Write-Host "Instance Manager deployed successfully to $Environment environment."
        exit 0
    } catch {
        Write-Error "Failed to deploy Instance Manager: $_"
        exit 1
    }
} else {
    Write-Host "Dry run completed successfully. All required environment variables are present."
    exit 0
}