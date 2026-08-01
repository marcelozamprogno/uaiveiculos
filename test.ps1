$body = @{
    name = "Marcio Silva"
    cpf = "14924671622"
    phone = "31999999999"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://uaiveiculos.vercel.app/api/create-pix" -Method POST -ContentType "application/json" -Body $body
$response | ConvertTo-Json -Depth 10
