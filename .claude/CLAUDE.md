# LMS Project Rules for cf7-igeorgiadis-2025

## Personal Context
In case you need this information, the name of the owner on this project is Iasonas Georgiadis.

## Break complex tasks into smaller ones
If needed, break a complex task into smaller ones and tackle it running sub agents in parallel.

## Project Context
This is a full-stack Learning Management System for Coding Factory 7 at Athens University of Economics and Business.
Tech Stack: Node.js/Express backend, React/Vite frontend, PostgreSQL database.

## Critical Rules - ALWAYS FOLLOW

### Security First
- Every endpoint except /auth/login and /auth/register MUST verify JWT token
- Always validate input using express-validator before processing
- Hash passwords with bcrypt (minimum 10 rounds)
- Never expose stack traces or internal errors to clients
- Check user roles before ALL operations

### Architecture Patterns
- Use Repository pattern - no direct DB queries in controllers
- Controllers handle HTTP only - business logic goes in services
- Every endpoint needs request/response DTOs
- Follow REST conventions strictly
- Separate concerns: Controllers → Services → Repositories → Database

### Code Standards
- Use async/await (no callbacks or .then())
- JSDoc comments for all functions
- camelCase for variables, PascalCase for components/classes
- No console.log - use proper logging
- Conventional commits: feat:, fix:, docs:, test:

### Testing Requirements
- Write tests immediately after implementing features
- Test success AND failure cases
- Minimum 40% coverage
- Every service method needs a unit test
- Every endpoint needs an integration test

### Database Rules
- All tables need created_at, updated_at timestamps
- Use transactions for multi-table operations
- Migrations for ALL schema changes
- Parameterized queries only (prevent SQL injection)

### React Specific
- Functional components only with hooks
- Handle loading, error, and empty states
- PropTypes or TypeScript for all props
- Error boundaries for major sections
- Custom hooks for reused logic

### Business Logic
- Students cannot exceed course capacity
- Prerequisites must be completed first
- Instructors only modify their own courses
- Grades must be 0-100
- No late submissions without admin override

## Development Workflow
1. Create database migration first
2. Implement model/entity
3. Add repository methods
4. Create service with business logic
5. Add controller with validation
6. Write comprehensive tests
7. Implement frontend
8. Update documentation

## Before Committing Checklist
- [ ] No console.log statements
- [ ] All inputs validated
- [ ] Authentication checked
- [ ] Tests written and passing
- [ ] Errors handled gracefully
- [ ] Documentation updated
- [ ] No commented code
- [ ] Follows REST conventions

## Remember
This is an academic project - prioritize clean, readable code that demonstrates understanding of full-stack principles.