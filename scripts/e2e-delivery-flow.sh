#!/usr/bin/env bash
# ------------------------------------------------------------------------------
# End-to-end check of the Delivery Management workflow against a running backend.
#   1. customer picks a courier partner and confirms the order
#   2. the Delivery Management page receives the live update (SSE)
#   3. coordinator approves, then assigns the courier
#   4. courier picks up and delivers using the customer's OTP
# plus security / validation negative checks.
#
# Usage: ./scripts/e2e-delivery-flow.sh   (backend on http://localhost:8080)
# ------------------------------------------------------------------------------
set -uo pipefail
B="${API_BASE:-http://localhost:8080}"
PASS=0; FAIL=0
TMP="$(mktemp -d)"
trap 'kill $SSE_PID 2>/dev/null; rm -rf "$TMP"' EXIT

check() { # name expected actual
  if [[ "$2" == "$3" ]]; then echo "  PASS  $1"; PASS=$((PASS+1)); else echo "  FAIL  $1 (expected $2, got $3)"; FAIL=$((FAIL+1)); fi
}
json() { python3 -c 'import sys,json; d=json.load(sys.stdin); print(eval("d"+sys.argv[1]))' "$1"; }
login() { # email -> token (admin portal for staff, customer portal otherwise)
  local path="/api/v1/auth/login"; [[ "$2" == staff ]] && path="/api/v1/auth/admin/login"
  curl -s -X POST "$B$path" -H 'Content-Type: application/json' -d "{\"email\":\"$1\",\"password\":\"admin123\"}" | json "['data']['token']"
}
code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

echo "== Login"
CUST=$(login customer1@gmail.com customer)
COORD=$(login deliverycoordinator1@gmail.com staff)
[[ -n "$CUST" && -n "$COORD" ]] && echo "  customer + coordinator logged in"

echo "== Delivery page subscribes to live updates (SSE channel 'deliveries')"
curl -s -N "$B/api/v1/realtime/stream/deliveries" > "$TMP/sse.txt" &
SSE_PID=$!
sleep 1

echo "== 1. Customer chooses courier partner and confirms the order"
PARTNERS=$(curl -s "$B/api/v1/customer/deliveries/courier-partners" | json "['data'].__len__()")
check "courier partners listed publicly" 4 "$PARTNERS"
RESP=$(curl -s -X POST "$B/api/v1/customer/deliveries" -H "Authorization: Bearer $CUST" -H 'Content-Type: application/json' -d '{
  "preferredCourier":"Koombiyo","deliveryAddress":"12 Flower Road, Colombo 07","customerPhone":"0771234567",
  "specialInstructions":"Call on arrival","deliveryFee":500,
  "items":[{"medicineId":1,"name":"Amoxil 500mg","quantity":2,"unitPrice":1},{"name":"Gift note","quantity":1,"unitPrice":50}]}')
ID=$(echo "$RESP" | json "['data']['id']")
check "delivery created as PENDING" PENDING "$(echo "$RESP" | json "['data']['status']")"
check "preferred courier stored" Koombiyo "$(echo "$RESP" | json "['data']['preferredCourier']")"
ORDER_ID=$(echo "$RESP" | json "['data']['orderId']")
echo "  delivery #$ID, order #$ORDER_ID, total $(echo "$RESP" | json "['data']['orderTotal']")"

echo "== 2. Delivery Management page got the update"
sleep 1
grep -q "event:DELIVERY_REQUESTED" "$TMP/sse.txt" && check "SSE pushed DELIVERY_REQUESTED" yes yes || check "SSE pushed DELIVERY_REQUESTED" yes no
PENDING_LIST=$(curl -s "$B/api/v1/deliveries?status=PENDING" -H "Authorization: Bearer $COORD")
echo "$PENDING_LIST" | grep -q "\"id\":$ID," && check "appears in coordinator's Pending queue" yes yes || check "appears in Pending queue" yes no
echo "$PENDING_LIST" | grep -qi "otp\":\"[0-9]" && check "staff view hides OTP" yes no || check "staff view hides OTP" yes yes

echo "== 3. Coordinator approves, then assigns the courier"
check "assign before approval is blocked (409)" 409 "$(code -X PUT "$B/api/v1/deliveries/assign" -H "Authorization: Bearer $COORD" -H 'Content-Type: application/json' -d "{\"deliveryIds\":[$ID]}")"
check "approve" APPROVED "$(curl -s -X PUT "$B/api/v1/deliveries/$ID/approve" -H "Authorization: Bearer $COORD" -H 'Content-Type: application/json' -d '{"note":"Stock checked"}' | json "['data']['status']")"
check "order synced to PROCESSING" PROCESSING "$(curl -s "$B/api/v1/orders/my-orders" -H "Authorization: Bearer $CUST" | python3 -c "import sys,json; print([o['status'] for o in json.load(sys.stdin)['data'] if o['id']==$ORDER_ID][0])")"
ASSIGN=$(curl -s -X PUT "$B/api/v1/deliveries/assign" -H "Authorization: Bearer $COORD" -H 'Content-Type: application/json' -d "{\"deliveryIds\":[$ID],\"route\":\"Colombo 1 - 5\"}")
check "assigned -> DISPATCHED" DISPATCHED "$(echo "$ASSIGN" | json "['data'][0]['status']")"
check "defaults to customer's courier" Koombiyo "$(echo "$ASSIGN" | json "['data'][0]['assignedCourier']")"

