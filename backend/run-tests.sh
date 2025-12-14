#!/bin/bash

# Serenity Care Partners ERP - Test Runner
# Comprehensive test suite for all phases

echo "=================================="
echo "Serenity Care ERP - Test Suite"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking database connection...${NC}"
if ! psql -h localhost -U postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL is not running or not accessible${NC}"
    echo "Please start PostgreSQL and ensure DATABASE_URL is set"
    exit 1
fi
echo -e "${GREEN}✓ Database connection OK${NC}"
echo ""

# Check environment variables
echo -e "${YELLOW}Checking environment configuration...${NC}"
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠ DATABASE_URL not set, using default${NC}"
    export DATABASE_URL="postgresql://postgres:password@localhost:5432/serenity_test"
fi
echo -e "${GREEN}✓ Environment configured${NC}"
echo ""

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npm run migrate:latest > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migrations completed${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi
echo ""

# Test option menu
echo "Select test suite to run:"
echo "1) Integration Tests (Fast - No external APIs)"
echo "2) E2E Tests (Comprehensive - Requires API keys)"
echo "3) Both"
echo "4) Exit"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "=================================="
        echo "Running Integration Tests..."
        echo "=================================="
        echo ""
        npm test -- tests/integration/services.integration.test.ts
        ;;
    2)
        echo ""
        echo "=================================="
        echo "Running E2E Tests..."
        echo "=================================="
        echo ""
        echo -e "${YELLOW}⚠ E2E tests require external API keys to be configured${NC}"
        echo -e "${YELLOW}  Tests will skip features where APIs are not available${NC}"
        echo ""
        npm test -- tests/e2e/complete-lifecycle.test.ts
        ;;
    3)
        echo ""
        echo "=================================="
        echo "Running All Tests..."
        echo "=================================="
        echo ""
        npm test
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Test results
if [ $? -eq 0 ]; then
    echo ""
    echo "=================================="
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    echo "=================================="
    echo ""
else
    echo ""
    echo "=================================="
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo "=================================="
    echo ""
    exit 1
fi
