---
name: Falha no replay Radar/Satélite
about: Relatar problemas com Play, pré-carregamento ou timeline do Windy Enhanced
title: "[Replay] "
labels: []
assignees: []
---

## O que aconteceu?
Descreva o comportamento observado (ex.: Play não inicia, volta para 1h ou interrompe antes do fim).

## Como reproduzir
1. Abra https://www.windy.com/
2. Selecione a camada Radar ou Satélite.
3. Descreva o período selecionado e a sequência de ações.
4. Informe o resultado.

## Resultado esperado
Descreva como o replay deveria funcionar.

## Ambiente
- Versão do Windy Enhanced:
- Navegador e versão:
- Gerenciador de userscripts (e versão):
- Sistema operacional:
- Camada: Radar / Satélite
- Janela temporal visível: 1h / 6h / 24h / outra

## Diagnóstico (opcional)
Após reproduzir o erro, abra o console do navegador (`F12`) e execute:

```javascript
console.log(JSON.stringify(WindyEnhancedStatus(), null, 2))
console.log(JSON.stringify(WindyEnhancedTrace(), null, 2))
```

Cole somente os trechos relevantes, em bloco de código. **Antes de publicar, remova informações privadas, URLs de sessão e outros dados sensíveis.** Não envie cookies, tokens ou credenciais.

## O que já tentou?
- [ ] Recarregar a página com `Ctrl + Shift + R`
- [ ] Atualizar o Windy Enhanced pelo RAW do GitHub
- [ ] Desativar cópias antigas do mesmo userscript
- [ ] Testar novamente com apenas uma cópia ativa
- [ ] Outro procedimento (descreva abaixo)
