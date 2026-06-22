# Reobote Consórcios - Sistema de Simulação

## Visão Geral
O **Reobote Consórcios** é uma aplicação web de sistema de simulação de consórcios para Reobote Consórcios. Ele permite criar simulações de consórcios, gerar propostas em PDF, calcular alavancagem financeira e patrimonial, além de simular previdência aplicada.

> Observação: Este sistema não inclui funcionalidade de autenticação ou gerenciamento de usuários internamente. A autenticação e o gerenciamento de usuários são responsabilidade de um sistema externo.

## Tecnologias Utilizadas

### Frontend & Framework
- **Next.js 16.2.7** - Framework React moderno com App Router
- **React 19** - Biblioteca para construção de interfaces
- **TypeScript 5.7.3** - Superset de JavaScript com tipagem estática

### UI & Design
- **Tailwind CSS 4.2.0** - Framework CSS utilitário
- **shadcn/ui** - Componentes de UI acessíveis e customizáveis
- **Lucide React** - Ícones consistentes
- **next-themes** - Gerenciamento de tema (dark/light mode)

### Gerenciamento de Estado
- **Zustand 5.0.14** - Gerenciamento de estado global leve
- **Persist Middleware** - Persistência de dados no localStorage

### Formulários & Validação
- **React Hook Form 7.54.1** - Gerenciamento de formulários performático
- **Zod 3.24.1** - Validação de esquemas de dados
- **react-number-format** - Mascaras e formatação numérica

### Visualização & Gráficos
- **Recharts 2.15.0** - Biblioteca de gráficos
- **jspdf 4.2.1** - Geração de PDFs
- **jspdf-autotable 5.0.8** - Tabelas em PDFs

### Outras Dependências
- **date-fns 4.1.0** - Manipulação de datas
- **class-variance-authority** - Variantes de componentes
- **clsx + tailwind-merge** - Combinação de classes CSS
- **@vercel/analytics** - Análise de uso
- **sonner** - Notificações toast

## Estrutura do Projeto

```
app-reobote-consorcios/
├── app/                           # Rotas Next.js (App Router)
│   ├── layout.tsx                 # Layout raiz
│   ├── page.tsx                   # Página inicial (redireciona para dashboard)
│   └── dashboard/                 # Área principal do sistema
│       ├── layout.tsx             # Layout do dashboard (sidebar)
│       ├── page.tsx               # Redireciona para simulação
│       ├── simulacao/             # Nova simulação de consórcio
│       ├── simulacoes/            # Lista de simulações
│       ├── alavancagem-financeira/  # Alavancagem Financeira
│       ├── alavancagem-patrimonial/ # Alavancagem Patrimonial
│       ├── previdencia-aplicada/    # Previdência Aplicada
│       └── configuracoes/          # Configurações do sistema
├── components/                    # Componentes React
│   ├── ui/                        # Componentes shadcn/ui
│   └── theme-provider.tsx
├── lib/                           # Logica de negócio
│   ├── types.ts                   # Interfaces TypeScript
│   ├── store.ts                   # Zustand stores (simulações compartilhadas)
│   ├── calculations/              # Cálculos financeiros (modularizados)
│   │   ├── index.ts
│   │   ├── simulation.ts
│   │   ├── financial-leverage.ts
│   │   ├── patrimonial-leverage.ts
│   │   ├── previdencia.ts
│   │   ├── helpers.ts
│   │   └── leverage-helpers.ts
│   ├── pdf.ts                     # Geração de PDF
│   └── utils.ts                   # Funções utilitárias
├── hooks/                         # Hooks customizados
├── public/                        # Arquivos estáticos
│   └── images/                    # Logos e imagens do sistema
├── styles/                        # Estilos globais
├── components.json                # Configuração do shadcn/ui
├── tsconfig.json
├── next.config.mjs
└── package.json
```

## Funcionalidades Principais

### 1. Simulação de Consórcio
- Parâmetros:
  - Nome do Cliente
  - Valor da Carta de Crédito
  - Taxa de Administração (%)
  - Prazo (meses)
  - Índice de Correção (INCC)
  - Mês de Contemplação

- Cálculos Realizados (`lib/calculations/simulation.ts`):
  - Valor Total com Taxa
  - Taxa em Reais
  - Parcela da Taxa Mensal
  - Parcela Bruta Mensal
  - **Parcela Inicial Mensal** (Diferencial)
  - Total Pago no Plano
  - **Parcela Pós-Contemplação** (usando valor real investido até a contemplação)

### 2. Geração de Proposta PDF
- Documento profissional com:
  - Cabeçalho da empresa
  - Dados do cliente
  - Parâmetros da simulação
  - Resultados detalhados
  - Comparativo de modelos (se aplicável)
  - Informações do consultor/vendedor

