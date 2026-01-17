---
## [v0.5.1] – Advanced Redis Caching, LRU Eviction, and Observability
Date: 2026-01-18

### Redis Caching Enhancements
- Implemented Redis-backed caching for task filtering endpoint
- Introduced user-scoped cache keys to prevent cross-user data leakage
- Normalized query parameters before cache key generation to avoid stale or incorrect cache hits
- Added TTL-based caching strategy for filtered task results

### Cache Invalidation Strategy
- Replaced unsafe global cache flushing (`FLUSHALL`)
- Implemented targeted cache invalidation per user using Redis `SCAN` + pattern matching
- Ensured cache invalidation on task create, update, toggle, and delete operations
- Preserved cache consistency without impacting other users

### LRU Eviction & Monitoring
- Configured Redis to use native `allkeys-lru` eviction policy
- Enabled Redis keyspace notifications for eviction events
- Added dedicated Redis Pub/Sub subscriber for LRU eviction monitoring
- Logged evicted cache keys with reason (`LRU`) for observability

### Logging & Observability
- Implemented structured JSON logging for Redis events
- Added timestamped, level-based logs (info/error)
- Logged Redis eviction events to both console and rotating log files
- Implemented file-based logging with automatic rotation at 10MB size limit
- Organized logs for easier debugging and future integration with log aggregators

### Bug Fixes & Stability Improvements
- Fixed cache key interpolation issues caused by incorrect string literals
- Resolved incorrect cache reuse across different filter parameters
- Corrected pagination inconsistencies caused by stale cached responses
- Improved defensive handling of query parameters and numeric parsing

### Architecture & Maintainability
- Preserved existing Redis wrapper API (`get/set/del/flushAll`)
- Isolated Redis Pub/Sub logic from cache access logic
- Improved separation of concerns between caching, logging, and controllers
- Ensured Redis observability features do not interfere with application logic

### Notes
- Redis eviction logs only appear when actual memory eviction occurs (expected behavior)
- Cache observability validated via Redis CLI and application logs
- Foundation laid for future enhancements such as cache metrics, rate limiting, and monitoring dashboards


## [v0.5.0] – Advanced Filtering, Aggregation & Redis Caching
**Date: 2026-01-11**

### 🚀 New Features
- Added advanced filtering using MongoDB Aggregation Pipeline
- Implemented multi-tag filtering with support for:
  - `mode=any` → tasks matching **any** tag
  - `mode=all` → tasks matching **all** tags
- Added dynamic sorting for any field (`createdAt`, `priority`, `dueDate`, etc.)
- Added pagination using `page` + `limit`
- Added full-text-like search using regex on title & description
- Added date filters:  
  - `dueBefore=YYYY-MM-DD`
  - `dueAfter=YYYY-MM-DD`

### 🔧 Redis Caching (redis@5.10.0)
- Integrated Redis client for caching filtered results
- Cached responses keyed by user + query string
- Implemented automatic cache invalidation on:
  - task creation
  - task update/toggle
  - task deletion
- Added TTL (time-to-live) of 5 minutes per cache entry
- Improved server performance by reducing MongoDB queries

### 🗂 Schema Enhancements
- Modified Task schema to include:
  - `priority: low | medium | high`
  - `tags: [String]`
  - `dueDate: Date`
- Added MongoDB indexes:
  - `{ owner: 1 }`
  - `{ priority: 1 }`
  - `{ dueDate: 1 }`
  - `{ tags: 1 }`
  - `{ createdAt: -1 }`
- Ensures faster sorting, pagination, and tag filtering

### 🛠 Controller Improvements
- Restructured filter controller to build dynamic matchStage
- Improved pipeline:
  - `$match`
  - `$sort`
  - `$skip`
  - `$limit`
- Added `totalTasks` + `totalPages` response structure
- Added caching logic wrapping aggregation pipeline

### 🧪 Testing & Debugging Improvements
- Tested all filtering scenarios:
  - filtering by priority
  - multi-tag filters
  - searching by title
  - pagination navigation
  - date-range queries
- Confirmed Redis hits & misses with console logs
- Verified aggregation output consistency

---


## [v0.4.0] – Refresh Token System, Logout, and Token Security
Date: 2026-01-10

