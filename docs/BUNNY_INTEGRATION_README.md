# Integração Bunny.net Stream - OrtoQBank

Documentação completa da integração de streaming de vídeos com Bunny.net CDN.

## Visão Geral

Este projeto utiliza **Bunny.net Stream** para:

- ✅ Upload seguro de vídeos por admins
- ✅ Processamento automático e transcoding
- ✅ Streaming otimizado com CDN global
- ✅ Player customizado com watermark
- ✅ Autenticação via tokens signed
- ✅ Notificações em tempo real via webhooks

## Arquitetura

```
┌─────────────┐
│   Admin UI  │ (Next.js)
└──────┬──────┘
       │ 1. Upload Request
       ↓
┌─────────────────┐
│ Convex HTTP     │
│ /bunny/create   │
└──────┬──────────┘
       │ 2. Create Video
       ↓
┌─────────────────┐
│   Bunny API     │
└──────┬──────────┘
       │ 3. Video Created (guid)
       ↓
┌─────────────────┐
│ Server Action   │ (Next.js)
│ uploadToBunny   │
└──────┬──────────┘
       │ 4. PUT video file
       ↓
┌─────────────────┐
│  Bunny Storage  │
└──────┬──────────┘
       │ 5. Processing...
       ↓
┌─────────────────┐
│  Bunny Webhook  │
└──────┬──────────┘
       │ 6. Video Encoded Event
       ↓
┌─────────────────┐
│ Convex HTTP     │
│ /bunny/webhook  │
└──────┬──────────┘
       │ 7. Update Status
       ↓
┌─────────────────┐
│  Convex DB      │
│  videos table   │
└──────┬──────────┘
       │ 8. Status = ready
       ↓
┌─────────────────┐
│   User Player   │ (React)
└──────┬──────────┘
       │ 9. Request signed URL
       ↓
┌─────────────────┐
│ Convex HTTP     │
│ /bunny/embed    │
└──────┬──────────┘
       │ 10. Signed iframe URL
       ↓
┌─────────────────┐
│  Video Player   │ + Watermark
└─────────────────┘
```

## Componentes

### Backend (Convex)

| Arquivo | Descrição |
|---------|-----------|
| `convex/http.ts` | HTTP actions (create-video, webhook, embed-token) |
| `convex/bunny/webhookHandler.ts` | Lógica de processamento de webhooks |
| `convex/videos.ts` | Queries/mutations para tabela videos |
| `convex/lessons.ts` | Integração lessons ↔ videos |
| `convex/schema.ts` | Schema da tabela videos |

### Frontend (Next.js)

| Arquivo | Descrição |
|---------|-----------|
| `hooks/use-bunny-upload.ts` | Hook para upload de vídeos |
| `components/bunny/admin-video-uploader.tsx` | UI de upload (admin) |
| `components/bunny/video-player-with-watermark.tsx` | Player com watermark |
| `app/actions/bunny.ts` | Server Action de upload |
| `app/(dashboard)/admin/units-lessons/_components/lesson-edit-panel.tsx` | Upload no editor de lessons |

### Documentação

| Arquivo | Descrição |
|---------|-----------|
| `docs/BUNNY_ENV_SETUP.md` | Configuração de variáveis de ambiente |
| `docs/BUNNY_WEBHOOK_CONFIG.md` | Configuração de webhook |
| `docs/BUNNY_TESTING_GUIDE.md` | Guia de testes |
| `docs/BUNNY_PRODUCTION_DEPLOY.md` | Guia de deploy |
| `docs/BUNNY_INTEGRATION_README.md` | Este arquivo |

## Quick Start

### 1. Configurar Variáveis de Ambiente

Consulte: [`BUNNY_ENV_SETUP.md`](./BUNNY_ENV_SETUP.md)

**Convex:**
```bash
BUNNY_API_KEY=...
BUNNY_LIBRARY_ID=...
BUNNY_EMBED_SECRET=...
BUNNY_WEBHOOK_SECRET=... (opcional)
```

**Next.js (.env.local):**
```bash
NEXT_PUBLIC_CONVEX_URL=...
NEXT_PUBLIC_BUNNY_LIBRARY_ID=...
```

### 2. Configurar Webhook

Consulte: [`BUNNY_WEBHOOK_CONFIG.md`](./BUNNY_WEBHOOK_CONFIG.md)

URL: `https://your-deployment.convex.site/bunny/webhook`

### 3. Testar Localmente

```bash
# Terminal 1: Convex
npx convex dev

# Terminal 2: Next.js
npm run dev

# Acesse: http://localhost:3000/admin/units-lessons
```

### 4. Deploy

Consulte: [`BUNNY_PRODUCTION_DEPLOY.md`](./BUNNY_PRODUCTION_DEPLOY.md)

```bash
# 1. Deploy Convex
npx convex deploy --prod

# 2. Configurar webhook no Bunny
# Ver guia de webhook

# 3. Deploy Next.js
npm run build
vercel --prod  # ou sua plataforma
```

## Fluxo de Upload

1. **Admin seleciona arquivo**
   - Validação: tipo de arquivo, tamanho (<5GB)
   - UI mostra nome e tamanho do arquivo

2. **Criação no Bunny**
   - POST `/bunny/create-video` com title e createdBy
   - Bunny retorna `videoId` (GUID)
   - Salva registro na tabela `videos` (status: uploading)

3. **Upload do arquivo**
   - Server Action envia arquivo como buffer
   - PUT `https://video.bunnycdn.com/library/{id}/videos/{videoId}`
   - Bunny aceita e inicia processamento

4. **Processamento**
   - Bunny encodifica vídeo em múltiplas resoluções
   - Gera thumbnail automaticamente
   - Cria playlist HLS (.m3u8)

