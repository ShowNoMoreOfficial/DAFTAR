#!/bin/bash
# Daftar API Tests — Relay Module (Social Media Publishing)
# Prerequisites: Server running at localhost:3000, valid session cookie
# Assumes seed data from tests/seed/seed-test-data.ts has been run
#
# KNOWN ISSUE (still broken): Publishing is simulated — will return fake post IDs.
# Deferred to a developer integration later. No session owns this fix.

BASE_URL="http://localhost:3000"
COOKIE="next-auth.session-token=YOUR_TOKEN_HERE"
PASS=0
FAIL=0
TOTAL=0

test_endpoint() {
    local name="$1"
    local method="$2"
    local url="$3"
    local expected_status="$4"
    local body="$5"

    TOTAL=$((TOTAL + 1))

    if [ -n "$body" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$url" \
            -H "Cookie: $COOKIE" \
            -H "Content-Type: application/json" \
            -d "$body")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$url" \
            -H "Cookie: $COOKIE")
    fi

    status=$(echo "$response" | tail -1)
    body_response=$(echo "$response" | sed '$d')

    if [ "$status" = "$expected_status" ]; then
        echo "✅ PASS: $name (HTTP $status)"
        PASS=$((PASS + 1))
    else
        echo "❌ FAIL: $name (Expected $expected_status, got $status)"
        echo "   Response: $(echo "$body_response" | head -3)"
        FAIL=$((FAIL + 1))
    fi
}

# Helper: check JSON field exists in last response
check_field() {
    local field="$1"
    echo "$body_response" | jq -e ".$field" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "  ✓ Field '$field' present"
    else
        echo "  ⚠ Field '$field' missing"
    fi
}

echo "=========================================="
echo "  Daftar API Tests — Relay Module"
echo "=========================================="
echo ""

# ---- Setup: get a brandId for post creation ----

echo "--- Setup ---"

setup_response=$(curl -s -X GET "$BASE_URL/api/brands" -H "Cookie: $COOKIE")
BRAND_ID=$(echo "$setup_response" | jq -r '.[0].id // empty')

if [ -z "$BRAND_ID" ]; then
    echo "  ⚠ No brand found in seed data. Post creation tests will use a placeholder."
    BRAND_ID="placeholder-brand-id"
fi
echo "  → Using brand ID: $BRAND_ID"

# ---- Happy Path Tests ----

echo ""
echo "--- Happy Path ---"

# GET /api/relay/posts — list posts (paginated)
test_endpoint "List relay posts" "GET" "/api/relay/posts" "200"
check_field "data"
check_field "total"
check_field "page"

# Capture first post ID if available
FIRST_POST_ID=$(echo "$body_response" | jq -r '.data[0].id // empty')
if [ -n "$FIRST_POST_ID" ]; then
    echo "  → First post ID: $FIRST_POST_ID"
fi

# POST /api/relay/posts — create post (title, platform, brandId required)
TIMESTAMP=$(date +%s)
CREATE_BODY="{\"title\":\"Test Post ${TIMESTAMP}\",\"content\":\"Test content for API testing\",\"platform\":\"linkedin\",\"brandId\":\"${BRAND_ID}\"}"
test_endpoint "Create relay post" "POST" "/api/relay/posts" "201" "$CREATE_BODY"
check_field "id"
check_field "title"
check_field "platform"
check_field "status"
check_field "brand"

# Store created post ID for cleanup
CREATED_POST_ID=$(echo "$body_response" | jq -r '.id')
echo "  → Created post ID: $CREATED_POST_ID"

# GET /api/relay/posts/[id] — get post detail
if [ -n "$CREATED_POST_ID" ] && [ "$CREATED_POST_ID" != "null" ]; then
    test_endpoint "Get post by ID" "GET" "/api/relay/posts/$CREATED_POST_ID" "200"
    check_field "id"
    check_field "title"
    check_field "platform"
fi

# GET /api/relay/calendar — get content calendar
test_endpoint "Get content calendar" "GET" "/api/relay/calendar" "200"

# POST /api/relay/posts — create scheduled post
FUTURE_DATE=$(date -d "+7 days" +%Y-%m-%dT%H:%M:%S 2>/dev/null || date -v+7d +%Y-%m-%dT%H:%M:%S 2>/dev/null || echo "2026-04-01T12:00:00")
SCHEDULED_BODY="{\"title\":\"Scheduled Post ${TIMESTAMP}\",\"content\":\"Scheduled content\",\"platform\":\"x\",\"brandId\":\"${BRAND_ID}\",\"scheduledAt\":\"${FUTURE_DATE}\"}"
test_endpoint "Create scheduled post" "POST" "/api/relay/posts" "201" "$SCHEDULED_BODY"
SCHEDULED_POST_ID=$(echo "$body_response" | jq -r '.id')
echo "  → Scheduled post ID: $SCHEDULED_POST_ID"

# GET /api/relay/analytics — relay analytics
test_endpoint "Get relay analytics" "GET" "/api/relay/analytics" "200"

# GET /api/relay/connections — list platform connections
test_endpoint "List platform connections" "GET" "/api/relay/connections" "200"

# ---- Error / Edge Case Tests ----

echo ""
echo "--- Error / Edge Cases ---"

# POST /api/relay/posts — invalid platform → 400
test_endpoint "Create post invalid platform → 400" "POST" "/api/relay/posts" "400" \
    "{\"title\":\"Bad Platform Post\",\"platform\":\"tiktok\",\"brandId\":\"${BRAND_ID}\"}"

# POST /api/relay/posts — missing title → 400
test_endpoint "Create post missing title → 400" "POST" "/api/relay/posts" "400" \
    "{\"platform\":\"linkedin\",\"brandId\":\"${BRAND_ID}\"}"

# POST /api/relay/posts — missing platform → 400
test_endpoint "Create post missing platform → 400" "POST" "/api/relay/posts" "400" \
    "{\"title\":\"No Platform\",\"brandId\":\"${BRAND_ID}\"}"

# POST /api/relay/posts — missing brandId → 400
test_endpoint "Create post missing brandId → 400" "POST" "/api/relay/posts" "400" \
    '{"title":"No Brand","platform":"linkedin"}'

# No cookie → 401
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/relay/posts")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: List posts without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: List posts without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# POST without auth → 401
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/relay/posts" \
    -H "Content-Type: application/json" \
    -d '{"title":"Unauth Post","platform":"linkedin","brandId":"fake"}')
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Create post without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Create post without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# ---- Cleanup ----

echo ""
echo "--- Cleanup ---"

for POST_ID in "$CREATED_POST_ID" "$SCHEDULED_POST_ID"; do
    if [ -n "$POST_ID" ] && [ "$POST_ID" != "null" ]; then
        echo "  → Cleaning up post: $POST_ID"
        cleanup_response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/relay/posts/$POST_ID" \
            -H "Cookie: $COOKIE")
        cleanup_status=$(echo "$cleanup_response" | tail -1)
        if [ "$cleanup_status" = "200" ] || [ "$cleanup_status" = "204" ]; then
            echo "  ✓ Post $POST_ID cleaned up successfully"
        else
            echo "  ⚠ Could not auto-delete post $POST_ID (HTTP $cleanup_status) — manual cleanup may be needed"
        fi
    fi
done

# ---- Summary ----

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed out of $TOTAL tests"
echo "=========================================="

exit $FAIL
