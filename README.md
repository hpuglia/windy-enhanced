<p align="center">
  <img src="assets/banner.svg" alt="Windy Enhanced — mais controle, foco e conforto visual no Windy.com" width="100%">
</p>

<p align="center">
  <a href="https://raw.githubusercontent.com/hpuglia/windy-enhanced/main/windy-enhanced.user.js"><img alt="Versão do userscript 6.7.1" src="https://img.shields.io/badge/userscript-v6.7.1-2b9eb3?style=for-the-badge"></a>
  <a href="https://github.com/hpuglia/windy-enhanced/actions/workflows/validate.yml"><img alt="Validação" src="https://img.shields.io/github/actions/workflow/status/hpuglia/windy-enhanced/validate.yml?style=for-the-badge&label=valida%C3%A7%C3%A3o"></a>
  <a href="LICENSE"><img alt="Licença MIT" src="https://img.shields.io/github/license/hpuglia/windy-enhanced?style=for-the-badge&color=4c78a8"></a>
</p>

<p align="center">
  Userscript independente para personalizar o <a href="https://www.windy.com/">Windy.com</a>, reduzir distrações e preparar a timeline do Radar/Satélite para reprodução contínua.
</p>

<p align="center">
  <a href="https://raw.githubusercontent.com/hpuglia/windy-enhanced/main/windy-enhanced.user.js"><strong>⚡ Instalar Windy Enhanced</strong></a>
  ·
  <a href="https://github.com/hpuglia/windy-enhanced/releases/latest">Releases / outras versões</a>
  ·
  <a href="https://github.com/hpuglia/windy-enhanced/issues">Relatar problema</a>
</p>

> [!IMPORTANT]
> Este é um projeto independente, sem vínculo com o Windy.com. Ele modifica a interface e interage com os controles de tempo disponíveis no próprio navegador. **Não oferece assinatura Premium, não desbloqueia dados restritos e não altera sua conta.**

## ✨ O que ele oferece

| Recurso | Como ajuda |
| --- | --- |
| 🎨 **Cores do mapa** | Remove filtros visuais locais de tons de cinza quando presentes. |
| 🧹 **Modo limpo instantâneo** | O botão de vassoura oculta logotipo, barras, laterais e timeline para deixar somente o mapa. |
| 🪟 **Logotipo superior** | Pode ocultar somente a marca Windy.com, independentemente do modo limpo. |
| 🏷️ **Branding do mapa** | Oculta selos institucionais sobrepostos (por exemplo, NOAA, Nowcast e Cemaden), preservando as opções de estilo do mapa. |
| 🗓️ **Arquivo temporal** | Pode esconder o atalho de histórico sem interferir no cache automático do navegador. |
| 🌘 **Sombras ajustáveis** | Aplica contraste gradual ao redor dos controles, com intensidade regulável no painel. |
| ➖ **Camadas recolhíveis** | Move o Menu para junto do avatar e adiciona `−`/`+` para ocultar ou revelar os tipos de mapas. |
| 👑 **Indicadores Premium** | Oculta coroas, chamadas promocionais e alguns modais de assinatura na interface, sem liberar recursos pagos. |
| ⚙️ **Painel configurável** | Fica no canto inferior esquerdo e pode ser arrastado pelo cabeçalho. |
| ⭐ **Vista salva** | Guarda a URL atual do Windy e permite reabri-la depois. |
| ▶️ **Play/Pause integrado** | Usa o botão circular original do Windy para preparar e reproduzir quadros de Radar/Satélite; clique novamente para interromper. |
| ⏳ **Pré-carregamento sequencial** | Percorre os horários acessíveis, espera a renderização e volta ao início antes de iniciar o loop. |
| 🕓 **Janela temporal** | Integra-se aos controles 1h/6h/24h quando reconhecidos, sem adicionar uma segunda barra ou botões de navegação no painel. |
| 💾 **Backup em JSON** | Exporta, importa ou restaura suas preferências localmente. |
| 🔄 **Sincronização entre abas** | Reaplica alterações feitas em outra aba aberta do Windy. |
| ♿ **Acessibilidade** | Inclui navegação por teclado, gerenciamento de foco e avisos para leitores de tela. |

O userscript não usa bibliotecas externas nem envia telemetria. Os quadros meteorológicos continuam sendo solicitados ao Windy pelo próprio mapa, conforme a disponibilidade da sessão.

## 🌦️ Replay do Radar e Satélite — novidade na 6.7.1

O diferencial das versões 6.7.x é a **preparação dos quadros antes do Play contínuo**. Isso surgiu porque a reprodução ampliada podia retornar à janela nativa de 1h quando imagens anteriores ainda não tinham sido carregadas.

1. Abra a camada **Radar** ou **Satélite** no Windy.
2. Posicione a linha do tempo onde deseja começar e clique no **Play circular original**.
3. O Enhanced tenta percorrer os horários disponíveis **um por vez**, aguardando a renderização. A barra se move durante essa preparação.
4. Quando há quadros suficientes, o script retorna ao começo da sequência preparada e inicia a reprodução em loop.
5. **Para parar ou cancelar o carregamento**, clique no mesmo Play novamente ou pressione **`Esc`**.

Não aparece uma barra de replay adicional. O botão continua sendo o do próprio Windy, com a velocidade configurada na interface original.

> [!NOTE]
> **Limitações:** o recurso depende dos horários, das camadas e do controlador expostos pelo Windy. O pré-carregamento é sequencial, limitado e pode demorar em conexões lentas. Alguns quadros podem não existir, falhar ou sair do cache; o Enhanced não faz download independente nem gera previsões. A transição entre histórico (branco) e previsão/extrapolação (vermelho) também depende do que estiver disponível. Se a interface do site mudar, pode ser necessário atualizar o script.

