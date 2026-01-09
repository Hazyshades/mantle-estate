# Database Rules

## General Principles

- Database: PostgreSQL
- Schema management through migrations
- Migrations are located in `backend/db/migrations/`

## Migration Structure

- Each migration consists of two files:
  - `NNN_description.up.sql` - apply migration
  - `NNN_description.down.sql` - rollback migration
- Migration numbers should be sequential (001, 002, 003...)
- Description should be clear and in English

## Working with Migrations

- Always create both versions of migration (up and down)
- Test rollback before applying migration
- Use transactions for critical operations:
  ```sql
  BEGIN;
  -- operations
  COMMIT;
  ```

## Indexes

- Create indexes for frequently used fields in WHERE and JOIN
- Use indexes for foreign keys
- Create composite indexes for queries with multiple conditions
- Don't overuse indexes - they slow down INSERT/UPDATE

## Data Types

- Use `BIGSERIAL` for auto-incrementing IDs
- Use `TEXT` for strings of arbitrary length
- Use `DOUBLE PRECISION` for floating-point numbers (prices, metrics)
- Use `TIMESTAMP` for dates and times
- Use `BOOLEAN` for boolean values

## Foreign Keys

- Always use foreign keys for relationships between tables
- Add `ON DELETE CASCADE` or `ON DELETE SET NULL` where appropriate
- Don't forget to create indexes for foreign keys

## Data History

- Use separate tables for history (e.g., `price_history`, `market_price_history`)
- Save timestamp for each history record
- Regularly clean old history data if necessary

## Working with Data in Code

- Always use parameterized queries via template literals:
  ```typescript
  await db.exec`
    SELECT * FROM cities WHERE id = ${cityId}
  `;
  ```
- Never insert user data directly into SQL string
- Use typing for query results:
  ```typescript
  const cities = await db.queryAll<City>`
    SELECT * FROM cities
  `;
  ```

## Performance

- Avoid N+1 queries - use JOIN or batch data loading
- Use LIMIT for large selections
- Use pagination for large lists
- Regularly analyze slow queries

## Security

- Never execute DROP TABLE in production without confirmation
- Make backups before important migrations
- Use transactions for critical operations

