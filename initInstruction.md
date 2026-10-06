# MediOrder Phase 1 Baseline Architecture & Implementation Specification

This specification outlines the foundational setup, local authentication system, and frontend scaffolding for Phase 1 of the MediOrder platform.

---

## 1. Technical Prerequisites & Dependencies

Before generating application source code, configure the build tools and project metadata. 
-allow_access : to open vscode in the same project folder
-allow_access : to install all the dependencies needed for the vscode to run the spirngboot application + maven
-allow_access : to install all the libraries required for the project

### Backend: Maven Configuration (`backend/pom.xml`)
Initialize a Spring Boot 4.x project using Java 26 with the following starter modules:

*   **`spring-boot-starter-web`**: Exposes RESTful endpoints and sets up embedded Tomcat.
*   **`spring-boot-starter-data-jpa`**: Manages entity persistence, repositories, and Hibernate lifecycle.
*   **`spring-boot-starter-security`**: Configures authorization filters and authentication pipelines.
*   **`mysql-connector-j`**: Provides JDBC transport for MySQL 8+.
*   **`jjwt-api` / `jjwt-impl` / `jjwt-jackson`**: Issues and verifies stateless JWT tokens.
*   **`lombok`**: Removes boilerplate for POJOs, entities, and DTOs.
*   **`spring-boot-starter-validation`**: Validates request payloads (e.g., email format, password constraints).

### Frontend: Vite & React Setup (`frontend/package.json`)
Initialize the React SPA using the Vite build tool:

*   **`react-router-dom`**: Handles client-side navigation across views.
*   **`axios`**: Centralized HTTP client configured with base URLs and interceptors.
*   **`lucide-react`**: Provides interface icons for action buttons and status cards.
*   **Tailwind CSS**: Utility-first styling for accessible, responsive views.

### Instructions to build the initial base of the springboot project
* everywhere change mediorder --> online_pharmacy (including folder names, sub folder names)
* install database using mySQL & JPA entities, use the database schema: medical_system_db
* build for user: entity, repository, authService, AuthController, AuthContext; instructions: user attributes fullname, email, password, contact number, role (customer, admin), createdAt (account creation date), userID; email/userid should be the primary keys to identify each user(findByEmail|existsByEmail); security_config: use BcryptPasswordEncoder & configure security Filter chain.
* Any user who goes to the local address will directed to the landing page, users must have sessions tokens it should be refreshed until the perticular user logs out. In the landing page users have option to login/register (if user is already logged in an accout symbol is shown in the top nav bar). 
* Landing page should only have 6 button and a nav bar(navbar: must havev login|register --> if not logged in, account access symbo --> if already logged in), 4buttons (buttons with 6 different colours and with names of the core functions;{prescription test, inventory & expiry management, real time order processing, cold chain tagging & logistics security, automatic medicine refil & subscription management, Delivery management & notification engine})
* set base url: http://localhost:8080/


## 2. Directory Layout & Artifact Mapping

This structure maintains separation of concerns across both frontend and backend modules, use the same structure to organize the files in the project folder, create all the folder required even source codes aren't build yet :

```text
mediorder/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/mediorder/
│       │   │   ├── config/
│       │   │   │   ├── SecurityConfig.java
│       │   │   │   ├── CorsConfig.java
│       │   │   │   └── JwtTokenProvider.java
│       │   │   ├── controller/
│       │   │   │   ├── AuthController.java
│       │   │   │   └── HealthController.java
│       │   │   ├── dto/
│       │   │   │   ├── AuthRequest.java
│       │   │   │   ├── AuthResponse.java
│       │   │   │   └── UserResponse.java
│       │   │   ├── model/
│       │   │   │   ├── User.java
│       │   │   │   └── Role.java
│       │   │   ├── repository/
│       │   │   │   └── UserRepository.java
│       │   │   └── service/
│       │   │       ├── AuthService.java
│       │   │       └── CustomUserDetailsService.java
│       │   └── resources/
│       │       ├── application.yml.example
│       │       └── application.yml
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api/
│       │   └── client.js
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── ProtectedRoute.jsx
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── RegisterPage.jsx
│       │   ├── ProfilePage.jsx
│       │   └── modules/
│       │       ├── PrescriptionPage.jsx
│       │       ├── InventoryPage.jsx
│       │       ├── OrderProcessingPage.jsx
│       │       ├── ColdChainPage.jsx
│       │       ├── SubscriptionsPage.jsx
│       │       └── DeliveryPage.jsx
│       ├── App.jsx
│       └── main.jsx
└── .gitignore

