"""
Exporta da base da calculadora OFICIAL da Receita Federal
(github.com/ReceitaFederal/calculadora-rtc-regime-regular, licença MIT,
Copyright (c) 2026 Receita Federal do Brasil) a tabela que a consulta de NCM
do site usa: lib/receita/tabela-ncm.json.

Uso (o banco é gerado pelo flyway do repositório da Receita; ver
scripts/conferir-receita.ts):
    python3 scripts/tabela-receita.py <calculadora-pro.db> <commit da Receita>

O modelo da Receita:
- NCM: todos os códigos (capítulo, posição, subposição, item), com descrição.
- NCM_APLICAVEL: um PREFIXO de NCM (2 a 8 dígitos) ligado a uma classificação
  tributária especial (cClassTrib), com o item de anexo da LC 214 que define a
  condição. EXCECAO_NCM_APLICAVEL tira NCMs específicos de um vínculo.
- PERCENTUAL_REDUCAO: a redução por tributo (2 = CBS, 3 e 4 = IBS estadual e
  municipal).
- FUNDAMENTACAO_LEGAL: o artigo da lei de cada classificação.
- Tributo 1 = Imposto Seletivo: as classificações dele marcam o NCM como
  sujeito ao IS.

Só entra o que está vigente (sem fim de vigência, ou com fim no futuro).
"""
import json
import sqlite3
import sys
from datetime import date

HOJE = date.today().isoformat()


def limpar(texto):
    """A descrição do NCM vem com HTML (cm<sup>2</sup>) e com os travessões da
    hierarquia ("- ", "-- "). O site mostra texto puro."""
    import re

    s = (texto or "").replace("<sup>2</sup>", "²").replace("<sup>3</sup>", "³")
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"^[\s\-–]+", "", s)
    return re.sub(r"\s+", " ", s).strip()


def vigente(fim):
    return fim is None or fim == "" or fim >= HOJE


