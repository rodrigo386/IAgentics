import Link from "next/link";
import { notFound } from "next/navigation";
import { buscarCursoAdmin, contarImpactoDoCurso, type Impacto } from "@/lib/admin/conteudo";
import { admin } from "@/lib/content-admin";
import { FormCurso } from "@/components/admin/FormCurso";
import { PainelModulos } from "@/components/admin/PainelModulos";

const SEM_IMPACTO: Impacto = { aulas: 0, alunosComProgresso: 0 };

export default async function PaginaCursoAdmin({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const curso = await buscarCursoAdmin(slug);
  if (!curso) notFound();

  // Uma chamada batelada (2 queries no total, ver contarImpactoDoCurso) em vez
  // de uma contarImpacto() por módulo + uma por aula — um curso com dezenas de
  // aulas não devia custar dezenas de queries só para montar os avisos de
  // exclusão de cada linha.
  const impacto = await contarImpactoDoCurso(curso.id);
  const modulosComImpacto = curso.modulos.map((m) => ({
    id: m.id,
    titulo: m.titulo,
    ordem: m.ordem,
    impacto: impacto.porModulo.get(m.id) ?? SEM_IMPACTO,
    aulas: m.aulas.map((a) => ({ ...a, impacto: impacto.porAula.get(a.id) ?? SEM_IMPACTO })),
  }));

  const t = admin.conteudo;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/conteudo"
          className="w-fit font-mono text-[11px] uppercase tracking-[0.14em] text-fg-muted transition-colors hover:text-fg"
        >
          ← {t.titulo}
        </Link>
        <h1 className="text-3xl font-medium tracking-[-0.03em]">{curso.titulo}</h1>
      </div>

      <FormCurso curso={curso} impacto={impacto.curso} />

      <PainelModulos courseId={curso.id} cursoSlug={curso.slug} modulos={modulosComImpacto} />
    </div>
  );
}
