# General Project Rules

## Mantle Estate Project

Mantle Estate is a platform for trading synthetic real estate, where users can open long/short positions on real estate markets of various cities.

## Project Architecture

- **Backend**: Encore.dev (TypeScript) in the `backend/` directory
- **Frontend**: React + TypeScript + Vite in the `frontend/` directory
- **Smart Contracts**: Solidity contracts in the `contracts/` directory
- **Package Manager**: Bun (not npm/yarn)

## Directory Structure

```
mantle-estate/
├── backend/          # Encore.dev backend services
├── frontend/         # React frontend application
├── contracts/        # Solidity smart contracts
├── docs/             # Project documentation
└── .cursor/          # Rules for Cursor AI
```

## Language and Localization

- Code comments: English
- User messages: English (or the required language)
- Variable and function names: English, camelCase
- File names: English, snake_case for backend, PascalCase for React components

## Commits

- Use clear commit messages
- Specify change type: `feat:`, `fix:`, `refactor:`, `docs:`, etc.
- Example: `feat: add funding rate calculation`, `fix: resolve price update issue`

## Dependencies

- Don't add dependencies without necessity
- Check that the dependency is actively maintained
- Use exact versions in package.json for critical dependencies
- Regularly update dependencies for security

## Code Review

- All changes must go through code review before merge
- Check typing, error handling, security
- Ensure code follows project rules

## Testing

- Write tests for critical business logic
- Test edge cases
- Use mocks for external dependencies

## Documentation

- Update documentation when API changes
- Document complex logic in comments
- Maintain changelog for important changes

## Security

- Never commit secrets and API keys
- Use environment variables for configuration
- Validate user input on backend
- Use parameterized SQL queries
- Follow best practices for smart contracts

## Performance

- Optimize database queries
- Use caching where appropriate
- Minimize the number of API requests
- Optimize frontend bundle size

## Git Workflow

- Create branches for new features: `feat/feature-name` or `fix/bug-name`
- Don't commit directly to main/master
- Use meaningful commit messages
- Regularly sync branches with main

