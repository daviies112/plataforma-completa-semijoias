# 🚨 DOCUMENTAÇÃO DE DIAGNÓSTICO: Correção da API Datacorp e Exibição de Dados

Este documento lista **TODOS** os bugs identificados na integração com a API da BigDataCorp (Datacorp) e fornece as instruções exatas de como resolvê-los. Use este documento como guia definitivo para aplicar as correções.

---

## 🐞 PROBLEMA 1: Incompatibilidade de Chaves no Dataset de Cobranças (Collections)

**O Problema:** 
O frontend e o motor de risco de crédito esperam chaves com um nome, mas a API da BigDataCorp retorna com outro nome. Por isso os painéis de "Presença em Cobrança" ficam totalmente zerados, mostrando como se a pessoa não tivesse dívidas.

| O que a API retorna | O que o frontend espera | Consequência |
|---|---|---|
| `IsCurrentlyOnCollection` | `HasActiveCollections` | Frontend acha que não tem dívida ativa |
| `CollectionOccurrences` | `TotalOccurrences` | Total de dívidas sempre mostra 0 |
| `Last90DaysCollectionOccurrences` | `Last3Months` | Não exibe dívidas recentes |
| `Last365DaysCollectionOccurrences` | `Last12Months` | Não exibe dívidas anuais |

### Como resolver:
O arquivo `server/lib/bigdatacorpClient.ts` não possui normalização para o dataset `collections`. A normalização precisa ser adicionada.

---

## 🐞 PROBLEMA 2: Status do CPF "REGULAR" Quebrado (Case Sensitive)

**O Problema:**
O badge do CPF no arquivo `process-details-modal.tsx` (linha ~597) verifica o status usando Case Sensitive estritos:
`basicDataPayload.TaxIdStatus === 'Regular'`

Porém, a API da BigDataCorp retorna a string em formato **MAIÚSCULO**: `"REGULAR"`.
**Consequência:** CPFs perfeitamente normais aparecem marcados em vermelho no front.

### Como resolver:
No `process-details-modal.tsx`, alterar a renderização do Badge para comparar convertendo para um padrão:
`basicDataPayload.TaxIdStatus?.toUpperCase() === 'REGULAR'`

---

## 🐞 PROBLEMA 3: Cálculo do Score Universal (Motor de Risco) Ignorando Inadimplentes

**O Problema:**
Nas linhas de `universalScore` (dentro de `process-details-modal.tsx`), a lógica de penalização usa as variáveis erradas que causam o Problema 1.
```typescript
if (collectionsPayload?.HasActiveCollections) { score -= 200; }
```
**Consequência:** A revendedora ganha a pontuação base mesmo estando inadimplente agora, permitindo a aprovação de pessoas que deveriam ser rejeitadas.

### Como resolver:
Dentro de `process-details-modal.tsx` e `server/lib/datacorpCompliance.ts`, alterar as chaves para verificar:
`collectionsPayload?.IsCurrentlyOnCollection || collectionsPayload?.HasActiveCollections`
Isso garantirá a lógica independente de se a normalização no backend ocorreu antes ou depois do cache.

---

## 🐞 PROBLEMA 4: Falha na Exibição do "Nome da Mãe" em Cache Hits

**O Problema:**
Quando você abre a página, o nome da mãe às vezes não aparece e os blocos cadastrais ficam vazios. 
Isso acontece porque as consultas antigas (ou reutilizadas via global cache) não tinham sido armazenadas com a nova estrutura das 3 APIs (`_basic_data` e `_collections`). 

Quando um registro antigo é carregado, o frontend procura por `payload?._basic_data?.Result?.[0]?.BasicData` e não encontra nada.

### Como resolver (Solução Parcial no Frontend):
No `process-details-modal.tsx`, a exibição só deve ocultar os dados se REALMENTE não houver nada no objeto `BasicData`. Porém, para consultas legadas que não possuem as 3 requisições no payload, não há nome da mãe no banco de dados.
A recomendação para revendedoras sem esses dados é clicar no botão **"Forçar Atualização" (ou forçar a re-consulta com as 3 requisições habilitadas)**, para injetar o payload correto com o novo padrão no cache.

---

## 🛠️ SUGESTÃO DO CÓDIGO EXATO PARA O CLAUDE APLICAR

### Edição 1: No arquivo `server/lib/bigdatacorpClient.ts`
Na função `consultarPresencaCobranca`, onde você pega `response.data.Result[0].Collections`, adicione este fallback de injeção logo ANTES de retornar os dados:

```typescript
const collections = response.data.Result?.[0]?.Collections;
if (collections) {
    // Normaliza os dados injetando chaves que o sistema espera se elas não existirem
    (collections as any).HasActiveCollections = collections.IsCurrentlyOnCollection ?? collections.HasActiveCollections;
    (collections as any).TotalOccurrences = (collections as any).CollectionOccurrences ?? collections.TotalOccurrences;
    (collections as any).Last3Months = (collections as any).Last90DaysCollectionOccurrences ?? collections.Last3Months;
    (collections as any).Last12Months = (collections as any).Last365DaysCollectionOccurrences ?? collections.Last12Months;
}
```

### Edição 2: No arquivo `src/components/compliance/process-details-modal.tsx`
Procure o bloco localizando o Status do CPF (aproximadamente linha 595 - Dados Cadastrais) e corrija para `toUpperCase()`:
```tsx
<Badge variant={basicDataPayload.TaxIdStatus?.toUpperCase() === 'REGULAR' ? 'default' : 'destructive'} 
       className={basicDataPayload.TaxIdStatus?.toUpperCase() === 'REGULAR' ? 'bg-green-600' : ''}>
  {basicDataPayload.TaxIdStatus || 'N/A'}
</Badge>
```

### Edição 3: Correção do Risco (em `process-details-modal.tsx` e `datacorpCompliance.ts`)
No `universalScore`:
```typescript
const isCpfRegular = cpfStatus === 'REGULAR' || cpfStatus === '';

// E na parte de Collections:
const hasActiveDebt = collectionsPayload?.HasActiveCollections || collectionsPayload?.IsCurrentlyOnCollection;
const pastDebtCount = Number(collectionsPayload?.TotalOccurrences || collectionsPayload?.CollectionOccurrences || 0);

if (hasActiveDebt) {
  score -= 200;
} else if (pastDebtCount > 0) {
  score -= 60;
}
```

Com estas adições pontuais, todo o fluxo multitenant do _basic_data e _collections que usa a Datacorp ficará visualmente perfeito e o risco será calculado corretamente.
