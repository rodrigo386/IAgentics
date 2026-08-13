import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { auth } from "@/auth";
import { ehAdminAtivo } from "@/lib/admin/sessao";
import { sairAction } from "@/app/app/actions";
import { plataforma } from "@/lib/content-plataforma";

/** Header da plataforma: logo Academy (não o lockup IAgentics — quem está
 *  logado está na Academy), navegação mínima e sair. Sem sessão (páginas
 *  públicas de auth), mostra só o logo.
 *
 *  O link "Administração" só existe para admin, e a checagem é NO BANCO
 *  (ehAdminAtivo), não no role do JWT — rebaixou, o link some no próximo
 *  request. Para aluno comum o link não renderiza, coerente com o /admin
 *  responder 404: a área não existe para quem não é admin. */
export async function ShellHeader() {
  const sessao = await auth();
  const user = sessao?.user;
  const ehAdmin = user?.id ? await ehAdminAtivo(user.id) : false;

  return (
    <header className="border-b border-line">
      {/* min-h + flex-wrap na nav: com os quatro itens do admin num celular a linha
          não cabe; sem o wrap o flexbox quebrava "Meus cursos" no meio da palavra. */}
      <div className="mx-auto flex min-h-16 max-w-[1200px] items-center justify-between gap-4 px-5 py-2 sm:px-8">
        <Link href={user ? "/app" : "/app/entrar"} aria-label={plataforma.nome} className="shrink-0">
          <Image src="/plataforma/academy-logo.png" alt={plataforma.nome} width={893} height={254} className="h-9 w-auto dark:invert-0 invert" priority />
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1">
          {user ? (
            <>
              <Link href="/app" className="whitespace-nowrap text-sm text-fg-muted transition-colors hover:text-fg">{plataforma.shell.meusCursos}</Link>
              <Link href="/app/conta" className="whitespace-nowrap text-sm text-fg-muted transition-colors hover:text-fg">{plataforma.shell.conta}</Link>
              {ehAdmin ? (
                <Link href="/admin" className="whitespace-nowrap text-sm font-medium text-accent-text transition-colors hover:text-fg">
                  {plataforma.shell.administracao}
                </Link>
              ) : null}
              <form action={sairAction}>
                <button className="rounded-control border border-line px-4 py-1.5 text-sm transition-colors hover:border-line-strong">{plataforma.shell.sair}</button>
              </form>
            </>
          ) : null}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
