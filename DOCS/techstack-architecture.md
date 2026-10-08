# Restaurant Management System --- Tech Stack & Architecture

## 1. Architecture Overview

The Restaurant Management System is a multi-tenant SaaS web application
built using the MERN stack.

``` mermaid
flowchart TD
    USER[Platform Admin / Restaurant Owner / Staff]
    USER --> REACT[React Frontend]

    REACT --> API[Express REST API]
    API --> AUTH[JWT Authentication]
    API --> RBAC[Role-Based Authorization]
    API --> TENANT[Tenant Isolation Middleware]
    API --> SERVICES[Business Logic Services]

    SERVICES --> MONGO[(MongoDB Atlas)]

    API --> LOG[Logging / Error Handling]
```

The architecture is divided into:

1.  Frontend
2.  Backend API
3.  Business Logic
4.  Database
5.  Authentication/Authorization
6.  Multi-Tenant Isolation

------------------------------------------------------------------------

# 2. Technology Stack

  ---------------------------------------------------------------------------
  Layer                   Technology                  Purpose
  ----------------------- --------------------------- -----------------------
  Frontend                React.js                    User interface

  Routing                 React Router                Client-side routing

  State                   Context API / lightweight   Application state
                          state solution              

  Styling                 Tailwind CSS or suitable    UI
                          React UI library            

  Backend                 Node.js                     Runtime

  API                     Express.js                  REST API

  Database                MongoDB                     Application database

  ODM                     Mongoose                    MongoDB modeling

  Authentication          JWT                         Authentication

  Password Security       bcrypt/bcryptjs             Password hashing

  Validation              Zod/Joi/express-validator   Request validation

  Security                Helmet, CORS, rate limiting API security

  Development             Git + GitHub                Version control

  Database Hosting        MongoDB Atlas               Cloud database

  Frontend Hosting        Vercel/Netlify or           Frontend deployment
                          equivalent                  

  Backend Hosting         Render/Railway/Fly.io or    Backend deployment
                          equivalent                  
  ---------------------------------------------------------------------------

Use the final project decision consistently when implementation starts.

------------------------------------------------------------------------

# 3. System Architecture

``` text
                         USERS
                           |
                           v
                  +----------------+
                  | React Frontend |
                  +----------------+
                           |
                     HTTPS / REST
                           |
                           v
                  +----------------+
                  | Express API    |
                  +----------------+
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
   Authentication       RBAC          Tenant Isolation
          |                |                |
          +----------------+----------------+
                           |
                           v
                  +----------------+
                  | Controllers    |
                  +----------------+
                           |
                           v
                  +----------------+
                  | Services       |
                  +----------------+
                           |
                           v
                  +----------------+
                  | Mongoose       |
                  +----------------+
                           |
                           v
                  +----------------+
                  | MongoDB Atlas  |
                  +----------------+
```

------------------------------------------------------------------------

# 4. Multi-Tenant Architecture

Each restaurant is a tenant.

``` text
Platform
│
├── Restaurant R001
│   ├── Users
│   ├── Tables
│   ├── Menu
│   ├── Orders
│   ├── Reservations
│   ├── Queue
│   ├── Customers
│   ├── Bills
│   └── Payments
│
└── Restaurant R002
    ├── Users
    ├── Tables
    ├── Menu
    ├── Orders
    ├── Reservations
    ├── Queue
    ├── Customers
    ├── Bills
    └── Payments
```

Most restaurant-specific MongoDB documents should contain:

``` text
restaurantId
```

Example:

``` text
Order
├── _id
├── restaurantId
├── tableId
├── customerId
├── items
├── subtotal
├── tax
├── discount
├── total
├── paymentStatus
└── status
```

------------------------------------------------------------------------

# 5. Tenant Isolation Strategy

Use application-level tenant isolation.

When a user logs in, the authenticated context contains:

``` text
userId
role
restaurantId
```

For restaurant users, `restaurantId` identifies the tenant.

The backend should:

1.  Authenticate the user.
2.  Identify the user's restaurant.
3.  Check role permissions.
4.  Automatically scope restaurant queries by `restaurantId`.
5.  Verify that referenced resources belong to the same restaurant.

Never trust this from the frontend:

``` text
restaurantId = "R002"
```

when the authenticated user belongs to:

``` text
restaurantId = "R001"
```

The server should derive the tenant from the authenticated user.

