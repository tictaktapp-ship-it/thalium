Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$supabaseUrl = "https://yxqkbocjpsyyswdddkcf.supabase.co"
$serviceKey = (Get-Content "E:\thalium\platform\.env.local" | Select-String "SUPABASE_SERVICE_ROLE_KEY").ToString().Split("=",2)[1]
$brainId = "a8cc0cf2-bb6f-4656-b082-b314f6011360"

$headers = @{
  "apikey" = $serviceKey
  "Authorization" = "Bearer $serviceKey"
  "Content-Type" = "application/json"
  "Prefer" = "return=representation"
}

# Check table columns
$schemaRes = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/api_keys?limit=0" -Headers $headers -Method GET
Write-Host "Schema check passed"

# Try a test insert
$body = @{
  brain_id = $brainId
  name = "debug-test"
  key_prefix = "thal_debug"
  key_hash = "aabbccdd" * 8
  scope = "invocation-only"
} | ConvertTo-Json

try {
  $res = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/api_keys" -Headers $headers -Method POST -Body $body
  Write-Host "Insert succeeded:" ($res | ConvertTo-Json)
} catch {
  Write-Host "Insert failed:" $_.Exception.Message
  Write-Host "Response:" $_.ErrorDetails.Message
}