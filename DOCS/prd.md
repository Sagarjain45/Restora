# Restaurant Management System --- Product Requirements Document

## 1. Product Overview

The Restaurant Management System is a multi-tenant SaaS web application
built using the MERN stack. The platform allows multiple restaurants to
register and operate their restaurant through an isolated restaurant
dashboard, while the platform owner manages restaurants through a
separate Platform Admin dashboard.

The system focuses on restaurant operations such as table management,
table-based ordering, billing, waiting queues, reservations, menu
management, customer management, staff management, and reports.

### Core Technology

-   Frontend: React.js
-   Backend: Node.js + Express.js
-   Database: MongoDB
-   Authentication: JWT
-   API: REST API
-   Architecture: Multi-tenant SaaS
-   Deployment: Cloud-ready

------------------------------------------------------------------------

## 2. Problem Statement

Restaurants often manage tables, orders, reservations, waiting
customers, menus, and billing using disconnected manual processes or
separate systems.

The proposed system provides a centralized platform where restaurant
staff can manage the complete customer journey:

**Reservation / Walk-in → Table Assignment → Order → Billing → Payment →
Table Available**

The platform also provides a SaaS-level administration layer so that
multiple restaurants can use the same application while keeping their
data isolated.

------------------------------------------------------------------------

## 3. Goals and Objectives

### Primary Goals

1.  Provide a centralized restaurant operations platform.
2.  Support multiple restaurants from one SaaS application.
3.  Provide separate Platform Admin and Restaurant dashboards.
4.  Track restaurant tables in real time from the application's
    perspective.
5.  Associate orders and bills with specific tables.
6.  Manage waiting customers using a queue.
7.  Manage table reservations.
8.  Provide menu, customer, staff, billing, and reporting functionality.
9.  Enforce strict tenant/data isolation.
10. Provide a clean and easy-to-use interface for restaurant staff.

### Project Goals

-   Demonstrate MERN stack development.
-   Demonstrate REST API design.
-   Demonstrate authentication and role-based authorization.
-   Demonstrate MongoDB relationships and indexing.
-   Demonstrate multi-tenant architecture.
-   Demonstrate real-world business workflows.

------------------------------------------------------------------------

## 4. Target Users

### Platform Admin

The company/platform operator who manages restaurants registered on the
SaaS platform.

### Restaurant Owner/Admin

The owner or manager of a specific restaurant.

### Restaurant Staff

Employees who handle daily restaurant operations such as tables, orders,
reservations, queues, and billing.

------------------------------------------------------------------------

## 5. High-Level Architecture

``` mermaid
flowchart TD
    U[Users] --> FE[React Frontend]
    FE --> API[Node.js + Express REST API]
    API --> AUTH[Authentication & Authorization]
    API --> DB[(MongoDB)]
    API --> SERVICES[Business Logic Services]

    AUTH --> TENANT[Tenant Isolation]
    SERVICES --> DB

    ADMIN[Platform Admin] --> FE
    OWNER[Restaurant Owner] --> FE
    STAFF[Restaurant Staff] --> FE
```

------------------------------------------------------------------------

# 6. Multi-Tenant SaaS Architecture

Each restaurant is treated as an independent tenant.

``` text
Platform
│
├── Restaurant A
│   ├── Tables
│   ├── Menu
│   ├── Orders
│   ├── Reservations
│   ├── Queue
│   ├── Customers
│   ├── Bills
│   └── Staff
│
└── Restaurant B
    ├── Tables
    ├── Menu
    ├── Orders
    ├── Reservations
    ├── Queue
    ├── Customers
    ├── Bills
    └── Staff
```

Restaurant A must never be able to access Restaurant B's data.

Restaurant-specific records should contain a `restaurantId`.

The backend must derive the tenant context from the authenticated user
and must not blindly trust a `restaurantId` supplied by the client.

------------------------------------------------------------------------

# 7. Platform Admin Dashboard

The Platform Admin dashboard operates at the SaaS/platform level.

## 7.1 Features

-   Platform login
-   Dashboard
-   Restaurant applications
-   Restaurant management
-   Restaurant approval/rejection
-   Restaurant suspension/activation
-   Restaurant details
-   Platform analytics
-   Subscription/plan management
-   Platform settings

