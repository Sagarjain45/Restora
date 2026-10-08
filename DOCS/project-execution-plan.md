# Restaurant Management System --- AI Project Execution Plan

## 1. Purpose of This File

This file is the **execution roadmap for an AI coding agent** working on
the Restaurant Management System.

The agent must use:

-   `prd.md` as the product requirements source of truth.
-   `techstack-architecture.md` as the technical architecture source of
    truth.
-   This file as the **implementation order and phase-control
    document**.

The project must NOT be implemented in one large operation.

The project is intentionally divided into small phases so that an AI
coding agent such as Antigravity can complete, test, review, and
stabilize one phase before moving to the next.

------------------------------------------------------------------------

# 2. Project Context

The project is a:

**Multi-tenant Restaurant Management SaaS Platform**

Technology:

-   React.js
-   Node.js
-   Express.js
-   MongoDB
-   Mongoose
-   JWT
-   REST API

There are two application levels:

``` text
                    RESTAURANT MANAGEMENT SAAS
                              |
                 +------------+------------+
                 |                         |
          PLATFORM ADMIN             RESTAURANT
            DASHBOARD                DASHBOARD
                 |                         |
       Restaurants / Apps          Tables / Orders
       Platform Analytics          Menu / Queue
       Restaurant Status           Reservations
                                   Billing
                                   Customers
                                   Staff
                                   Reports
```

The most important architecture rule is:

> Platform Admin manages the SaaS platform. Restaurant users manage only
> their own restaurant. Restaurant data must be isolated by tenant.

------------------------------------------------------------------------

# 3. How the AI Agent Must Use This File

## 3.1 One Phase at a Time

The AI agent must implement **only one phase at a time**.

Do not automatically continue to the next phase after completing a
phase.

After finishing a phase:

1.  Implement the requested work.
2.  Run the relevant tests.
3.  Run lint/build/type checks if configured.
4.  Review the changed files.
5.  Fix issues found within the current phase.
6.  Update documentation if required.
7.  Provide a concise completion summary.
8.  STOP.

The next phase should begin only when explicitly requested.

------------------------------------------------------------------------

# 4. General Rules for Every Phase

For every phase:

### Before coding

1.  Read `prd.md`.
2.  Read the relevant sections of `techstack-architecture.md`.
3.  Read this execution file.
4.  Inspect the existing project structure.
5.  Check what previous phases have already implemented.
6.  Do not recreate existing functionality.

### During coding

-   Follow the architecture in `techstack-architecture.md`.
-   Follow requirements in `prd.md`.
-   Prefer simple, maintainable solutions.
-   Do not introduce unnecessary libraries.
-   Do not over-engineer.
-   Keep frontend and backend responsibilities separated.
-   Keep business logic in services where appropriate.
-   Keep controllers thin.
-   Validate API input.
-   Handle errors consistently.
-   Protect routes.
-   Maintain tenant isolation.
-   Do not hardcode secrets.
-   Do not expose sensitive data.

### After coding

Run appropriate checks.

At minimum, where applicable:

``` text
Frontend:
- npm run build
- npm run lint

Backend:
- npm test
- npm run lint
```

If scripts do not exist, use the project's available commands.

Then:

-   Fix errors.
-   Check for broken imports.
-   Check API/frontend integration.
-   Check authorization.
-   Check tenant isolation where applicable.

------------------------------------------------------------------------

# 5. Phase Dependency Map

``` text
Phase 0
Project Inspection
    |
    v
Phase 1
Project Foundation
    |
    v
Phase 2
Database + Core Models
    |
    v
Phase 3
Authentication + Authorization
    |
    v
Phase 4
Multi-Tenant Architecture
    |
    +--------------------+
    |                    |
    v                    v
Phase 5              Phase 6
Platform Admin       Restaurant Setup
                         |
                         v
                    Phase 7
                    Tables
                         |
                         v
                    Phase 8
                    Menu
                         |
                         v
                    Phase 9
                    Orders
                         |
                         v
                    Phase 10
                    Billing
                         |
              +----------+----------+
              |                     |
              v                     v
          Phase 11              Phase 12
          Queue              Reservations
              |                     |
              +----------+----------+
                         |
                         v
                    Phase 13
                    Customers
                         |
                         v
                    Phase 14
                    Staff
                         |
                         v
                    Phase 15
                    Reports
                         |
                         v
                    Phase 16
                    Integration
                         |
                         v
                    Phase 17
                    Testing
                         |
                         v
                    Phase 18
                    Security
                         |
                         v
                    Phase 19
                    UI Polish
                         |
                         v
                    Phase 20
                    Deployment
```

