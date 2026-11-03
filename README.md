# Windy Enhanced

Userscript independente para personalizar a interface do [Windy.com](https://www.windy.com/) no navegador. Compatível com gerenciadores de userscripts como Tampermonkey.

> Projeto não oficial, sem vínculo com Windy.com. O script altera somente a apresentação local da página. **Não concede assinatura Premium, acesso a dados restritos, resolução adicional nem mais horários de previsão no servidor.**

## Instalação

1. Instale um gerenciador de userscripts compatível (por exemplo, Tampermonkey).
2. [Clique aqui para instalar o Windy Enhanced](https://raw.githubusercontent.com/hpuglia/windy-enhanced/main/windy-enhanced.user.js) e confirme a instalação no Tampermonkey.
3. Salve e visite `https://www.windy.com/`.
4. Desative a versão 5.1 anterior para não sobrepor regras de CSS.
5. Abra o painel pelo botão **⚙** no canto superior direito.

As atualizações são detectadas pelo gerenciador de userscripts por meio dos metadados `@updateURL` e `@downloadURL`.

## Recursos da versão 6.1.0

| Recurso | Descrição |
| --- | --- |
| Cores do mapa | Preserva a correção visual da 5.1 para filtros CSS de tons de cinza, onde presentes. |
| Chamadas Premium | Esconde seletivamente botões e banners promocionais reconhecidos. |
| Modo visualização limpa | Oculta alguns painéis auxiliares; o mapa e a timeline permanecem acessíveis. |
| Painel configurável | Liga/desliga recursos sem editar código. |
| Vista salva | Guarda a **URL atual** no navegador e pode reabri-la. Os detalhes preservados dependem do que o Windy codifica na URL. |
| Importação/exportação | Preferências em arquivo JSON. |
| Controles de horário | Botões anterior/próximo somente quando o site expõe uma interface de tempo compatível; se não, use as setas do Windy. |
| Observador otimizado | Examina apenas elementos novos do DOM, com agrupamento de eventos. |
| Sincronização entre abas | Reaplica preferências alteradas em outra aba aberta do Windy. |

O painel pode ser fechado pelo botão **×** ou pela tecla `Esc`, possui identificação adequada para leitores de tela e restaura o foco ao botão de abertura.

### Atalhos

| Atalho | Ação |
| --- | --- |
| `Alt + Shift + E` | Abrir/fechar painel Enhanced |
| `Alt + Shift + L` | Ativar/desativar modo visualização limpa |
| `←` / `→` | Atalhos nativos de tempo do Windy (sujeitos à versão do site) |
| `+` / `-` | Zoom nativo do Windy |

Os atalhos podem ser interceptados pelo navegador ou sistema operacional.

## Privacidade

- O script não inclui bibliotecas de terceiros.
- Não coleta informações de contas nem envia dados a serviços externos.
- Preferências são guardadas apenas no `localStorage` do navegador, na chave `windy-enhanced:v6:settings`.
- O backup de configurações é gerado localmente como JSON.

## Compatibilidade e limites

O Windy.com muda seus seletores CSS e componentes internos com frequência. A recuperação visual só funciona quando o cinza resulta de um estilo local — não recria dados meteorológicos nem reconstitui cores que já vêm embutidas na imagem. Os botões opcionais de tempo requerem métodos compatíveis; a API oficial para mapas embutidos **não é uma garantia** de que o site principal exponha os mesmos objetos.

Se a versão nova apresentar problema, desative-a e use o backup [`legacy/windy_clean_ui_5_1.user.js`](./legacy/windy_clean_ui_5_1.user.js).

## Desenvolvimento

A versão atual não tem dependências de execução nem etapa de build. Para executar todas as verificações locais:

```bash
npm test
```

O teste confere a sintaxe, os metadados de instalação e a correspondência da versão com o changelog. Para publicar novas versões, altere `@version` no cabeçalho do userscript e atualize [`CHANGELOG.md`](./CHANGELOG.md).

## Referências técnicas

- [Documentação Windy Map Forecast API](https://api.windy.com/map-forecast/docs)
- [Atalhos do Windy, fórum oficial](https://community.windy.com/topic/13/keyboard-shortcuts)

## Licença

MIT — consulte [`LICENSE`](./LICENSE).
