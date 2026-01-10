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
