import { db } from '../db';
import { appSettings } from '../../shared/db-schema';
import { eq } from 'drizzle-orm';

const slugCache = new Map<string, string>();

export async function getCompanySlug(tenantId: string): Promise<string> {
  if (slugCache.has(tenantId)) {
    return slugCache.get(tenantId)!;
  }
  
  try {
    const [config] = await db.select({ companySlug: appSettings.companySlug })
      .from(appSettings)
      .where(eq(appSettings.tenantId, tenantId))
      .limit(1);
    
    if (config?.companySlug) {
      const slug = config.companySlug === 'emericks' || config.companySlug === 'emericks-tenant' ? 'emerick' : config.companySlug;
      slugCache.set(tenantId, slug);
      return slug;
    }
    const defaultSlug = tenantId.replace(/^dev-/, '').replace(/_/g, '-');
    return defaultSlug === 'emericks' || defaultSlug === 'emericks-tenant' ? 'emerick' : defaultSlug;
  } catch {
    const defaultSlug = tenantId.replace(/^dev-/, '').replace(/_/g, '-');
    return defaultSlug === 'emericks' || defaultSlug === 'emericks-tenant' ? 'emerick' : defaultSlug;
  }
}

export async function getCompanySlugFromDb(tenantId: string): Promise<string | null> {
  try {
    const [config] = await db.select({ companySlug: appSettings.companySlug })
      .from(appSettings)
      .where(eq(appSettings.tenantId, tenantId))
      .limit(1);
    
    return config?.companySlug || null;
  } catch {
    return null;
  }
}

export function invalidateSlugCache(tenantId: string) {
  slugCache.delete(tenantId);
}

export async function saveCompanySlug(tenantId: string, slug: string): Promise<boolean> {
  try {
    const normalized = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    const [existing] = await db.select().from(appSettings)
      .where(eq(appSettings.tenantId, tenantId)).limit(1);
    
    const oldSlug = existing?.companySlug;
    
    if (existing) {
      await db.update(appSettings)
        .set({ companySlug: normalized, updatedAt: new Date() })
        .where(eq(appSettings.tenantId, tenantId));
    } else {
      await db.insert(appSettings).values({
        tenantId,
        companySlug: normalized,
        companyName: normalized.charAt(0).toUpperCase() + normalized.slice(1).replace(/-/g, ' '),
      });
    }
    
    if (oldSlug && oldSlug !== normalized) {
      try {
        const { meetingTenants } = await import('../../shared/db-schema.js');
        const [mt] = await db.select()
          .from(meetingTenants)
          .where(eq(meetingTenants.slug, oldSlug))
          .limit(1);
        
        if (mt) {
          await db.update(meetingTenants)
            .set({ slug: normalized, nome: normalized })
            .where(eq(meetingTenants.id, mt.id));
          console.log(`[TenantSlug] Updated meeting_tenants slug from "${oldSlug}" to "${normalized}"`);
        }
      } catch (mtErr) {
      }
    }
    
    invalidateSlugCache(tenantId);
    return true;
  } catch (err) {
    console.error('[TenantSlug] Error saving slug:', err);
    return false;
  }
}
