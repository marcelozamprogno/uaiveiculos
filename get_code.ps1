$text = Get-Content 'repasse\js\index-Cav2mZA_.js' -Raw
$matches = [regex]::Matches($text, 'waitForFbq')
foreach ($m in $matches) {
    Write-Output "Found waitForFbq at $($m.Index)"
    Write-Output $text.Substring([Math]::Max(0, $m.Index - 100), 200)
    Write-Output "---"
}
