#!/bin/bash
# =============================================================================
# Daftar API Tests -- Role-Based Access Control (RBAC)
# =============================================================================
# Tests access control for ALL 7 roles across protected API endpoints.
#
# Roles: ADMIN, HEAD_HR, DEPT_HEAD, MEMBER, CLIENT, FINANCE, CONTRACTOR
#
# Prerequisites:
#   - Server running at localhost:3000
#   - Valid session tokens for each of the 7 roles
#   - Replace the TOKEN_HERE placeholders below with real tokens
#
# Usage:
#   chmod +x tests/api/test-rbac.sh
#   ./tests/api/test-rbac.sh
#
# Optional environment variables:
#   BASE_URL              - Override server URL (default: http://localhost:3000)
#   ADMIN_TOKEN           - Session token for ADMIN role
#   HEAD_HR_TOKEN         - Session token for HEAD_HR role
#   DEPT_HEAD_TOKEN       - Session token for DEPT_HEAD role
#   MEMBER_TOKEN          - Session token for MEMBER role
#   CLIENT_TOKEN          - Session token for CLIENT role
#   FINANCE_TOKEN         - Session token for FINANCE role
#   CONTRACTOR_TOKEN      - Session token for CONTRACTOR role
# =============================================================================

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

# ---------------------------------------------------------------------------
# Role tokens -- override via environment or replace placeholders
# ---------------------------------------------------------------------------
ADMIN_TOKEN="${ADMIN_TOKEN:-ADMIN_TOKEN_HERE}"
HEAD_HR_TOKEN="${HEAD_HR_TOKEN:-HEAD_HR_TOKEN_HERE}"
DEPT_HEAD_TOKEN="${DEPT_HEAD_TOKEN:-DEPT_HEAD_TOKEN_HERE}"
MEMBER_TOKEN="${MEMBER_TOKEN:-MEMBER_TOKEN_HERE}"
CLIENT_TOKEN="${CLIENT_TOKEN:-CLIENT_TOKEN_HERE}"
FINANCE_TOKEN="${FINANCE_TOKEN:-FINANCE_TOKEN_HERE}"
CONTRACTOR_TOKEN="${CONTRACTOR_TOKEN:-CONTRACTOR_TOKEN_HERE}"

ADMIN_COOKIE="next-auth.session-token=${ADMIN_TOKEN}"
HEAD_HR_COOKIE="next-auth.session-token=${HEAD_HR_TOKEN}"
DEPT_HEAD_COOKIE="next-auth.session-token=${DEPT_HEAD_TOKEN}"
MEMBER_COOKIE="next-auth.session-token=${MEMBER_TOKEN}"
CLIENT_COOKIE="next-auth.session-token=${CLIENT_TOKEN}"
FINANCE_COOKIE="next-auth.session-token=${FINANCE_TOKEN}"
CONTRACTOR_COOKIE="next-auth.session-token=${CONTRACTOR_TOKEN}"

# Map role names to cookies for iteration
declare -A ROLE_COOKIES=(
    [ADMIN]="$ADMIN_COOKIE"
    [HEAD_HR]="$HEAD_HR_COOKIE"
    [DEPT_HEAD]="$DEPT_HEAD_COOKIE"
    [MEMBER]="$MEMBER_COOKIE"
    [CLIENT]="$CLIENT_COOKIE"
    [FINANCE]="$FINANCE_COOKIE"
    [CONTRACTOR]="$CONTRACTOR_COOKIE"
)

# Ordered list for consistent iteration (bash associative arrays are unordered)
ROLE_ORDER=("ADMIN" "HEAD_HR" "DEPT_HEAD" "MEMBER" "CLIENT" "FINANCE" "CONTRACTOR")

PASS=0
FAIL=0
TOTAL=0
SKIPPED=0

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
print_header() {
    echo ""
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}============================================================${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${CYAN}--- $1 ---${NC}"
    echo ""
}

print_route_header() {
    echo ""
    echo -e "${YELLOW}>> $1${NC}"
}