Some phases can be developed independently, but the recommended order
should be followed unless there is a clear reason to change it.

------------------------------------------------------------------------

# 6. PHASE 0 --- Project Inspection and Planning

## Goal

Understand the current workspace before modifying anything.

## Tasks

-   Inspect all existing files.
-   Determine whether a project already exists.
-   Identify frontend/backend structure.
-   Check package.json files.
-   Check existing dependencies.
-   Check environment configuration.
-   Check Git status if available.
-   Identify existing code that can be reused.
-   Compare current implementation with `prd.md`.
-   Compare current implementation with `techstack-architecture.md`.

## Do NOT

-   Rewrite the project.
-   Delete existing files.
-   Install unnecessary packages.
-   Implement features.

## Deliverable

A clear understanding of the existing codebase.

## Completion Criteria

-   Project structure understood.
-   Existing technology identified.
-   Existing implementation documented.
-   No unnecessary modifications made.

------------------------------------------------------------------------

# 7. PHASE 1 --- Project Foundation

## Goal

Create a clean MERN application foundation.

## Tasks

### Frontend

Set up:

-   React
-   Routing
-   Basic application structure
-   Global styling
-   Base layout
-   Error boundary if appropriate

### Backend

Set up:

-   Node.js
-   Express
-   Basic server
-   API router
-   Environment configuration
-   Error handling
-   CORS
-   Security middleware

### Database

Set up:

-   MongoDB connection
-   Mongoose
-   Database configuration

## Basic Backend Structure

``` text
server/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── utils/
├── app.js
└── server.js
```

## Basic Frontend Structure

``` text
client/
└── src/
    ├── components/
    ├── pages/
    ├── layouts/
    ├── routes/
    ├── services/
    ├── context/
    ├── hooks/
    └── utils/
```

## Completion Criteria

-   Frontend starts successfully.
-   Backend starts successfully.
-   Backend connects to MongoDB.
-   Frontend can communicate with backend.
-   Environment variables work.
-   Basic health endpoint works.

Example:

``` text
GET /api/health
```

------------------------------------------------------------------------

# 8. PHASE 2 --- Database and Core Models

## Goal

Create the database foundation.

## Models

Create initial models for:

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

Do not implement all complex business logic yet.

## Requirements

Each model must:

-   Use Mongoose.
-   Have appropriate validation.
-   Have timestamps.
-   Use references where appropriate.
-   Include `restaurantId` where required.

## Important

Do not duplicate restaurant data unnecessarily.

## Completion Criteria

-   All required schemas exist.
-   Relationships are defined.
-   Basic validation exists.
-   Database connection works.
-   Models can be created/read in development tests.

------------------------------------------------------------------------

# 9. PHASE 3 --- Authentication and Authorization

## Goal

Implement secure authentication.

## Roles

Implement:

``` text
PLATFORM_ADMIN
RESTAURANT_OWNER
RESTAURANT_STAFF
```

## Tasks

-   Registration
-   Login
-   Password hashing
-   JWT generation
-   Authentication middleware
-   Logout strategy
-   Protected routes
-   Role middleware

## Authentication Context

Authenticated users should have:

``` text
userId
role
restaurantId
```

Platform Admin:

``` text
restaurantId = null
```

Restaurant users:

``` text
restaurantId = their restaurant
```

## Frontend

Implement:

-   Login page
-   Auth context/state
-   Protected routes
-   Role-based route handling
-   Logout

