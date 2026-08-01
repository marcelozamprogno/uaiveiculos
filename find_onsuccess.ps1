$text = Get-Content 'repasse\js\index-Cav2mZA_.js' -Raw
$index = 0
while (($index = $text.IndexOf('onSuccess', $index)) -ne -1) {
    Write-Output "At index $index"
    $text.Substring([Math]::Max(0, $index - 50), 100)
    $index += 9
}