## 7.2 Platform Metrics

The dashboard can show:

-   Total restaurants
-   Active restaurants
-   Pending applications
-   Suspended restaurants
-   Total orders
-   Platform revenue
-   Recently registered restaurants
-   Recent applications

## 7.3 Restaurant Application Status

-   Pending
-   Under Review
-   Approved
-   Rejected
-   Suspended
-   Active

------------------------------------------------------------------------

# 8. Restaurant Dashboard

Each approved restaurant receives an isolated dashboard.

## 8.1 Modules

-   Overview
-   Tables
-   Orders
-   Menu
-   Waiting Queue
-   Reservations
-   Billing
-   Customers
-   Order History
-   Reports
-   Staff
-   Restaurant Profile
-   Settings

## 8.2 Dashboard Metrics

-   Total tables
-   Available tables
-   Occupied tables
-   Reserved tables
-   Customers waiting
-   Today's orders
-   Today's sales
-   Upcoming reservations
-   Pending bills

------------------------------------------------------------------------

# 9. User Roles and Permissions

## 9.1 Platform Admin

Can:

-   Manage restaurants
-   Approve/reject applications
-   Suspend/activate restaurants
-   View platform analytics
-   Manage platform settings
-   Manage subscription information

## 9.2 Restaurant Owner/Admin

Can:

-   Manage restaurant profile
-   Manage tables
-   Manage menu
-   Manage staff
-   Manage orders
-   Manage queue
-   Manage reservations
-   Manage billing
-   View reports
-   View restaurant analytics

## 9.3 Restaurant Staff

Can:

-   View and manage tables
-   Create/update orders
-   Manage queue
-   Manage reservations
-   Generate bills
-   Process payments

Staff cannot manage platform restaurants or access another restaurant.

------------------------------------------------------------------------

# 10. Restaurant Registration and Approval

## Workflow

``` mermaid
flowchart TD
    A[Restaurant Owner Registers] --> B[Submit Application]
    B --> C[Application Pending]
    C --> D[Platform Admin Reviews]
    D --> E{Decision}
    E -->|Approve| F[Restaurant Activated]
    E -->|Reject| G[Application Rejected]
    F --> H[Restaurant Dashboard Access]
```

## Restaurant Information

-   Restaurant name
-   Owner name
-   Email
-   Phone
-   Address
-   City
-   State
-   Country
-   Cuisine/type
-   Number of tables
-   Registration date
-   Status
-   Subscription/plan

------------------------------------------------------------------------

# 11. Table Management

Restaurants can have multiple tables.

## Requirements

Staff/Owner can:

-   Add table
-   Edit table
-   Deactivate table
-   Set table number/name
-   Set capacity
-   View table status

## Table Status

-   Available
-   Occupied
-   Reserved
-   Billing
-   Out of Service

## Table State Flow

``` mermaid
stateDiagram-v2
    [*] --> Available
    Available --> Occupied
    Available --> Reserved
    Reserved --> Occupied
    Occupied --> Billing
    Billing --> Available
    Available --> Out_of_Service
    Out_of_Service --> Available
```

------------------------------------------------------------------------

# 12. Table-Based Order Management

Orders are associated with a specific restaurant and table.

## Workflow

``` mermaid
flowchart TD
    A[Select Table] --> B[Customer Seated]
    B --> C[Create Order]
    C --> D[Add Food Items]
    D --> E[Update Order]
    E --> F[Customer Finishes]
    F --> G[Generate Bill]
```

## Order Capabilities

-   Create order
-   Add items
-   Change quantity
-   Remove items
-   Add notes
-   View order
-   Update order
-   Calculate subtotal
-   Apply discount
-   Calculate tax
-   Calculate total

------------------------------------------------------------------------

# 13. Billing and Payments

## Payment Methods

-   Cash
-   UPI
-   Card

## Billing Workflow

``` mermaid
flowchart TD
    A[Active Order] --> B[Generate Bill]
    B --> C[Calculate Amount]
    C --> D[Customer Pays]
    D --> E[Record Payment]
    E --> F[Order Completed]
    F --> G[Table Available]
    G --> H[Check Waiting Queue]
```

