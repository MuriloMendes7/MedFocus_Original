# Admin Uploads e Editores

Este painel ativa os uploads de simulados e flashcards, alem de oferecer editores visuais para criacao manual. O layout existente foi mantido e apenas funcoes de JS foram adicionadas.

## Como usar

1. Acesse o painel admin logado como usuario com perfil `admin`.
2. Use o botao **Upload** para importar arquivos `.txt`:
   - Flashcards: `Pergunta | Resposta | Explicacao` (explicacao pode ficar vazia, mas o separador deve existir).
   - Simulados: `pergunta;A);B);C);D);letra;[explicacao]` (explicacao opcional dentro de colchetes, letra em A-D).
3. A pre-visualizacao mostra o total de linhas, itens validos, erros por linha e uma tabela com amostra.
4. Ajuste titulo, descricao, categoria e visibilidade antes de salvar. Apenas itens validos sao persistidos.
5. Para criacao manual, clique em **Editor Visual** (flashcards) ou **Criar Simulado** (simulados), adicione os itens, reordene com drag and drop e salve.

## Persistencia

- Se `window.supabase` estiver configurado, os decks sao gravados em `decks`, `cards` e `questions`, com RLS restrito a admins (consulte `supabase/admin_decks.sql`).
- Sem Supabase, os dados sao salvos no IndexedDB `medfocus-db` (stores `decks`, `cards`, `questions`) e replicados no localStorage legaco para compatibilidade com o app atual.
- IDs sao gerados com `crypto.randomUUID()` quando disponivel.

## Guard de administrador

Antes de abrir upload ou editores, o codigo verifica se o usuario logado possui `role === 'admin'`. Em cenarios com Supabase, a funcao RPC `is_admin()` e consultada. Usuarios sem permissao recebem alerta e sao redirecionados para login.

## Estrutura de codigo

- `services/storageService.js`: seleciona Supabase ou IndexedDB, atualiza cache local e expone `saveDeckWithItems`.
- `admin-uploader.js`: funcoes de parsing, previews, editores visuais e integracao com `AdminStorageService`.
- `admin-uploads.js`: loader leve que injeta os modulos quando a pagina admin e carregada.

## Testes rapidos

1. Upload de flashcards com linhas validas e invalidas: conferir contadores e que apenas validos sao salvos.
2. Upload de simulados com 3 questoes validas e uma invalida: salvar deve criar o deck com 3 questoes.
3. Criar baralho manual via editor: adicionar itens, reordenar, salvar e verificar na grade admin.
4. Criar simulado manual: adicionar questoes, reordenar, salvar e iniciar no app.

Apos salvar qualquer deck, utilize os botoes da propria UI para iniciar estudo ou simulados e confirmar que os dados foram persistidos.
