import { forms } from './shared/db-schema';
import { createInsertSchema } from 'drizzle-zod';

const schema = createInsertSchema(forms);

type InsertType = typeof schema._type;
// Just checking if schema itself compiles
console.log(schema);
