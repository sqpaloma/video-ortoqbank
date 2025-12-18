#!/usr/bin/env node

/**
 * Script de debug para verificar vídeos e lessons
 * Uso: node debug-video.js
 */

console.log("\n🔍 DEBUG: Verificando integração Bunny.net\n");
console.log("=" .repeat(60));

console.log("\n1️⃣  VERIFICAR VARIÁVEIS DE AMBIENTE");
console.log("-".repeat(60));
console.log("NEXT_PUBLIC_CONVEX_URL:", process.env.NEXT_PUBLIC_CONVEX_URL || "❌ NÃO CONFIGURADA");
console.log("NEXT_PUBLIC_BUNNY_LIBRARY_ID:", process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || "❌ NÃO CONFIGURADA");

console.log("\n2️⃣  COMANDOS PARA VERIFICAR NO CONVEX");
console.log("-".repeat(60));
console.log("\n# Ver todas as lessons com videoId:");
console.log("npx convex run lessons:list");
console.log("\n# Ver todos os vídeos:");
console.log("npx convex run videos:listAll");

console.log("\n3️⃣  CHECKLIST DE DIAGNÓSTICO");
console.log("-".repeat(60));
console.log("[ ] Lesson tem campo videoId preenchido?");
console.log("[ ] Video existe na tabela videos?");
console.log("[ ] Status do vídeo é 'ready'?");
console.log("[ ] NEXT_PUBLIC_CONVEX_URL está configurada?");
console.log("[ ] BUNNY_EMBED_SECRET está configurada no Convex?");

console.log("\n4️⃣  TESTAR TOKEN MANUALMENTE");
console.log("-".repeat(60));
console.log("\nAbra no browser (substitua os valores):");
console.log("https://YOUR-DEPLOYMENT.convex.site/bunny/embed-token?videoId=VIDEO_ID&libraryId=LIBRARY_ID");

console.log("\n5️⃣  VER LOGS DO CONVEX EM TEMPO REAL");
console.log("-".repeat(60));
console.log("npx convex logs");

console.log("\n" + "=".repeat(60));
console.log("💡 Execute os comandos acima e compartilhe os resultados\n");
