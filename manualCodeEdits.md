# Antigravity Prompt: Build Delivery Management Dashboard & Backend

Copy and paste the prompt below directly into the Antigravity chat window:

```text
Build the Delivery Management core function for the MediOrder project. Implement the backend CRUD operations, database entity updates, and the React frontend dashboard based on the exact specifications below. Skip the Notification Engine for now.

### 1. Backend: Entities and Mock Adjustments
Update or create the `Delivery` JPA entity in `backend/src/main/java/com/mediorder/model/Delivery.java` to strictly match these attributes. If existing fields contradict this, replace them:
- `id` (Long, Primary Key, Auto-increment)
- `userId` (Long) - ID of the customer receiving the delivery.
- `description` (String) - Details about the delivery.
- `pharmacistId` (Long) - ID of the pharmacist who approved/prepared it.
- `deliveryAddress` (String) - The destination address.
- `coldChainTag` (Boolean) - True if it requires cold-chain transport.
- `initialDate` (LocalDate) - The scheduled start date of the delivery.
- `finalDate` (LocalDate) - The actual or expected completion date.
- `status` (String) - Enum or String (e.g., 'PENDING', 'SUCCESSFUL', 'UNSUCCESSFUL').

Ensure any dependent mock classes (like `User`) in `com.mediorder.external.model` are updated if necessary to support this compilation without errors. Update `schema.sql` if `spring.jpa.hibernate.ddl-auto` is not handling the schema creation.

### 2. Backend: API & Security (RBAC)
Create the `DeliveryController`, `DeliveryService`, and `DeliveryRepository`:
- **POST /api/v1/deliveries**: Create a new delivery record.
- **GET /api/v1/deliveries**: Retrieve all delivery records.
- **PUT /api/v1/deliveries/{id}/status**: Update the delivery status (Successful/Unsuccessful).
- **DELETE /api/v1/deliveries/{id}**: Delete a delivery record from the database.

Update `SecurityConfig.java` and Controller endpoints to enforce Role-Based Access Control (RBAC). Only the following roles can access these delivery endpoints:
- `DELIVERY_COORDINATOR`
- `ADMIN`
- `CHIEF_PHARMACIST`
- `OPERATIONS_MANAGER`
*(Customers and other roles must receive a 403 Forbidden).*

### 3. Frontend: React Dashboard (`frontend/src/pages/modules/DeliveryPage.jsx`)
Build the Delivery Management Dashboard mirroring the database structure:
- **Input Form (Top Section)**: Create a form with inputs for User ID, Description, Pharmacist ID, Delivery Address, Cold-Chain Tag (Checkbox), Initial Date, and Final Date.
- **Publish Button**: A button below the form to submit the data (POST) and immediately update the table below.
- **Data Table (Bottom Section)**: A table displaying all saved deliveries mapping directly to the database columns.
- **Row Actions**: 
  - Next to the status/columns in each row, include a green **"Successful"** button and a red **"Unsuccessful"** button that trigger a PUT request to update the status.
  - At the far right end of each row, include a red **"Delete"** button that triggers a DELETE request and removes the row from the table and database.

Ensure all React state synchronizes with the backend via Axios so that publishing, status updates, and deletions reflect instantly on the UI and in the database. Apply these file creations and modifications directly to the workspace.