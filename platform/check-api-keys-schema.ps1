Set-StrictMode -Version Latest
$supabaseUrl = "https://yxqkbocjpsyyswdddkcf.supabase.co"
$serviceKey = (Get-Content "E:\thalium\platform\.env.local" | Select-String "SUPABASE_SERVICE_ROLE_KEY").ToString().Split("=",2)[1]
$headers = @{
  "apikey" = $serviceKey
  "Authorization" = "Bearer $serviceKey"
  "Content-Type" = "application/json"
}
# Get one row to see actual columns
$res = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/api_keys?limit=1" -Headers $headers -Method GET
Write-Host "Columns in api_keys:" ($res | ConvertTo-Json -Depth 3)

# Also check what migrations exist for api_keys