test_with_role() {
    local name="$1"
    local method="$2"
    local url="$3"
    local expected_status="$4"
    local cookie="$5"
    local body="${6:-}"

    TOTAL=$((TOTAL + 1))

    local curl_args=(-s -w "\n%{http_code}" -X "$method" "${BASE_URL}${url}")

    if [ -n "$cookie" ]; then
        curl_args+=(-H "Cookie: $cookie")
    fi

    curl_args+=(-H "Content-Type: application/json")

    if [ -n "$body" ]; then
        curl_args+=(-d "$body")
    fi

    local response
    response=$(curl "${curl_args[@]}" 2>/dev/null) || {
        echo -e "  ${RED}FAIL: $name (curl error -- is the server running?)${NC}"
        FAIL=$((FAIL + 1))
        return
    }

    local status
    status=$(echo "$response" | tail -1)
    local body_response
    body_response=$(echo "$response" | sed '$d')

    # Allow flexible status matching: "201/200" means either is acceptable
    local pass=0
    IFS='/' read -ra EXPECTED_CODES <<< "$expected_status"
    for code in "${EXPECTED_CODES[@]}"; do
        if [ "$status" = "$code" ]; then
            pass=1
            break
        fi
    done

    if [ "$pass" = "1" ]; then
        echo -e "  ${GREEN}PASS: $name (HTTP $status)${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "  ${RED}FAIL: $name (Expected $expected_status, got $status)${NC}"
        echo "     Response: $(echo "$body_response" | head -2)"
        FAIL=$((FAIL + 1))
    fi
}

# Convenience: test one route against all 7 roles
test_route_all_roles() {
    local method="$1"
    local url="$2"
    local body="$3"
    # Remaining args: expected status for ADMIN, HEAD_HR, DEPT_HEAD, MEMBER, CLIENT, FINANCE, CONTRACTOR
    local admin_expected="$4"
    local headhr_expected="$5"
    local depthead_expected="$6"
    local member_expected="$7"
    local client_expected="$8"
    local finance_expected="$9"
    local contractor_expected="${10}"

    local -A EXPECTED_MAP=(
        [ADMIN]="$admin_expected"
        [HEAD_HR]="$headhr_expected"
        [DEPT_HEAD]="$depthead_expected"
        [MEMBER]="$member_expected"
        [CLIENT]="$client_expected"
        [FINANCE]="$finance_expected"
        [CONTRACTOR]="$contractor_expected"
    )

    print_route_header "$method $url"

    for role in "${ROLE_ORDER[@]}"; do
        local expected="${EXPECTED_MAP[$role]}"
        local cookie="${ROLE_COOKIES[$role]}"
        test_with_role \
            "$role: $method $url -> $expected" \
            "$method" \
            "$url" \
            "$expected" \
            "$cookie" \
            "$body"
    done
}

# ---------------------------------------------------------------------------
# Preflight: check server is reachable
# ---------------------------------------------------------------------------
print_header "Daftar RBAC Tests -- All 7 Roles"

echo "Target: ${BASE_URL}"
echo "Date:   $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""
echo "Roles under test:"
for role in "${ROLE_ORDER[@]}"; do
    token_var="${role}_TOKEN"
    token_val="${!token_var}"
    if [ "$token_val" = "${role}_TOKEN_HERE" ]; then
        echo -e "  ${YELLOW}$role${NC} -- placeholder token (tests may fail)"
    else
        echo -e "  ${GREEN}$role${NC} -- token configured"
    fi
done
echo ""

if ! curl -s --max-time 5 "${BASE_URL}" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Server at ${BASE_URL} is not reachable. Aborting.${NC}"
    exit 1
fi
echo -e "${GREEN}Server is reachable.${NC}"

