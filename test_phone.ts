import { normalizePhone } from './server/formularios/utils/phoneNormalizer';

console.log('1:', normalizePhone('553192267220@s.whatsapp.net'));
console.log('2:', normalizePhone('553192267220'));
console.log('3:', normalizePhone('3192267220'));
console.log('4:', normalizePhone('312267220'));
process.exit(0);
