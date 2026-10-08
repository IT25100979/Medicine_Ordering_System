# Prompt for Antigravity: Delivery Management Module Update

**Target Application:** Spring Boot Application
**Target Package:** `it25100979_delivery_management`

## Overview
Please refactor and update the delivery management module under the `it25100979_delivery_management` package. You will need to remove the existing delivery management section entirely and replace it with a new flow handling customer deliveries, batching, courier assignment, and status tracking. 

Please follow the detailed instructions below for Database Entities, REST API Endpoints, Business Logic, and UI Layout.

---

## 1. Code Cleanup
- Locate the existing delivery management section under "all sections" and completely remove its associated frontend components, backend controllers, and obsolete services.

## 2. Database Entities & Seed Data

### A. Delivery & Batch Entities
Create or update entities to handle single and batched deliveries. 
- **Fields required per Delivery:**
  - `deliveryId` (Unique identifier)
  - `batchId` (Nullable, connects multiple deliveries)
  - `customerName` (Who orders)
  - `orderAddress`
  - `customerPhone`
  - `customerEmail`
  - `specialInstructions` (Includes cold chain requirements)
  - `validatingPharmacist` (Name/ID of pharmacist who validated the prescription, if attached)
  - `arrangingStaff` (Name/ID of the person who arranged the medications)
  - `status` (Enum: `PENDING`, `DISPATCHED`, `IN_TRANSIT`, `DELIVERED`, `FAILED`)

### B. Delivery Routes (Geofenced Areas)
- **Action:** Remove all existing delivery zones. 
- **Seed/Add the following exact route data:**
  - City: `Colombo 1 - 5`
  - Postal Code: `0100 - 0500`
  - Status: `Active`
  - Delivery Fee: `500 Rs`
  - Estimated Time: `1 hour`

### C. Delivery Couriers
- **Action:** Create an Entity or Enum for Couriers with the following specific options:
  - `DHL`
  - `Koombiyo`
  - `Lanka Delivery`
  - `In Company Delivery`

---

## 3. Backend Endpoints (REST API)

### Delivery Management API
- **POST `/api/deliveries`**: Endpoint to receive new deliveries from customers, show related entities, and persist them to the database.
- **PUT `/api/deliveries/assign`**: Endpoint to select a single delivery or a batch of deliveries (by ID) and assign a `Delivery Route` and a `Delivery Courier`.
- **PUT `/api/deliveries/{id}/action`**: Endpoint to perform specific actions on a delivery/batch. Supported actions:
  - `TERMINATE`
  - `HOLD` (Hold without sending to delivery)
  - `POSTPONE`

### Courier API
- **GET `/api/courier/deliveries`**: Endpoint tailored strictly for couriers. It must **only** return:
  - `deliveryId` / `batchId`
  - `customerName` (Recipient)
  - `orderAddress`
  - `customerPhone`
- **PUT `/api/courier/deliveries/{id}/status`**: Endpoint for couriers to update the delivery status. 
  - Allow direct updates to `IN_TRANSIT` and `FAILED`.
  - For `DELIVERED`, strictly require a valid `OTP` in the request payload.

---

## 4. Business Logic & State Transitions
- **Initial State:** All new deliveries must default to the `PENDING` status.
- **Dispatching:** Once a delivery (or batch) is assigned a route/courier and transferred from the management section to the Courier's queue, the status must automatically change from `PENDING` to `DISPATCHED`.
- **OTP Verification:** Implement logic to generate, store, and verify an OTP for the customer. The system must validate this OTP when the courier attempts to mark a delivery as `DELIVERED`.

---

## 5. Frontend & UI Requirements

### General Layout Constraints
- **Do not render sections one below the other.**
- Implement a tabbed or routed navigational structure. When a user clicks on a specific section (e.g., Delivery Management, Courier Dashboard), **only** that section should be visible on the page.

### Delivery Management View
- Display a comprehensive table/grid of deliveries containing all the fields mentioned in 2A.
- Implement filtering tags/buttons based on status: `Pending`, `Dispatched`, `In Transit`, `Delivered`, `Failed`.
- Provide UI controls (checkboxes) to select single or multiple deliveries for batching, and dropdowns to assign routes and couriers.
- Provide action buttons for `Terminate`, `Hold`, and `Postpone`.

### Courier View
- Display a simplified view showing only: ID, Recipient Name, Address, and Phone.
- Provide action buttons for the courier:
  - Mark as `In Transit`
  - Mark as `Failed`
  - Mark as `Delivered` (Clicking this should prompt a modal/input field to enter the customer's OTP).