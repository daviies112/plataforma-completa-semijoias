import { StateStorage } from 'zustand/middleware';
import { apiRequest } from './queryClient';
import { getSupabaseClient } from './supabase';

/**
 * Check if current path is a public route that doesn't need Supabase storage
 */
function isPublicRoute(): boolean {
  if (typeof window === 'undefined') return false;
  
  const path = window.location.pathname;
  return (
    path.startsWith('/reuniao/') ||
    path.startsWith('/reuniao-publica/') ||
    path.startsWith('/assinar/') ||
    path.startsWith('/f/') ||
    path.startsWith('/form/') ||
    path.startsWith('/formulario/') ||
    path.startsWith('/loja/') ||
    path.startsWith('/checkout/') ||
    path === '/' ||
    path === '/login' ||
    path === '/reseller-login' ||
    /^\/[^/]+\/form\//.test(path)
  );
}

// Debounce helper
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Helper para obter clientId, tenantId e userId do localStorage
function getClientAndTenantIds(): { clientId: string; tenantId: string; userId: string | null } {
  try {
    const userData = localStorage.getItem('user_data');
    const parsedUser = userData ? JSON.parse(userData) : null;
    return {
      clientId: parsedUser?.clientId || '1',
      tenantId: parsedUser?.tenantId || 'tenant_a',
      userId: parsedUser?.userId || parsedUser?.id || null
    };
  } catch (error) {
    console.warn('⚠️ Erro ao obter user_data do localStorage, usando defaults:', error);
    return {
      clientId: '1',
      tenantId: 'tenant_a',
      userId: null
    };
  }
}

// Função para deletar do Supabase (chamada explicitamente pela UI)
export async function deleteFromSupabase(
  type: 'page' | 'database' | 'board',
  id: string
): Promise<void> {
  try {
    console.log(`🗑️ [DELETE] Deletando ${type} com id ${id} do Supabase...`);
    
    const supabase = await getSupabaseClient();
    
    if (!supabase) {
      console.log('⚠️ Supabase não configurado - delete ignorado');
      return;
    }

    // Mapear tipo para tabela
    const tableMap = {
      page: 'workspace_pages',
      database: 'workspace_databases',
      board: 'workspace_boards'
    };
    
    const tableName = tableMap[type];
    
    // Deletar do Supabase
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`❌ ERRO ao deletar ${type} do Supabase:`, error);
      throw error;
    }
    
    console.log(`✅ ${type} deletado do Supabase com sucesso! ID: ${id}`);
  } catch (error) {
    console.error(`❌ ERRO CRÍTICO ao deletar ${type} do Supabase:`, error);
    // Não propaga o erro para não quebrar a UI - o delete local já foi feito
  }
}

