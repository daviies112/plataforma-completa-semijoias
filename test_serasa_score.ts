import { calculateUnifiedRiskScore } from './server/lib/datacorpCompliance';

async function testSerasaScores() {
  console.log("==========================================================");
  console.log("   INICIANDO TESTES EXAUSTIVOS SCORE SERASA");
  console.log("==========================================================\n");

  const buildProcessData = (asDefendant: number, total: number, last30: number = 0, criminal: boolean = false) => {
    return {
      Lawsuits: criminal ? [{ CourtType: "Criminal" }] : [],
      TotalLawsuitsAsDefendant: asDefendant,
      TotalLawsuits: total,
      Last30DaysLawsuits: last30,
    };
  };

  const basicDataClean = { TaxIdStatus: 'REGULAR', BirthDate: '1990-01-01', MotherName: 'MARIA' };
  const collectionsClean = { HasActiveCollections: false, TotalOccurrences: 0 };
  const collectionsDirty = { HasActiveCollections: true, TotalOccurrences: 5 };

  // ===================================
  // CASE 1: Impecavel (0 processos)
  // ===================================
  const scoreImpecavel = calculateUnifiedRiskScore(
    buildProcessData(0, 0),
    basicDataClean,
    collectionsClean
  );
  console.log(`[CENARIO 1] Candidata Ficha Limpa (0 proc, s/ div):`)
  console.log(`   -> Score Risco (Backend): ${scoreImpecavel} (esperado: 0)`);
  console.log(`   -> Veredicto Frontend Relacionado: Excelente (> 900)`);
  console.log("----------------------------------------------------------");

  // ===================================
  // CASE 2: Dentro da média (2-3 processos)
  // ===================================
  const scoreMedia = calculateUnifiedRiskScore(
    buildProcessData(3, 3),
    basicDataClean,
    collectionsClean
  );
  console.log(`[CENARIO 2] Candidata Brasileira Media (3 proc como réu):`)
  console.log(`   -> Score Risco (Backend): ${scoreMedia} (esperado: 4.0 penalidade)`);
  console.log(`   -> Veredicto Frontend Relacionado: Atenção (~600)`);
  console.log("----------------------------------------------------------");

  // ===================================
  // CASE 3: Zona de Perigo (4 processos)
  // ===================================
  const scorePerigo = calculateUnifiedRiskScore(
    buildProcessData(4, 4),
    basicDataClean,
    collectionsClean
  );
  console.log(`[CENARIO 3] Zona de Risco (4 proc como réu):`)
  console.log(`   -> Score Risco (Backend): ${scorePerigo} (esperado: 5.0 penalidade)`);
  console.log(`   -> Veredicto Frontend Relacionado: Risco Alto (~500)`);
  console.log("----------------------------------------------------------");

  // ===================================
  // CASE 4: Rejeitada Imediata (6 processos)
  // ===================================
  const scoreRejeitada = calculateUnifiedRiskScore(
    buildProcessData(6, 6),
    basicDataClean,
    collectionsClean
  );
  console.log(`[CENARIO 4] Rejeitada Automaticamente (6 proc como réu):`)
  console.log(`   -> Score Risco (Backend): ${scoreRejeitada} (esperado: 8.2 penalidade -> base 7.2 + 1 total)`);
  console.log(`   -> Veredicto Frontend Relacionado: Risco Muito Alto (~280)`);
  console.log("----------------------------------------------------------");

  // ===================================
  // CASE 5: Dívida Ativa Fatal 
  // ===================================
  const scoreDividaAtiva = calculateUnifiedRiskScore(
    buildProcessData(0, 0),
    basicDataClean,
    collectionsDirty
  );
  console.log(`[CENARIO 5] Ficha Limpa, porem Divida Ativa em Cobrança:`)
  console.log(`   -> Score Risco (Backend): ${scoreDividaAtiva} (esperado: >>7 penalidade)`);
  console.log(`   -> Veredicto Frontend Relacionado: Risco Muito Alto (< 300)`);
  console.log("----------------------------------------------------------");

  // ===================================
  // CASE 6: Processo Criminal
  // ===================================
  const scoreCriminal = calculateUnifiedRiskScore(
    buildProcessData(1, 1, 0, true),
    basicDataClean,
    collectionsClean
  );
  console.log(`[CENARIO 6] 1 Processo Criminal Recente:`)
  console.log(`   -> Score Risco (Backend): ${scoreCriminal} (esperado: 1.5 + 5 criminal)`);
  console.log(`   -> Veredicto Frontend Relacionado: Punição Extra`);
  console.log("==========================================================\n");
}

testSerasaScores();
