# Guia de Teste - Integração Bunny.net

Este documento fornece um checklist completo para testar toda a integração com Bunny.net Stream.

## Pré-requisitos para Testes

Antes de testar, certifique-se que:

- ✅ Todas as variáveis de ambiente estão configuradas (ver `BUNNY_ENV_SETUP.md`)
- ✅ Webhook está configurado no Bunny Dashboard (ver `BUNNY_WEBHOOK_CONFIG.md`)
- ✅ Convex está rodando: `npx convex dev` ou deployed
- ✅ Next.js está rodando: `npm run dev` ou deployed
- ✅ Você tem acesso de admin na aplicação
- ✅ Tem um vídeo de teste (recomendado: vídeo curto <30MB)

## Checklist de Testes

### ✅ Teste 1: Upload de Vídeo

**Objetivo**: Verificar se vídeo é criado no Bunny e salvo no Convex.

**Passos:**

1. Acesse a área admin: `/admin/units-lessons`
2. Selecione ou crie uma Lesson
3. Clique em "Upload de Vídeo"
4. Selecione um arquivo de vídeo (MP4, MOV, AVI, etc.)
5. Clique em "Fazer Upload"

**Resultado esperado:**

- ✅ Mensagem de sucesso: "Vídeo enviado! O Bunny está processando."
- ✅ Upload não deve dar erro
- ✅ Interface deve mostrar loading durante upload

**Verificação no Convex:**

```bash
# Terminal
npx convex dashboard
```

1. Vá em **Data** → **videos** table
2. Deve existir um registro novo com:
   - `videoId`: GUID do Bunny
   - `libraryId`: ID da biblioteca
   - `status`: "uploading"
   - `createdBy`: Seu userId do Clerk
   - `title`: Título da lesson
   - `isPrivate`: true

**Verificação no Bunny:**

1. Acesse: https://dash.bunny.net/stream/{LIBRARY_ID}
2. Vídeo deve aparecer na lista
3. Status deve ser "Processing" ou "Encoding"

**Se falhar:**

- Verifique console do browser para erros
- Verifique `BUNNY_API_KEY` está configurada
- Verifique `BUNNY_LIBRARY_ID` está correta
- Veja logs: `npx convex logs`

---

### ✅ Teste 2: Webhook - Processamento

**Objetivo**: Verificar se webhook atualiza status quando vídeo é processado.

**Passos:**

1. Aguarde alguns segundos/minutos (depende do tamanho do vídeo)
2. Monitore logs do Convex em tempo real:
   ```bash
   npx convex logs --watch
   ```

**Resultado esperado:**

- ✅ Deve aparecer no log:
  ```
  Bunny webhook received: { VideoGuid: "...", Status: 4, VideoLibraryId: "..." }
  ```
- ✅ Status do vídeo no Convex deve mudar para "ready"
- ✅ Campos devem ser preenchidos:
  - `hlsUrl`: URL do playlist.m3u8
  - `thumbnailUrl`: URL da thumbnail
  - `metadata.duration`: Duração em segundos
  - `metadata.width`: Largura do vídeo
  - `metadata.height`: Altura do vídeo

**Verificação:**

```bash
# No Convex Dashboard
```

1. **Data** → **videos** table
2. Encontre o vídeo pelo `videoId`
3. Verifique os campos acima

**Se falhar:**

- Webhook pode não estar configurado → Ver `BUNNY_WEBHOOK_CONFIG.md`
- Webhook secret pode estar errado → Verificar `BUNNY_WEBHOOK_SECRET`
- Vídeo ainda está processando → Aguardar mais tempo
- Ver seção "Troubleshooting Webhook" abaixo

---

### ✅ Teste 3: Player com Watermark

**Objetivo**: Verificar se vídeo reproduz corretamente com watermark.

**Passos:**

1. Acesse a área de usuário: `/units/{categoryId}`
2. Navegue até a lesson com vídeo
3. O player deve carregar automaticamente
4. Clique em play

**Resultado esperado:**

- ✅ Player carrega sem erros
- ✅ Vídeo reproduz normalmente
- ✅ Watermark aparece sobreposto ao vídeo com:
  - Nome do usuário
  - CPF do usuário
  - Posição aleatória (não nos cantos)
- ✅ Watermark não interfere nos controles do player
- ✅ Watermark é semi-transparente

**Verificação Técnica:**

Abra DevTools (F12) → Network:

1. Deve haver um request para: `{convex-url}/bunny/embed-token`
2. Response deve conter:
   ```json
   {
     "embedUrl": "https://player.mediadelivery.net/embed/...",
     "token": "...",
     "expires": 1234567890
   }
   ```
3. iframe deve carregar com URL assinada

**Se falhar:**

- Player não carrega → Verificar `BUNNY_EMBED_SECRET`
- Sem watermark → Verificar `VideoPlayerWithWatermark` component
- Erro 401 → Token expirado ou inválido
- Vídeo não reproduz → Status ainda não é "ready"

---

### ✅ Teste 4: Múltiplos Uploads

**Objetivo**: Verificar comportamento com uploads concorrentes.

**Passos:**

1. Selecione 3 lessons diferentes
2. Faça upload de vídeos em todas simultaneamente
3. Aguarde processamento

**Resultado esperado:**

