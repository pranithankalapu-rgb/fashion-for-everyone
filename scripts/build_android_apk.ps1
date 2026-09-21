<#
.SYNOPSIS
    Builds the local release APK for Fashion for Everyone Android application.
.DESCRIPTION
    Sets up required Android SDK and JDK paths, creates a temporary short NTFS directory junction
    to prevent Windows MAX_PATH (260-character limit) errors during native C++/CMake compilation,
    and runs Gradle assembleRelease.
#>

param(
    [string]$Architecture = "arm64-v8a"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$mobileDir = "$repoRoot\mobile"
$junction = "C:\fe"

# Discover SDK
$sdk = $env:ANDROID_HOME
if (-not $sdk -or -not (Test-Path $sdk)) {
    $sdk = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
}
if (-not (Test-Path $sdk)) {
    Write-Error "Android SDK not found at $sdk. Please set ANDROID_HOME."
    exit 1
}

# Discover JDK
$jdk = $env:JAVA_HOME
if (-not $jdk -or -not (Test-Path $jdk)) {
    $jdkCandidates = @(
        "C:\Users\$env:USERNAME\AppData\Local\Programs\Microsoft\jdk-17.0.10.7-hotspot",
        "C:\Program Files\Java\jdk-17",
        "C:\Program Files\Microsoft\jdk-17*"
    )
    foreach ($c in $jdkCandidates) {
        $found = Get-Item -Path $c -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) { $jdk = $found.FullName; break }
    }
}

$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
if ($jdk) {
    $env:JAVA_HOME = $jdk
    $env:Path = "$jdk\bin;$env:Path"
}
$env:Path = "$sdk\platform-tools;$sdk\cmdline-tools\latest\bin;$sdk\emulator;$env:Path"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Fashion for Everyone - Android APK Build " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Project Root : $repoRoot"
Write-Host "Android SDK  : $sdk"
Write-Host "Java Home    : $jdk"
Write-Host "Architecture : $Architecture"
Write-Host ""

# Create junction if needed to avoid Windows MAX_PATH (260 character limit)
$createdJunction = $false
$buildDir = "$repoRoot\mobile\android"
if (-not (Test-Path $junction)) {
    try {
        cmd.exe /c "mklink /J `"$junction`" `"$repoRoot`"" > $null 2>&1
        if (Test-Path $junction) {
            $createdJunction = $true
            $buildDir = "$junction\mobile\android"
            Write-Host "Using NTFS directory junction $junction to prevent 260-char path limits." -ForegroundColor Green
        }
    } catch {
        Write-Warning "Could not create junction, using direct path."
    }
} elseif (Test-Path "$junction\mobile\android") {
    $buildDir = "$junction\mobile\android"
}

try {
    Push-Location $buildDir
    Write-Host "Running Gradle assembleRelease..." -ForegroundColor Yellow
    .\gradlew.bat assembleRelease "-PreactNativeArchitectures=$Architecture" --stacktrace
} finally {
    Pop-Location
    if ($createdJunction -and (Test-Path $junction)) {
        cmd.exe /c "rmdir `"$junction`"" > $null 2>&1
    }
}

$apkPath = "$repoRoot\mobile\android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    $item = Get-Item $apkPath
    $sizeMb = [math]::Round($item.Length / 1MB, 2)
    $sha = (Get-FileHash -Path $apkPath -Algorithm SHA256).Hash

    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host " APK BUILD SUCCESSFUL! " -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "File : $($item.Name)"
    Write-Host "Path : $($item.FullName)"
    Write-Host "Size : $sizeMb MB ($($item.Length) bytes)"
    Write-Host "SHA256: $sha"
    Write-Host "==========================================" -ForegroundColor Green
} else {
    Write-Error "Build finished but APK was not found at $apkPath"
}
