import { admin } from "@/lib/content-admin";
import { lerTodas } from "@/lib/admin/configuracoes";
import { FormConfiguracoes } from "@/components/admin/FormConfiguracoes";

export default async function PaginaConfiguracoes() {
  const valoresIniciais = await lerTodas();
  const t = admin.configuracoes;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-medium tracking-[-0.03em]">{t.titulo}</h1>
      <FormConfiguracoes valoresIniciais={valoresIniciais} />
    </div>
  );
}
