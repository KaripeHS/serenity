@echo off
REM Serenity Care Partners ERP - Test Runner (Windows)
REM Comprehensive test suite for all phases

echo ==================================
echo Serenity Care ERP - Test Suite
echo ==================================
echo.

REM Check if DATABASE_URL is set
if "%DATABASE_URL%"=="" (
    echo [WARNING] DATABASE_URL not set, using default
    set DATABASE_URL=postgresql://postgres:password@localhost:5432/serenity_test
)

echo [INFO] Environment configured
echo.

REM Run database migrations
echo [INFO] Running database migrations...
call npm run migrate:latest >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Migration failed
    exit /b 1
)
echo [SUCCESS] Migrations completed
echo.

REM Test menu
echo Select test suite to run:
echo 1) Integration Tests (Fast - No external APIs)
echo 2) E2E Tests (Comprehensive - Requires API keys)
echo 3) Both
echo 4) Exit
echo.
set /p choice="Enter choice [1-4]: "

if "%choice%"=="1" goto integration
if "%choice%"=="2" goto e2e
if "%choice%"=="3" goto both
if "%choice%"=="4" goto end
goto invalid

:integration
echo.
echo ==================================
echo Running Integration Tests...
echo ==================================
echo.
call npm test -- tests/integration/services.integration.test.ts
goto testresult

:e2e
echo.
echo ==================================
echo Running E2E Tests...
echo ==================================
echo.
echo [WARNING] E2E tests require external API keys to be configured
echo [WARNING] Tests will skip features where APIs are not available
echo.
call npm test -- tests/e2e/complete-lifecycle.test.ts
goto testresult

:both
echo.
echo ==================================
echo Running All Tests...
echo ==================================
echo.
call npm test
goto testresult

:testresult
if %errorlevel% equ 0 (
    echo.
    echo ==================================
    echo [SUCCESS] ALL TESTS PASSED
    echo ==================================
    echo.
) else (
    echo.
    echo ==================================
    echo [ERROR] SOME TESTS FAILED
    echo ==================================
    echo.
    exit /b 1
)
goto end

:invalid
echo [ERROR] Invalid choice
exit /b 1

:end
echo Test run complete
pause
