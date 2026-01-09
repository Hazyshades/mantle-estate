# Backend Development Rules (Encore.dev)

## General Principles

- All backend files are located in the `backend/` directory
- Encore.dev framework is used for creating microservices
- Package manager: Bun
- Language: TypeScript

## Service Structure

- Each service should be in a separate directory (e.g., `backend/auth/`, `backend/city/`, `backend/trading/`)
- Each service should contain an `encore.service.ts` file with service definition
- API endpoints are defined using the `api()` function from `encore.dev/api`
- Cron jobs are defined using `CronJob` from `encore.dev/cron`

## API Endpoints

- Use the `api()` function to create endpoints:
  ```typescript
  export const myEndpoint = api(
    { expose: true, method: "POST", path: "/my-endpoint" },
    async (req: RequestType): Promise<ResponseType> => {
      // implementation
    }
  );
  ```
- Always specify types for request and response
- Use `expose: true` for public endpoints
- Use authentication method for protected endpoints

## Database Operations

- Use the `db` object from `../db` (or the appropriate path)
- Use template literals for SQL queries:
  ```typescript
  await db.exec`
    UPDATE cities
    SET price = ${newPrice}
    WHERE id = ${cityId}
  `;
  ```
- Always use parameterized queries for security
- For SELECT queries, use `db.queryAll<T>()` or `db.queryOne<T>()`

## Database Migrations

- Migrations are located in `backend/db/migrations/`
- File naming format: `NNN_description.up.sql` and `NNN_description.down.sql`
- Always create both versions of migration (up and down)
- Use transactions for critical operations

## Authentication

- Use Clerk for authentication via `@clerk/backend`
- Check authentication through middleware or inside the endpoint
- User ID is obtained from the Clerk token

## Cron Jobs

- Define Cron jobs using `CronJob`:
  ```typescript
  const myCron = new CronJob("job-name", {
    title: "Job Title",
    every: "6h", // or other frequency
    endpoint: myEndpoint,
  });
  ```
- Use meaningful names and execution frequency

## Error Handling

- Always handle errors in try-catch blocks
- Return clear error messages to the client
- Log errors for debugging

## TypeScript Typing

- Always use TypeScript types
- Export types for use in frontend
- Use interfaces for data objects

## Frontend Client Generation

- After changing the API, run `encore gen client --target leap` in the `backend/` directory
- This generates types and client for use in frontend