// Sincronização em background com Supabase (não bloqueia UI)
async function syncToSupabaseInBackground(value: string): Promise<void> {
  // Executa em background, não aguarda resultado
  Promise.resolve().then(async () => {
    try {
      console.log('🔒 [SYNC] Iniciando sincronização com Supabase...');

      // Parse o estado
      let state;
      try {
        state = typeof value === 'string' ? JSON.parse(value) : value;
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse do estado para sincronização:', parseError);
        return;
      }

      // Extrair pages, boards, databases do estado
      const { pages, boards, databases } = state.state || state;

      // Validar que temos arrays
      const validPages = Array.isArray(pages) ? pages : [];
      const validBoards = Array.isArray(boards) ? boards : [];
      const validDatabases = Array.isArray(databases) ? databases : [];

      // Obter clientId, tenantId e userId do localStorage ou usar defaults
      const { clientId, tenantId, userId } = getClientAndTenantIds();
      
      console.log('🔑 IDs extraídos do localStorage:', { clientId, tenantId, userId });
      
      // Salvar em paralelo (mais rápido)
      const promises = [];
      
      // Buscar cliente Supabase (assíncrono)
      const supabase = await getSupabaseClient();
      
      // Se Supabase não está configurado, não sincroniza
      if (!supabase) {
        console.log('⚠️ Supabase não configurado - sincronização desabilitada');
        return;
      }

      // IMPORTANTE: NÃO deletamos automaticamente do Supabase!
      // Supabase é a fonte da verdade - apenas fazemos UPSERT (insert ou update)
      // Deleções devem ser explícitas via UI, nunca automáticas
      
      // Helper para converter data para timestamp bigint
      const toTimestamp = (dateValue: any): number => {
        if (!dateValue) return Date.now();
        if (typeof dateValue === 'number') return dateValue;
        if (dateValue instanceof Date) return dateValue.getTime();
        if (typeof dateValue === 'string') {
          const parsed = new Date(dateValue);
          return isNaN(parsed.getTime()) ? Date.now() : parsed.getTime();
        }
        return Date.now();
      };

      // Salvar/atualizar pages
      if (validPages.length > 0) {
        console.log(`🔒 Preparando para salvar ${validPages.length} páginas no Supabase...`);
        const pagesData = validPages.map((page: any) => ({
          id: page.id,
          title: page.title || 'Sem título',
          icon: page.icon || '📄',
          cover: page.cover,
          content: page.content,
          type: page.type || 'page',
          properties: page.properties || {},
          blocks: page.blocks || [],
          databases: page.databases || [],
          parent_id: page.parentId,
          created_at: toTimestamp(page.createdAt),
          updated_at: Date.now(),
          tenant_id: tenantId,
          client_id: clientId,
          font_style: page.fontStyle,
          small_text: page.smallText,
          full_width: page.fullWidth,
          locked: page.locked,
          favorited: page.favorited
        }));

        console.log('📄 Dados das páginas:', pagesData.map(p => ({ id: p.id, title: p.title })));
        const pageResult = await supabase.from('workspace_pages').upsert(pagesData);
        if (pageResult.error) {
          console.error('❌ ERRO ao salvar páginas no Supabase:', pageResult.error);
        } else {
          console.log('✅ Páginas salvas no Supabase com sucesso!');
        }
      }

      // Salvar/atualizar boards
      if (validBoards.length > 0) {
        console.log(`🔒 Preparando para salvar ${validBoards.length} boards no Supabase...`);
        const boardsData = validBoards.map((board: any) => ({
          id: board.id,
          title: board.title || 'Sem título',
          icon: board.icon || '📋',
          cover: board.cover,
          lists: board.lists || [],
          cards: board.cards || [],
          labels: board.labels || [],
          members: board.members || [],
          settings: board.settings || {},
          created_at: toTimestamp(board.createdAt),
          updated_at: Date.now(),
          tenant_id: tenantId,
          client_id: clientId,
          favorited: board.favorited
        }));

        console.log('📋 Dados dos boards:', boardsData.map(b => ({ id: b.id, title: b.title })));
        const boardResult = await supabase.from('workspace_boards').upsert(boardsData);
        if (boardResult.error) {
          console.error('❌ ERRO ao salvar boards no Supabase:', boardResult.error);
        } else {
          console.log('✅ Boards salvos no Supabase com sucesso!');
        }
      }

      // Salvar/atualizar databases
      if (validDatabases.length > 0) {
        console.log(`🔒 Preparando para salvar ${validDatabases.length} databases no Supabase...`);
        const databasesData = validDatabases.map((db: any) => {
          // Garantir que columns e fields tenham o mesmo valor para compatibilidade
          const fieldsData = db.fields || db.columns || [];
          
          return {
            id: db.id,
            title: db.title || 'Sem título',
            icon: db.icon || '📊',
            cover: db.cover,
            description: db.description,
            columns: fieldsData,
            fields: fieldsData,
            rows: db.rows || [],
            views: db.views || [],
            view_type: db.view || db.viewType || 'table',
            current_view_id: db.currentViewId,
            created_at: toTimestamp(db.createdAt),
            updated_at: Date.now(),
            tenant_id: tenantId,
            client_id: clientId,
            locked: db.locked,
            favorited: db.favorited,
            chart_type: db.chartType,
            chart_x_axis: db.chartXAxis,
            chart_y_axis: db.chartYAxis
          };
        });

        console.log('📊 Dados dos databases:', databasesData.map(d => ({ id: d.id, title: d.title, fields: d.fields.length, columns: d.columns.length })));
        const databaseResult = await supabase.from('workspace_databases').upsert(databasesData);
        if (databaseResult.error) {
          console.error('❌ ERRO ao salvar databases no Supabase:', databaseResult.error);
        } else {
          console.log('✅ Databases salvos no Supabase com sucesso!');
        }
      }

      console.log('📤 Workspace sincronizado com Supabase (background):', {
        pages: validPages.length,
        boards: validBoards.length,
        databases: validDatabases.length
      });
    } catch (error) {
      console.error('❌ ERRO CRÍTICO ao sincronizar com Supabase:', error);
      console.error('Detalhes completos do erro:', JSON.stringify(error, null, 2));
      // Dados permanecem seguros no localStorage mesmo se a sincronização falhar
    }
  });
}

