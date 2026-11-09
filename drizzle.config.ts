import { defineConfig } from 'drizzle-kit';

// Migrations are bundled into the app (expo driver) and applied at startup.
export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
});
