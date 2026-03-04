import { forms } from './shared/db-schema';
import { createInsertSchema } from 'drizzle-zod';

const schema = createInsertSchema(forms);

const testOmit = schema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
