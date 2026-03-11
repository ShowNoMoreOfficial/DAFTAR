#!/bin/bash
# Daftar API Tests — Communication Module (Announcements + Feedback)
# Prerequisites: Server running at localhost:3000, valid session cookie
# Assumes seed data from tests/seed/seed-test-data.ts has been run

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
echo "  Daftar API Tests — Communication Module"
echo "=========================================="
echo ""

# ---- Happy Path Tests ----

echo "--- Happy Path ---"

# GET /api/communication/announcements — list
test_endpoint "List announcements" "GET" "/api/communication/announcements" "200"
check_field "data"
check_field "total"

# Capture first announcement ID if available
FIRST_ANNOUNCEMENT_ID=$(echo "$body_response" | jq -r '.data[0].id // empty')
if [ -n "$FIRST_ANNOUNCEMENT_ID" ]; then
    echo "  → First announcement ID: $FIRST_ANNOUNCEMENT_ID"
fi

# POST /api/communication/announcements — create (ADMIN, HEAD_HR, DEPT_HEAD)
TIMESTAMP=$(date +%s)
CREATE_ANN_BODY="{\"title\":\"Test Announcement ${TIMESTAMP}\",\"content\":\"This is an API test announcement.\",\"priority\":\"NORMAL\"}"
test_endpoint "Create announcement" "POST" "/api/communication/announcements" "201" "$CREATE_ANN_BODY"
check_field "id"
check_field "title"
check_field "content"
check_field "priority"
check_field "authorId"

CREATED_ANN_ID=$(echo "$body_response" | jq -r '.id')
echo "  → Created announcement ID: $CREATED_ANN_ID"

# POST /api/communication/announcements/[id]/read — mark as read
if [ -n "$CREATED_ANN_ID" ] && [ "$CREATED_ANN_ID" != "null" ]; then
    test_endpoint "Mark announcement as read" "POST" "/api/communication/announcements/$CREATED_ANN_ID/read" "200"
fi

# POST /api/communication/announcements — create pinned, high priority
CREATE_PINNED_BODY="{\"title\":\"Pinned Announcement ${TIMESTAMP}\",\"content\":\"Pinned high-priority test.\",\"priority\":\"HIGH\",\"isPinned\":true}"
test_endpoint "Create pinned announcement" "POST" "/api/communication/announcements" "201" "$CREATE_PINNED_BODY"
CREATED_PINNED_ANN_ID=$(echo "$body_response" | jq -r '.id')
echo "  → Created pinned announcement ID: $CREATED_PINNED_ANN_ID"

# GET /api/communication/announcements?pinned=true — filter pinned
test_endpoint "List pinned announcements" "GET" "/api/communication/announcements?pinned=true" "200"
check_field "data"

# GET /api/communication/feedback/channels — list channels
test_endpoint "List feedback channels" "GET" "/api/communication/feedback/channels" "200"

# Get first channel ID for feedback submission
FIRST_CHANNEL_ID=$(echo "$body_response" | jq -r '.[0].id // (.data[0].id) // empty')
if [ -n "$FIRST_CHANNEL_ID" ]; then
    echo "  → First feedback channel ID: $FIRST_CHANNEL_ID"
fi

# POST /api/communication/feedback/entries — submit feedback
if [ -n "$FIRST_CHANNEL_ID" ] && [ "$FIRST_CHANNEL_ID" != "null" ] && [ "$FIRST_CHANNEL_ID" != "placeholder" ]; then
    FEEDBACK_BODY="{\"channelId\":\"${FIRST_CHANNEL_ID}\",\"content\":\"Test feedback from API tests ${TIMESTAMP}\"}"
    test_endpoint "Submit feedback entry" "POST" "/api/communication/feedback/entries" "201" "$FEEDBACK_BODY"
    check_field "id"
    check_field "content"
    check_field "channel"

    CREATED_FEEDBACK_ID=$(echo "$body_response" | jq -r '.id')
    echo "  → Created feedback entry ID: $CREATED_FEEDBACK_ID"

    # Test anonymous feedback: check that on anonymous channels, userId is null
    IS_ANONYMOUS=$(echo "$body_response" | jq -r '.channel.isAnonymous // false')
    if [ "$IS_ANONYMOUS" = "true" ]; then
        USER_ID_IN_RESPONSE=$(echo "$body_response" | jq -r '.userId')
        if [ "$USER_ID_IN_RESPONSE" = "null" ]; then
            echo "  ✓ Anonymous feedback: userId is null (correct)"
        else
            echo "  ⚠ Anonymous feedback: userId should be null but got '$USER_ID_IN_RESPONSE'"
        fi
    else
        echo "  (Channel is not anonymous — userId included as expected)"
    fi