------------------------------------------------------------------------

# 6. Authentication Architecture

Use JWT-based authentication.

``` mermaid
sequenceDiagram
    participant U as User
    participant F as React
    participant A as Express API
    participant DB as MongoDB

    U->>F: Login
    F->>A: POST /api/auth/login
    A->>DB: Find user
    DB-->>A: User
    A->>A: Verify password
    A->>A: Generate JWT
    A-->>F: JWT + user context
    F-->>U: Dashboard
```

JWT payload should conceptually contain:

``` text
userId
role
restaurantId
```

Do not store passwords in JWTs.

------------------------------------------------------------------------

# 7. Authorization Architecture

Use middleware such as:

``` text
authenticate
requireRole
requireRestaurantAccess
```

Example request flow:

``` text
Request
  ↓
JWT Authentication
  ↓
Authenticated User
  ↓
Role Check
  ↓
Tenant Check
  ↓
Controller
  ↓
Service
  ↓
Database
```

Example:

``` text
GET /api/orders
```

For a restaurant staff member:

``` text
authenticate()
        ↓
requireRole(RESTAURANT_STAFF)
        ↓
restaurantId = req.user.restaurantId
        ↓
Order.find({ restaurantId })
```

------------------------------------------------------------------------

# 8. Role Architecture

## Platform Admin

``` text
role = PLATFORM_ADMIN
restaurantId = null
```

Can access platform-level resources.

## Restaurant Owner

``` text
role = RESTAURANT_OWNER
restaurantId = R001
```

Can manage Restaurant R001.

## Restaurant Staff

``` text
role = RESTAURANT_STAFF
restaurantId = R001
```

Can perform operational activities for Restaurant R001.

------------------------------------------------------------------------

# 9. Frontend Architecture

Recommended structure:

``` text
client/
└── src/
    ├── assets/
    ├── components/
    │   ├── common/
    │   ├── tables/
    │   ├── orders/
    │   ├── menu/
    │   ├── reservations/
    │   ├── queue/
    │   └── billing/
    │
    ├── pages/
    │   ├── auth/
    │   ├── admin/
    │   └── restaurant/
    │
    ├── layouts/
    │   ├── AdminLayout.jsx
    │   └── RestaurantLayout.jsx
    │
    ├── routes/
    │   └── AppRoutes.jsx
    │
    ├── context/
    │   ├── AuthContext.jsx
    │   └── ...
    │
    ├── hooks/
    ├── services/
    │   ├── api.js
    │   ├── authService.js
    │   ├── tableService.js
    │   ├── orderService.js
    │   └── ...
    │
    ├── utils/
    └── App.jsx
```

------------------------------------------------------------------------

# 10. Frontend Routing

Use separate route groups.

``` text
/admin/*
/restaurant/*
/auth/*
```

Example:

``` text
/auth/login

/admin/dashboard
/admin/restaurants
/admin/applications
/admin/analytics

/restaurant/dashboard
/restaurant/tables
/restaurant/orders
/restaurant/menu
/restaurant/queue
/restaurant/reservations
/restaurant/billing
/restaurant/customers
/restaurant/reports
```

Route guards should prevent users from accessing unauthorized pages.

------------------------------------------------------------------------

# 11. Backend Architecture

Recommended structure:

``` text
server/
├── config/
│   ├── database.js
│   └── env.js
│
├── controllers/
│   ├── authController.js
│   ├── adminController.js
│   ├── restaurantController.js
│   ├── tableController.js
│   ├── menuController.js
│   ├── orderController.js
│   ├── billController.js
│   ├── queueController.js
│   ├── reservationController.js
│   ├── customerController.js
│   └── staffController.js
│
├── models/
│   ├── User.js
│   ├── Restaurant.js
│   ├── RestaurantApplication.js
│   ├── Table.js
│   ├── MenuItem.js
│   ├── Customer.js
│   ├── Order.js
│   ├── Reservation.js
│   ├── QueueEntry.js
│   ├── Bill.js
│   └── Payment.js
│
├── routes/
│   ├── authRoutes.js
│   ├── adminRoutes.js
│   ├── restaurantRoutes.js
│   ├── tableRoutes.js
│   ├── menuRoutes.js
│   ├── orderRoutes.js
│   ├── billRoutes.js
│   ├── queueRoutes.js
│   ├── reservationRoutes.js
│   ├── customerRoutes.js
│   └── staffRoutes.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   ├── tenantMiddleware.js
│   ├── validationMiddleware.js
│   └── errorMiddleware.js
│
├── services/
│   ├── orderService.js
│   ├── billingService.js
│   ├── queueService.js
│   ├── reservationService.js
│   └── ...
│
├── validators/
├── utils/
├── app.js
└── server.js
```

