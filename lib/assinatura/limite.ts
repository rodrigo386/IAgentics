/**
 * Limite de tentativas do checkout (2026-10-14; pendência desde 2026-09-22).
 * Cada tentativa cria cliente e assinatura no Asaas, e a rota é pública: sem
 * limite, qualquer um enche a conta de cadastros e faturas.
 *
 * Em memória, por endereço de rede: o site roda em UMA instância no Railway,
 * então um mapa no processo basta. Reiniciar zera o contador, o que é
 * aceitável para o que ele protege.
 */
const tentativas = new Map<string, number[]>();

export function permitir(chave: string, maximo = 5, janelaMs = 15 * 60_000, agora = Date.now()): boolean {
  const recentes = (tentativas.get(chave) ?? []).filter((t) => agora - t < janelaMs);
  if (recentes.length >= maximo) {
    tentativas.set(chave, recentes);
    return false;
  }
  recentes.push(agora);
  tentativas.set(chave, recentes);
  // Faxina barata: o mapa não cresce sem fim com endereços de passagem.
  if (tentativas.size > 5000) for (const [k, v] of tentativas) if (v.every((t) => agora - t >= janelaMs)) tentativas.delete(k);
  return true;
}

/** O endereço de quem chama: o Cloudflare manda o IP real em cf-connecting-ip. */
export function enderecoDe(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "sem-endereco"
  );
}
