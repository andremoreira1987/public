// Script que gera o build ESTÁTICO (pasta "out") só para o Android,
// sem bagunçar o next.config.ts usado no deploy da Vercel (que precisa
// das API routes dinâmicas e por isso NÃO pode ter output: "export").
//
// O que ele faz:
// 1. Guarda o next.config.ts atual (o da Vercel) em memória
// 2. Escreve uma versão temporária com output: "export"
// 3. Roda "next build" (gera a pasta "out" atualizada)
// 4. Restaura o next.config.ts original automaticamente
// 5. Roda "npx cap sync android"

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const configPath = path.join(__dirname, "..", "next.config.ts");
const configOriginal = fs.readFileSync(configPath, "utf8");

const apiPath = path.join(__dirname, "..", "app", "api");
const apiBackupPath = path.join(__dirname, "..", "app", "_api_backup_temp");

const configAndroid = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
`;

function restaurarConfig() {
  fs.writeFileSync(configPath, configOriginal, "utf8");

  if (fs.existsSync(apiBackupPath)) {
    fs.renameSync(apiBackupPath, apiPath);
  }

  console.log("✅ next.config.ts e pasta app/api originais restaurados (modo Vercel).");
}

const nextCachePath = path.join(__dirname, "..", ".next");

try {
  console.log("📦 Gerando build estático para o Android...");
  fs.writeFileSync(configPath, configAndroid, "utf8");

  // Remove temporariamente as API routes (incompatíveis com output: "export")
  if (fs.existsSync(apiPath)) {
    fs.renameSync(apiPath, apiBackupPath);
  }

  // Apaga o cache do Next para evitar referências a rotas de API antigas
  // (ex: erro TS2307 apontando pra app/api que acabamos de mover)
  if (fs.existsSync(nextCachePath)) {
    console.log("🧹 Limpando cache .next...");
    fs.rmSync(nextCachePath, { recursive: true, force: true });
  }

  execSync("npx next build", { stdio: "inherit", cwd: path.join(__dirname, "..") });

  // Restaura ANTES do cap sync (não precisa do config pra isso, mas por segurança)
  restaurarConfig();

  console.log("🔄 Sincronizando com o projeto Android...");
  execSync("npx cap sync android", { stdio: "inherit", cwd: path.join(__dirname, "..") });

  console.log("🎉 Tudo pronto! Pode abrir o Android Studio e dar Run.");
} catch (err) {
  // Mesmo se o build falhar, garante que o config da Vercel volte ao normal
  restaurarConfig();
  console.error("❌ Erro durante o build/sync:", err.message);
  process.exit(1);
}
