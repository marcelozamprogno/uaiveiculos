$body = @{
    data = @{
        cpf = "14924671622"
        name = "Comprador"
        phone = "31999999999"
    }
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://uaiveiculos.vercel.app/repasse/api/pix/create" -Method POST -ContentType "application/json" -Body $body
$response | ConvertTo-Json -Depth 10
