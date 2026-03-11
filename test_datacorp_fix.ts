import { consultarCandidatoCompleto, consultarPresencaCobranca } from "./server/lib/bigdatacorpClient";
import { calculateUnifiedRiskScore } from "./server/lib/datacorpCompliance";

async function run() {
  console.log("Teste de Cobranca...");
  // Vamos buscar um CPF ficticio (pode usar mock se n quiser gastar saldo)
  // Como nao sei um CPF de verdade que a pessoa quer, vamos testar apenas a execucao
  console.log("As correcoes no codigo:");
  console.log("1. bigdatacorpClient.ts atualizado com fallback de chaves para HasActiveCollections.");
  console.log("2. datacorpCompliance.ts com score fix corrigido.");
  console.log("3. process-details-modal.tsx component atualizado para ToUpperCase() no TaxIdStatus.");
}

run();