## Completion Criteria

-   Users can log in.
-   Passwords are hashed.
-   JWT authentication works.
-   Protected API routes reject unauthenticated users.
-   Role restrictions work.
-   Frontend redirects users to the correct dashboard.

------------------------------------------------------------------------

# 10. PHASE 4 --- Multi-Tenant Architecture

## Goal

Implement strict restaurant data isolation.

This is one of the highest-priority architectural phases.

## Tasks

Create tenant middleware/service behavior.

For restaurant users:

``` text
req.user.restaurantId
```

must determine their tenant.

All restaurant-specific queries must be scoped by:

``` text
restaurantId
```

## Example

If user belongs to:

``` text
R001
```

then:

``` text
GET /api/orders
```

must behave conceptually like:

``` text
Order.find({ restaurantId: "R001" })
```

The client must not be able to override this to R002.

## Security Requirements

Prevent:

-   Cross-tenant reads
-   Cross-tenant updates
-   Cross-tenant deletes
-   Cross-tenant resource references

## Completion Criteria

Test:

``` text
Restaurant A → Can access A
Restaurant A → Cannot access B
Restaurant B → Can access B
Restaurant B → Cannot access A
```

Do not proceed until tenant isolation works correctly.

------------------------------------------------------------------------

# 11. PHASE 5 --- Platform Admin Dashboard

## Goal

Build the platform-level administration system.

## Pages

-   Admin Login
-   Admin Dashboard
-   Restaurant Applications
-   Restaurants
-   Restaurant Details
-   Analytics
-   Settings

## Features

### Restaurant Applications

Admin can:

-   View pending applications.
-   View details.
-   Approve.
-   Reject.

### Restaurant Management

Admin can:

-   View restaurants.
-   Search restaurants.
-   Filter restaurants.
-   Suspend restaurant.
-   Activate restaurant.
-   View restaurant details.

### Dashboard

Show:

-   Total restaurants
-   Active restaurants
-   Pending applications
-   Suspended restaurants
-   Platform orders
-   Platform revenue

## Completion Criteria

Platform Admin can complete:

``` text
Login
→ View Applications
→ Approve Restaurant
→ View Restaurant
→ Suspend/Activate Restaurant
```

------------------------------------------------------------------------

# 12. PHASE 6 --- Restaurant Onboarding and Restaurant Dashboard

## Goal

Allow an approved restaurant to enter and configure its own environment.

## Tasks

-   Restaurant profile
-   Restaurant dashboard
-   Restaurant status handling
-   Restaurant settings
-   Opening hours
-   Basic information

## Dashboard

Show:

-   Tables
-   Available tables
-   Occupied tables
-   Reserved tables
-   Waiting count
-   Today's orders
-   Today's sales
-   Upcoming reservations

## Completion Criteria

Approved restaurant owner can:

``` text
Login
→ Access own dashboard
→ View own restaurant
→ Update restaurant profile
```

Suspended restaurant should not be allowed to operate.

------------------------------------------------------------------------

# 13. PHASE 7 --- Table Management

## Goal

Implement restaurant table management.

## Tasks

-   Add table
-   Edit table
-   Deactivate table
-   Set capacity
-   Set table number
-   View table list
-   View table status

## Table Status

``` text
AVAILABLE
OCCUPIED
RESERVED
BILLING
OUT_OF_SERVICE
```

## UI

Create table cards/grid showing:

``` text
Table 01
4 Seats
Available
```

or:

``` text
Table 05
4 Seats
Occupied
```

## Completion Criteria

Staff can:

-   View all tables.
-   Add tables.
-   Edit tables.
-   Change status where allowed.
-   See table capacity.
-   Cannot assign invalid states.

------------------------------------------------------------------------

# 14. PHASE 8 --- Menu Management

## Goal

Implement restaurant menu management.

## Tasks

-   Add menu item
-   Edit menu item
-   Deactivate menu item
-   Set category
-   Set price
-   Set availability
-   Vegetarian/non-vegetarian
-   Search/filter

## Categories

Example:

-   Starters
-   Main Course
-   Rice
-   Breads
-   Beverages
-   Desserts

## Completion Criteria

Restaurant owner can fully manage menu.

Staff can view available items.

Unavailable items cannot be added to new orders.

------------------------------------------------------------------------

# 15. PHASE 9 --- Order Management

## Goal

Implement table-based restaurant ordering.

## Core Workflow

``` text
Select Table
    ↓
Create Order
    ↓
Add Items
    ↓
Change Quantity
    ↓
Remove Items
    ↓
Add Notes
    ↓
Save Order
```

## Requirements

Every active order must have:

-   restaurantId
-   tableId
-   items
-   status
-   totals

## Features

-   Create order
-   Add menu item
-   Update quantity
-   Remove item
-   Add notes
-   View order
-   Calculate subtotal
-   Apply discount
-   Calculate tax
-   Calculate total

## Table Behavior

When an order becomes active:

``` text
Available → Occupied
```

## Completion Criteria

Staff can select a table and create a complete order.

The order must belong to the correct restaurant and table.

------------------------------------------------------------------------

# 16. PHASE 10 --- Billing and Payment

## Goal

Complete the restaurant's order-to-payment workflow.

## Tasks

-   Generate bill
-   Calculate subtotal
-   Calculate discount
-   Calculate tax
-   Calculate total
-   Record payment
-   Payment status
-   Complete order
-   Release table

## Payment Methods

-   Cash
-   UPI
-   Card

## Workflow

``` text
Active Order
→ Generate Bill
→ Payment
→ Record Payment
→ Complete Order
→ Table Available
```

## Completion Criteria

After successful payment:

``` text
Order = COMPLETED
Payment = PAID
Table = AVAILABLE
```

The system must not accidentally release a table before payment/order
completion according to the defined business rule.

------------------------------------------------------------------------

# 17. PHASE 11 --- Waiting Queue

## Goal

Implement customer waiting queue management.

## Tasks

-   Add customer to queue
-   View queue
-   Queue position
-   Guest count
-   Arrival time
-   Queue status
-   Cancel queue entry
-   Mark no-show
-   Seat customer

## Queue Logic

Basic ordering:

``` text
FIFO
```

But table capacity must be considered.

Example:

``` text
Customer = 4 guests

Table 2 = 2 seats → Not suitable
Table 5 = 4 seats → Suitable
Table 8 = 6 seats → Suitable
```

The system should suggest suitable tables.

## Integration

When a table becomes available:

``` text
Table Available
→ Check Queue
→ Find Suitable Customer
→ Suggest
→ Staff Assigns
→ Queue = SEATED
→ Table = OCCUPIED
```

## Completion Criteria

Queue works independently and integrates with table management.

------------------------------------------------------------------------

# 18. PHASE 12 --- Reservation System

## Goal

Implement table reservations.

## Tasks

-   Create reservation
-   View reservations
-   Edit reservation
-   Cancel reservation
-   Confirm reservation
-   Mark arrived
-   Assign table
-   Mark seated
-   Complete reservation
-   Mark no-show

## Conflict Detection

Prevent:

``` text
Same table
+
Overlapping time
+
Same restaurant
```

from creating conflicting reservations.

## Completion Criteria

Reservation workflow works:

``` text
Create
→ Confirm
→ Arrive
→ Assign Table
→ Seat
→ Order
→ Billing
→ Complete
```

------------------------------------------------------------------------

# 19. PHASE 13 --- Customer Management

## Goal

Create basic reusable customer profiles.

## Tasks

-   Add customer
-   Edit customer
-   Search customer
-   View customer
-   Track visit count
-   Track last visit

Customers should be reusable across:

-   Reservations
-   Queue
-   Orders

## Completion Criteria

Staff can find an existing customer rather than creating duplicate
records unnecessarily.

------------------------------------------------------------------------

# 20. PHASE 14 --- Staff Management

## Goal

Allow restaurant owners/admins to manage their staff.

## Tasks

-   Add staff
-   Edit staff
-   Deactivate staff
-   Assign staff role
-   View staff

