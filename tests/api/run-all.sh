#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Daftar API Test Suite — Master Runner
# ═══════════════════════════════════════════════════════════════
#
# Runs all API test scripts and produces a summary report.
#
# Usage:
#   bash tests/api/run-all.sh
#
# Prerequisites:
#   - Dev server running at localhost:3000
#   - Valid session cookies configured in each test file
#   - Seed data loaded (npx ts-node tests/seed/seed-test-data.ts)
#   - jq installed (for JSON parsing)
#
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_FILE="$SCRIPT_DIR/test-report-$TIMESTAMP.txt"

TOTAL_PASS=0
TOTAL_FAIL=0
TOTAL_TESTS=0
SUITE_PASS=0
SUITE_FAIL=0
SUITE_TOTAL=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─── Pre-flight checks ──────────────────────────────────────

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Daftar API Test Suite${NC}"
echo -e "${BLUE}  $(date)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Check server is running
echo -n "Checking dev server at localhost:3000... "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "  Dev server not reachable. Start it with: npm run dev"
    exit 1
fi

# Check jq is installed
echo -n "Checking jq is installed... "
if command -v jq &> /dev/null; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "  jq is required. Install: https://stedolan.github.io/jq/download/"
    exit 1
fi

echo ""

# ─── Test suite list ─────────────────────────────────────────

TEST_FILES=(
    "test-auth.sh"
    "test-rbac.sh"
    "test-users.sh"
    "test-departments.sh"
    "test-brands.sh"
    "test-clients.sh"
    "test-tasks.sh"
    "test-yantri-pipeline.sh"
    "test-gi.sh"
    "test-relay.sh"
    "test-finance.sh"
    "test-hoccr.sh"
    "test-communication.sh"
    "test-gamification.sh"
    "test-search.sh"
)

# ─── Run each test suite ─────────────────────────────────────

run_suite() {
    local file="$1"
    local filepath="$SCRIPT_DIR/$file"

    if [ ! -f "$filepath" ]; then
        echo -e "${YELLOW}⚠ SKIP: $file (not found)${NC}"
        return
    fi

    SUITE_TOTAL=$((SUITE_TOTAL + 1))

    echo -e "${BLUE}───────────────────────────────────────────────────${NC}"
    echo -e "${BLUE}  Running: $file${NC}"
    echo -e "${BLUE}───────────────────────────────────────────────────${NC}"

    # Run suite and capture output
    output=$(bash "$filepath" 2>&1)
    exit_code=$?

    echo "$output"

    # Parse pass/fail counts from output
    pass_count=$(echo "$output" | grep -c "✅ PASS" || true)
    fail_count=$(echo "$output" | grep -c "❌ FAIL" || true)
    test_count=$((pass_count + fail_count))

    TOTAL_PASS=$((TOTAL_PASS + pass_count))
    TOTAL_FAIL=$((TOTAL_FAIL + fail_count))
    TOTAL_TESTS=$((TOTAL_TESTS + test_count))

    if [ "$fail_count" -eq 0 ] && [ "$test_count" -gt 0 ]; then
        echo -e "${GREEN}  Suite passed: $pass_count/$test_count${NC}"
        SUITE_PASS=$((SUITE_PASS + 1))
    elif [ "$test_count" -eq 0 ]; then
        echo -e "${YELLOW}  Suite had no parseable results${NC}"
    else
        echo -e "${RED}  Suite failed: $fail_count failures out of $test_count tests${NC}"
        SUITE_FAIL=$((SUITE_FAIL + 1))
    fi

    # Write to report file
    echo "" >> "$REPORT_FILE"
    echo "=== $file ===" >> "$REPORT_FILE"
    echo "Pass: $pass_count | Fail: $fail_count | Total: $test_count" >> "$REPORT_FILE"
    echo "$output" >> "$REPORT_FILE"

    echo ""
}

# Initialize report
echo "Daftar API Test Report — $TIMESTAMP" > "$REPORT_FILE"
echo "========================================" >> "$REPORT_FILE"

for file in "${TEST_FILES[@]}"; do
    run_suite "$file"
done

# ─── Summary ─────────────────────────────────────────────────

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  FINAL SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Suites Run:    $SUITE_TOTAL"
echo -e "  Suites Passed: ${GREEN}$SUITE_PASS${NC}"
echo -e "  Suites Failed: ${RED}$SUITE_FAIL${NC}"
echo ""
echo -e "  Total Tests:   $TOTAL_TESTS"
echo -e "  Passed:        ${GREEN}$TOTAL_PASS${NC}"
echo -e "  Failed:        ${RED}$TOTAL_FAIL${NC}"
echo ""

if [ "$TOTAL_FAIL" -eq 0 ] && [ "$TOTAL_TESTS" -gt 0 ]; then
    echo -e "  ${GREEN}ALL TESTS PASSED ✅${NC}"
else
    echo -e "  ${RED}SOME TESTS FAILED ❌${NC}"
fi

echo ""
echo "  Full report saved to: $REPORT_FILE"
echo ""

# ─── Append summary to report ────────────────────────────────
echo "" >> "$REPORT_FILE"
echo "========================================" >> "$REPORT_FILE"
echo "FINAL SUMMARY" >> "$REPORT_FILE"
echo "  Suites: $SUITE_PASS passed, $SUITE_FAIL failed of $SUITE_TOTAL" >> "$REPORT_FILE"
echo "  Tests:  $TOTAL_PASS passed, $TOTAL_FAIL failed of $TOTAL_TESTS" >> "$REPORT_FILE"
echo "========================================" >> "$REPORT_FILE"

# Exit with non-zero if any test failed
[ "$TOTAL_FAIL" -eq 0 ]