# ==========================================================================
# Expected access matrix:
#
# | Route                                  | ADMIN   | HEAD_HR | DEPT_HEAD | MEMBER | CLIENT | FINANCE | CONTRACTOR |
# |----------------------------------------|---------|---------|-----------|--------|--------|---------|------------|
# | GET  /api/users                        | 200     | 200     | 403       | 403    | 403    | 403     | 403        |
# | POST /api/users                        | 201/200 | 403     | 403       | 403    | 403    | 403     | 403        |
# | GET  /api/tasks                        | 200     | 200     | 200       | 200    | 403    | 403     | 200        |
# | GET  /api/finance/invoices             | 200     | 403     | 403       | 403    | 200    | 200     | 403        |
# | POST /api/finance/invoices             | 201     | 403     | 403       | 403    | 403    | 201     | 403        |
# | GET  /api/hoccr/operations/capacity    | 200     | 200     | 200       | 403    | 403    | 403     | 403        |
# | POST /api/communication/announcements  | 201     | 201     | 201       | 403    | 403    | 403     | 403        |
# | GET  /api/gamification/leaderboard     | 200     | 200     | 200       | 200    | 403    | 403     | 200        |
# | GET  /api/gi/config                    | 200     | 403     | 403       | 403    | 403    | 403     | 403        |
# | POST /api/relay/posts                  | 201     | 403     | 201       | 201    | 201    | 403     | 403        |
# ==========================================================================

# ==========================================================================
# 1. GET /api/users -- ADMIN + HEAD_HR only
# ==========================================================================
print_section "1. User Management (GET /api/users)"

test_route_all_roles \
    "GET" "/api/users" "" \
    "200" "200" "403" "403" "403" "403" "403"

# ==========================================================================
# 2. POST /api/users -- ADMIN only
# ==========================================================================
print_section "2. User Creation (POST /api/users)"

# Use a unique email per test run to avoid duplicate conflicts
TIMESTAMP=$(date +%s)

# ADMIN -- should succeed (201) or return 200 if user exists
test_with_role \
    "ADMIN: POST /api/users -> 201/200" \
    "POST" \
    "/api/users" \
    "201/200" \
    "$ADMIN_COOKIE" \
    "{\"email\":\"rbac-test-${TIMESTAMP}@daftar.test\",\"name\":\"RBAC Test User\",\"role\":\"MEMBER\"}"

# All other roles -- should be forbidden (403)
for role in "HEAD_HR" "DEPT_HEAD" "MEMBER" "CLIENT" "FINANCE" "CONTRACTOR"; do
    cookie="${ROLE_COOKIES[$role]}"
    test_with_role \
        "$role: POST /api/users -> 403" \
        "POST" \
        "/api/users" \
        "403" \
        "$cookie" \
        "{\"email\":\"rbac-blocked-${role}-${TIMESTAMP}@daftar.test\",\"name\":\"Blocked User\",\"role\":\"MEMBER\"}"
done

# ==========================================================================
# 3. GET /api/tasks -- ADMIN, HEAD_HR, DEPT_HEAD, MEMBER, CONTRACTOR
# ==========================================================================
print_section "3. Task Listing (GET /api/tasks)"

test_route_all_roles \
    "GET" "/api/tasks" "" \
    "200" "200" "200" "200" "403" "403" "200"

# ==========================================================================
# 4. GET /api/finance/invoices -- ADMIN, CLIENT, FINANCE
# ==========================================================================
print_section "4. Invoice Listing (GET /api/finance/invoices)"

test_route_all_roles \
    "GET" "/api/finance/invoices" "" \
    "200" "403" "403" "403" "200" "200" "403"

# ==========================================================================
# 5. POST /api/finance/invoices -- ADMIN, FINANCE
# ==========================================================================
print_section "5. Invoice Creation (POST /api/finance/invoices)"

INVOICE_BODY="{\"amount\":5000,\"dueDate\":\"2026-12-31\",\"description\":\"RBAC test invoice\"}"

print_route_header "POST /api/finance/invoices"

test_with_role \
    "ADMIN: POST /api/finance/invoices -> 201" \
    "POST" \
    "/api/finance/invoices" \
    "201" \
    "$ADMIN_COOKIE" \
    "$INVOICE_BODY"

test_with_role \
    "HEAD_HR: POST /api/finance/invoices -> 403" \
    "POST" \
    "/api/finance/invoices" \
    "403" \
    "$HEAD_HR_COOKIE" \
    "$INVOICE_BODY"

test_with_role \
    "DEPT_HEAD: POST /api/finance/invoices -> 403" \
    "POST" \
    "/api/finance/invoices" \
    "403" \
    "$DEPT_HEAD_COOKIE" \
    "$INVOICE_BODY"