------------------------------------------------------------------------

# 12. Backend Request Flow

``` mermaid
flowchart TD
    A[HTTP Request] --> B[Express Router]
    B --> C[Authentication Middleware]
    C --> D[Role Middleware]
    D --> E[Tenant Middleware]
    E --> F[Validation Middleware]
    F --> G[Controller]
    G --> H[Service Layer]
    H --> I[Mongoose Model]
    I --> J[(MongoDB)]
    J --> I
    I --> H
    H --> G
    G --> K[HTTP Response]
```

------------------------------------------------------------------------

# 13. MongoDB Data Model

Core relationships:

``` mermaid
erDiagram
    RESTAURANT ||--o{ USER : has
    RESTAURANT ||--o{ TABLE : has
    RESTAURANT ||--o{ MENU_ITEM : has
    RESTAURANT ||--o{ CUSTOMER : has
    RESTAURANT ||--o{ ORDER : has
    RESTAURANT ||--o{ RESERVATION : has
    RESTAURANT ||--o{ QUEUE_ENTRY : has

    TABLE ||--o{ ORDER : receives
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ ORDER_ITEM : contains
    MENU_ITEM ||--o{ ORDER_ITEM : included_in
    CUSTOMER ||--o{ RESERVATION : makes
    TABLE ||--o{ RESERVATION : reserved_for
    ORDER ||--|| BILL : generates
    BILL ||--|| PAYMENT : paid_by
```

------------------------------------------------------------------------

# 14. Recommended Collections

## User

``` text
_id
restaurantId
name
email
passwordHash
role
status
createdAt
updatedAt
```

## Restaurant

``` text
_id
name
ownerId
email
phone
address
city
state
country
cuisine
status
subscriptionPlan
createdAt
updatedAt
```

## Table

``` text
_id
restaurantId
tableNumber
capacity
status
createdAt
updatedAt
```

## MenuItem

``` text
_id
restaurantId
name
description
category
price
image
isVegetarian
isAvailable
preparationTime
createdAt
updatedAt
```

## Customer

``` text
_id
restaurantId
name
phone
email
visitCount
lastVisit
notes
createdAt
updatedAt
```

## Order

``` text
_id
restaurantId
tableId
customerId
items
subtotal
discount
tax
total
status
paymentStatus
createdAt
updatedAt
```

## Reservation

``` text
_id
restaurantId
customerId
tableId
guestCount
date
startTime
endTime
status
notes
createdAt
updatedAt
```

## QueueEntry

``` text
_id
restaurantId
customerId
guestCount
arrivalTime
position
status
notes
createdAt
updatedAt
```

## Bill

``` text
_id
restaurantId
orderId
tableId
subtotal
discount
tax
total
status
createdAt
```

## Payment

``` text
_id
restaurantId
billId
amount
method
status
transactionReference
paidAt
```

------------------------------------------------------------------------

# 15. Indexing Strategy

Important indexes should include:

``` text
User:
- email
- restaurantId

Table:
- restaurantId + tableNumber
- restaurantId + status

MenuItem:
- restaurantId + category
- restaurantId + isAvailable

Order:
- restaurantId + status
- restaurantId + createdAt
- restaurantId + tableId

Reservation:
- restaurantId + date
- restaurantId + tableId
- restaurantId + status

QueueEntry:
- restaurantId + status
- restaurantId + arrivalTime

Customer:
- restaurantId + phone
```

Use compound indexes where they improve common tenant-scoped queries.

------------------------------------------------------------------------

# 16. Core Business Services

Use a service layer for business logic.

Recommended services:

### Order Service

Handles:

-   Creating orders
-   Adding items
-   Updating quantities
-   Removing items
-   Calculating totals
-   Order status transitions

### Billing Service

Handles:

-   Bill generation
-   Tax
-   Discount
-   Payment status
-   Closing orders
-   Releasing tables

### Queue Service

Handles:

-   Queue entry
-   FIFO ordering
-   Table capacity matching
-   Table suggestions
-   Seating customers
-   Queue status changes

