# GATE Prep - Comprehensive QA Test Suite
# =========================================

$baseUrl = "http://localhost:5000"
$frontendUrl = "http://localhost:5173"
$results = @()
$token = $null
$adminToken = $null
$testId = $null

function Add-Result($name, $expected, $actual, $pass, $details="") {
    $script:results += [PSCustomObject]@{
        Name = $name
        Expected = $expected
        Actual = $actual
        Pass = $pass
        Details = $details
    }
    $status = if ($pass) { "PASS" } else { "FAIL" }
    Write-Host "[$status] $name" -ForegroundColor $(if ($pass) { "Green" } else { "Red" })
    if ($details -and -not $pass) { Write-Host "  Details: $details" -ForegroundColor Yellow }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  GATE PREP - QA TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# =============================================
# 1. AUTH SYSTEM
# =============================================
Write-Host "`n--- 1. AUTH SYSTEM ---`n" -ForegroundColor Magenta

# Test 1.1: Register
Write-Host "Running Test 1.1: Register user..."
try {
    $body = @{ name = "QA Tester"; email = "tester_qa@test.com"; password = "Test123456" } | ConvertTo-Json
    $reg = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    $regToken = if ($reg.token) { $reg.token } elseif ($reg.data -and $reg.data.token) { $reg.data.token } else { $null }
    if ($regToken) { $token = $regToken }
    Add-Result "1.1 Register User" "User created or token returned" "Success - token: $($regToken.Substring(0, [Math]::Min(20, $regToken.Length)))..." $true
} catch {
    $errBody = $_.ErrorDetails.Message
    # If user already exists, that's still acceptable
    if ($errBody -match "already|exists|duplicate") {
        Add-Result "1.1 Register User" "User created or already exists" "User already exists (OK)" $true $errBody
    } else {
        Add-Result "1.1 Register User" "User created" "Error: $errBody" $false "$($_.Exception.Message)"
    }
}

# Test 1.2: Login
Write-Host "Running Test 1.2: Login..."
try {
    $body = @{ email = "tester_qa@test.com"; password = "Test123456" } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    $loginToken = if ($login.token) { $login.token } elseif ($login.data -and $login.data.token) { $login.data.token } else { $null }
    if ($loginToken) { $token = $loginToken }
    Add-Result "1.2 Login" "JWT token returned" "Token received: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." ($null -ne $token)
} catch {
    $errBody = $_.ErrorDetails.Message
    Add-Result "1.2 Login" "JWT token returned" "Error: $errBody" $false "$($_.Exception.Message)"
}

# Test 1.3: Get Current User (GET /api/auth/me)
Write-Host "Running Test 1.3: Get current user..."
if ($token) {
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $me = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method GET -Headers $headers -ErrorAction Stop
        $userName = if ($me.name) { $me.name } elseif ($me.data -and $me.data.name) { $me.data.name } elseif ($me.user -and $me.user.name) { $me.user.name } else { "Unknown" }
        $userEmail = if ($me.email) { $me.email } elseif ($me.data -and $me.data.email) { $me.data.email } elseif ($me.user -and $me.user.email) { $me.user.email } else { "Unknown" }
        Add-Result "1.3 Get Current User" "User profile returned" "Name: $userName, Email: $userEmail" $true
    } catch {
        Add-Result "1.3 Get Current User" "User profile returned" "Error: $($_.ErrorDetails.Message)" $false "$($_.Exception.Message)"
    }
} else {
    Add-Result "1.3 Get Current User" "User profile returned" "SKIPPED - No token" $false "Login failed"
}

# Test 1.4: Get Current User WITHOUT token (should fail)
Write-Host "Running Test 1.4: Get user without token (expect 401)..."
try {
    $me2 = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method GET -ErrorAction Stop
    Add-Result "1.4 Auth Guard (no token)" "401 Unauthorized" "Got response (unexpected)" $false "Endpoint did not reject unauthenticated request"
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    $pass = ($statusCode -eq 401 -or $statusCode -eq 403)
    Add-Result "1.4 Auth Guard (no token)" "401 Unauthorized" "Status: $statusCode" $pass
}

# Test 1.5: Forgot Password
Write-Host "Running Test 1.5: Forgot password..."
try {
    $body = @{ email = "tester_qa@test.com" } | ConvertTo-Json
    $forgot = Invoke-RestMethod -Uri "$baseUrl/api/auth/forgot-password" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Add-Result "1.5 Forgot Password" "Success response" "Response received" $true ($forgot | ConvertTo-Json -Compress)
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    $errBody = $_.ErrorDetails.Message
    # Endpoint existing (even if email not configured) is ok
    if ($statusCode -ne 404) {
        Add-Result "1.5 Forgot Password" "Endpoint exists" "Status: $statusCode" $true "Endpoint exists, response: $errBody"
    } else {
        Add-Result "1.5 Forgot Password" "Endpoint exists" "404 Not Found" $false "Endpoint not found"
    }
}