5. **Notificação via Webhook**
   - Bunny envia POST para `/bunny/webhook`
   - Payload inclui: VideoGuid, Status, VideoLibraryId
   - Handler atualiza DB: status=ready, URLs, metadata

6. **Reprodução**
   - User acessa lesson
   - Component solicita token signed via `/bunny/embed-token`
   - Player renderiza iframe com URL assinada
   - Watermark sobreposto com nome e CPF do usuário

## Segurança

### Token Authentication

Player usa **signed URLs** que expiram em 1 hora:

```typescript
// SHA256(embed_secret + video_id + expiration)
const token = sha256(secret + videoId + expires);
const url = `https://player.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`;
```

### Webhook Signature

Webhooks validam assinatura (se `BUNNY_WEBHOOK_SECRET` configurado):

```typescript
const signature = sha256(webhook_secret + JSON.stringify(body));
if (signature !== header_signature) {
  throw new Error("Invalid signature");
}
```

### Watermark

Vídeos mostram watermark não-removível com:
- Nome completo do usuário
- CPF do usuário
- Posição aleatória (10-80% da tela)

## Troubleshooting

### Upload Falha

**Sintomas**: Erro ao fazer upload

**Checklist**:
- [ ] `BUNNY_API_KEY` configurada?
- [ ] `BUNNY_LIBRARY_ID` correta?
- [ ] Arquivo é válido? (vídeo, <5GB)
- [ ] Usuário está autenticado? (Clerk)

### Status Não Atualiza

**Sintomas**: Vídeo fica "uploading" forever

**Checklist**:
- [ ] Webhook configurado no Bunny?
- [ ] URL do webhook correta? (`.convex.site`)
- [ ] Eventos marcados? (Video Encoded)
- [ ] Logs mostram webhook? (`npx convex logs`)

### Player Não Carrega

**Sintomas**: Player mostra erro ou loading infinito

**Checklist**:
- [ ] Status do vídeo é "ready"?
- [ ] `BUNNY_EMBED_SECRET` configurada?
- [ ] Token não expirou?
- [ ] Vídeo existe no Bunny?

Ver guia completo: [`BUNNY_TESTING_GUIDE.md`](./BUNNY_TESTING_GUIDE.md)

## Funcionalidades Avançadas

### Polling de Status

Use `api.videos.getVideoStatus` para polling:

```typescript
const status = useQuery(api.videos.getVideoStatus, { videoId });

useEffect(() => {
  if (status && status.status !== "ready") {
    // Poll a cada 3 segundos
    const interval = setInterval(() => {}, 3000);
    return () => clearInterval(interval);
  }
}, [status]);
```

### Sincronização Manual

Admins podem forçar sync com Bunny:

```typescript
await syncFromBunny({ videoId: "..." });
```

Útil se webhook falhar ou para debug.

## Limites e Quotas

### Bunny.net

- Upload: Até 10GB por arquivo (configurado: 5GB)
- Storage: Ilimitado (plano pago)
- Bandwidth: Conforme plano contratado
- API: Rate limit 500 req/min

### Convex

- Function duration: 30s (suficiente para criar vídeo)
- HTTP response: 20MB (suficiente para metadata)
- Database: Unlimited reads/writes

## Monitoramento

### Métricas Importantes

1. **Upload Success Rate**: >95%
2. **Webhook Delivery Rate**: >99%
3. **Player Load Time**: <3s
4. **Processing Time**: <5min (vídeos pequenos)

### Comandos Úteis

```bash
# Ver logs em tempo real
npx convex logs --watch

# Filtrar erros
npx convex logs | grep -i error

# Filtrar webhooks
npx convex logs | grep webhook

# Ver deployment atual
npx convex deployments

# Ver env vars
npx convex env list
```

## Custos Estimados

### Bunny.net Stream (Base)

- Storage: $0.005/GB/mês
- Streaming: $0.01/GB transferido
- Encoding: Incluído

**Exemplo**: 100 vídeos (10GB total), 1000 views/mês (50GB tráfego)
- Storage: 10GB × $0.005 = $0.05
- Bandwidth: 50GB × $0.01 = $0.50
- **Total: ~$0.55/mês**

### Convex

- Free tier: 1M reads, 1M writes/mês
- Após free tier: $25/mês (Standard)

## Roadmap Futuro

- [ ] Suporte a legendas/captions
- [ ] Upload múltiplo (batch)
- [ ] Prévia de thumbnail customizada
- [ ] Analytics de visualização
- [ ] Suporte a múltiplas qualidades
- [ ] Download de vídeos (admin)
- [ ] Fila de processamento
- [ ] Retry automático de webhooks falhados

## Contribuindo

Para adicionar features ou corrigir bugs:

1. Crie branch: `git checkout -b feature/nome-da-feature`
2. Faça mudanças e teste localmente
3. Execute testes: Ver `BUNNY_TESTING_GUIDE.md`
4. Commit com mensagens descritivas (português)
5. Push e crie Pull Request
6. Aguarde review

## Suporte

- **Documentação**: Arquivos nesta pasta (`docs/`)
- **Bunny.net Docs**: https://docs.bunny.net/docs/stream-overview
- **Convex Docs**: https://docs.convex.dev
- **Issues**: [Criar issue no GitHub]
- **Equipe**: [Contatos internos]

## Changelog

### v1.0.0 (2024-XX-XX) - Initial Release

- ✅ Upload de vídeos via admin panel
- ✅ Webhook para notificações de processamento
- ✅ Player com watermark customizado
- ✅ Token authentication para segurança
- ✅ Integração completa lessons ↔ videos
- ✅ Documentação completa

---

**Desenvolvido para OrtoQBank** | Integração Bunny.net Stream v1.0
