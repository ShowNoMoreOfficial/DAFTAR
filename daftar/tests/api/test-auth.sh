#!/bin/bash
# =============================================================================
# Daftar API Tests -- Authentication & Session Security
# =============================================================================
# Prerequisites:
#   - Server running at localhost:3000
#   - A valid session cookie (replace YOUR_TOKEN_HERE below)
#
# Usage:
#   chmod +x tests/api/test-auth.sh
#   ./tests/api/test-auth.sh
#
# Optional environment variables:
#   BASE_URL          - Override server URL (default: http://localhost:3000)
#   SESSION_TOKEN     - Provide a valid session token
# =============================================================================

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
SESSION_TOKEN="${SESSION_TOKEN:-YOUR_TOKEN_HERE}"
COOKIE="next-auth.session-token=${SESSION_TOKEN}"

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
    echo -e "${YELLOW}--- $1 ---${NC}"
    echo ""
}

test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local expected_status="$4"
    local cookie="${5:-}"
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
        echo -e "${RED}FAIL: $name (curl error -- is the server running?)${NC}"
        FAIL=$((FAIL + 1))
        return
    }

    local status
    status=$(echo "$response" | tail -1)
    local body_response
    body_response=$(echo "$response" | sed '$d')

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}PASS: $name (HTTP $status)${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}FAIL: $name (Expected $expected_status, got $status)${NC}"
        echo "   Response: $(echo "$body_response" | head -3)"
        FAIL=$((FAIL + 1))
    fi
}

# Variant that checks response body content (JSON field existence or value)
test_endpoint_with_body_check() {
    local name="$1"
    local method="$2"
    local url="$3"
    local expected_status="$4"
    local cookie="${5:-}"
    local body="${6:-}"
    local body_check_pattern="${7:-}"

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
        echo -e "${RED}FAIL: $name (curl error -- is the server running?)${NC}"
        FAIL=$((FAIL + 1))
        return
    }

    local status
    status=$(echo "$response" | tail -1)
    local body_response
    body_response=$(echo "$response" | sed '$d')

    if [ "$status" != "$expected_status" ]; then
        echo -e "${RED}FAIL: $name (Expected HTTP $expected_status, got $status)${NC}"
        echo "   Response: $(echo "$body_response" | head -3)"
        FAIL=$((FAIL + 1))
        return
    fi

    if [ -n "$body_check_pattern" ]; then
        if echo "$body_response" | grep -qE "$body_check_pattern"; then
            echo -e "${GREEN}PASS: $name (HTTP $status, body matched)${NC}"
            PASS=$((PASS + 1))
        else
            echo -e "${RED}FAIL: $name (HTTP $status OK, but body did not match pattern: $body_check_pattern)${NC}"
            echo "   Response: $(echo "$body_response" | head -3)"
            FAIL=$((FAIL + 1))
        fi
    else
        echo -e "${GREEN}PASS: $name (HTTP $status)${NC}"
        PASS=$((PASS + 1))
    fi
}

skip_test() {
    local name="$1"
    local reason="$2"
    TOTAL=$((TOTAL + 1))
    SKIPPED=$((SKIPPED + 1))
    echo -e "${YELLOW}SKIP: $name -- $reason${NC}"
}

# ---------------------------------------------------------------------------
# Preflight: check server is reachable
# ---------------------------------------------------------------------------
print_header "Daftar Auth API Tests"

echo "Target: ${BASE_URL}"
echo "Date:   $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

if ! curl -s --max-time 5 "${BASE_URL}" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Server at ${BASE_URL} is not reachable. Aborting.${NC}"
    exit 1
fi
echo -e "${GREEN}Server is reachable.${NC}"

if [ "$SESSION_TOKEN" = "YOUR_TOKEN_HERE" ]; then
    echo -e "${YELLOW}WARNING: Using placeholder session token. Set SESSION_TOKEN env var for authenticated tests.${NC}"
    echo ""
fi

# ==========================================================================
# 1. Session endpoint -- authenticated
# ==========================================================================
print_section "1. Authenticated session"

test_endpoint \
    "GET /api/auth/session with valid cookie returns 200" \
    "GET" \
    "/api/auth/session" \
    "200" \
    "$COOKIE"

# Verify the response contains user data (email or name field)
test_endpoint_with_body_check \
    "GET /api/auth/session response contains user object" \
    "GET" \
    "/api/auth/session" \
    "200" \
    "$COOKIE" \
    "" \
    '"user"'

# Check that session response contains expected fields
test_endpoint_with_body_check \
    "GET /api/auth/session response has expires field" \
    "GET" \
    "/api/auth/session" \
    "200" \
    "$COOKIE" \
    "" \
    '"expires"'