## Security

A restaurant owner must not create staff belonging to another
restaurant.

Staff must only access their restaurant.

## Completion Criteria

Restaurant Owner can manage staff.

Staff permissions remain restricted.

------------------------------------------------------------------------

# 21. PHASE 15 --- Order History and Reports

## Goal

Provide basic historical information and analytics.

## Order History

Implement:

-   Order list
-   Search
-   Date filtering
-   Table filtering
-   Payment filtering
-   Order details

## Restaurant Reports

Implement basic:

-   Daily sales
-   Weekly sales
-   Monthly sales
-   Order count
-   Top-selling items
-   Payment method breakdown
-   Table utilization

## Platform Reports

Implement:

-   Total restaurants
-   Active restaurants
-   Restaurant activity
-   Platform orders
-   Platform revenue

## Completion Criteria

Reports are based on real database data.

Avoid fake/static analytics.

------------------------------------------------------------------------

# 22. PHASE 16 --- Full Feature Integration

## Goal

Connect all modules into the complete business workflow.

This phase should focus primarily on integration rather than adding
large new features.

## Main Workflow

``` text
Walk-in Customer
      ↓
Check Tables
      ↓
Available?
  ┌───┴───┐
 Yes      No
  ↓        ↓
Assign   Queue
  ↓        ↓
  └───→ Table Available
            ↓
       Assign Customer
            ↓
          Order
            ↓
       Add Food Items
            ↓
           Bill
            ↓
         Payment
            ↓
      Order Completed
            ↓
      Table Available
            ↓
      Check Queue
```

## Reservation Workflow

``` text
Reservation
→ Confirmed
→ Customer Arrives
→ Table Assigned
→ Seated
→ Order
→ Billing
→ Payment
→ Completed
```

## Completion Criteria

All core modules work together without manual database changes.

------------------------------------------------------------------------

# 23. PHASE 17 --- Testing

## Goal

Test the complete system before UI polishing.

## Test Areas

### Authentication

-   Valid login
-   Invalid login
-   Expired token
-   Protected routes

### Authorization

-   Admin permissions
-   Owner permissions
-   Staff permissions

### Tenant Isolation

Critical tests:

``` text
Restaurant A cannot read Restaurant B data.
Restaurant A cannot update Restaurant B data.
Restaurant A cannot delete Restaurant B data.
```

### Tables

-   Valid assignment
-   Invalid assignment
-   State transitions

### Orders

-   Create
-   Update
-   Delete/cancel where allowed
-   Correct calculations

### Billing

-   Correct total
-   Payment
-   Table release

### Queue

-   FIFO
-   Capacity matching
-   Seating

### Reservations

-   Creation
-   Conflict detection
-   Cancellation
-   No-show

------------------------------------------------------------------------

# 24. PHASE 18 --- Security Hardening

## Goal

Review the entire application for security issues.

## Check

-   Password hashing
-   JWT security
-   Authorization
-   Tenant isolation
-   Input validation
-   MongoDB injection
-   CORS
-   Rate limiting
-   Secure headers
-   Environment variables
-   Error leakage
-   Sensitive data exposure
-   IDOR/resource access vulnerabilities

## Important

Test malicious/incorrect requests such as:

``` text
User R001 requests resource belonging to R002.
```

This must return:

``` text
403 Forbidden
```

or an appropriate secure response.

------------------------------------------------------------------------

# 25. PHASE 19 --- UI/UX Polish

## Goal

Improve usability only after functionality is stable.

## Tasks

-   Responsive design
-   Better spacing
-   Consistent typography
-   Status badges
-   Loading states
-   Empty states
-   Error states
-   Toast notifications
-   Confirmation dialogs
-   Form validation
-   Better navigation
-   Dashboard cards
-   Table visualization

## Important Screens

Prioritize:

1.  Restaurant Dashboard
2.  Tables
3.  Order creation
4.  Billing
5.  Queue
6.  Reservations

## Completion Criteria

The system feels like one consistent application rather than separate
pages.