The bill should contain:

-   Restaurant information
-   Bill/order number
-   Table number
-   Items
-   Quantity
-   Price
-   Subtotal
-   Discount
-   Tax
-   Total
-   Payment method
-   Payment status
-   Date/time

------------------------------------------------------------------------

# 14. Waiting Queue

When no suitable table is available, customers can be added to a queue.

## Queue Data

-   Queue ID
-   Restaurant ID
-   Customer
-   Contact number
-   Number of guests
-   Arrival time
-   Queue position
-   Status
-   Notes

## Queue Status

-   Waiting
-   Called
-   Seated
-   Cancelled
-   No-show

## Queue Logic

The queue should generally follow FIFO while also considering table
capacity.

Example:

``` text
Waiting:
1. Group of 4
2. Group of 2
3. Group of 6

Available:
Table 2 = 2 seats
Table 5 = 4 seats
Table 8 = 6 seats

Suggested:
Group of 4 → Table 5
```

Staff may manually override the suggestion.

------------------------------------------------------------------------

# 15. Reservation System

## Reservation Fields

-   Customer name
-   Contact number
-   Email
-   Date
-   Time
-   Number of guests
-   Preferred table
-   Notes
-   Status

## Statuses

-   Pending
-   Confirmed
-   Arrived
-   Seated
-   Completed
-   Cancelled
-   No-show

The system must prevent overlapping reservations for the same table.

------------------------------------------------------------------------

# 16. Menu Management

Menu items contain:

-   Name
-   Description
-   Category
-   Price
-   Image
-   Vegetarian/non-vegetarian
-   Availability
-   Preparation time

## Operations

-   Add
-   Edit
-   Deactivate/delete
-   Change price
-   Mark available/unavailable
-   Search
-   Filter

Unavailable menu items cannot be added to new orders.

------------------------------------------------------------------------

# 17. Customer Management

Store basic customer data:

-   Name
-   Phone
-   Email
-   Number of visits
-   Last visit
-   Notes

Customer records may be reused for reservations, queue entries, and
orders.

------------------------------------------------------------------------

# 18. Staff Management

Restaurant Owner/Admin can:

-   Add staff
-   Edit staff
-   Deactivate staff
-   Assign role
-   View staff

Each staff member belongs to exactly one restaurant.

------------------------------------------------------------------------

# 19. Order History

Completed orders should contain:

-   Order ID
-   Restaurant ID
-   Table
-   Customer
-   Items
-   Total
-   Payment method
-   Date/time
-   Status

Features:

-   Search
-   Date filtering
-   Table filtering
-   Payment status filtering

------------------------------------------------------------------------

# 20. Reports and Analytics

## Restaurant Reports

-   Daily sales
-   Weekly sales
-   Monthly sales
-   Number of orders
-   Top-selling items
-   Table utilization
-   Payment method breakdown

## Platform Reports

-   Total restaurants
-   Active restaurants
-   New restaurants
-   Restaurant activity
-   Platform-wide orders
-   Platform revenue

------------------------------------------------------------------------

# 21. Restaurant Profile

Restaurant Owner/Admin can manage:

-   Name
-   Logo
-   Address
-   Contact details
-   Opening hours
-   Cuisine/type

------------------------------------------------------------------------

# 22. Authentication

Use JWT authentication.

Requirements:

-   Registration
-   Login
-   Logout
-   Password hashing
-   Protected routes
-   Role-based authorization
-   Tenant authorization

Authentication context should conceptually contain:

``` text
userId
role
restaurantId
```

Platform Admin:

``` text
role = PLATFORM_ADMIN
restaurantId = null
```

Restaurant Owner:

``` text
role = RESTAURANT_OWNER
restaurantId = R001
```

Restaurant Staff:

``` text
role = RESTAURANT_STAFF
restaurantId = R001
```

------------------------------------------------------------------------

# 23. Authorization and Tenant Isolation

The backend must verify:

1.  User is authenticated.
2.  User has the required role.
3.  User belongs to the requested restaurant.
4.  Restaurant is active.
5.  Requested resource belongs to that restaurant.