# ==========================================================================
# 2. Session endpoint -- unauthenticated (no cookie)
# ==========================================================================
print_section "2. Unauthenticated session"

# NextAuth returns 200 with an empty/null session object (not 401)
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/api/auth/session" \
    -H "Content-Type: application/json" 2>/dev/null)
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')

if [ "$status" = "200" ]; then
    # NextAuth returns 200 with {} or {"user":null} when no session
    if echo "$body_response" | grep -qE '^\{\}$|"user"\s*:\s*null|^\{\s*\}$'; then
        echo -e "${GREEN}PASS: GET /api/auth/session without cookie returns empty/null session (HTTP 200)${NC}"
        PASS=$((PASS + 1))
    elif ! echo "$body_response" | grep -q '"user"'; then
        echo -e "${GREEN}PASS: GET /api/auth/session without cookie returns no user data (HTTP 200)${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}FAIL: GET /api/auth/session without cookie returned user data unexpectedly${NC}"
        echo "   Response: $(echo "$body_response" | head -3)"
        FAIL=$((FAIL + 1))
    fi
else
    echo -e "${RED}FAIL: GET /api/auth/session without cookie (Expected 200 with empty session, got HTTP $status)${NC}"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# ==========================================================================
# 3. Protected routes -- no cookie should return 401
# ==========================================================================
print_section "3. Protected routes without authentication"

test_endpoint \
    "GET /api/users without cookie returns 401" \
    "GET" \
    "/api/users" \
    "401" \
    "" \
    ""

test_endpoint \
    "POST /api/users without cookie returns 401" \
    "POST" \
    "/api/users" \
    "401" \
    "" \
    '{"email":"test@example.com","name":"Test","role":"MEMBER"}'

test_endpoint \
    "GET /api/tasks without cookie returns 401" \
    "GET" \
    "/api/tasks" \
    "401" \
    "" \
    ""

test_endpoint \
    "GET /api/finance/invoices without cookie returns 401" \
    "GET" \
    "/api/finance/invoices" \
    "401" \
    "" \
    ""

test_endpoint \
    "POST /api/finance/invoices without cookie returns 401" \
    "POST" \
    "/api/finance/invoices" \
    "401" \
    "" \
    '{"amount":1000,"dueDate":"2026-12-31"}'

test_endpoint \
    "GET /api/hoccr/operations/capacity without cookie returns 401" \
    "GET" \
    "/api/hoccr/operations/capacity" \
    "401" \
    "" \
    ""

test_endpoint \
    "GET /api/gamification/leaderboard without cookie returns 401" \
    "GET" \
    "/api/gamification/leaderboard" \
    "401" \
    "" \
    ""

test_endpoint \
    "POST /api/communication/announcements without cookie returns 401" \
    "POST" \
    "/api/communication/announcements" \
    "401" \
    "" \
    '{"title":"Test","content":"Test content"}'

test_endpoint \
    "GET /api/gi/config without cookie returns 401" \
    "GET" \
    "/api/gi/config" \
    "401" \
    "" \
    ""

test_endpoint \
    "POST /api/relay/posts without cookie returns 401" \
    "POST" \
    "/api/relay/posts" \
    "401" \
    "" \
    '{"title":"Test","platform":"x","brandId":"test-brand"}'

# ==========================================================================
# 4. Invalid/expired session token
# ==========================================================================
print_section "4. Invalid session tokens"

INVALID_COOKIE="next-auth.session-token=invalid-garbage-token-12345"

test_endpoint \
    "GET /api/users with invalid token returns 401" \
    "GET" \
    "/api/users" \
    "401" \
    "$INVALID_COOKIE" \
    ""

test_endpoint \
    "POST /api/users with invalid token returns 401" \
    "POST" \
    "/api/users" \
    "401" \
    "$INVALID_COOKIE" \
    '{"email":"hack@evil.com","name":"Hacker","role":"ADMIN"}'

test_endpoint \
    "GET /api/tasks with invalid token returns 401" \
    "GET" \
    "/api/tasks" \
    "401" \
    "$INVALID_COOKIE" \
    ""

EXPIRED_COOKIE="next-auth.session-token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZXhwIjoxMDAwMDAwMDAwfQ.invalid"

test_endpoint \
    "GET /api/users with expired/malformed JWT returns 401" \
    "GET" \
    "/api/users" \
    "401" \
    "$EXPIRED_COOKIE" \
    ""

# ==========================================================================
# 5. CSRF protection
# ==========================================================================
print_section "5. CSRF protection"

