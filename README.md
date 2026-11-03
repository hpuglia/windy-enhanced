<p align="center">
  <img src="assets/banner.svg" alt="Windy Enhanced — mais controle, foco e conforto visual no Windy.com" width="100%">
</p>

<p align="center">
  <a href="https://github.com/hpuglia/windy-enhanced/releases/latest"><img alt="Última versão" src="https://img.shields.io/github/v/release/hpuglia/windy-enhanced?style=for-the-badge&color=2b9eb3"></a>
  <a href="https://github.com/hpuglia/windy-enhanced/actions/workflows/validate.yml"><img alt="Validação" src="https://img.shields.io/github/actions/workflow/status/hpuglia/windy-enhanced/validate.yml?style=for-the-badge&label=valida%C3%A7%C3%A3o"></a>
  <a href="LICENSE"><img alt="Licença MIT" src="https://img.shields.io/github/license/hpuglia/windy-enhanced?style=for-the-badge&color=4c78a8"></a>
</p>

<p align="center">
  Userscript independente para personalizar a interface do <a href="https://www.windy.com/">Windy.com</a>, reduzir distrações e facilitar o acesso aos controles mais usados.
</p>

<p align="center">
  <a href="https://raw.githubusercontent.com/hpuglia/windy-enhanced/main/windy-enhanced.user.js"><strong>⚡ Instalar Windy Enhanced</strong></a>
  ·
  <a href="https://github.com/hpuglia/windy-enhanced/releases/latest">Ver release</a>
  ·
  <a href="https://github.com/hpuglia/windy-enhanced/issues">Relatar problema</a>
</p>

> [!IMPORTANT]
> Este é um projeto não oficial e sem vínculo com o Windy.com. Ele altera apenas a apresentação local da página: não concede assinatura Premium, não acessa dados restritos e não modifica sua conta.

## ✨ O que ele oferece

| Recurso | Como ajuda |
| --- | --- |
| 🎨 **Cores do mapa** | Remove filtros visuais locais de tons de cinza quando presentes. |
| 🧹 **Modo limpo instantâneo** | O botão de vassoura oculta logotipo, barras, laterais e timeline para deixar somente o mapa. |
| 🪟 **Logotipo superior** | Pode ocultar somente a marca Windy.com, independentemente do modo limpo. |
| 🌘 **Sombras** | Aplica contraste gradual ao redor da busca, menus laterais e controles inferiores. |
| 👑 **Indicadores Premium** | Remove globalmente as coroas sem apagar o texto ou o controle associado. |
| ⚙️ **Painel configurável** | Fica no canto inferior esquerdo e pode ser arrastado pelo cabeçalho. |
| ⭐ **Vista salva** | Guarda a URL atual do Windy e permite reabri-la depois. |
| ↔️ **Linha do tempo** | Oferece botões de horário quando o site expõe uma interface compatível. |
| 💾 **Backup em JSON** | Exporta, importa ou restaura suas preferências localmente. |
| 🔄 **Sincronização entre abas** | Reaplica alterações feitas em outra aba aberta do Windy. |
| ♿ **Acessibilidade** | Inclui navegação por teclado, gerenciamento de foco e avisos para leitores de tela. |

Tudo funciona localmente no navegador, sem bibliotecas externas e sem envio de dados.

## 🚀 Instalação

1. Instale o [Tampermonkey](https://www.tampermonkey.net/) ou outro gerenciador de userscripts compatível.
2. Clique em **[Instalar Windy Enhanced](https://raw.githubusercontent.com/hpuglia/windy-enhanced/main/windy-enhanced.user.js)**.
3. Confirme a instalação no gerenciador.
4. Acesse [Windy.com](https://www.windy.com/). Use **⚙** para abrir o painel e **🧹** para alternar o modo limpo.

Os dois atalhos visuais ficam no canto inferior esquerdo. Arraste o painel pelo cabeçalho para reposicioná-lo; um clique duplo no cabeçalho restaura a posição original.

Se você ainda usa a versão 5.1, desative-a para evitar regras visuais duplicadas. Depois da primeira instalação pelo GitHub, o gerenciador poderá detectar novas versões automaticamente.

## ⌨️ Atalhos

| Atalho | Ação |
| --- | --- |
| `Alt + Shift + E` | Abrir ou fechar o painel do Windy Enhanced |
| `Alt + Shift + L` | Ativar ou desativar o modo de visualização limpa |
| `Esc` | Fechar o painel |
| `←` / `→` | Alterar o horário pelo atalho nativo do Windy, quando disponível |
| `+` / `-` | Controlar o zoom pelo atalho nativo do Windy |

Alguns atalhos podem ser interceptados pelo navegador ou pelo sistema operacional.

## 🔐 Privacidade e segurança

- Não coleta informações da conta.
- Não envia telemetria ou preferências para serviços externos.
- Armazena as configurações apenas no `localStorage`, usando a chave `windy-enhanced:v6:settings`.
- Valida arquivos importados e aceita vistas salvas somente nos endereços HTTPS oficiais do Windy.
- Não solicita permissões de rede no Tampermonkey.

## 🧭 Compatibilidade e limites

O Windy.com pode alterar seletores e componentes internos sem aviso. A correção de cores funciona somente quando o efeito resulta de um estilo aplicado localmente; ela não recria dados meteorológicos ou imagens que não foram fornecidos pelo servidor.

Os controles opcionais de tempo dependem de uma interface compatível exposta pela página. Quando ela não estiver disponível, use a linha do tempo e os atalhos nativos do Windy.

Se uma atualização apresentar problemas, desative a versão atual e use o backup [`legacy/windy_clean_ui_5_1.user.js`](legacy/windy_clean_ui_5_1.user.js).

## 🛠️ Desenvolvimento

O projeto não possui dependências de execução nem etapa de build. É necessário apenas o [Node.js](https://nodejs.org/) para executar as verificações:

```bash
git clone https://github.com/hpuglia/windy-enhanced.git
cd windy-enhanced
npm test
```

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
