# Reobote Consórcios - Sistema de Simulação Magalu

## Visão Geral
O **Reobote Consórcios** é uma aplicação web de sistema de simulação e propostas para Magalu Consórcio. Ele permite vendedores e administradores criar simulações de consórcios, gerar propostas em PDF, calcular alavancagem financeira e patrimonial, e gerenciar usuários.

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
│   ├── page.tsx                   # Página de login
│   └── dashboard/                 # Área logada
│       ├── layout.tsx             # Layout do dashboard (sidebar, autenticação)
│       ├── page.tsx               # Dashboard principal (estatísticas)
│       ├── simulacao/             # Nova simulação
│       ├── simulacoes/            # Lista de simulações
│       ├── alavancagem-financeira/
│       ├── alavancagem-patrimonial/
│       ├── usuarios/              # Gerenciamento de usuários (admin only)
│       └── configuracoes/
├── components/                    # Componentes React
│   ├── ui/                        # Componentes shadcn/ui
│   └── theme-provider.tsx
├── lib/                           # Logica de negócio
│   ├── types.ts                   # Interfaces TypeScript
│   ├── store.ts                   # Zustand stores (auth + simulações)
│   ├── calculations.ts            # Cálculos financeiros
│   ├── pdf.ts                     # Geração de PDF
│   └── utils.ts                   # Funções utilitárias
├── hooks/                         # Hooks customizados
├── public/                        # Arquivos estáticos
├── styles/                        # Estilos globais
├── components.json                # Configuração do shadcn/ui
├── tsconfig.json
├── tailwind.config.js
├── next.config.mjs
└── package.json
```

## Funcionalidades Principais

### 1. Autenticação e Usuários
- **Roles**: ADMIN e VENDEDOR
- **Login**: Credenciais mockadas armazenadas no Zustand + localStorage
- **Gerenciamento de Usuários** (Admin):
  - Criar novos usuários
  - Editar informações
  - Ativar/desativar usuários

**Credenciais de Teste**:
- Admin: `admin@reobote.com.br` / `admin123`
- Vendedor: `joao@reobote.com.br` / `joao123`

### 2. Simulação de Consórcio
- Parâmetros:
  - Nome do Cliente
  - Valor da Carta de Crédito
  - Taxa de Administração (%)
  - Prazo (meses)

- Cálculos Realizados (`lib/calculations.ts`):
  - Valor Total com Taxa
  - Taxa em Reais
  - Parcela da Taxa Mensal
  - Parcela Bruta Mensal
  - **Parcela Inicial Mensal** (Diferencial Magalu)
  - Total Pago no Plano
  - Comparativo com Modelo HS

### 3. Geração de Proposta PDF
- Documento profissional com:
  - Cabeçalho da empresa
  - Dados do cliente
  - Parâmetros da simulação
  - Resultados detalhados
  - Comparativo de modelos
  - Informações do consultor/vendedor

### 4. Alavancagem Financeira
Cálculo de retorno de investimento em consórcio com:
- Valor do Crédito
- Prazo
- Percentual de Ganho na Venda
- Parcelas Pagas

Resultados: Valor de Venda, Total Investido, Lucro, Retorno Mensal, ROI.

### 5. Alavancagem Patrimonial
Simulação de aquisição de imóvel via consórcio com:
- Valor do Crédito
- Prazo
- Índice de Correção Anual
- Aluguel Estimado

Resultados: Valor Corrigido do Imóvel, Total de Aluguel, Tabela de Amortização, Renda Passiva.

### 6. Dashboard
- Estatísticas em tempo real:
  - Total de Simulações
  - Simulações do Mês
  - Crédito Simulado Total
  - Vendedores Ativos
- Gráfico de simulações por mês (últimos 6 meses)
- Lista de simulações recentes

## Arquitetura de Dados

### Tipos Principais (`lib/types.ts`)
```typescript
// Usuário
type UserRole = 'ADMIN' | 'VENDEDOR'
interface User { id, name, email, role, office?, phone?, socialMedia?, active }

// Simulação
interface Simulation {
  id, clientName, creditValue, adminFeePercent, months,
  totalValue, feeValue, monthlyFee, grossInstallment,
  finalPayment, totalPaid, createdAt, userId, userName, status
}

// Entradas e Resultados
interface SimulationInput, SimulationResult
interface LeverageFinancialInput, LeverageFinancialResult
interface LeveragePatrimonialInput, LeveragePatrimonialResult
```

### Stores Zustand (`lib/store.ts`)
1. **useAuthStore**: Gerencia autenticação e usuários
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

1. **Login**: Acesse a página inicial e entre com suas credenciais
2. **Dashboard**: Veja o resumo das atividades
3. **Nova Simulação**: Crie uma nova proposta para um cliente
4. **Gerar PDF**: Baixe a proposta em formato PDF
5. **Minhas Simulações**: Visualize e gerencie simulações anteriores
6. **Alavancagens**: Calcule retornos de investimento
7. **Usuários** (Admin): Gerencie a equipe de vendedores

## Principais Arquivos e Responsabilidades

| Arquivo | Responsabilidade |
|---------|-------------------|
| `app/page.tsx` | Página de login |
| `app/dashboard/layout.tsx` | Layout do dashboard + autenticação |
| `app/dashboard/page.tsx` | Dashboard com estatísticas |
| `lib/types.ts` | Interfaces e tipos TypeScript |
| `lib/store.ts` | Zustand stores (auth + simulações) |
| `lib/calculations.ts` | Cálculos financeiros |
| `lib/pdf.ts` | Geração de propostas PDF |
| `components/ui/` | Componentes shadcn/ui |

## Persistência de Dados
Todos os dados são armazenados **localmente no navegador** via `localStorage` usando o middleware `persist` do Zustand:
- `reobote-auth`: Dados de autenticação e usuários
- `reobote-simulations`: Simulações criadas

*Nota: Em produção, isso deve ser substituído por um banco de dados real.*

## Melhorias Futuras Possíveis
1. Integração com banco de dados (PostgreSQL/MongoDB)
2. Autenticação real (NextAuth.js/Auth.js)
3. Envio de propostas por e-mail
4. Histórico completo de alterações
5. Exportação de relatórios em Excel
6. Integração com API oficial do Magalu
7. Multi-empresa/sucursal

---

**Desenvolvido para Reobote Consórcios**