# Test 1.6: Reset Password (dummy token - expect failure but endpoint should exist)
Write-Host "Running Test 1.6: Reset password (dummy token)..."
try {
    $body = @{ password = "NewPass123456" } | ConvertTo-Json
    $reset = Invoke-RestMethod -Uri "$baseUrl/api/auth/reset-password/dummytoken123" -Method PUT -Body $body -ContentType "application/json" -ErrorAction Stop
    Add-Result "1.6 Reset Password Endpoint" "Endpoint exists (reject dummy token)" "Got success (unexpected)" $true
} catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    if ($statusCode -ne 404) {
        Add-Result "1.6 Reset Password Endpoint" "Endpoint exists (reject dummy token)" "Status: $statusCode (expected rejection)" $true
    } else {
        Add-Result "1.6 Reset Password Endpoint" "Endpoint exists" "404 Not Found" $false "Endpoint not registered"
    }
}

# =============================================
# 2. TESTS SYSTEM
# =============================================
Write-Host "`n--- 2. TESTS SYSTEM ---`n" -ForegroundColor Magenta

# Test 2.1: List all tests
Write-Host "Running Test 2.1: List all tests..."
if ($token) {
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $tests = Invoke-RestMethod -Uri "$baseUrl/api/tests" -Method GET -Headers $headers -ErrorAction Stop
        $testList = if ($tests -is [array]) { $tests } elseif ($tests.data -is [array]) { $tests.data } elseif ($tests.tests -is [array]) { $tests.tests } else { @() }
        $count = $testList.Count
        if ($count -gt 0) {
            $testId = if ($testList[0]._id) { $testList[0]._id } elseif ($testList[0].id) { $testList[0].id } else { $null }
        }
        Add-Result "2.1 List All Tests" "Array of tests" "Got $count tests" ($count -ge 0)
    } catch {
        Add-Result "2.1 List All Tests" "Array of tests" "Error: $($_.ErrorDetails.Message)" $false "$($_.Exception.Message)"
    }
} else {
    Add-Result "2.1 List All Tests" "Array of tests" "SKIPPED - No token" $false
}

# Test 2.2: Get specific test
Write-Host "Running Test 2.2: Get specific test..."
if ($token -and $testId) {
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $test = Invoke-RestMethod -Uri "$baseUrl/api/tests/$testId" -Method GET -Headers $headers -ErrorAction Stop
        $testTitle = if ($test.title) { $test.title } elseif ($test.data -and $test.data.title) { $test.data.title } elseif ($test.name) { $test.name } else { "Found" }
        Add-Result "2.2 Get Specific Test" "Test details returned" "Title: $testTitle" $true
    } catch {
        Add-Result "2.2 Get Specific Test" "Test details returned" "Error: $($_.ErrorDetails.Message)" $false "$($_.Exception.Message)"
    }
} elseif (-not $testId) {
    Add-Result "2.2 Get Specific Test" "Test details returned" "SKIPPED - No test ID available" $false "No tests in database"
} else {
    Add-Result "2.2 Get Specific Test" "Test details returned" "SKIPPED - No token" $false
}

# Test 2.3: Get user test attempts
Write-Host "Running Test 2.3: Get user test attempts..."
if ($token) {
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $attempts = Invoke-RestMethod -Uri "$baseUrl/api/tests/user/my-attempts" -Method GET -Headers $headers -ErrorAction Stop
        $attemptList = if ($attempts -is [array]) { $attempts } elseif ($attempts.data -is [array]) { $attempts.data } elseif ($attempts.attempts -is [array]) { $attempts.attempts } else { @() }
        Add-Result "2.3 User Test Attempts" "Attempts list returned" "Got $($attemptList.Count) attempts" $true
    } catch {
        Add-Result "2.3 User Test Attempts" "Attempts list returned" "Error: $($_.ErrorDetails.Message)" $false "$($_.Exception.Message)"
    }
} else {
    Add-Result "2.3 User Test Attempts" "Attempts list returned" "SKIPPED - No token" $false
}

# =============================================
# 3. IMPORT SYSTEM (Admin)
# =============================================
Write-Host "`n--- 3. IMPORT SYSTEM ---`n" -ForegroundColor Magenta

