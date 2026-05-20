Set-StrictMode -Version Latest

$ErrorActionPreference = "Stop"

$AppName = "thalium-instance-manager"
$ConfigFile = "E:\thalium\fly.instance-manager.toml"

$RequiredSecrets = @(
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

function Test-Secrets {
    foreach ($secret in $RequiredSecrets) {
        if (-not (Test-Path "env:$secret")) {
            Write-Host "Missing required secret: $secret"
            return $false
        }
    }
    return $true
}

function Deploy-App {
    try {
        if (-not (Test-Secrets)) {
            return 1
        }

        Write-Host "Deploying $AppName with config file $ConfigFile"

        fly deploy --app $AppName --config $ConfigFile

        if ($LASTEXITCODE -ne 0) {
            Write-Host "Deployment failed with exit code $LASTEXITCODE"
            return 1
        }

        Write-Host "Deployment successful"
        return 0
    } catch {
        Write-Host "Deployment failed: $_"
        return 1
    }
}

exit (Deploy-App)