Never trust a client-provided restaurant ID.

------------------------------------------------------------------------

# 24. Database Requirements

Required MongoDB collections/models:

-   User
-   Restaurant
-   RestaurantApplication
-   Table
-   MenuItem
-   Customer
-   Order
-   Reservation
-   QueueEntry
-   Bill
-   Payment
-   Subscription/Plan

For each model define:

-   Fields
-   Data types
-   Required/optional
-   References
-   Indexes
-   `restaurantId` requirement

------------------------------------------------------------------------

# 25. REST API Requirements

Document REST APIs for:

### Authentication

``` text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

### Platform Admin

``` text
GET /api/admin/restaurants
GET /api/admin/restaurants/pending
POST /api/admin/restaurants/:id/approve
POST /api/admin/restaurants/:id/reject
POST /api/admin/restaurants/:id/suspend
POST /api/admin/restaurants/:id/activate
GET /api/admin/analytics
```

### Restaurant

``` text
GET /api/restaurants/me
PUT /api/restaurants/me
```

### Tables

``` text
GET /api/tables
POST /api/tables
GET /api/tables/:id
PUT /api/tables/:id
DELETE /api/tables/:id
```

### Menu

``` text
GET /api/menu
POST /api/menu
GET /api/menu/:id
PUT /api/menu/:id
DELETE /api/menu/:id
```

### Orders

``` text
GET /api/orders
POST /api/orders
GET /api/orders/:id
PUT /api/orders/:id
```

### Billing

``` text
POST /api/bills
GET /api/bills/:id
POST /api/bills/:id/pay
```

### Queue

``` text
GET /api/queue
POST /api/queue
PUT /api/queue/:id
DELETE /api/queue/:id
```

### Reservations

``` text
GET /api/reservations
POST /api/reservations
GET /api/reservations/:id
PUT /api/reservations/:id
DELETE /api/reservations/:id
```

### Customers

``` text
GET /api/customers
POST /api/customers
GET /api/customers/:id
PUT /api/customers/:id
```

### Staff

``` text
GET /api/staff
POST /api/staff
PUT /api/staff/:id
DELETE /api/staff/:id
```

For each API specify method, purpose, auth, role, request, response,
errors, and tenant restrictions.

------------------------------------------------------------------------

# 26. Frontend Pages

## Platform Admin

-   Login
-   Dashboard
-   Restaurant Applications
-   Restaurants
-   Restaurant Details
-   Analytics
-   Plans/Subscriptions
-   Settings

## Restaurant

-   Login
-   Dashboard
-   Tables
-   Table Details
-   Create Order
-   Current Order
-   Billing
-   Menu
-   Queue
-   Reservations
-   Customers
-   Order History
-   Reports
-   Staff
-   Restaurant Profile
-   Settings

------------------------------------------------------------------------

# 27. User Stories

Create user stories for all major features.

Examples:

-   Platform Admin approving restaurants
-   Restaurant Owner managing tables
-   Staff creating table orders
-   Staff adding customers to queue
-   Staff assigning waiting customers
-   Staff creating reservations
-   Staff generating bills
-   Owner managing menu
-   Owner managing staff
-   Owner viewing reports

------------------------------------------------------------------------

# 28. Acceptance Criteria

Provide testable acceptance criteria for every major module:

-   Registration
-   Approval
-   Login
-   Roles
-   Tenant isolation
-   Tables
-   Orders
-   Menu
-   Billing
-   Payments
-   Queue
-   Reservations
-   Customers
-   Staff
-   Reports
-   Dashboards

------------------------------------------------------------------------

# 29. Edge Cases

Cover:

-   Occupied table assignment
-   Double booking
-   Overlapping reservations
-   Large customer groups
-   Multiple waiting groups
-   Payment failure
-   Empty order
-   Unavailable menu item
-   Cancellation
-   No-show
-   API failure
-   Unauthorized access
-   Cross-restaurant access
-   Suspended restaurant
-   Duplicate customer
-   Invalid state transitions

------------------------------------------------------------------------

# 30. Security

Include:

-   Password hashing
-   JWT
-   RBAC
-   Tenant isolation
-   Input validation
-   MongoDB injection protection
-   CORS
-   Rate limiting
-   Environment variables
-   Secure errors
-   Protected routes
-   Authorization middleware

------------------------------------------------------------------------

# 31. UI/UX

The interface should be:

-   Modern
-   Clean
-   Professional
-   Responsive
-   Easy for restaurant staff to operate

Important operational screens should minimize the number of clicks
required.

Include loading, empty, error, confirmation, and success states.

------------------------------------------------------------------------

# 32. Project Structure

Recommend a clean MERN structure:

``` text
restaurant-management-system/
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── hooks/
│       ├── services/
│       ├── context/
│       ├── utils/
│       └── routes/
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   ├── config/
│   └── server.js
│
├── README.md
└── .env.example
```

------------------------------------------------------------------------

# 33. MVP

MVP must include:

### Platform

-   Platform Admin
-   Restaurant registration
-   Restaurant approval/rejection
-   Restaurant management
-   Platform dashboard

### Restaurant

-   Restaurant dashboard
-   Table management
-   Menu management
-   Table-based ordering
-   Billing
-   Payment recording
-   Waiting queue
-   Reservations
-   Customers
-   Order history
-   Staff management
-   Basic reports

------------------------------------------------------------------------

# 34. Future Enhancements

Keep these outside the MVP:

-   Kitchen Display System
-   QR menu
-   Customer self-ordering
-   Online payments
-   Customer mobile application
-   Inventory management
-   Supplier management
-   Loyalty system
-   Advanced analytics
-   WhatsApp/SMS notifications
-   Online booking
-   Multi-branch support
-   AI recommendations

------------------------------------------------------------------------

# 35. Testing Strategy

Include:

-   Unit testing
-   API testing
-   Integration testing
-   Frontend testing
-   Authentication testing
-   Authorization testing
-   Tenant isolation testing
-   Database testing
-   End-to-end testing

------------------------------------------------------------------------

# 36. Deployment

Recommended architecture:

``` text
React Frontend
       ↓
