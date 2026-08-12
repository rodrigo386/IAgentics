import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { destinoCta, lerConfiguracao, lerTodas, salvarConfiguracoes, type ChaveConfig } from "./configuracoes";

// Ao contrário de lib/admin/alunos.test.ts / conteudo.test.ts, AQUI NÃO HÁ
// prefixo: as 3 chaves de settings (cta_destino, aviso_topo, email_contato)
// são fixas e compartilhadas com o banco de dev real — não dá pra isolar por
// LIKE num prefixo próprio. beforeAll lê o valor atual de cada chave;
// afterAll restaura exatamente esse valor (upsert de volta, ou delete se a
// chave não existia antes) em vez de simplesmente apagar tudo.
const CHAVES: ChaveConfig[] = ["cta_destino", "aviso_topo", "email_contato"];

describe.skipIf(!process.env.DATABASE_URL)("configurações do admin", () => {
  let originais: { chave: string; valor: string }[] = [];

  beforeAll(async () => {
    originais = await db.select({ chave: settings.chave, valor: settings.valor }).from(settings).where(inArray(settings.chave, CHAVES));
  });

  afterAll(async () => {
    const chavesQueExistiam = new Set(originais.map((o) => o.chave));
    for (const chave of CHAVES) {
      const original = originais.find((o) => o.chave === chave);
      if (original) {
        await db
          .insert(settings)
          .values({ chave, valor: original.valor })
          .onConflictDoUpdate({ target: settings.chave, set: { valor: original.valor } });
      } else if (!chavesQueExistiam.has(chave)) {
        await db.delete(settings).where(eq(settings.chave, chave));
      }
    }
  });

  it("lerConfiguracao de chave ausente devolve string vazia", async () => {
    await db.delete(settings).where(eq(settings.chave, "email_contato"));
    expect(await lerConfiguracao("email_contato")).toBe("");
  });

  it("salvarConfiguracoes upserta e lerTodas devolve os valores salvos, sem duplicar linha numa segunda chamada", async () => {
    await salvarConfiguracoes({ cta_destino: "/academy#contato-teste", aviso_topo: "Aviso de teste" });
    const todas = await lerTodas();
    expect(todas.cta_destino).toBe("/academy#contato-teste");
    expect(todas.aviso_topo).toBe("Aviso de teste");

    await salvarConfiguracoes({ cta_destino: "/academy#contato-teste-2" });
    expect(await lerConfiguracao("cta_destino")).toBe("/academy#contato-teste-2");
    const linhas = await db.select().from(settings).where(eq(settings.chave, "cta_destino"));
    expect(linhas).toHaveLength(1);
  });

  it("destinoCta: chave vazia/ausente devolve o fallback padrão; com valor devolve o valor salvo", async () => {
    await db.delete(settings).where(eq(settings.chave, "cta_destino"));
    expect(await destinoCta()).toBe("/academy#contato");

    await salvarConfiguracoes({ cta_destino: "https://exemplo.com/vendas" });
    expect(await destinoCta()).toBe("https://exemplo.com/vendas");
  });
});