test_with_role \
    "MEMBER: POST /api/finance/invoices -> 403" \
    "POST" \
    "/api/finance/invoices" \
    "403" \
    "$MEMBER_COOKIE" \
    "$INVOICE_BODY"

test_with_role \
    "CLIENT: POST /api/finance/invoices -> 403" \
    "POST" \
    "/api/finance/invoices" \
    "403" \
    "$CLIENT_COOKIE" \
    "$INVOICE_BODY"

test_with_role \
    "FINANCE: POST /api/finance/invoices -> 201" \
    "POST" \
    "/api/finance/invoices" \
    "201" \
    "$FINANCE_COOKIE" \
    "$INVOICE_BODY"

test_with_role \
    "CONTRACTOR: POST /api/finance/invoices -> 403" \
    "POST" \
    "/api/finance/invoices" \
    "403" \
    "$CONTRACTOR_COOKIE" \
    "$INVOICE_BODY"

# ==========================================================================
# 6. GET /api/hoccr/operations/capacity -- ADMIN, HEAD_HR, DEPT_HEAD
# ==========================================================================
print_section "6. HOCCR Capacity (GET /api/hoccr/operations/capacity)"

test_route_all_roles \
    "GET" "/api/hoccr/operations/capacity" "" \
    "200" "200" "200" "403" "403" "403" "403"

# ==========================================================================
# 7. POST /api/communication/announcements -- ADMIN, HEAD_HR, DEPT_HEAD
# ==========================================================================
print_section "7. Announcements Creation (POST /api/communication/announcements)"

ANNOUNCEMENT_BODY="{\"title\":\"RBAC Test Announcement\",\"content\":\"This is a test announcement for RBAC validation.\"}"

print_route_header "POST /api/communication/announcements"

test_with_role \
    "ADMIN: POST /api/communication/announcements -> 201" \
    "POST" \
    "/api/communication/announcements" \
    "201" \
    "$ADMIN_COOKIE" \
    "$ANNOUNCEMENT_BODY"

test_with_role \
    "HEAD_HR: POST /api/communication/announcements -> 201" \
    "POST" \
    "/api/communication/announcements" \
    "201" \
    "$HEAD_HR_COOKIE" \
    "$ANNOUNCEMENT_BODY"

test_with_role \
    "DEPT_HEAD: POST /api/communication/announcements -> 201" \
    "POST" \
    "/api/communication/announcements" \
    "201" \
    "$DEPT_HEAD_COOKIE" \
    "$ANNOUNCEMENT_BODY"

test_with_role \
    "MEMBER: POST /api/communication/announcements -> 403" \
    "POST" \
    "/api/communication/announcements" \
    "403" \
    "$MEMBER_COOKIE" \
    "$ANNOUNCEMENT_BODY"

test_with_role \
    "CLIENT: POST /api/communication/announcements -> 403" \
    "POST" \
    "/api/communication/announcements" \
    "403" \
    "$CLIENT_COOKIE" \
    "$ANNOUNCEMENT_BODY"

test_with_role \
    "FINANCE: POST /api/communication/announcements -> 403" \
    "POST" \
    "/api/communication/announcements" \
    "403" \
    "$FINANCE_COOKIE" \
    "$ANNOUNCEMENT_BODY"

test_with_role \
    "CONTRACTOR: POST /api/communication/announcements -> 403" \
    "POST" \
    "/api/communication/announcements" \
    "403" \
    "$CONTRACTOR_COOKIE" \
    "$ANNOUNCEMENT_BODY"

# ==========================================================================
# 8. GET /api/gamification/leaderboard -- everyone except CLIENT, FINANCE
# ==========================================================================
print_section "8. Gamification Leaderboard (GET /api/gamification/leaderboard)"

test_route_all_roles \
    "GET" "/api/gamification/leaderboard" "" \
    "200" "200" "200" "200" "403" "403" "200"

# ==========================================================================
# 9. GET /api/gi/config -- ADMIN only
# ==========================================================================
print_section "9. GI Configuration (GET /api/gi/config)"

test_route_all_roles \
    "GET" "/api/gi/config" "" \
    "200" "403" "403" "403" "403" "403" "403"