### 3. Alavancagem Financeira
Cálculo de retorno de investimento em consórcio com:
- Valor do Crédito
- Prazo
- Percentual de Lance
- Forma de Contemplação

Resultados: Valor de Venda, Total Investido, Lucro, Retorno Mensal, ROI, etc.

### 4. Alavancagem Patrimonial
Simulação de aquisição de imóvel via consórcio com:
- Valor do Crédito
- Prazo
- Índice de Correção Anual
- Aluguel Estimado (%)
- Mês de Contemplação
- Forma de Contemplação

Resultados: Valor Corrigido do Imóvel, Total de Aluguel, Tabela de Amortização, Renda Passiva, etc.

### 5. Previdência Aplicada
Simulação de previdência usando consórcio como investimento com:
- Valor do Crédito
- Prazo
- Rendimento de Aluguel (%)
- Modalidade de Contemplação
- Mês de Contemplação

Resultados: Valor Corrigido, Lucro Líquido, Total Investido Acumulado, ROI, etc.

### 6. Minhas Simulações
- Listagem de todas as simulações criadas
- Opção de visualizar detalhes
- Opção de editar
- Opção de deletar
- Opção de gerar PDF novamente

### 7. Tema Dark/Light
- Alternância entre modo claro e escuro
- Persistência da preferência do usuário
- Logo responsiva que muda de acordo com o tema

## Arquitetura de Dados

### Tipos Principais (`lib/types.ts`)
```typescript
// Simulação
interface Simulation {
  id, clientName, creditValue, adminFeePercent, months,
  inccPercent, contemplationMonth, modality,
  totalValue, feeValue, monthlyFee, grossInstallment,
  finalPayment, totalPaid, createdAt, status
}

// Entradas e Resultados
interface SimulationInput, SimulationResult
interface LeverageFinancialInput, LeverageFinancialResult
interface LeveragePatrimonialInput, LeveragePatrimonialResult
interface PrevidenciaInput, PrevidenciaResult
```

### Stores Zustand (`lib/store.ts`)
1. **useSharedSimulationStore**: Gerencia campos compartilhados entre simulações (creditValue, months, taxaTotal, incc, contemplationMonth) para sincronização automática
2. **useSimulationStore**: Gerencia simulações criadas
3. Ambos usam `persist` middleware para salvar dados no localStorage

## Como Executar o Projeto

### Pré-requisitos
- Node.js 18+
- npm ou pnpm

### Instalação e Execução
```bash
# 1. Instalar dependências
npm install
# ou
pnpm install

# 2. Rodar em ambiente de desenvolvimento
npm run dev
# ou
pnpm dev

# 3. Acessar no navegador
# http://localhost:3000
```

### Build para Produção
```bash
npm run build
npm start
```

## Fluxo de Uso

1. **Acesso**: Ao acessar o sistema, é direcionado automaticamente para o dashboard
2. **Nova Simulação**: Crie uma nova proposta para um cliente na página "Nova Simulação"
3. **Sincronização**: Campos compartilhados (Valor do Crédito, Prazo, INCC, Mês de Contemplação) são sincronizados automaticamente entre todas as páginas
4. **Geração de PDF**: Baixe a proposta em formato PDF
5. **Minhas Simulações**: Visualize e gerencie simulações anteriores
6. **Alavancagens**: Calcule retornos de investimento (Financeira e Patrimonial)
7. **Previdência**: Simule previdência aplicada usando consórcio
8. **Tema**: Altere entre tema claro e escuro conforme preferência

## Principais Arquivos e Responsabilidades

| Arquivo | Responsabilidade |
|---------|-------------------|
| `app/page.tsx` | Página inicial (redireciona para dashboard) |
| `app/dashboard/layout.tsx` | Layout do dashboard + sidebar |
| `lib/types.ts` | Interfaces e tipos TypeScript |
| `lib/store.ts` | Zustand stores (simulações compartilhadas e simulações criadas) |
| `lib/calculations/` | Cálculos financeiros modularizados |
| `lib/pdf.ts` | Geração de propostas PDF |
| `components/ui/` | Componentes shadcn/ui |

## Persistência de Dados
Os dados são armazenados **localmente no navegador** via `localStorage` usando o middleware `persist` do Zustand:
- `reobote-simulations`: Simulações criadas

## Integração com Sistema Externo
Como este sistema não possui autenticação ou gerenciamento de usuários internamente:
1. O sistema externo é responsável por autenticar os usuários
2. O sistema externo é responsável por gerenciar os dados dos usuários
3. Ao abrir o sistema, o usuário é direcionado diretamente para o dashboard

---

**Desenvolvido para Reobote Consórcios**
