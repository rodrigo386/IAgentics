/** Campo de CSV para o Excel em português (separador ponto e vírgula).
 *  Aspas duplicadas e o campo entre aspas: nome com ponto e vírgula ou quebra
 *  de linha não pode partir a coluna. `=`, `+`, `-` e `@` iniciais são
 *  neutralizados porque o Excel os interpretaria como fórmula. */
export function campoCsv(valor: string): string {
  const seguro = /^[=+\-@]/.test(valor) ? `'${valor}` : valor;
  return `"${seguro.replace(/"/g, '""')}"`;
}
