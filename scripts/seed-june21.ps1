# Smart Canteen - Seed Script for June 21, 2026
# Usage: .\scripts\seed-june21.ps1

$API = "http://178.128.100.1:8080"

# ====== LOGIN ======
$loginBody = @{ email = "manager.sc@gmail.com"; password = "SmartCanteen_01" } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "$API/api/Auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.value.accessToken
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
Write-Host "✅ Login successful"

# ====== FETCH EXISTING CATEGORIES ======
$catRes = Invoke-RestMethod -Uri "$API/api/Categories?pageSize=100" -Method Get -Headers $headers
$categories = $catRes.value.items | Group-Object name | ForEach-Object { $_.Group[0] }
$catMap = @{}
$categories | ForEach-Object { $catMap[$_.name] = $_.id }
Write-Host "✅ Fetched categories: $($catMap.Count) unique names"

# ====== FETCH EXISTING DISHES ======
$dishRes = Invoke-RestMethod -Uri "$API/api/Dishes?pageSize=100" -Method Get -Headers $headers
$dishes = $dishRes.value.items
Write-Host "✅ Fetched dishes: $($dishes.Count)"

# ====== CREATE SESSION "Suất Sáng 21/6" ======
$sessionBody = @{
    name = "Suất Sáng 21/6"
    description = "Suất ăn sáng ngày 21/6/2026 - Cơm văn phòng đầy đủ dinh dưỡng"
    availableFrom = "2026-06-21T00:00:00+07:00"
    availableTo = "2026-06-21T23:59:59+07:00"
    availableForOrder = "2026-06-21T23:59:59+07:00"
    finalizationDeadline = "2026-06-21T23:59:59+07:00"
    autoFinalizePolicy = 0
    mealTemplates = @(
        @{
            name = "Combo Sáng Đầy Đủ"
            settings = @(
                @{ categoryId = $catMap["Tinh Bột"]; minQuantity = 1; maxQuantity = 2; isRequired = $true }
                @{ categoryId = $catMap["Chất Đạm"]; minQuantity = 1; maxQuantity = 2; isRequired = $true }
                @{ categoryId = $catMap["Chất Xơ & Vitamin"]; minQuantity = 0; maxQuantity = 2; isRequired = $false }
                @{ categoryId = $catMap["Canh & Nước"]; minQuantity = 0; maxQuantity = 1; isRequired = $false }
            )
        }
    )
    dishes = @(
        # Tinh Bot dishes
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Tinh Bột"] -and $_.name -eq "Bún tươi" } | Select-Object -First 1).id }
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Tinh Bột"] -and $_.name -eq "Com Suon Nuong" } | Select-Object -First 1).id }
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Tinh Bột"] -and $_.name -eq "Com trắng gạo dẻo" } | Select-Object -First 1).id }
        # Chat Dam dishes
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Chất Đạm"] -and $_.name -eq "Cá ba sa kho tộ" } | Select-Object -First 1).id }
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Chất Đạm"] -and $_.name -eq "Ức gà áp chảo" } | Select-Object -First 1).id }
        # Chat Xo dishes
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Chất Xơ & Vitamin"] } | Select-Object -First 1).id }
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Canh & Nước"] } | Select-Object -First 1).id }
    )
} | ConvertTo-Json -Depth 10