# ==========================================================================
# 10. POST /api/relay/posts -- ADMIN, DEPT_HEAD, MEMBER, CLIENT
# ==========================================================================
print_section "10. Relay Post Creation (POST /api/relay/posts)"

# Note: POST /api/relay/posts requires title, platform, and brandId.
# CLIENT users must have access to the specified brandId.
RELAY_BODY="{\"title\":\"RBAC Test Post\",\"platform\":\"x\",\"brandId\":\"test-brand-id\",\"content\":\"RBAC test content\"}"

print_route_header "POST /api/relay/posts"

test_with_role \
    "ADMIN: POST /api/relay/posts -> 201" \
    "POST" \
    "/api/relay/posts" \
    "201" \
    "$ADMIN_COOKIE" \
    "$RELAY_BODY"

test_with_role \
    "HEAD_HR: POST /api/relay/posts -> 403" \
    "POST" \
    "/api/relay/posts" \
    "403" \
    "$HEAD_HR_COOKIE" \
    "$RELAY_BODY"

test_with_role \
    "DEPT_HEAD: POST /api/relay/posts -> 201" \
    "POST" \
    "/api/relay/posts" \
    "201" \
    "$DEPT_HEAD_COOKIE" \
    "$RELAY_BODY"

test_with_role \
    "MEMBER: POST /api/relay/posts -> 201" \
    "POST" \
    "/api/relay/posts" \
    "201" \
    "$MEMBER_COOKIE" \
    "$RELAY_BODY"

test_with_role \
    "CLIENT: POST /api/relay/posts -> 201" \
    "POST" \
    "/api/relay/posts" \
    "201" \
    "$CLIENT_COOKIE" \
    "$RELAY_BODY"

test_with_role \
    "FINANCE: POST /api/relay/posts -> 403" \
    "POST" \
    "/api/relay/posts" \
    "403" \
    "$FINANCE_COOKIE" \
    "$RELAY_BODY"

test_with_role \
    "CONTRACTOR: POST /api/relay/posts -> 403" \
    "POST" \
    "/api/relay/posts" \
    "403" \
    "$CONTRACTOR_COOKIE" \
    "$RELAY_BODY"

# ==========================================================================
# 11. Cross-cutting: unauthenticated access to all routes returns 401
# ==========================================================================
print_section "11. Unauthenticated access (all routes return 401)"

ROUTES_TO_TEST=(
    "GET|/api/users"
    "POST|/api/users"
    "GET|/api/tasks"
    "GET|/api/finance/invoices"
    "POST|/api/finance/invoices"
    "GET|/api/hoccr/operations/capacity"
    "POST|/api/communication/announcements"
    "GET|/api/gamification/leaderboard"
    "GET|/api/gi/config"
    "POST|/api/relay/posts"
)

for route_spec in "${ROUTES_TO_TEST[@]}"; do
    IFS='|' read -r method url <<< "$route_spec"
    test_with_role \
        "NO AUTH: $method $url -> 401" \
        "$method" \
        "$url" \
        "401" \
        "" \
        ""
done

# ==========================================================================
# 12. Privilege escalation attempts
# ==========================================================================
print_section "12. Privilege escalation attempts"

# MEMBER trying to create a user (admin-only)
test_with_role \
    "MEMBER cannot create users (privilege escalation)" \
    "POST" \
    "/api/users" \
    "403" \
    "$MEMBER_COOKIE" \
    "{\"email\":\"escalation-test-${TIMESTAMP}@daftar.test\",\"name\":\"Escalation\",\"role\":\"ADMIN\"}"

# CONTRACTOR trying to access finance
test_with_role \
    "CONTRACTOR cannot access finance invoices" \
    "GET" \
    "/api/finance/invoices" \
    "403" \
    "$CONTRACTOR_COOKIE" \
    ""

# CLIENT trying to access user management
test_with_role \
    "CLIENT cannot list users" \
    "GET" \
    "/api/users" \
    "403" \
    "$CLIENT_COOKIE" \
    ""