- ✅ Todos os uploads devem completar sem erro
- ✅ Todos os vídeos devem ser salvos no Convex
- ✅ Webhooks devem atualizar todos corretamente
- ✅ Cada vídeo deve ter seu próprio `videoId` único

**Se falhar:**

- Race condition no banco → Verificar índices no schema
- Webhook perdido → Verificar logs do Bunny

---

### ✅ Teste 5: Upload Grande

**Objetivo**: Verificar comportamento com vídeos grandes.

**Passos:**

1. Faça upload de vídeo >100MB
2. Monitore progresso
3. Aguarde processamento completo

**Resultado esperado:**

- ✅ Upload deve completar (pode demorar)
- ✅ Sem timeout
- ✅ Progresso deve ser visível
- ✅ Vídeo deve processar normalmente

**Limites:**

- Máximo configurado no código: 5GB
- Bunny.net suporta até arquivos muito grandes
- Network timeout pode afetar uploads longos

**Se falhar:**

- Timeout → Aumentar timeout do Next.js (next.config.js)
- Erro de memória → Buffer muito grande no Server Action
- Upload interrompido → Verificar conexão de internet

---

### ✅ Teste 6: Vídeo com Falha

**Objetivo**: Verificar tratamento de erros.

**Passos:**

1. Faça upload de arquivo corrompido ou não-vídeo
2. Ou: Interrompa upload no meio

**Resultado esperado:**

- ✅ Erro deve ser tratado gracefully
- ✅ Mensagem de erro clara para o usuário
- ✅ Status pode ser "failed" se Bunny rejeitar

**Se falhar:**

- Erro não tratado → Adicionar try/catch nos handlers
- Vídeo fica em estado indefinido → Implementar timeout/cleanup

---

### ✅ Teste 7: Permissões de Admin

**Objetivo**: Verificar que apenas admins podem fazer upload.

**Passos:**

1. Logout
2. Login com usuário não-admin
3. Tente acessar `/admin/units-lessons`

**Resultado esperado:**

- ✅ Acesso bloqueado ou redirecionado
- ✅ Upload não deve ser possível
- ✅ Erro claro se tentar via API

**Se falhar:**

- Implementar middleware de auth
- Verificar role do usuário no Clerk

---

## Troubleshooting

### Webhook Não Recebido

**Sintomas:**

- Vídeo processa no Bunny mas status não atualiza
- Sem logs de webhook no Convex

**Debug:**

1. Verificar webhook está ativo no Bunny:
   ```
   https://dash.bunny.net/stream/{LIBRARY_ID}/settings/webhooks
   ```

2. Testar webhook manualmente:
   - Clique em "Test Webhook" no Bunny
   - Deve retornar 200 OK

3. Verificar URL está correta:
   - Deve terminar em `.convex.site/bunny/webhook`
   - Não pode ser `.convex.cloud`

4. Verificar logs do Convex:
   ```bash
   npx convex logs --watch
   ```

### Token de Embed Inválido

**Sintomas:**

- Player não carrega
- Erro 401 no iframe
- "Invalid token" no console

**Debug:**

1. Verificar `BUNNY_EMBED_SECRET` no Convex:
   ```bash
   npx convex env list
   ```

2. Verificar no Bunny Dashboard:
   - Video Library → Security → Token Authentication
   - Key deve ser igual ao `BUNNY_EMBED_SECRET`

3. Testar geração manual:
   ```bash
   node generate-token.js VIDEO_ID LIBRARY_ID EMBED_SECRET
   ```

### Vídeo Não Aparece no Player

**Sintomas:**

- Player mostra "Vídeo ainda não disponível"
- Lesson tem `videoId` mas player não carrega

**Debug:**

1. Verificar status no Convex:
   ```javascript
   // Convex Dashboard → Data → videos
   // Status deve ser "ready"
   ```

2. Verificar `videoId` na lesson:
   ```javascript
   // Convex Dashboard → Data → lessons
   // Campo videoId deve estar preenchido
   ```

3. Verificar vídeo existe no Bunny:
   ```
   https://dash.bunny.net/stream/{LIBRARY_ID}
   ```

## Testes Automatizados (Futuro)

Para implementar testes automatizados:

### Unit Tests

- [ ] Testar `processBunnyWebhook` com mocks
- [ ] Testar `mapBunnyStatus` para todos os códigos
- [ ] Testar geração de token signed

### Integration Tests

- [ ] Testar fluxo completo com vídeo de teste
- [ ] Testar webhook com payload fake
- [ ] Testar player com token válido/inválido

### E2E Tests (Playwright)

- [ ] Simular upload via UI
- [ ] Verificar player carrega
- [ ] Verificar watermark aparece

## Métricas de Sucesso

Sistema está funcionando corretamente quando:

- ✅ Upload success rate > 95%
- ✅ Webhook receive rate > 99%
- ✅ Player load time < 3s
- ✅ Sem erros 500 nos logs
- ✅ Todos os vídeos eventualmente ficam "ready"

## Próximos Passos

Após todos os testes passarem:

1. ✅ Fase 7 completa
2. ➡️ Fase 8: Implementar melhorias opcionais (polling, sync manual)
3. ➡️ Fase 9: Deploy para produção

## Referências

- [Bunny Stream API](https://docs.bunny.net/reference/video_getvideo)
- [Convex Testing](https://docs.convex.dev/production/testing)