// Versão com debounce para a sincronização Supabase (não para localStorage!)
const debouncedSyncToSupabase = debounce(syncToSupabaseInBackground, 1000);

// Custom storage adapter que usa Supabase via API
export const supabaseStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // Skip Supabase entirely for public routes - return null immediately
    if (isPublicRoute()) {
      return null;
    }
    
    try {
      // Helper para fazer parsing seguro de campos JSON do Supabase
      const parseJsonField = (field: any, fallback: any = []) => {
        if (!field) return fallback;
        if (Array.isArray(field)) return field;
        if (typeof field === 'object') return field;
        
        // Se é string, tenta fazer parse (pode ter single ou double escape)
        if (typeof field === 'string') {
          try {
            let parsed = JSON.parse(field);
            // Se ainda é string após primeiro parse, tenta novamente (double-escaped)
            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed);
            }
            return parsed;
          } catch (error) {
            console.warn('⚠️ Erro ao fazer parse do campo JSON:', error);
            return fallback;
          }
        }
        
        return fallback;
      };

      // Verificar se usuário está autenticado
      const userData = localStorage.getItem('user_data');
      const isAuthenticated = !!userData;

      // Buscar cliente Supabase
      const supabase = await getSupabaseClient();
      
      // Se usuário está autenticado E Supabase está configurado, SEMPRE carrega do Supabase
      if (isAuthenticated && supabase) {
        console.log('🔄 Usuário autenticado - carregando workspace do Supabase...');

        // 🔐 MULTI-TENANT: obter tenantId do localStorage para filtrar dados corretamente
        const { tenantId: currentTenantId } = getClientAndTenantIds();
        console.log(`🔐 [WORKSPACE] Filtrando por tenant_id: ${currentTenantId}`);

        const [pagesResult, boardsResult, databasesResult] = await Promise.all([
          supabase.from('workspace_pages').select('*').eq('tenant_id', currentTenantId),
          supabase.from('workspace_boards').select('*').eq('tenant_id', currentTenantId),
          supabase.from('workspace_databases').select('*').eq('tenant_id', currentTenantId),
        ]);

        const pages = pagesResult.data || [];
        const boards = boardsResult.data || [];
        const databases = databasesResult.data || [];

        console.log('📊 Dados do Supabase:', { pages: pages.length, boards: boards.length, databases: databases.length });

        // SEMPRE usa dados do Supabase como fonte da verdade quando autenticado
        // IMPORTANTE: NUNCA ignora dados do Supabase, mesmo que vazio
        console.log('✅ Parseando dados do Supabase com suporte a JSON escapado...');
        console.log('🔒 GARANTIA: Estes dados do Supabase NUNCA serão deletados automaticamente');
          
        const state = {
          pages: pages.map((p: any) => {
            const blocks = parseJsonField(p.blocks, []);
            const databases = parseJsonField(p.databases, []);
            const properties = parseJsonField(p.properties, {});
            console.log(`📄 Página "${p.title}": ${blocks.length} blocos, ${databases.length} databases`);
            
            return {
              id: p.id,
              title: p.title,
              icon: p.icon,
              cover: p.cover,
              content: p.content,
              type: p.type,
              properties: properties,
              blocks: blocks,
              databases: databases,
              parentId: p.parent_id,
              createdAt: p.created_at,
              updatedAt: p.updated_at,
              fontStyle: p.font_style,
              smallText: p.small_text,
              fullWidth: p.full_width,
              locked: p.locked,
              favorited: p.favorited
            };
          }),
          boards: boards.map((b: any) => ({
            id: b.id,
            title: b.title,
            icon: b.icon,
            cover: b.cover,
            lists: parseJsonField(b.lists, []),
            cards: parseJsonField(b.cards, []),
            labels: parseJsonField(b.labels, []),
            members: parseJsonField(b.members, []),
            settings: parseJsonField(b.settings, {}),
            createdAt: b.created_at,
            favorited: b.favorited
          })),
          databases: databases.map((d: any) => ({
            id: d.id,
            title: d.title,
            icon: d.icon,
            cover: d.cover,
            description: d.description,
            fields: parseJsonField(d.columns, []),
            rows: parseJsonField(d.rows, []),
            views: parseJsonField(d.views, []),
            view: d.view_type,
            currentViewId: d.current_view_id,
            createdAt: d.created_at,
            locked: d.locked,
            favorited: d.favorited,
            chartType: d.chart_type,
            chartXAxis: d.chart_x_axis,
            chartYAxis: d.chart_y_axis
          })),
          currentPageId: pages[0]?.id || null,
          currentDatabaseId: null,
          currentBoardId: boards[0]?.id || null,
          searchQuery: '',
          version: 4,
          state: {
            pages: pages.map((p: any) => ({
              id: p.id,
              title: p.title,
              icon: p.icon,
              cover: p.cover,
              content: p.content,
              type: p.type,
              properties: parseJsonField(p.properties, {}),
              blocks: parseJsonField(p.blocks, []),
              databases: parseJsonField(p.databases, []),
              parentId: p.parent_id,
              createdAt: p.created_at,
              updatedAt: p.updated_at,
              fontStyle: p.font_style,
              smallText: p.small_text,
              fullWidth: p.full_width,
              locked: p.locked,
              favorited: p.favorited
            })),
            boards: boards.map((b: any) => ({
              id: b.id,
              title: b.title,
              icon: b.icon,
              cover: b.cover,
              lists: b.lists || [],
              cards: b.cards || [],
              labels: b.labels || [],
              members: b.members || [],
              settings: b.settings || {},
              createdAt: b.created_at,
              favorited: b.favorited
            })),
            databases: databases.map((d: any) => ({
              id: d.id,
              title: d.title,
              icon: d.icon,
              cover: d.cover,
              description: d.description,
              fields: d.columns || [],
              rows: d.rows || [],
              views: d.views || [],
              view: d.view_type,
              currentViewId: d.current_view_id,
              createdAt: d.created_at,
              locked: d.locked,
              favorited: d.favorited,
              chartType: d.chart_type,
              chartXAxis: d.chart_x_axis,
              chartYAxis: d.chart_y_axis
            }))
          }
        };

        console.log('✅ Workspace carregado do Supabase:', {
          pages: pages.length,
          boards: boards.length,
          databases: databases.length
        });

        // Salva no localStorage para cache
        localStorage.setItem(name, JSON.stringify(state));
        
        return JSON.stringify(state);
      } else if (!isAuthenticated) {
        // Usuário não autenticado - usa localStorage
        console.log('👤 Usuário não autenticado - usando localStorage');
        const localData = localStorage.getItem(name);
        if (localData) {
          return localData;
        }
      } else {
        // Supabase não configurado - usa localStorage
        console.log('⚠️ Supabase não configurado - usando localStorage');
        const localData = localStorage.getItem(name);
        if (localData) {
          return localData;
        }
      }

      // Se não tiver dados em nenhum lugar, retorna null
      console.log('📭 Nenhum dado encontrado');
      return null;
    } catch (error) {
      console.error('Erro ao carregar workspace, usando localStorage:', error);
      return localStorage.getItem(name);
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    // Skip Supabase entirely for public routes
    if (isPublicRoute()) {
      return;
    }
    
    // PASSO 1: Salvar IMEDIATAMENTE no localStorage (cache local)
    localStorage.setItem(name, value);
    console.log('💾 Workspace salvo localmente (cache)');
    
    // PASSO 2: Sincronizar com Supabase em BACKGROUND (FONTE DA VERDADE)
    // PROTEÇÃO: Apenas UPSERT, NUNCA delete automático
    console.log('📤 Sincronizando com Supabase (apenas insert/update)...');
    debouncedSyncToSupabase(value);
  },

  removeItem: async (name: string): Promise<void> => {
    localStorage.removeItem(name);
  },
};
