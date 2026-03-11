const { Client } = require('pg');

async function test() {
  const client = new Client({
    host: '103.199.187.145',
    port: 5432,
    user: 'postgres',
    password: '230723Davi#',
    database: 'semijoias',
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
    console.log('CONEXÃO SUCESSO! O Postgres está acessível e a senha está correta.');
    const res = await client.query('SELECT current_database(), count(*) FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log(`Banco: ${res.rows[0].current_database}, Tabelas no public: ${res.rows[0].count}`);
    await client.end();
  } catch (err) {
    console.error('ERRO NA CONEXÃO:', err.message);
    if (err.message.includes('password authentication failed')) {
      console.log('DICA: A senha pode estar incorreta ou o usuário não tem permissão.');
    }
  }
}

test();
