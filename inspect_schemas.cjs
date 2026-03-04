
const { complianceAuditLog, datacorpChecks, complianceUsers, tenantsRegistry } = require('./shared/db-schema.js');
const { createInsertSchema } = require('drizzle-zod');

try {
  const auditSchema = createInsertSchema(complianceAuditLog);
  console.log('AuditLog keys:', Object.keys(auditSchema.shape));

  const checkSchema = createInsertSchema(datacorpChecks);
  console.log('DatacorpCheck keys:', Object.keys(checkSchema.shape));

  const userSchema = createInsertSchema(complianceUsers);
  console.log('ComplianceUser keys:', Object.keys(userSchema.shape));

  const tenantSchema = createInsertSchema(tenantsRegistry);
  console.log('Tenant keys:', Object.keys(tenantSchema.shape));
} catch (e) {
  console.error('Error creating schemas:', e.message);
}
