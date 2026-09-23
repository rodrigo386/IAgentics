/** Campo de CSV para o Excel em português (separador ponto e vírgula).
 *  Aspas duplicadas e o campo entre aspas: nome com ponto e vírgula ou quebra
 *  de linha não pode partir a coluna. `=`, `+`, `-`, `@`, tab e retorno de
 *  carro iniciais são neutralizados porque o Excel os interpretaria como
 *  início de fórmula (CSV injection). */
export function campoCsv(valor: string): string {
  const seguro = /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
  return `"${seguro.replace(/"/g, '""')}"`;
}