### Reservation Service

Handles:

-   Reservation creation
-   Availability checks
-   Conflict detection
-   Reservation status
-   Table assignment

### Restaurant Service

Handles:

-   Restaurant onboarding
-   Restaurant status
-   Restaurant profile

------------------------------------------------------------------------

# 17. Table and Order Flow

``` mermaid
sequenceDiagram
    participant S as Staff
    participant F as React
    participant A as API
    participant DB as MongoDB

    S->>F: Select available table
    F->>A: Create order
    A->>DB: Create order
    DB-->>A: Order
    A-->>F: Order created

    S->>F: Add menu item
    F->>A: Update order
    A->>DB: Update order
    DB-->>A: Updated order
    A-->>F: Updated order
```

------------------------------------------------------------------------

# 18. Billing Flow

``` mermaid
sequenceDiagram
    participant S as Staff
    participant API as Express API
    participant DB as MongoDB

    S->>API: Generate bill
    API->>DB: Fetch active order
    DB-->>API: Order
    API->>API: Calculate subtotal/tax/discount
    API->>DB: Create bill
    API-->>S: Bill

    S->>API: Record payment
    API->>DB: Create payment
    API->>DB: Complete order
    API->>DB: Set table Available
    API-->>S: Payment successful
```

------------------------------------------------------------------------

# 19. Waiting Queue Architecture

``` mermaid
flowchart TD
    A[Customer Arrives] --> B{Suitable Table?}
    B -->|Yes| C[Assign Table]
    B -->|No| D[Create Queue Entry]
    D --> E[Wait]
    E --> F[Table Becomes Available]
    F --> G[Find Suitable Queue Entry]
    G --> H[Suggest Customer]
    H --> I[Staff Confirms]
    I --> C
    C --> J[Create Order]
```

Queue selection should consider:

1.  Waiting time
2.  Guest count
3.  Table capacity
4.  Restaurant-specific queue

------------------------------------------------------------------------

# 20. Reservation Architecture

``` mermaid
flowchart TD
    A[Create Reservation] --> B[Check Table Availability]
    B --> C{Conflict?}
    C -->|Yes| D[Reject / Suggest Alternative]
    C -->|No| E[Create Reservation]
    E --> F[Confirmed]
    F --> G[Customer Arrives]
    G --> H[Assign Table]
    H --> I[Occupied]
```

------------------------------------------------------------------------

# 21. Platform Admin Flow

``` mermaid
flowchart TD
    A[Restaurant Registration] --> B[Pending Application]
    B --> C[Platform Admin]
    C --> D{Decision}
    D -->|Approve| E[Activate Restaurant]
    D -->|Reject| F[Rejected]
    D -->|Suspend| G[Suspended]
    E --> H[Restaurant Dashboard]
```

------------------------------------------------------------------------

# 22. API Layer

Use RESTful routes.

Recommended structure:

``` text
/api/auth/*
/api/admin/*
/api/restaurants/*
/api/tables/*
/api/menu/*
/api/orders/*
/api/bills/*
/api/payments/*
/api/queue/*
/api/reservations/*
/api/customers/*
/api/staff/*
/api/reports/*
```

Controllers should remain thin. Business rules should primarily live in
services.

------------------------------------------------------------------------

# 23. API Error Handling

Use consistent response structures.

Success example:

