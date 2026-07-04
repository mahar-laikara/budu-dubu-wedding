$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")

try {
    $listener.Start()
    Write-Host "Server started successfully on http://localhost:8080/"
} catch {
    Write-Error "Failed to start server: $_"
    exit 1
}

$baseDir = "C:\Users\MADEEHA\.gemini\antigravity\scratch\premium-wedding-invitation"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $req = $context.Request
        $res = $context.Response
        
        $url = $req.Url.LocalPath
        if ($url -eq "/") {
            $url = "/index.html"
        }
        
        $filePath = Join-Path $baseDir $url
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            if ($filePath.EndsWith(".html")) {
                $res.ContentType = "text/html"
            } elseif ($filePath.EndsWith(".css")) {
                $res.ContentType = "text/css"
            } elseif ($filePath.EndsWith(".js")) {
                $res.ContentType = "text/javascript"
            } elseif ($filePath.EndsWith(".png")) {
                $res.ContentType = "image/png"
            }
            
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
        }
        $res.Close()
    } catch {
        # Catch connection resets or client aborts silently
    }
}
