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
