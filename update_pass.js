
const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";
const url = "https://semijoias-supabase.y98g1d.easypanel.host/pg/query";
const newHash = "$2b$12$4lL9dBFbLVIiErqHCdcXI.PSC.dtHLQaP2u43IyX6SMpGQJIlYdfy"; // Hash para Gabriel15@

async function updateUser() {
  console.log('🔄 Atualizando senha para contato@emericks.com.br...');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `UPDATE admin_users SET password_hash = '${newHash}' WHERE email = 'contato@emericks.com.br'`
    })
  });
  const data = await response.json();
  console.log('✅ Resultado:', JSON.stringify(data, null, 2));
}

updateUser();
