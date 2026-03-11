import { aggregateLeadJourneys } from './server/lib/leadJourneyAggregator';
import 'dotenv/config';

async function run() {
    try {
        console.log('Testing aggregateLeadJourneys for emerick...');
        const journeys = await aggregateLeadJourneys('emerick');
        console.log('Result length:', journeys.length);
        if (journeys.length > 0) {
            journeys.forEach((j, i) => {
                console.log(`Lead ${i}:`, j.nome, '| Phone:', j.telefone, '| Status:', j.pipelineStatus);
            });
        } else {
            console.log('No journeys found for emerick');
        }
        process.exit(0);
    } catch (e) {
        console.error('Error during aggregation:', e);
        process.exit(1);
    }
}
run();