def main(db_path, commit):
    db = sqlite3.connect(db_path)
    q = db.execute

    # Descrições de todos os níveis do NCM vigentes, para mostrar a hierarquia.
    ncm = {cd: limpar(desc) for cd, desc, fim in q("select NCM_CD, NCM_DESCRICAO, NCM_FIM_VIGENCIA from NCM") if vigente(fim)}

    # Situação de cada classificação: código, CST, descrições e tributo.
    tributo_da_situacao = {}
    for sitr, tbto, fim in q("select TRST_SITR_ID, TRST_TBTO_ID, TRST_FIM_VIGENCIA from TRIBUTO_SITUACAO_TRIBUTARIA"):
        if vigente(fim):
            tributo_da_situacao.setdefault(sitr, set()).add(tbto)

    classes = {}
    for cid, cd, desc, sitr, sitr_cd, sitr_desc, fim in q(
        """select c.CLTR_ID, c.CLTR_CD, c.CLTR_DESCRICAO, c.CLTR_SITR_ID, s.SITR_CD, s.SITR_DESCRICAO, c.CLTR_FIM_VIGENCIA
           from CLASSIFICACAO_TRIBUTARIA c join SITUACAO_TRIBUTARIA s on s.SITR_ID = c.CLTR_SITR_ID"""
    ):
        if not vigente(fim):
            continue
        tributos = tributo_da_situacao.get(sitr, set())
        classes[cid] = {
            "cClassTrib": cd,
            "cst": sitr_cd,
            "situacao": sitr_desc.strip(),
            "descricao": desc.strip(),
            "seletivo": tributos == {1},
            "reducao": {},
            "fundamento": [],
        }

    for cid, tbto, valor, fim in q("select PERE_CLTR_ID, PERE_TBTO_ID, PERE_VALOR, PERE_FIM_VIGENCIA from PERCENTUAL_REDUCAO"):
        if cid in classes and vigente(fim):
            chave = {2: "cbs", 3: "ibs", 4: "ibs"}.get(tbto)
            if chave:
                classes[cid]["reducao"][chave] = float(valor)

    for cid, curto, texto, fim1, fim2 in q(
        """select fc.FDCL_CLTR_ID, f.FDLG_TEXTO_CURTO, f.FDLG_TEXTO, fc.FDCL_FIM_VIGENCIA, f.FDLG_FIM_VIGENCIA
           from FUNDAMENTACAO_CLASSIFICACAO fc join FUNDAMENTACAO_LEGAL f on f.FDLG_ID = fc.FDCL_FDLG_ID"""
    ):
        if cid in classes and vigente(fim1) and vigente(fim2):
            primeira = (texto or "").strip().split("\n")[0].strip()
            classes[cid]["fundamento"].append({"referencia": (curto or "").strip(), "texto": primeira[:400]})

    anexos = {aid: (num, (txt or "").strip()) for aid, num, txt in q("select ANXO_ID, ANXO_NUMERO, ANXO_TEXTO_ITEM from ANEXO")}

    excecoes = {}
    for ncm_cd, ncma, fim in q("select ENCM_NCM_CD, ENCM_NCMA_ID, ENCM_FIM_VIGENCIA from EXCECAO_NCM_APLICAVEL"):
        if vigente(fim):
            excecoes.setdefault(ncma, []).append(ncm_cd)

    # Cada linha de NCM_APLICAVEL vai crua, com as exceções DELA: a Receita
    # modela "vínculo genérico duplicado, um por exceção" (0207 aparece duas
    # vezes, cada uma excetuando um foie gras), e a regra que decide
    # (tabela-verdade de NcmAplicavelService) olha as linhas separadas.
    # A regra está reproduzida em lib/consulta-ncm.ts.
    vinculos = []
    usadas = set()
    for ncma, prefixo, cid, anexo, fim in q("select NCMA_ID, NCMA_NCM_CD, NCMA_CLTR_ID, NCMA_ANXO_ID, NCMA_FIM_VIGENCIA from NCM_APLICAVEL"):
        if not vigente(fim) or cid not in classes:
            continue
        num, item = anexos.get(anexo, (None, ""))
        classe = classes[cid]["cClassTrib"] + (":is" if classes[cid]["seletivo"] else "")
        vinculos.append({"prefixo": prefixo, "classe": classe, "anexo": num, "condicao": item[:500], "excecoes": sorted(excecoes.get(ncma, []))})
        usadas.add(cid)

    # Só as classificações que algum NCM usa, mais a de tributação integral (a regra geral).
    saida_classes = {}
    for cid, c in classes.items():
        chave = c["cClassTrib"] + (":is" if c["seletivo"] else "")
        if cid in usadas or (c["cClassTrib"] == "000001" and not c["seletivo"]):
            saida_classes[chave] = {k: v for k, v in c.items() if k != "seletivo"} | {"seletivo": c["seletivo"]}

    versoes = list(q("select VRBD_VERSAO_BASE_DADO, VRBD_DESCRICAO from VERSAO_BASE_DADO order by VRBD_ID"))
    saida = {
        "fonte": "https://github.com/ReceitaFederal/calculadora-rtc-regime-regular",
        "licenca": "MIT, Copyright (c) 2026 Receita Federal do Brasil",
        "commit": commit,
        "versaoBase": versoes[-1][0] if versoes else None,
        "geradoEm": HOJE,
        "ncm": ncm,
        "classes": saida_classes,
        "vinculos": sorted(vinculos, key=lambda v: (v["prefixo"], v["classe"], v["excecoes"])),
    }
    with open("lib/receita/tabela-ncm.json", "w", encoding="utf-8") as f:
        json.dump(saida, f, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    print(f"{len(ncm)} NCMs, {len(saida_classes)} classificações, {len(vinculos)} vínculos; base {saida['versaoBase']}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("uso: python3 scripts/tabela-receita.py <calculadora-pro.db> <commit>")
    main(sys.argv[1], sys.argv[2])