## 🚀 Instalação

1. Instale o [Tampermonkey](https://www.tampermonkey.net/) ou outro gerenciador de userscripts compatível.
2. Escolha uma das opções: **[instalar/atualizar pelo RAW do GitHub](https://raw.githubusercontent.com/hpuglia/windy-enhanced/main/windy-enhanced.user.js)** (versão do branch principal) ou consultar as **[releases](https://github.com/hpuglia/windy-enhanced/releases/latest)** (versões publicadas; podem estar anteriores ao RAW).
3. Confirme a instalação no gerenciador.
4. Acesse [Windy.com](https://www.windy.com/). Use **⚙** para abrir o painel e **🧹** para alternar o modo limpo.

Os dois atalhos visuais ficam no canto inferior esquerdo. Arraste o painel pelo cabeçalho para reposicioná-lo; um clique duplo no cabeçalho restaura a posição original.

Se você ainda utiliza outras versões do Windy Enhanced (como a 5.1), desative-as para evitar conflitos de controles ou regras visuais. O cabeçalho do userscript inclui URLs de instalação e atualização pelo RAW do GitHub.

## ⌨️ Atalhos

| Atalho | Ação |
| --- | --- |
| `Alt + Shift + E` | Abrir ou fechar o painel do Windy Enhanced |
| `Alt + Shift + L` | Ativar ou desativar o modo de visualização limpa |
| `Esc` | **Interromper o pré-carregamento/replay**, se ativo; caso contrário, fechar o painel |
| `←` / `→` | Alterar o horário pelo atalho nativo do Windy, quando disponível |
| `+` / `-` | Controlar o zoom pelo atalho nativo do Windy |

Alguns atalhos podem ser interceptados pelo navegador ou pelo sistema operacional.

## 🧪 Diagnóstico e solução de problemas

Se o Play não iniciar, ficar preso na divisória branca/vermelha ou o Windy mudar sua interface, abra o console do navegador (`F12`) após reproduzir o problema:

```javascript
console.log(JSON.stringify(WindyEnhancedStatus(), null, 2))
```

Para um histórico mais detalhado dos eventos locais do Play:

```javascript
console.log(JSON.stringify(WindyEnhancedTrace(), null, 2))
```

Os diagnósticos mostram a fase (`preloading`, `playing` ou `idle`), o relógio da camada, a quantidade de quadros e a razão de eventual interrupção. **Revise a saída antes de compartilhá-la em uma Issue**, pois pode conter informações da sessão, horários e estado do mapa.

Se uma alteração na timeline causar problemas, atualize pelo RAW, recarregue o Windy com `Ctrl + Shift + R` e verifique se não há duas cópias do userscript ativadas.

## 🔐 Privacidade e segurança

- Não coleta informações da conta.
- Não envia telemetria ou preferências para serviços externos.
- Armazena as configurações apenas no `localStorage`, usando a chave `windy-enhanced:v6:settings`.
- Valida arquivos importados e aceita vistas salvas somente nos endereços HTTPS oficiais do Windy.
- Não solicita permissões de rede no Tampermonkey.

## 🧭 Compatibilidade e limites

O Windy.com pode alterar seletores, botões, estrutura da timeline e estados internos sem aviso. A correção de cores atua somente em estilos locais e não recria imagens meteorológicas indisponíveis.

O replay ampliado é uma integração experimental com a interface do site. O recurso depende de o navegador conseguir carregar os quadros e de o Windy aceitar cada mudança de horário. **Não há garantia de cobrir toda a extensão de 24 horas ou todos os trechos de extrapolação em qualquer sessão.**

A opção **Remover branding** não deve ocultar o seletor de mapas (`Outdoor`, `Winter sports`, `Aerial` etc.); a atribuição cartográfica obrigatória continua sendo preservada. A simples exibição de um estilo não garante acesso a opções restritas.

Se uma atualização apresentar problemas, desative a versão atual e use o backup [`legacy/windy_clean_ui_5_1.user.js`](legacy/windy_clean_ui_5_1.user.js).

## 🛠️ Desenvolvimento

O projeto não possui dependências de execução nem etapa de build. É necessário apenas o [Node.js](https://nodejs.org/) para executar as verificações:

```bash
git clone https://github.com/hpuglia/windy-enhanced.git
cd windy-enhanced
npm test
```

**Versão atual do script: 6.7.1.** O validador também confere se os números de versão do userscript, `package.json` e `CHANGELOG.md` estão sincronizados.

O teste verifica:

- sintaxe do JavaScript;
- presença dos metadados obrigatórios;
- URLs de instalação e atualização em HTTPS;
- correspondência da versão entre o userscript, `package.json` e [`CHANGELOG.md`](CHANGELOG.md);
- integridade da codificação UTF-8.

O mesmo processo é executado automaticamente pelo GitHub Actions em cada alteração relevante.

## 🤝 Contribuições

Sugestões e relatos são bem-vindos nas [Issues](https://github.com/hpuglia/windy-enhanced/issues). Ao relatar um problema, informe o navegador, o gerenciador de userscripts e, se possível, a área do Windy em que ocorreu.

## 📚 Referências

- [Windy Map Forecast API](https://api.windy.com/map-forecast/docs)
- [Atalhos do Windy — fórum oficial](https://community.windy.com/topic/13/keyboard-shortcuts)
- [Documentação do Tampermonkey](https://www.tampermonkey.net/documentation.php)

## 📄 Licença

Distribuído sob a licença [MIT](LICENSE). Criado por **Henrique / Puglia Apps**.
