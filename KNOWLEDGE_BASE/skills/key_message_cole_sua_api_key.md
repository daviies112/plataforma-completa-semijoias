---
## 4. CLI ErgonÃ´mica ðŸ’»

```typescript
// CLI usando commander.js ou oclif

// InstalaÃ§Ã£o: npm install -g seuproduto
// Uso: seuproduto [command] [options]

import { Command } from 'commander';
const program = new Command();

program
  .name('seuproduto')
  .description('CLI do Seu Produto')
  .version('1.0.0');

// AutenticaÃ§Ã£o (armazenar chave localmente):
program
  .command('login')
  .description('Autenticar com sua API key')
  .action(async () => {
    const { key } = await inquirer.prompt([
      { type: 'password', name: 'key', message: 'Cole sua API key:' }
    ]);
    await saveConfig({ apiKey: key });
    console.log('âœ“ Autenticado com sucesso!');
  });

// Comando principal com opÃ§Ãµes intuitivas:
program
  .command('process <input>')
  .description('Processar um arquivo ou texto')
  .option('-f, --format <type>', 'formato de saÃ­da: json, text, csv', 'json')
  .option('-o, --output <file>', 'salvar resultado em arquivo')
  .option('--dry-run', 'simular sem processar')
  .action(async (input, options) => {
    const spinner = ora('Processando...').start();
    try {
      const result = await client.process(input, options);
      spinner.succeed('Processado!');
      
      if (options.output) {
        await fs.writeFile(options.output, JSON.stringify(result, null, 2));
        console.log(`Resultado salvo em ${options.output}`);
      } else {
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      spinner.fail(`Erro: ${error.message}`);
      process.exit(1);
    }
  });

// PRINCÃPIOS DA BOA CLI:
// â†’ Mensagens de erro claras com sugestÃ£o de soluÃ§Ã£o
// â†’ Tab completion (usando omelette ou oclif plugins)
// â†’ --help sempre atualizado e descritivo
// â†’ Spinner para operaÃ§Ãµes longas (ora)
// â†’ Cores para output (chalk) â€” mas respeitar NO_COLOR env
// â†’ --json flag para output machine-readable
// â†’ Exit codes significativos (0 = sucesso, 1 = erro do usuÃ¡rio, 2 = erro da API)
```
---

## 5. Changelog e Versionamento ðŸ“‹

```markdown
# Changelog

## v2.1.0 â€” 18 de fevereiro de 2026

### ðŸš€ Novidades
- **Suporte a streaming**: `client.process()` agora aceita `{ stream: true }` 
  retornando `AsyncIterator` ([ver docs](https://docs.seusite.com/streaming))
- **Novo endpoint**: `POST /v1/batch` para processamento em lote (atÃ© 100 itens)

### ðŸ› CorreÃ§Ãµes
- Corrigido timeout em requests > 30s que retornavam erro 500 incorretamente
- Headers de CORS agora incluem `X-Request-ID` para debugging

### âš ï¸ DeprecaÃ§Ãµes (suporte atÃ© v3.0)
- `client.processSync()` foi deprecado. Use `client.process()` (que jÃ¡ Ã© assÃ­ncrono)

### ðŸ“¦ SDK Updates
- Node.js SDK: v2.1.0 ([npm](https://npm.im/@seuproduto/node))
- Python SDK: v2.1.0 ([PyPI](https://pypi.org/project/seuproduto))
- Go SDK: v2.1.0 ([pkg.go.dev](https://pkg.go.dev/github.com/seuproduto/go))