# FINANCE trying to access GI config
test_with_role \
    "FINANCE cannot access GI config" \
    "GET" \
    "/api/gi/config" \
    "403" \
    "$FINANCE_COOKIE" \
    ""

# HEAD_HR trying to create invoices
test_with_role \
    "HEAD_HR cannot create invoices" \
    "POST" \
    "/api/finance/invoices" \
    "403" \
    "$HEAD_HR_COOKIE" \
    "{\"amount\":99999,\"dueDate\":\"2026-12-31\"}"

# MEMBER trying to access HOCCR capacity
test_with_role \
    "MEMBER cannot access HOCCR capacity" \
    "GET" \
    "/api/hoccr/operations/capacity" \
    "403" \
    "$MEMBER_COOKIE" \
    ""

# CONTRACTOR trying to post announcements
test_with_role \
    "CONTRACTOR cannot post announcements" \
    "POST" \
    "/api/communication/announcements" \
    "403" \
    "$CONTRACTOR_COOKIE" \
    "{\"title\":\"Unauthorized\",\"content\":\"Should be blocked\"}"

# ==========================================================================
# Summary
# ==========================================================================
print_header "RBAC Test Summary"

echo "Total:   $TOTAL"
echo -e "Passed:  ${GREEN}$PASS${NC}"
echo -e "Failed:  ${RED}$FAIL${NC}"
echo -e "Skipped: ${YELLOW}$SKIPPED${NC}"
echo ""

# Print the expected access matrix for reference
echo -e "${CYAN}Expected Access Matrix:${NC}"
echo ""
printf "%-42s %-7s %-9s %-10s %-8s %-8s %-9s %-12s\n" \
    "Route" "ADMIN" "HEAD_HR" "DEPT_HEAD" "MEMBER" "CLIENT" "FINANCE" "CONTRACTOR"
echo "------------------------------------------------------------------------------------------------------------"
printf "%-42s %-7s %-9s %-10s %-8s %-8s %-9s %-12s\n" \
    "GET  /api/users"                        "200"   "200"    "403"     "403"   "403"   "403"    "403"
printf "%-42s %-7s %-9s %-10s %-8s %-8s %-9s %-12s\n" \
    "POST /api/users"                        "201"   "403"    "403"     "403"   "403"   "403"    "403"
printf "%-42s %-7s %-9s %-10s %-8s %-8s %-9s %-12s\n" \
    "GET  /api/tasks"                        "200"   "200"    "200"     "200"   "403"   "403"    "200"
printf "%-42s %-7s %-9s %-10s %-8s %-8s %-9s %-12s\n" \
    "GET  /api/finance/invoices"             "200"   "403"    "403"     "403"   "200"   "200"    "403"
printf "%-42s %-7s %-9s %-10s %-8s %-8s %-9s %-12s\n" \
    "POST /api/finance/invoices"             "201"   "403"    "403"     "403"   "403"   "201"    "403"
printf "%-42s %-7s %-9s %-10s %-8s %-8s %-9s %-12s\n" \
    "GET  /api/hoccr/operations/capacity"    "200"   "200"    "200"     "403"   "403"   "403"    "403"
printf "%-42s %-7s %-9s %-10s %-8s %-8s %-9s %-12s\n" \
    "POST /api/communication/announcements"  "201"   "201"    "201"     "403"   "403"   "403"    "403"
printf "%-42s %-7s %-9s %-10s %-8s %-8s %-9s %-12s\n" \
    "GET  /api/gamification/leaderboard"     "200"   "200"    "200"     "200"   "403"   "403"    "200"
printf "%-42s %-7s %-9s %-10s %-8s %-8s %-9s %-12s\n" \
    "GET  /api/gi/config"                    "200"   "403"    "403"     "403"   "403"   "403"    "403"
printf "%-42s %-7s %-9s %-10s %-8s %-8s %-9s %-12s\n" \
    "POST /api/relay/posts"                  "201"   "403"    "201"     "201"   "201"   "403"    "403"
echo ""

if [ "$FAIL" -gt 0 ]; then
    echo -e "${RED}Some tests failed. Review the output above for details.${NC}"
    exit 1
else
    echo -e "${GREEN}All executed tests passed.${NC}"
    exit 0
fi
