# Debug Session: financial-zero-cards
- **Status**: [OPEN]
- **Issue**: A section "Alavancagem Financeira" continua exibindo `R$ 0,00` em "Total Investido" e "Lucro Líquido na Venda", embora os inputs da tela indiquem que deveria haver cálculo.
- **Debug Server**: Pending startup
- **Log File**: .dbg/trae-debug-log-financial-zero-cards.ndjson

## Reproduction Steps
1. Abrir a tela de alavancagem financeira.
2. Observar os cards "Total Investido" e "Lucro Líquido na Venda".
3. Comparar com os valores esperados a partir de crédito, prazo, taxa total e mês de contemplação.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Evidence |
|----|------------|------------|--------|----------|
| A | `results` chega como `null` ou com zeros já no `useMemo` da página | High | Low | Pending |
| B | `calculateFinancialLeverage` recebe algum valor inválido (`NaN`, `0`, `undefined`) e zera `totalInvested` | High | Low | Pending |
| C | A função `calcularTotalInvestido` retorna `0` por conta de `pagamentos.length === 0` ou por um branch inesperado | High | Low | Pending |
| D | A UI renderiza outro estado que não é o resultado calculado, por exemplo store/valor stale durante render | Medium | Medium | Pending |
| E | O valor calculado existe, mas `formatCurrency` ou algum valor intermediário (`profit`, `saleValue`) está virando `NaN` e caindo visualmente em zero | Medium | Medium | Pending |

## Log Evidence
Pending collection.

## Verification Conclusion
Pending.