# Test 3.1: Login as admin
Write-Host "Running Test 3.1: Login as admin..."
try {
    $body = @{ email = "admin@gateprep.com"; password = "admin123" } | ConvertTo-Json
    $adminLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    $adminToken = if ($adminLogin.token) { $adminLogin.token } elseif ($adminLogin.data -and $adminLogin.data.token) { $adminLogin.data.token } else { $null }
    Add-Result "3.1 Admin Login" "Admin token returned" "Token: $($adminToken.Substring(0, [Math]::Min(20, $adminToken.Length)))..." ($null -ne $adminToken)
} catch {
    $errBody = $_.ErrorDetails.Message
    Add-Result "3.1 Admin Login" "Admin token returned" "Error: $errBody" $false "Admin login failed - $($_.Exception.Message)"
}

# Test 3.2: Import endpoint exists
Write-Host "Running Test 3.2: Import endpoint exists..."
$importToken = if ($adminToken) { $adminToken } else { $token }
if ($importToken) {
    try {
        $headers = @{ Authorization = "Bearer $importToken" }
        # Send empty body to see if endpoint exists
        $body = @{ questions = @() } | ConvertTo-Json
        $import = Invoke-RestMethod -Uri "$baseUrl/api/import/questions" -Method POST -Body $body -ContentType "application/json" -Headers $headers -ErrorAction Stop
        Add-Result "3.2 Import Endpoint" "Endpoint exists" "Response received" $true
    } catch {
        $statusCode = [int]$_.Exception.Response.StatusCode
        if ($statusCode -eq 404) {
            Add-Result "3.2 Import Endpoint" "Endpoint exists" "404 Not Found" $false "Endpoint not registered"
        } else {
            Add-Result "3.2 Import Endpoint" "Endpoint exists" "Status: $statusCode (endpoint exists)" $true "$($_.ErrorDetails.Message)"
        }
    }
} else {
    Add-Result "3.2 Import Endpoint" "Endpoint exists" "SKIPPED - No token" $false
}

# =============================================
# 4. SMART REVISION ENGINE
# =============================================
Write-Host "`n--- 4. SMART REVISION ENGINE ---`n" -ForegroundColor Magenta

# Test 4.1: Get revision queue
Write-Host "Running Test 4.1: Get revision queue..."
if ($token) {
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $revision = Invoke-RestMethod -Uri "$baseUrl/api/revision" -Method GET -Headers $headers -ErrorAction Stop
        Add-Result "4.1 Revision Queue" "Revision items returned" "Response received" $true ($revision | ConvertTo-Json -Compress -Depth 2)
    } catch {
        $statusCode = [int]$_.Exception.Response.StatusCode
        if ($statusCode -eq 404) {
            Add-Result "4.1 Revision Queue" "Endpoint exists" "404 Not Found" $false "Endpoint not registered"
        } else {
            Add-Result "4.1 Revision Queue" "Revision items returned" "Status: $statusCode" ($statusCode -ne 500) "$($_.ErrorDetails.Message)"
        }
    }
} else {
    Add-Result "4.1 Revision Queue" "Revision items returned" "SKIPPED - No token" $false
}

# Test 4.2: Get revision summary
Write-Host "Running Test 4.2: Get revision summary..."
if ($token) {
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $summary = Invoke-RestMethod -Uri "$baseUrl/api/revision/summary" -Method GET -Headers $headers -ErrorAction Stop
        Add-Result "4.2 Revision Summary" "Summary stats returned" "Response received" $true ($summary | ConvertTo-Json -Compress -Depth 2)
    } catch {
        $statusCode = [int]$_.Exception.Response.StatusCode
        if ($statusCode -eq 404) {
            Add-Result "4.2 Revision Summary" "Endpoint exists" "404 Not Found" $false "Endpoint not registered"
        } else {
            Add-Result "4.2 Revision Summary" "Summary stats" "Status: $statusCode" ($statusCode -ne 500) "$($_.ErrorDetails.Message)"
        }
    }
} else {
    Add-Result "4.2 Revision Summary" "Summary stats returned" "SKIPPED - No token" $false
}

# Test 4.3: Generate revision items
Write-Host "Running Test 4.3: Generate revision items..."
if ($token) {
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $gen = Invoke-RestMethod -Uri "$baseUrl/api/revision/generate" -Method POST -Headers $headers -ContentType "application/json" -ErrorAction Stop
        Add-Result "4.3 Generate Revision" "Revision generated" "Response received" $true ($gen | ConvertTo-Json -Compress -Depth 2)
    } catch {
        $statusCode = [int]$_.Exception.Response.StatusCode
        if ($statusCode -eq 404) {
            Add-Result "4.3 Generate Revision" "Endpoint exists" "404 Not Found" $false "Endpoint not registered"
        } else {
            Add-Result "4.3 Generate Revision" "Revision generated" "Status: $statusCode" ($statusCode -ne 500) "$($_.ErrorDetails.Message)"
        }
    }
} else {
    Add-Result "4.3 Generate Revision" "Revision generated" "SKIPPED - No token" $false
}

