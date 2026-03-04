
import { Router } from 'express';
import { db } from '../db';
import { workspacePublicMapping } from '../../shared/db-schema';
import { eq, and } from 'drizzle-orm';
import { getClientSupabaseClient } from '../lib/multiTenantSupabase';

export const workspacePublicRoutes = Router();

// Utility functions for case conversion
function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertKeysToCamelCase(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => convertKeysToCamelCase(item));
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
        const converted: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const camelKey = toCamelCase(key);
                converted[camelKey] = convertKeysToCamelCase(obj[key]);
            }
        }
        return converted;
    }

    return obj;
}

/**
 * GET /api/public/workspace/:token
 * Busca um item do workspace (Página, Database ou Board) pelo seu token público
 */
workspacePublicRoutes.get('/:token', async (req: any, res: any) => {
    try {
        const { token } = req.params;

        console.log(`🌐 [WorkspacePublic] Buscando item pelo token: ${token}`);

        // 1. Resolver token na tabela de mapeamento
        const mappingResults = await db
            .select()
            .from(workspacePublicMapping)
            .where(and(
                eq(workspacePublicMapping.id, token),
                eq(workspacePublicMapping.isActive, true)
            ))
            .limit(1);
        
        let mapping = mappingResults[0];
        let itemId: string = '';
        let itemType: string = '';
        let tenantId: string = '';
        let clientId: string = '';

        if (!mapping) {
            console.log(`🔍 [WorkspacePublic] Token não mapeado, tentando fallback como itemId: ${token}`);
            // Fallback: Tentar tratar o token diretamente como itemId
            // Precisamos descobrir qual tenant possui este item
            const { pool } = await import('../db');
            const tenantResults = await pool.query('SELECT tenant_id FROM supabase_config');
            const tenants = tenantResults.rows.map((r: any) => r.tenant_id);
            
            // Adicionar 'system' e garantir que testamos todos
            const allTenants = Array.from(new Set([...tenants, 'system', 'local', 'supabase_local']));

            const tableMap: Record<string, string> = {
                'page': 'workspace_pages',
                'database': 'workspace_databases',
                'board': 'workspace_boards'
            };

            let foundItem: any = null;
            let foundType: string = '';
            let foundTenant: string = '';

            for (const tId of allTenants) {
                const supabase = await getClientSupabaseClient(tId);
                if (!supabase) continue;

                for (const [type, table] of Object.entries(tableMap)) {
                    const { data, error: fetchError } = await supabase
                        .from(table)
                        .select('*')
                        .eq('id', token)
                        .eq('is_public', true)
                        .maybeSingle();

                    if (!fetchError && data) {
                        foundItem = data;
                        foundType = type;
                        foundTenant = tId;
                        break;
                    }
                }
                if (foundItem) break;
            }

            if (!foundItem) {
                console.warn(`⚠️ [WorkspacePublic] Item não encontrado em nenhum tenant: ${token}`);
                return res.status(404).json({ error: 'Link de workspace não encontrado ou inativo' });
            }

            itemId = foundItem.id;
            itemType = foundType;
            tenantId = foundTenant;
            clientId = foundItem.client_id || '';
            
            console.log(`✅ [WorkspacePublic] Fallback encontrado: ${itemType} em ${tenantId}`);
            
            // Retornar item diretamente
            return res.json({
                success: true,
                item: convertKeysToCamelCase(foundItem),
                type: itemType,
                tenantId
            });
        } else {
            itemId = mapping.itemId;
            itemType = mapping.itemType;
            tenantId = mapping.tenantId;
            clientId = mapping.clientId || '';
        }

        // 2. Obter cliente Supabase dinâmico
        const supabase = await getClientSupabaseClient(tenantId);
        if (!supabase) {
            return res.status(400).json({ error: 'Supabase não configurado para este tenant' });
        }

        // 3. Buscar item na tabela correspondente
        const tableMap: Record<string, string> = {
            'page': 'workspace_pages',
            'database': 'workspace_databases',
            'board': 'workspace_boards'
        };

        const tableName = tableMap[itemType];
        if (!tableName) {
            return res.status(400).json({ error: 'Tipo de item inválido' });
        }

        const { data: item, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', itemId)
            .single();

        if (error || !item) {
            console.error(`❌ [WorkspacePublic] Erro ao buscar item no Supabase:`, error);
            return res.status(404).json({ error: 'Item do workspace não encontrado' });
        }

        // Double check if it's still public in the main table
        if (!item.is_public) {
            console.warn(`⚠️ [WorkspacePublic] Item encontrado mas não está marcado como público: ${itemId}`);
            return res.status(403).json({ error: 'Este item não é mais público' });
        }

        // 4. Parse campos JSON que o Supabase/Postgres pode retornar como string
        const jsonFields = [
            'blocks', 'databases', 'properties', 'lists', 'cards',
            'labels', 'members', 'settings', 'columns', 'rows', 'views'
        ];

        jsonFields.forEach(field => {
            if (item[field] && typeof item[field] === 'string') {
                try {
                    item[field] = JSON.parse(item[field]);
                } catch (e) {
                    console.warn(`Fallback parse failed for field ${field}`);
                }
            }
        });

        // 5. Formatar e retornar os dados (Recursivo para converter as chaves dos objetos JSON)
        const formattedItem = convertKeysToCamelCase(item);

        res.json({
            success: true,
            item: formattedItem,
            type: itemType,
            tenantId
        });

    } catch (error: any) {
        console.error('❌ [WorkspacePublic] Erro crítico:', error);
        res.status(500).json({
            error: 'Erro interno ao carregar workspace',
            details: error.message
        });
    }
});

/**
 * GET /api/public/workspace/:companySlug/:token
 * Variante com companySlug na URL para branding (companySlug é ignorado na lógica)
 * Redireciona para a mesma lógica do endpoint /:token
 */
workspacePublicRoutes.get('/:companySlug/:token', async (req: any, res: any) => {
    // companySlug is only for URL branding — forward to the same logic using just the token
    req.params.token = req.params.token;
    const tokenParam = req.params.token;

    // Reuse the same handler by calling the base route logic inline
    try {
        const { token } = { token: tokenParam };

        console.log(`🌐 [WorkspacePublic] Buscando item pelo token (slug route): ${token}`);

        const mappingResults = await db
            .select()
            .from(workspacePublicMapping)
            .where(and(
                eq(workspacePublicMapping.id, token),
                eq(workspacePublicMapping.isActive, true)
            ))
            .limit(1);

        let mapping = mappingResults[0];

        if (!mapping) {
            const { pool } = await import('../db');
            const tenantResults = await pool.query('SELECT tenant_id FROM supabase_config');
            const tenants = tenantResults.rows.map((r: any) => r.tenant_id);
            const allTenants = Array.from(new Set([...tenants, 'system', 'local', 'supabase_local']));

            const tableMap: Record<string, string> = {
                'page': 'workspace_pages',
                'database': 'workspace_databases',
                'board': 'workspace_boards'
            };

            let foundItem: any = null;
            let foundType: string = '';
            let foundTenant: string = '';

            for (const tId of allTenants) {
                const supabase = await getClientSupabaseClient(tId);
                if (!supabase) continue;
                for (const [type, table] of Object.entries(tableMap)) {
                    const { data, error: fetchError } = await supabase
                        .from(table)
                        .select('*')
                        .eq('id', token)
                        .eq('is_public', true)
                        .maybeSingle();
                    if (!fetchError && data) {
                        foundItem = data;
                        foundType = type;
                        foundTenant = tId;
                        break;
                    }
                }
                if (foundItem) break;
            }

            if (!foundItem) {
                return res.status(404).json({ error: 'Link de workspace não encontrado ou inativo' });
            }

            return res.json({
                success: true,
                item: convertKeysToCamelCase(foundItem),
                type: foundType,
                tenantId: foundTenant
            });
        }

        const supabase = await getClientSupabaseClient(mapping.tenantId);
        if (!supabase) {
            return res.status(400).json({ error: 'Supabase não configurado para este tenant' });
        }

        const tableMap: Record<string, string> = {
            'page': 'workspace_pages',
            'database': 'workspace_databases',
            'board': 'workspace_boards'
        };

        const tableName = tableMap[mapping.itemType];
        if (!tableName) {
            return res.status(400).json({ error: 'Tipo de item inválido' });
        }

        const { data: item, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', mapping.itemId)
            .single();

        if (error || !item) {
            return res.status(404).json({ error: 'Item do workspace não encontrado' });
        }

        if (!item.is_public) {
            return res.status(403).json({ error: 'Este item não é mais público' });
        }

        const jsonFields = ['blocks', 'databases', 'properties', 'lists', 'cards', 'labels', 'members', 'settings', 'columns', 'rows', 'views'];
        jsonFields.forEach(field => {
            if (item[field] && typeof item[field] === 'string') {
                try { item[field] = JSON.parse(item[field]); } catch (e) {}
            }
        });

        res.json({
            success: true,
            item: convertKeysToCamelCase(item),
            type: mapping.itemType,
            tenantId: mapping.tenantId
        });

    } catch (error: any) {
        console.error('❌ [WorkspacePublic] Erro crítico (slug route):', error);
        res.status(500).json({ error: 'Erro interno ao carregar workspace', details: error.message });
    }
});

export default workspacePublicRoutes;