------------------------------------------------------------------------

# 26. PHASE 20 --- Production Readiness and Deployment

## Goal

Prepare the application for deployment.

## Frontend

Verify:

-   Production build
-   Environment variables
-   API base URL
-   Routing
-   Responsive behavior

## Backend

Verify:

-   Production environment
-   MongoDB Atlas
-   CORS
-   JWT secret
-   Error handling
-   Logging
-   Secure configuration

## Deployment

``` text
React Frontend
      ↓
Frontend Hosting
      ↓
Express Backend
      ↓
MongoDB Atlas
```

## Completion Criteria

-   Production frontend works.
-   Production backend works.
-   Database works.
-   Authentication works.
-   CORS works.
-   Environment variables work.
-   Core workflow works in production.

------------------------------------------------------------------------

# 27. Phase Completion Checklist

Before declaring ANY phase complete, the AI agent must check:

``` text
[ ] Requirements read
[ ] Existing code inspected
[ ] Only current phase implemented
[ ] No unnecessary features added
[ ] Code follows architecture
[ ] Authentication/authorization considered
[ ] Tenant isolation considered
[ ] Validation implemented where needed
[ ] Error handling implemented
[ ] Relevant tests/checks run
[ ] Build succeeds
[ ] No obvious broken imports
[ ] No secrets committed
[ ] Existing functionality still works
[ ] Documentation updated if needed
```

------------------------------------------------------------------------

# 28. AI Agent Stop Rule

The AI agent MUST stop after completing the requested phase.

Do not automatically:

-   Start the next phase.
-   Implement future enhancements.
-   Refactor unrelated modules.
-   Add extra features.
-   Change the architecture without reason.

If a blocker in the current phase requires a decision, explain the
blocker and stop.

If a requirement in `prd.md` conflicts with the current implementation,
prefer the PRD and architecture documents and report the conflict.

------------------------------------------------------------------------

# 29. Phase Output Format

At the end of every phase, provide:

## Phase Completed

``` text
Phase X — <Name>
Status: Complete
```

## Implemented

-   Item 1
-   Item 2
-   Item 3

## Files Changed

List important files.

## Tests / Checks

List commands/checks performed and their results.

## Known Issues

List any remaining issues.

## Next Phase

``` text
Phase X+1 — <Name>
```

Do NOT start it automatically.

------------------------------------------------------------------------

# 30. Git Checkpoints

It is recommended to create a Git commit after each stable phase.

Suggested commit names:

``` text
phase-01-project-foundation
phase-02-database-models
phase-03-authentication
phase-04-multi-tenancy
phase-05-platform-admin
phase-06-restaurant-dashboard
phase-07-table-management
phase-08-menu-management
phase-09-order-management
phase-10-billing-payment
phase-11-waiting-queue
phase-12-reservations
phase-13-customer-management
phase-14-staff-management
phase-15-reports
phase-16-feature-integration
phase-17-testing
phase-18-security
phase-19-ui-polish
phase-20-deployment
```

Do not create a commit if the project is broken unless explicitly
requested.

------------------------------------------------------------------------

# 31. Priority Levels

When implementing each phase:

### P0 --- Critical

Must work.

Examples:

-   Authentication
-   Tenant isolation
-   Table/order relationship
-   Billing
-   Authorization

### P1 --- Core

Required for MVP.

Examples:

-   Menu
-   Queue
-   Reservations
-   Customers
-   Staff

### P2 --- Supporting

Important but can be implemented later within the phase.

Examples:

-   Advanced filtering
-   UI enhancements
-   Additional dashboard statistics

### P3 --- Future

Do not implement unless explicitly requested.

Examples:

-   AI recommendations
-   Inventory
-   Loyalty
-   Mobile application
-   Multi-branch management

------------------------------------------------------------------------

# 32. Important Scope Control

The AI agent must not add the following to the MVP unless explicitly
requested:

-   Inventory management
-   Supplier management
-   Employee attendance
-   Payroll
-   Kitchen Display System
-   Customer mobile app
-   Loyalty program
-   AI recommendations
-   AI forecasting
-   Multi-branch management
-   Complex subscription billing
-   Microservices
-   Kubernetes
-   Event-driven infrastructure
-   Redis unless genuinely required
-   GraphQL
-   Complex DevOps infrastructure

The project should remain a clean MERN application.

------------------------------------------------------------------------

# 33. Definition of Done --- Entire Project

The project is considered complete when:

### Platform

-   [ ] Platform Admin can log in.
-   [ ] Platform Admin can review restaurant applications.
-   [ ] Platform Admin can approve/reject restaurants.
-   [ ] Platform Admin can suspend/activate restaurants.
-   [ ] Platform analytics work.

### Restaurant

-   [ ] Restaurant Owner can log in.
-   [ ] Restaurant dashboard works.
-   [ ] Restaurant profile works.
-   [ ] Restaurant data is isolated.

### Tables

-   [ ] Tables can be created.
-   [ ] Tables can be edited.
-   [ ] Table status works.
-   [ ] Capacity works.

### Menu

-   [ ] Menu items can be created.
-   [ ] Menu items can be edited.
-   [ ] Availability works.

### Orders

-   [ ] Orders are associated with tables.
-   [ ] Items can be added.
-   [ ] Quantities can be changed.
-   [ ] Totals are calculated.

### Billing

-   [ ] Bills can be generated.
-   [ ] Payments can be recorded.
-   [ ] Orders can be completed.
-   [ ] Tables become available.

### Queue

-   [ ] Customers can join queue.
-   [ ] Queue order works.
-   [ ] Suitable tables are suggested.
-   [ ] Customers can be seated.

### Reservations

-   [ ] Reservations can be created.
-   [ ] Conflicts are prevented.
-   [ ] Reservations can become seated customers.

### Customers

-   [ ] Customers can be managed.
-   [ ] Customer history works.

### Staff

-   [ ] Staff can be created.
-   [ ] Staff roles work.
-   [ ] Staff are tenant-isolated.

### Reports

-   [ ] Restaurant reports work.
-   [ ] Platform reports work.

### Security

-   [ ] Authentication works.
-   [ ] Authorization works.
-   [ ] Tenant isolation works.
-   [ ] No major security vulnerabilities remain.

### Deployment

-   [ ] Production build works.
-   [ ] Backend is deployed.
-   [ ] Frontend is deployed.
-   [ ] MongoDB Atlas works.
-   [ ] Environment configuration works.

------------------------------------------------------------------------

# 34. Recommended AI Agent Working Pattern

For every phase, the AI agent should follow:

``` text
READ
 ↓
INSPECT
 ↓
PLAN CURRENT PHASE
 ↓
IMPLEMENT
 ↓
TEST
 ↓
FIX
 ↓
REVIEW
 ↓
DOCUMENT
 ↓
STOP
```

Never:

``` text
READ
 ↓
IMPLEMENT ENTIRE PROJECT
```

------------------------------------------------------------------------

# 35. Source of Truth Hierarchy

When making implementation decisions, use this priority:

``` text
1. Explicit user instruction
        ↓
2. prd.md
        ↓
3. techstack-architecture.md
        ↓
4. project execution plan
        ↓
5. Existing implementation conventions
        ↓
6. AI agent assumptions
```

If the agent needs to make a minor implementation decision not specified
by the documents, choose the simplest maintainable solution and document
it.

------------------------------------------------------------------------

# 36. Final Instruction to the AI Agent

You are implementing a real software project incrementally.

Do not attempt to build the complete Restaurant Management System in one
operation.

Implement only the phase requested by the user.

Before starting each phase, inspect the existing implementation and
confirm that previous phases are working.

Maintain:

-   Clean architecture
-   Multi-tenant isolation
-   Secure authentication
-   Role-based authorization
-   Consistent API design
-   Reusable frontend components
-   Maintainable code
-   Simple business logic
-   Clear error handling

After completing the requested phase, test it, summarize it, and STOP.

The next phase will be explicitly requested later.
