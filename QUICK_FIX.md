# 🚀 CORREÇÃO RÁPIDA - Vídeo Não Carrega

## Problema Identificado

As variáveis de ambiente estão configuradas mas o servidor precisa ser reiniciado.

## Solução (Passo a Passo)

### 1. Pare o servidor Next.js

No terminal onde `npm run dev` está rodando, pressione:
```
Ctrl + C
```

### 2. Reinicie o servidor

```bash
npm run dev
```

### 3. Verifique no Browser

Abra o DevTools (F12) → Console e recarregue a página.

Você deve ver logs como:
```
Buscando token para vídeo: {
  videoId: "...",
  libraryId: "566190",
  url: "https://famous-ptarmigan-64.convex.site/bunny/embed-token?..."
}
```

### 4. Se ainda não funcionar

Execute este comando para verificar a lesson:

```bash
# Listar todas as lessons
npx convex run lessons:list

# Procure pela lesson que você está testando
# Verifique se ela tem o campo "videoId" preenchido
```

### 5. Se a lesson não tem videoId

Significa que o upload ainda não associou o vídeo à lesson. Você precisa:

1. Ir em `/admin/units-lessons`
2. Editar a lesson
3. Fazer upload do vídeo novamente
4. O sistema deve associar automaticamente

### 6. Se o vídeo ainda está processando

Vá ao Bunny Dashboard e verifique se o vídeo está pronto:
- https://dash.bunny.net/stream/566190
- Status deve ser "Ready" (não "Processing")

Se estiver "Processing", aguarde alguns minutos.

### 7. Se mostrar erro no player

O erro agora vai ter detalhes! Clique em "Detalhes técnicos" e copie a mensagem.

## Variáveis Configuradas ✅

```
NEXT_PUBLIC_CONVEX_URL=https://famous-ptarmigan-64.convex.cloud
NEXT_PUBLIC_BUNNY_LIBRARY_ID=566190
```

## Próximos Passos se Ainda Não Funcionar

1. Abra o console do browser (F12)
2. Procure por erros em vermelho
3. Copie a mensagem completa do erro
4. Me envie aqui para eu ajudar mais!