### Refresh Token Implementation
- Added secure `refreshToken` generation during login
- Stored hashed refresh token inside user document for persistence
- Implemented `/auth/refresh` endpoint to generate new access tokens
- Ensured refresh token must be valid + match DB before issuing new access token
- Added validation for missing, invalid, or tampered refresh tokens

### Logout Functionality
- Implemented `/auth/logout` endpoint
- On logout, refresh token is cleared from database to invalidate user session
- Prevents re-use of old refresh tokens after logout
- Ensured logout flow properly returns errors for invalid tokens

### Security Enhancements
- Ensured access token expiry triggers refresh mechanism gracefully
- Prevented refresh token usage after logout
- Differentiated access token expiry vs. refresh token expiry cases
- Added validation ensuring only refresh token is allowed in refresh endpoint
- Enforced `.unknown(false)` on validation schemas to prevent extra fields in requests

### Middleware Improvements
- Updated auth middleware to correctly handle expired/invalid access tokens
- Standardized error structure using centralized error middleware
- Improved token error messages for consistency (`expired`, `missing`, `invalid format`)

### Task Flow Integration
- Updated all task routes to work with refreshed tokens
- Ensured owner-based filtering still applies after token refresh
- Validated request bodies using Joi schemas before modifying DB
- Refactored toggle endpoint to use shared validation logic

### Codebase Organization
- Updated controllers to separate token creation logic for maintainability
- Further simplified routes to import controllers cleanly
- Ensured no duplicate logic remains in app.js
- Confirmed consistent folder structure: controllers, routes, models, middlewares, validations

### Testing Improvements
- Added complete test cases for:
  - login success/failure
  - token expiration handling
  - refresh token validity checks
  - logout invalidating refresh tokens
  - unauthorized access attempts
- Verified DB stores refresh tokens and removes on logout



## [v0.3.0] – Route Modularization, Controllers, Middleware Fixes
Date: 2026-01-06

### Refactor & Architecture
- Separated routes, controllers, and middleware into modular structure
- Introduced `controllers/`, `routes/`, and `middlewares/` for scalability
- Updated all route imports to use centralized controllers
- Fixed incorrect and missing file paths in imports

### Authentication & Login Fixes
- Corrected `res.Error()` → `res.status()` in register controller
- Fixed login token using `user.role` instead of `User.role`
- Improved error handling using next(error)
- Ensured consistent status codes for authentication failures

### Middleware Enhancements
- Fixed path resolution for `auth.middleware.js`
- Improved token parsing and format validation
- Added consistent error JSON output for expired/malformed tokens

### Task Toggle Endpoint
- Completely refactored toggle logic
- Prevented repeated assignment of `completed` field
- Supported flexible updates (title, description, completed)
- Body validation added via Joi schema
- Enforced whitelist of fields

### Error Handling (Level 1 – Basic)
- Implemented centralized error middleware
- Standardized `err.statusCode` usage
- Ensured all thrown errors pass through centralized handler

### Misc Fixes
- Removed outdated /updatetask endpoint
- Cleaned up legacy CRUD routes
- Added missing return statements in some paths
- Updated task filtering to use authenticated user context


# Changelog

## [v0.2.0] – JWT Authentication & Authorization
_Date: 2026-01-05_

### Added
- Implemented JWT-based authentication for users
- Added secure login endpoint that returns signed JWT tokens
- Implemented authentication middleware to verify JWT and inject user context

### Authorization
- Enforced ownership-based authorization for task updates and deletions
- Ensured users can only access and modify their own tasks
- Added role field (user/admin) to user model for future role-based access

### Security Improvements
- Prevented unauthorized task access using combined `_id + owner` query filters
- Added ObjectId validation to prevent invalid or incorrect IDs
- Implemented field whitelisting for PATCH requests to prevent unsafe updates

### CRUD Enhancements
- Updated task creation to automatically associate tasks with the authenticated user
- Ensured update and delete operations return proper 404 responses when unauthorized

### Debugging & Validation
- Added logging to diagnose authorization and ownership issues
- Identified and resolved incorrect usage of user IDs vs task IDs in routes

### Notes
- Input payload validation (e.g., Joi/Zod) intentionally deferred to next milestone
- Admin override routes and advanced features planned for future commits