``` json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

Error example:

``` json
{
  "success": false,
  "message": "You are not authorized to access this resource",
  "code": "FORBIDDEN"
}
```

Use appropriate HTTP status codes such as:

-   200 OK
-   201 Created
-   400 Bad Request
-   401 Unauthorized
-   403 Forbidden
-   404 Not Found
-   409 Conflict
-   422 Unprocessable Entity
-   500 Internal Server Error

------------------------------------------------------------------------

# 24. Security Architecture

Recommended middleware:

``` text
helmet
cors
rateLimiter
authenticateJWT
requireRole
requireTenant
validateRequest
errorHandler
```

Security principles:

-   Never store plaintext passwords.
-   Never expose password hashes.
-   Never trust client-provided tenant IDs.
-   Validate request bodies.
-   Sanitize database inputs.
-   Restrict CORS in production.
-   Keep secrets in environment variables.
-   Use HTTPS in production.
-   Apply authorization on every protected resource.

------------------------------------------------------------------------

# 25. Frontend State Management

Keep state simple.

Recommended approach:

### Global State

Use Context or a lightweight state library for:

-   Authentication
-   Current user
-   Current restaurant
-   Permissions

### Local State

Use component state for:

-   Forms
-   Modals
-   Filters
-   Temporary order edits

### Server State

Use a data-fetching/caching solution if the project needs it, such as
TanStack Query.

Do not introduce unnecessary state-management complexity.

------------------------------------------------------------------------

# 26. UI Architecture

Use reusable components.

Examples:

``` text
Button
Modal
TableCard
StatusBadge
DataTable
SearchBar
FilterBar
Pagination
OrderItem
OrderSummary
BillSummary
ReservationCard
QueueCard
DashboardCard
Sidebar
Navbar
```

Restaurant table cards should clearly display:

``` text
Table 05
4 Seats
Occupied
₹1,250 Active Order
```

------------------------------------------------------------------------

# 27. Environment Variables

Example:

``` text
PORT=
MONGODB_URI=
JWT_SECRET=
JWT_EXPIRES_IN=
CLIENT_URL=
NODE_ENV=
```

Never commit real secrets to GitHub.

Provide `.env.example` but not `.env`.

------------------------------------------------------------------------

# 28. Deployment Architecture

``` mermaid
flowchart LR
    USER[User Browser] --> CDN[Frontend Hosting]
    CDN --> FE[React App]
    FE --> API[Backend Hosting]
    API --> DB[(MongoDB Atlas)]
```

Suggested deployment options:

### Frontend

-   Vercel
-   Netlify
-   Similar React-compatible hosting

### Backend

-   Render
-   Railway
-   Fly.io
-   Similar Node.js-compatible hosting

### Database

-   MongoDB Atlas

------------------------------------------------------------------------

# 29. Development Environment

Recommended:

-   VS Code
-   Git
-   GitHub
-   Node.js LTS
-   npm
-   MongoDB Atlas
-   Postman/Insomnia
-   Browser DevTools

------------------------------------------------------------------------

# 30. Testing Architecture

Test at multiple levels:

``` text
Unit Tests
    ↓
Service Tests
    ↓
API Tests
    ↓
Integration Tests
    ↓
End-to-End Tests
```

Critical tests:

-   Authentication
-   Role authorization
-   Tenant isolation
-   Restaurant approval
-   Table assignment
-   Order creation
-   Billing
-   Queue matching
-   Reservation conflicts
-   Payment
-   Staff permissions

------------------------------------------------------------------------

# 31. Recommended Implementation Order

1.  Initialize frontend and backend.
2.  Configure MongoDB Atlas.
3.  Create User and Restaurant models.
4.  Implement authentication.
5.  Implement roles.
6.  Implement tenant middleware.
7.  Build Platform Admin.
8.  Build restaurant onboarding.
9.  Build Restaurant Dashboard.
10. Build table management.
11. Build menu.
12. Build orders.
13. Build billing/payment recording.
14. Build queue.
15. Build reservations.
16. Build customers.
17. Build staff management.
18. Build reports.
19. Add testing.
20. Add security hardening.
21. Deploy.

------------------------------------------------------------------------

# 32. Architecture Principles

Follow these principles:

-   Separation of concerns
-   Modular backend
-   Reusable frontend components
-   RESTful APIs
-   Service-oriented business logic
-   Strong tenant isolation
-   Role-based access control
-   Validation at API boundaries
-   Consistent error handling
-   Database indexing
-   Secure authentication
-   Minimal over-engineering
-   Clear naming conventions
-   Maintainable code

------------------------------------------------------------------------

# 33. Final Architecture

``` text
                         RESTAURANT MANAGEMENT SAAS
                                      |
                    +-----------------+-----------------+
                    |                                   |
             PLATFORM ADMIN                       RESTAURANT
              DASHBOARD                           DASHBOARD
                    |                                   |
        +-----------+-----------+            +----------+----------+
        |           |           |            |          |          |
   Restaurants  Applications Analytics     Tables     Orders   Reservations
                                             |          |
                                           Queue      Billing
                                             |
                                      Menu / Customers
                                             |
                                           Staff
                                             |
                                          Reports
```

The key architecture rule is:

**Platform Admin manages the platform. Restaurant users manage their
restaurant. Restaurant data is isolated by tenant.**

This separation should remain consistent throughout the frontend,
backend, database, API, authentication, authorization, and deployment
architecture.
