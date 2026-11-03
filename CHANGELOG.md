# Changelog

## [6.4.1] - 2026-11-03

- Ocultado por padrão o atalho `Arquivo`, que abre o histórico temporal e não representa o cache.
- Adicionada opção independente para reexibir o histórico quando necessário.
- Mantido o cache nativo do Windy e do navegador, sem downloads automáticos pesados da timeline.

## [6.4.0] - 2026-11-03

- Ocultada a barra visual de rolagem do painel, preservando rolagem por mouse, toque e teclado.
- Adicionado controle de intensidade para sombras mais suaves e escuras.
- Reposicionado o botão nativo Menu ao lado esquerdo do avatar quando essa interface estiver disponível.
- Adicionado botão `−`/`+` para recolher ou revelar a lista de tipos de mapas, com estado persistente.
- Adicionada opção `Remover branding`, ativada por padrão, para ocultar selos institucionais sobre o mapa.

## [6.3.0] - 2026-11-03

- Adicionada opção independente para ocultar o logotipo superior do Windy, ativada por padrão.
- Adicionada opção `Sombras`, ativada por padrão, para melhorar o contraste entre o mapa e os controles.
- Aplicadas sombras graduais e direcionais à busca, menus laterais, controles inferiores e atalhos do Enhanced.

## [6.2.0] - 2026-11-03

- Movidos os atalhos do Windy Enhanced para o canto inferior esquerdo.
- Adicionado botão rápido com ícone de vassoura para alternar o modo limpo.
- Ampliado o modo limpo para ocultar logotipo, barras, painéis laterais e timeline do Windy.
- Removidas globalmente as coroas Premium sem ocultar os textos ou controles associados.
- Tornado o painel de configurações arrastável pela barra de título.
- Removida a descrição introdutória do painel e o toggle duplicado de modo limpo.

## [6.1.0] - 2026-11-03

- Adicionados links de instalação, atualização, página inicial e suporte no cabeçalho do userscript.
- Melhorada a acessibilidade do painel com diálogo identificado, botão de fechar, tecla `Esc` e gerenciamento de foco.
- Adicionada sincronização de preferências entre abas do Windy.
- Reforçada a validação de URLs importadas para rejeitar portas alternativas e credenciais embutidas.
- Adicionada confirmação antes de restaurar todas as preferências.
- Adicionada validação automatizada de sintaxe, metadados e consistência de versão.

## [6.0.0] - 2026-11-03

- Adicionado painel de configuração responsivo e persistência de preferências.
- Adicionados toggles para cores, promoções e modo de visualização limpa.
- Adicionada função para salvar/reabrir a URL atual do Windy.
- Adicionadas exportação, importação e restauração de preferências JSON.
- Adicionados atalhos locais e botões opcionais de navegação no tempo.
- Melhorado o `MutationObserver` para processar somente elementos adicionados.
- Mantido o núcleo CSS funcional da versão 5.1.
- Removidas tentativas de modificar flags de assinatura.

## [5.1] - 2026-11-03

- Ajustados seletores de botões promocionais.
- Ajustada tentativa de remover filtros de tons de cinza.
- Backup da versão original em `legacy/`.
