/** Normaliza e valida CPF (11 dígitos + 2 verificadores oficiais).
 *  Devolve só os dígitos quando válido, null quando não — o CPF validado vai
 *  direto ao Asaas e NUNCA é persistido nem logado aqui (constraint do ciclo). */
export function validarCpf(bruto: string): string | null {
  const cpf = bruto.replace(/\D/g, "");
  if (cpf.length !== 11) return null;
  if (/^(\d)\1{10}$/.test(cpf)) return null; // 111.111.111-11 etc. passam no DV, mas são inválidos
  for (const pos of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < pos; i++) soma += Number(cpf[i]) * (pos + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== Number(cpf[pos])) return null;
  }
  return cpf;
}
