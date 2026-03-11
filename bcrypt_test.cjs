
const b = require('bcryptjs');
const h = '$2a$10$C823Lw28T/Y.qXX.nKzJ/eqlH0XvJvGZgM37lOrN0OaN9rXgN.pIq';
b.compare('Gabriel15@', h).then(r => console.log('MATCH:' + r)).catch(console.error);