try {
    $sessionRes = Invoke-RestMethod -Uri "$API/api/Sessions" -Method Post -Body $sessionBody -ContentType "application/json" -Headers $headers
    Write-Host "✅ Created session: Suất Sáng 21/6"
    Write-Host "   Session ID: $($sessionRes.value.id)"
} catch {
    $err = $_.Exception.Response
    $reader = New-Object System.IO.StreamReader($err.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Host "❌ Failed to create session: $body"
    exit 1
}

# ====== CREATE SESSION "Suất Trưa 21/6" ======
$sessionBody2 = @{
    name = "Suất Trưa 21/6"
    description = "Suất ăn trưa ngày 21/6/2026 - Cơm văn phòng"
    availableFrom = "2026-06-21T00:00:00+07:00"
    availableTo = "2026-06-21T23:59:59+07:00"
    availableForOrder = "2026-06-21T23:59:59+07:00"
    finalizationDeadline = "2026-06-21T23:59:59+07:00"
    autoFinalizePolicy = 0
    mealTemplates = @(
        @{
            name = "Combo Trưa Cơ Bản"
            settings = @(
                @{ categoryId = $catMap["Tinh Bột"]; minQuantity = 1; maxQuantity = 1; isRequired = $true }
                @{ categoryId = $catMap["Chất Đạm"]; minQuantity = 1; maxQuantity = 2; isRequired = $true }
                @{ categoryId = $catMap["Chất Xơ & Vitamin"]; minQuantity = 1; maxQuantity = 1; isRequired = $true }
                @{ categoryId = $catMap["Canh & Nước"]; minQuantity = 0; maxQuantity = 1; isRequired = $false }
            )
        }
    )
    dishes = @(
        # Tinh Bot
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Tinh Bột"] -and $_.name -eq "Bún tươi" } | Select-Object -First 1).id }
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Tinh Bột"] -and $_.name -eq "Com Suon Nuong" } | Select-Object -First 1).id }
        # Chat Dam
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Chất Đạm"] -and $_.name -eq "Cá ba sa kho tộ" } | Select-Object -First 1).id }
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Chất Đạm"] -and $_.name -eq "Ức gà áp chảo" } | Select-Object -First 1).id }
        # Chat Xo
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Chất Xơ & Vitamin"] } | Select-Object -First 1).id }
        # Canh
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Canh & Nước"] } | Select-Object -First 1).id }
    )
} | ConvertTo-Json -Depth 10

try {
    $sessionRes2 = Invoke-RestMethod -Uri "$API/api/Sessions" -Method Post -Body $sessionBody2 -ContentType "application/json" -Headers $headers
    Write-Host "✅ Created session: Suất Trưa 21/6"
    Write-Host "   Session ID: $($sessionRes2.value.id)"
} catch {
    $err = $_.Exception.Response
    $reader = New-Object System.IO.StreamReader($err.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Host "❌ Failed to create session: $body"
    exit 1
}

# ====== CREATE SESSION "Suất Tối 21/6" ======
$sessionBody3 = @{
    name = "Suất Tối 21/6"
    description = "Suất ăn tối ngày 21/6/2026"
    availableFrom = "2026-06-21T00:00:00+07:00"
    availableTo = "2026-06-21T23:59:59+07:00"
    availableForOrder = "2026-06-21T23:59:59+07:00"
    finalizationDeadline = "2026-06-21T23:59:59+07:00"
    autoFinalizePolicy = 0
    mealTemplates = @(
        @{
            name = "Combo Tối Nhẹ"
            settings = @(
                @{ categoryId = $catMap["Món Nước"]; minQuantity = 0; maxQuantity = 1; isRequired = $false }
                @{ categoryId = $catMap["Chất Đạm"]; minQuantity = 0; maxQuantity = 2; isRequired = $false }
                @{ categoryId = $catMap["Đồ Uống"]; minQuantity = 0; maxQuantity = 1; isRequired = $false }
            )
        }
    )
    dishes = @(
        # Mon Nuoc
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Món Nước"] -and $_.name -eq "Phở Bò Tái" } | Select-Object -First 1).id }
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Món Nước"] -and $_.name -eq "Bún Bò Huế" } | Select-Object -First 1).id }
        # Chat Dam
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Chất Đạm"] -and $_.name -eq "Cá ba sa kho tộ" } | Select-Object -First 1).id }
        # Do Uong
        @{ dishId = ($dishes | Where-Object { $_.categoryId -eq $catMap["Đồ Uống"] -and $_.name -eq "Trà Đá" } | Select-Object -First 1).id }
    )
} | ConvertTo-Json -Depth 10

try {
    $sessionRes3 = Invoke-RestMethod -Uri "$API/api/Sessions" -Method Post -Body $sessionBody3 -ContentType "application/json" -Headers $headers
    Write-Host "✅ Created session: Suất Tối 21/6"
    Write-Host "   Session ID: $($sessionRes3.value.id)"
} catch {
    $err = $_.Exception.Response
    $reader = New-Object System.IO.StreamReader($err.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Host "❌ Failed to create session: $body"
    exit 1
}

Write-Host ""
Write-Host "====================================="
Write-Host "🎉 SEED COMPLETE!"
Write-Host "====================================="
Write-Host "Created 3 sessions for June 21, 2026:"
Write-Host "1. Suất Sáng 21/6"
Write-Host "2. Suất Trưa 21/6"
Write-Host "3. Suất Tối 21/6"
Write-Host ""
Write-Host "👉 Restart your app and navigate to the session page"
Write-Host "👉 You should see 3 sessions for today (June 21)"