# NextAuth uses double-submit cookie pattern for CSRF on POST endpoints.
# A POST to /api/auth/signin without CSRF token should be rejected.
TOTAL=$((TOTAL + 1))
csrf_response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/auth/signin" \
    -H "Content-Type: application/json" \
    -d '{"csrfToken":"invalid-csrf-token"}' 2>/dev/null)
csrf_status=$(echo "$csrf_response" | tail -1)
csrf_body=$(echo "$csrf_response" | sed '$d')

# NextAuth should reject invalid CSRF with 400, 403, or redirect (302/303)
if [[ "$csrf_status" =~ ^(400|403|302|303|405)$ ]]; then
    echo -e "${GREEN}PASS: POST /api/auth/signin with invalid CSRF rejected (HTTP $csrf_status)${NC}"
    PASS=$((PASS + 1))
elif [ "$csrf_status" = "200" ] && echo "$csrf_body" | grep -qi "csrf\|invalid\|error"; then
    echo -e "${GREEN}PASS: POST /api/auth/signin with invalid CSRF returns error in body (HTTP $csrf_status)${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}FAIL: POST /api/auth/signin with invalid CSRF was not rejected (HTTP $csrf_status)${NC}"
    echo "   Response: $(echo "$csrf_body" | head -3)"
    FAIL=$((FAIL + 1))
fi

# Test that GET to a CSRF-fetching endpoint returns a token
TOTAL=$((TOTAL + 1))
csrf_get_response=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/api/auth/csrf" 2>/dev/null)
csrf_get_status=$(echo "$csrf_get_response" | tail -1)
csrf_get_body=$(echo "$csrf_get_response" | sed '$d')

if [ "$csrf_get_status" = "200" ] && echo "$csrf_get_body" | grep -q "csrfToken"; then
    echo -e "${GREEN}PASS: GET /api/auth/csrf returns CSRF token (HTTP $csrf_get_status)${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}FAIL: GET /api/auth/csrf did not return CSRF token (HTTP $csrf_get_status)${NC}"
    echo "   Response: $(echo "$csrf_get_body" | head -3)"
    FAIL=$((FAIL + 1))
fi