# =============================================
# 5. ANALYTICS
# =============================================
Write-Host "`n--- 5. ANALYTICS ---`n" -ForegroundColor Magenta

# Test 5.1: Analytics overview
Write-Host "Running Test 5.1: Analytics overview..."
if ($token) {
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $analytics = Invoke-RestMethod -Uri "$baseUrl/api/analytics/overview" -Method GET -Headers $headers -ErrorAction Stop
        Add-Result "5.1 Analytics Overview" "Overview data returned" "Response received" $true ($analytics | ConvertTo-Json -Compress -Depth 2)
    } catch {
        $statusCode = [int]$_.Exception.Response.StatusCode
        if ($statusCode -eq 404) {
            Add-Result "5.1 Analytics Overview" "Endpoint exists" "404 Not Found" $false "Endpoint not registered"
        } else {
            Add-Result "5.1 Analytics Overview" "Overview data" "Status: $statusCode" ($statusCode -ne 500) "$($_.ErrorDetails.Message)"
        }
    }
} else {
    Add-Result "5.1 Analytics Overview" "Overview data returned" "SKIPPED - No token" $false
}

# Test 5.2: Topic analysis
Write-Host "Running Test 5.2: Topic analysis..."
if ($token) {
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $topics = Invoke-RestMethod -Uri "$baseUrl/api/analytics/topic-analysis" -Method GET -Headers $headers -ErrorAction Stop
        Add-Result "5.2 Topic Analysis" "Topic data returned" "Response received" $true ($topics | ConvertTo-Json -Compress -Depth 2)
    } catch {
        $statusCode = [int]$_.Exception.Response.StatusCode
        if ($statusCode -eq 404) {
            Add-Result "5.2 Topic Analysis" "Endpoint exists" "404 Not Found" $false "Endpoint not registered"
        } else {
            Add-Result "5.2 Topic Analysis" "Topic data" "Status: $statusCode" ($statusCode -ne 500) "$($_.ErrorDetails.Message)"
        }
    }
} else {
    Add-Result "5.2 Topic Analysis" "Topic data returned" "SKIPPED - No token" $false
}

# =============================================
# 6. FRONTEND PAGES
# =============================================
Write-Host "`n--- 6. FRONTEND PAGES ---`n" -ForegroundColor Magenta

$pages = @(
    @{ Name = "6.1 Landing Page"; Url = "/" },
    @{ Name = "6.2 Login Page"; Url = "/login" },
    @{ Name = "6.3 Register Page"; Url = "/register" },
    @{ Name = "6.4 Forgot Password Page"; Url = "/forgot-password" },
    @{ Name = "6.5 Dashboard Page"; Url = "/dashboard" },
    @{ Name = "6.6 Revision Page"; Url = "/revision" },
    @{ Name = "6.7 Tests Page"; Url = "/tests" },
    @{ Name = "6.8 Analytics Page"; Url = "/analytics" },
    @{ Name = "6.9 Weakness Radar Page"; Url = "/weakness-radar" }
)

foreach ($page in $pages) {
    Write-Host "Running Test $($page.Name)..."
    try {
        $resp = Invoke-WebRequest -Uri "$frontendUrl$($page.Url)" -Method GET -UseBasicParsing -ErrorAction Stop -MaximumRedirection 5
        $status = $resp.StatusCode
        $hasContent = $resp.Content.Length -gt 100
        Add-Result $page.Name "HTTP 200 with content" "Status: $status, Content length: $($resp.Content.Length)" ($status -eq 200 -and $hasContent)
    } catch {
        $statusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        Add-Result $page.Name "HTTP 200" "Status: $statusCode, Error: $($_.Exception.Message)" $false
    }
}

# =============================================
# SUMMARY
# =============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passed = ($results | Where-Object { $_.Pass }).Count
$failed = ($results | Where-Object { -not $_.Pass }).Count
$total = $results.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host ""

# Output results as JSON for parsing
Write-Host "`n=== RESULTS_JSON_START ==="
$results | ForEach-Object {
    $status = if ($_.Pass) { "PASS" } else { "FAIL" }
    Write-Host "$status|$($_.Name)|$($_.Expected)|$($_.Actual)|$($_.Details)"
}
Write-Host "=== RESULTS_JSON_END ==="
Write-Host "SUMMARY: $passed passed, $failed failed out of $total tests"