else
    echo "  ⚠ No feedback channel available — skipping feedback entry tests"
fi

# GET /api/communication/feedback/entries — list feedback entries
test_endpoint "List feedback entries" "GET" "/api/communication/feedback/entries" "200"
check_field "data"
check_field "total"

# ---- Error / Edge Case Tests ----

echo ""
echo "--- Error / Edge Cases ---"

# POST /api/communication/announcements — missing title → 400
test_endpoint "Create announcement missing title → 400" "POST" "/api/communication/announcements" "400" \
    '{"content":"Missing title"}'

# POST /api/communication/announcements — missing content → 400
test_endpoint "Create announcement missing content → 400" "POST" "/api/communication/announcements" "400" \
    '{"title":"Missing content"}'

# POST /api/communication/feedback/entries — missing channelId → 400
test_endpoint "Submit feedback missing channelId → 400" "POST" "/api/communication/feedback/entries" "400" \
    '{"content":"Missing channel"}'

# POST /api/communication/feedback/entries — missing content → 400
test_endpoint "Submit feedback missing content → 400" "POST" "/api/communication/feedback/entries" "400" \
    "{\"channelId\":\"${FIRST_CHANNEL_ID}\"}"

# POST /api/communication/feedback/entries — nonexistent channel → 404
test_endpoint "Submit feedback to nonexistent channel → 404" "POST" "/api/communication/feedback/entries" "404" \
    '{"channelId":"nonexistent-channel-id-12345","content":"Bad channel test"}'

# No cookie → 401 on announcements
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/communication/announcements")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Announcements without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Announcements without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# No cookie → 401 on feedback channels
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/communication/feedback/channels")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Feedback channels without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Feedback channels without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# No cookie → 401 on feedback entries
TOTAL=$((TOTAL + 1))
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/communication/feedback/entries")
status=$(echo "$response" | tail -1)
body_response=$(echo "$response" | sed '$d')
if [ "$status" = "401" ]; then
    echo "✅ PASS: Feedback entries without auth → 401 (HTTP $status)"
    PASS=$((PASS + 1))
else
    echo "❌ FAIL: Feedback entries without auth → 401 (Expected 401, got $status)"
    echo "   Response: $(echo "$body_response" | head -3)"
    FAIL=$((FAIL + 1))
fi

# ---- Cleanup ----

echo ""
echo "--- Cleanup ---"

for ANN_ID in "$CREATED_ANN_ID" "$CREATED_PINNED_ANN_ID"; do
    if [ -n "$ANN_ID" ] && [ "$ANN_ID" != "null" ]; then
        echo "  → Cleaning up announcement: $ANN_ID"
        cleanup_response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/communication/announcements/$ANN_ID" \
            -H "Cookie: $COOKIE")
        cleanup_status=$(echo "$cleanup_response" | tail -1)
        if [ "$cleanup_status" = "200" ] || [ "$cleanup_status" = "204" ]; then
            echo "  ✓ Announcement $ANN_ID cleaned up successfully"
        else
            echo "  ⚠ Could not auto-delete announcement $ANN_ID (HTTP $cleanup_status) — manual cleanup may be needed"
        fi
    fi
done

if [ -n "$CREATED_FEEDBACK_ID" ] && [ "$CREATED_FEEDBACK_ID" != "null" ]; then
    echo "  → Cleaning up feedback entry: $CREATED_FEEDBACK_ID"
    cleanup_response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/communication/feedback/entries/$CREATED_FEEDBACK_ID" \
        -H "Cookie: $COOKIE")
    cleanup_status=$(echo "$cleanup_response" | tail -1)
    if [ "$cleanup_status" = "200" ] || [ "$cleanup_status" = "204" ]; then
        echo "  ✓ Feedback entry cleaned up successfully"
    else
        echo "  ⚠ Could not auto-delete feedback entry $CREATED_FEEDBACK_ID (HTTP $cleanup_status) — manual cleanup may be needed"
    fi
fi

# ---- Summary ----

echo ""
echo "=========================================="
echo "Results: $PASS passed, $FAIL failed out of $TOTAL tests"
echo "=========================================="

exit $FAIL