echo "== 4. Courier delivers with the customer's OTP"
OTP=$(curl -s "$B/api/v1/customer/deliveries/$ID" -H "Authorization: Bearer $CUST" | json "['data']['handoverOtp']")
echo "  customer sees OTP on tracking page: $OTP"
check "courier marks IN_TRANSIT" 200 "$(code -X PUT "$B/api/v1/courier/deliveries/$ID/status" -H "Authorization: Bearer $COORD" -H 'Content-Type: application/json' -d '{"status":"IN_TRANSIT"}')"
WRONG=$([[ "$OTP" == "0000" ]] && echo 9999 || echo 0000)
# Build JSON bodies first: a comma inside "$( ... -d "{...}")" is subject to brace expansion.
WRONG_BODY='{"status":"DELIVERED","otp":"'"$WRONG"'"}'
RIGHT_BODY='{"status":"DELIVERED","otp":"'"$OTP"'"}'
check "wrong OTP rejected (400)" 400 "$(code -X PUT "$B/api/v1/courier/deliveries/$ID/status" -H "Authorization: Bearer $COORD" -H 'Content-Type: application/json' -d "$WRONG_BODY")"
check "correct OTP delivers" DELIVERED "$(curl -s -X PUT "$B/api/v1/courier/deliveries/$ID/status" -H "Authorization: Bearer $COORD" -H 'Content-Type: application/json' -d "$RIGHT_BODY" | json "['data']['status']")"
TL=$(curl -s "$B/api/v1/deliveries/$ID/timeline" -H "Authorization: Bearer $COORD" | python3 -c 'import sys,json; print(" -> ".join(e["eventType"] for e in json.load(sys.stdin)["data"]))')
echo "  timeline: $TL"
check "timeline has 6 events" 6 "$(curl -s "$B/api/v1/deliveries/$ID/timeline" -H "Authorization: Bearer $COORD" | json "['data'].__len__()")"

echo "== Security & validation"
check "anonymous cannot list deliveries (401)" 401 "$(code "$B/api/v1/deliveries")"
check "anonymous cannot update courier status (401)" 401 "$(code -X PUT "$B/api/courier/deliveries/$ID/status" -H 'Content-Type: application/json' -d '{"status":"IN_TRANSIT"}')"
check "customer cannot open coordinator console (403)" 403 "$(code "$B/api/v1/deliveries" -H "Authorization: Bearer $CUST")"
check "coordinator cannot place customer orders (403)" 403 "$(code -X POST "$B/api/v1/customer/deliveries" -H "Authorization: Bearer $COORD" -H 'Content-Type: application/json' -d '{}')"
check "unknown courier partner rejected (400)" 400 "$(code -X POST "$B/api/v1/customer/deliveries" -H "Authorization: Bearer $CUST" -H 'Content-Type: application/json' -d '{"preferredCourier":"FedEx","deliveryAddress":"12 Flower Road","customerPhone":"0771234567","items":[{"name":"x","quantity":1,"unitPrice":1}]}')"
check "empty cart rejected (400)" 400 "$(code -X POST "$B/api/v1/customer/deliveries" -H "Authorization: Bearer $CUST" -H 'Content-Type: application/json' -d '{"preferredCourier":"DHL","deliveryAddress":"12 Flower Road","customerPhone":"0771234567","items":[]}')"
check "bad phone rejected (400)" 400 "$(code -X POST "$B/api/v1/customer/deliveries" -H "Authorization: Bearer $CUST" -H 'Content-Type: application/json' -d '{"preferredCourier":"DHL","deliveryAddress":"12 Flower Road","customerPhone":"abc","items":[{"name":"x","quantity":1,"unitPrice":1}]}')"
check "reject without reason (400)" 400 "$(code -X PUT "$B/api/v1/deliveries/$ID/reject" -H "Authorization: Bearer $COORD" -H 'Content-Type: application/json' -d '{"reason":""}')"
check "missing delivery is 404" 404 "$(code "$B/api/v1/deliveries/999999" -H "Authorization: Bearer $COORD")"
check "self-registering SYSTEM_ADMIN is refused (403)" 403 "$(code -X POST "$B/api/v1/auth/register" -H 'Content-Type: application/json' -d '{"fullName":"Mallory","email":"mallory@x.com","password":"secret12","contactNumber":"0771234567","role":"SYSTEM_ADMIN"}')"
check "anonymous cannot list all orders (401)" 401 "$(code "$B/api/v1/orders")"
check "customer cannot list all orders (403)" 403 "$(code "$B/api/v1/orders" -H "Authorization: Bearer $CUST")"

echo
echo "Result: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