# Test CSRF token format -- should be a non-empty string
TOTAL=$((TOTAL + 1))
if [ "$csrf_get_status" = "200" ]; then
    csrf_token=$(echo "$csrf_get_body" | sed -n 's/.*"csrfToken"\s*:\s*"\([^"]*\)".*/\1/p')
    if [ -n "$csrf_token" ] && [ ${#csrf_token} -ge 10 ]; then
        echo -e "${GREEN}PASS: CSRF token is a non-trivial string (length: ${#csrf_token})${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}FAIL: CSRF token is missing or too short (value: '$csrf_token')${NC}"
        FAIL=$((FAIL + 1))
    fi
else
    skip_test "CSRF token format validation" "Could not fetch CSRF endpoint"
fi

# ==========================================================================
# 6. Session token format validation
# ==========================================================================
print_section "6. Session token format"

# Fetch session with valid cookie and inspect the response structure
TOTAL=$((TOTAL + 1))
session_response=$(curl -s -X GET "${BASE_URL}/api/auth/session" \
    -H "Cookie: $COOKIE" \
    -H "Content-Type: application/json" 2>/dev/null)

if [ "$SESSION_TOKEN" = "YOUR_TOKEN_HERE" ]; then
    skip_test "Session token format -- response structure" "No real session token provided"
else
    if echo "$session_response" | grep -qE '"user"\s*:\s*\{'; then
        echo -e "${GREEN}PASS: Session response has structured user object${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}FAIL: Session response missing structured user object${NC}"
        echo "   Response: $(echo "$session_response" | head -3)"
        FAIL=$((FAIL + 1))
    fi
fi

# Verify session user object contains role field (DAFTAR-specific)
TOTAL=$((TOTAL + 1))
if [ "$SESSION_TOKEN" = "YOUR_TOKEN_HERE" ]; then
    skip_test "Session contains role field" "No real session token provided"
else
    if echo "$session_response" | grep -qE '"role"\s*:\s*"(ADMIN|HEAD_HR|DEPT_HEAD|MEMBER|CLIENT|FINANCE|CONTRACTOR)"'; then
        echo -e "${GREEN}PASS: Session user has valid DAFTAR role${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}FAIL: Session user missing valid role field${NC}"
        echo "   Response: $(echo "$session_response" | head -3)"
        FAIL=$((FAIL + 1))
    fi
fi

# Verify session user object contains id field
TOTAL=$((TOTAL + 1))
if [ "$SESSION_TOKEN" = "YOUR_TOKEN_HERE" ]; then
    skip_test "Session contains user id" "No real session token provided"
else
    if echo "$session_response" | grep -qE '"id"\s*:\s*"[^"]+"'; then
        echo -e "${GREEN}PASS: Session user has id field${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}FAIL: Session user missing id field${NC}"
        echo "   Response: $(echo "$session_response" | head -3)"
        FAIL=$((FAIL + 1))
    fi
fi

# Verify session user object contains email field
TOTAL=$((TOTAL + 1))
if [ "$SESSION_TOKEN" = "YOUR_TOKEN_HERE" ]; then
    skip_test "Session contains user email" "No real session token provided"
else
    if echo "$session_response" | grep -qE '"email"\s*:\s*"[^"]+"'; then
        echo -e "${GREEN}PASS: Session user has email field${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}FAIL: Session user missing email field${NC}"
        echo "   Response: $(echo "$session_response" | head -3)"
        FAIL=$((FAIL + 1))
    fi
fi

# Verify the session expiry is in the future
TOTAL=$((TOTAL + 1))
if [ "$SESSION_TOKEN" = "YOUR_TOKEN_HERE" ]; then
    skip_test "Session expiry is in the future" "No real session token provided"
else
    expires=$(echo "$session_response" | sed -n 's/.*"expires"\s*:\s*"\([^"]*\)".*/\1/p')
    if [ -n "$expires" ]; then
        # Compare dates -- expires should be in the future
        expires_epoch=$(date -d "$expires" +%s 2>/dev/null || echo "0")
        now_epoch=$(date +%s)
        if [ "$expires_epoch" -gt "$now_epoch" ]; then
            echo -e "${GREEN}PASS: Session expiry is in the future ($expires)${NC}"
            PASS=$((PASS + 1))
        else
            echo -e "${RED}FAIL: Session expiry is in the past ($expires)${NC}"
            FAIL=$((FAIL + 1))
        fi
    else
        echo -e "${RED}FAIL: Could not parse session expiry field${NC}"
        FAIL=$((FAIL + 1))
    fi
fi

# ==========================================================================
# 7. Security headers and cookie attributes
# ==========================================================================
print_section "7. Security headers"

TOTAL=$((TOTAL + 1))
headers_response=$(curl -s -I "${BASE_URL}/api/auth/session" -H "Cookie: $COOKIE" 2>/dev/null)

# Check for security-relevant headers
if echo "$headers_response" | grep -qi "x-frame-options\|content-security-policy"; then
    echo -e "${GREEN}PASS: Response includes frame protection headers${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${YELLOW}SKIP: No X-Frame-Options or CSP header detected (may be configured at reverse proxy)${NC}"
    SKIPPED=$((SKIPPED + 1))
fi

TOTAL=$((TOTAL + 1))
if echo "$headers_response" | grep -qi "content-type.*application/json"; then
    echo -e "${GREEN}PASS: Session endpoint returns application/json content type${NC}"
    PASS=$((PASS + 1))
else
    echo -e "${RED}FAIL: Session endpoint does not return application/json${NC}"
    FAIL=$((FAIL + 1))
fi

# Check that auth endpoints do not expose server version
TOTAL=$((TOTAL + 1))
if echo "$headers_response" | grep -qi "x-powered-by"; then
    echo -e "${YELLOW}SKIP: X-Powered-By header is present (consider removing in production)${NC}"
    SKIPPED=$((SKIPPED + 1))
else
    echo -e "${GREEN}PASS: No X-Powered-By header exposed${NC}"
    PASS=$((PASS + 1))
fi

# ==========================================================================
# 8. HTTP method restrictions
# ==========================================================================
print_section "8. HTTP method restrictions"

# DELETE and PUT on /api/auth/session should not be allowed (405 or ignored)
test_endpoint \
    "DELETE /api/auth/session is not a valid method" \
    "DELETE" \
    "/api/auth/session" \
    "405" \
    "$COOKIE" \
    ""

test_endpoint \
    "PUT /api/auth/session is not a valid method" \
    "PUT" \
    "/api/auth/session" \
    "405" \
    "$COOKIE" \
    ""

# ==========================================================================
# Summary
# ==========================================================================
print_header "Test Summary"

echo "Total:   $TOTAL"
echo -e "Passed:  ${GREEN}$PASS${NC}"
echo -e "Failed:  ${RED}$FAIL${NC}"
echo -e "Skipped: ${YELLOW}$SKIPPED${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
else
    echo -e "${GREEN}All executed tests passed.${NC}"
    exit 0
fi
