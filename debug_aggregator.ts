
import { aggregateLeadJourneys } from './server/lib/leadJourneyAggregator';
import { normalizePhone } from './server/formularios/utils/phoneNormalizer';

async function test() {
  const tenantId = 'system';
  const targetPhone = '+5531992267220'; // Normalized version of 553192267220
  
  console.log(`🔍 Starting debug for tenant: ${tenantId}, phone: ${targetPhone}`);
  
  try {
    const journeys = await aggregateLeadJourneys(tenantId);
    console.log(`📊 Total journeys aggregated: ${journeys.length}`);
    
    const lead = journeys.find(j => j.telefoneNormalizado === targetPhone);
    
    if (lead) {
      console.log('✅ Lead found!');
      console.log('Pipeline Status:', lead.pipelineStatus);
      console.log('Pipeline Stage Label:', lead.pipelineStageLabel);
      console.log('Formulario Envio Present:', !!lead.formularioEnvio);
      if (lead.formularioEnvio) {
          console.log('Formulario Envio ID:', lead.formularioEnvio.id);
          console.log('Formulario Envio Status:', lead.formularioEnvio.status);
      }
      console.log('Has Form:', !!lead.form);
      console.log('Has CPF:', !!lead.cpfData);
      console.log('Has Meeting:', !!lead.meeting);
    } else {
      console.log('❌ Lead NOT found in aggregated journeys.');
      // List some normalized phones to see what we have
      console.log('Sample of 10 phones in system:');
      journeys.slice(0, 10).forEach(j => console.log(` - ${j.telefoneNormalizado} (${j.nome})`));
    }
  } catch (err) {
    console.error('❌ Error during aggregation:', err);
  }
}

test();