Node.js + Express API
       ↓
MongoDB Atlas
```

Document environment variables, CORS, JWT secrets, database
configuration, and production considerations.

------------------------------------------------------------------------

# 37. Development Phases

Break implementation into:

1.  Project setup
2.  Authentication
3.  Multi-tenancy
4.  Platform Admin
5.  Restaurant Dashboard
6.  Table Management
7.  Menu
8.  Orders
9.  Billing
10. Queue
11. Reservations
12. Customers/Staff
13. Reports
14. Testing/Security
15. Deployment

Define objectives and deliverables for each phase.

------------------------------------------------------------------------

# 38. Complete End-to-End Workflow

Document the complete flow:

``` text
Customer Reservation / Walk-in
        ↓
Check Table Availability
        ↓
Available? ── Yes → Assign Table
        │
        No
        ↓
Waiting Queue
        ↓
Table Becomes Available
        ↓
Find Suitable Waiting Customer
        ↓
Assign Table
        ↓
Table Occupied
        ↓
Create Order
        ↓
Add Food Items
        ↓
Generate Bill
        ↓
Payment
        ↓
Order Completed
        ↓
Table Available
        ↓
Check Waiting Queue
```

Also document the restaurant onboarding flow:

``` text
Restaurant Registration
        ↓
Application Pending
        ↓
Platform Admin Review
        ↓
Approve / Reject
        ↓
Approved
        ↓
Restaurant Dashboard
```

------------------------------------------------------------------------

# Final Output Requirements

Generate ONLY a complete `prd.md` file.

Do not generate source code.

Do not implement APIs.

Do not explain the project outside the PRD.

Use professional Markdown formatting, tables, bullet points, and Mermaid
diagrams where appropriate.

The PRD should be detailed enough to act as the single source of truth
for development while remaining realistic for a college-level MERN
project.

After creating the PRD, ensure that all requirements are internally
consistent, especially:

-   Multi-tenancy
-   Platform Admin vs Restaurant Dashboard
-   Role permissions
-   Table → Order → Bill → Payment workflow
-   Queue → Table assignment workflow
-   Reservation → Table → Order workflow
-   Restaurant data isolation
-   Authentication and authorization
