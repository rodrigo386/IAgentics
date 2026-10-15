#!/usr/bin/env python3
"""
Trilha original dos vídeos de lançamento da /cursos (2026-10-14, pedido do
Rodrigo: "precisa de trilha sonora animada de lançamento").

Sintetizada aqui, nota por nota, em vez de música de banco: não tem licença a
pagar nem risco de o Instagram ou o LinkedIn silenciarem o vídeo por direito
autoral. Pop eletrônico a 120 BPM em Ré maior (D, A, Bm, G, um acorde por
compasso), com bumbo, palma, chimbal, baixo, acordes com "respiração" (abaixam
a cada bumbo), arpejo, subidas de ruído e impactos.

A FOLHA DE TEMPOS de cada vídeo (FOLHAS, abaixo) segue os cortes das
composições em remotion/social/: mudou um tempo lá, mude aqui.

Uso: python3 scripts/trilha-lancamento.py lancamento out/social/trilha-lancamento.wav
     python3 scripts/trilha-lancamento.py dentro out/social/trilha-dentro.wav
Precisa só de numpy.
"""
import sys
import wave

import numpy as np

SR = 44100
BPM = 120
TEMPO = 60 / BPM  # 0,5 s
COMPASSO = 4 * TEMPO  # 2 s

# Ré maior: I, V, vi, IV. Notas MIDI das tríades (região média) e da fundamental do baixo.
ACORDES = [
    ([62, 66, 69], 38),  # D
    ([61, 64, 69], 33),  # A (1ª inversão, voz próxima)
    ([62, 66, 71], 35),  # Bm
    ([62, 67, 71], 31),  # G
]

FOLHAS = {
    # Vídeo 1, "O lançamento" (17 s): impacto em "Chegou.", bateria com a
    # cascata, impacto em "+300 horas", groove nas trilhas, impacto no preço.
    "lancamento": {
        "duracao": 17.0,
        "impactos": [0.0, 6.0, 12.5],
        "acentos": [],
        "subidas": [(4.5, 6.0), (11.5, 12.5)],
        "silencio_antes": [6.0, 12.5],  # meio tempo sem bateria antes da queda
        "secoes": [
            (0.0, 2.5, "intro"),
            (2.5, 6.0, "construcao"),
            (6.0, 12.5, "groove"),
            (12.5, 15.5, "groove_leve"),
            (15.5, 17.0, "fim"),
        ],
        "viradas": [],
    },
    # Vídeo 3, "O que tem dentro" (22 s): um acento por número, uma trilha
    # por compasso a partir de 3 s, impacto no fecho em 17 s.
    "dentro": {
        "duracao": 22.0,
        "impactos": [17.0],
        "acentos": [0.0, 1.0, 2.0],
        "subidas": [(2.0, 3.0), (16.0, 17.0)],
        "silencio_antes": [3.0, 17.0],
        "secoes": [
            (0.0, 3.0, "intro"),
            (3.0, 17.0, "groove"),
            (17.0, 20.5, "groove_leve"),
            (20.5, 22.0, "fim"),
        ],
        "viradas": [5.0, 7.0, 9.0, 11.0, 13.0, 15.0],  # prato a cada trilha nova
    },
}

RNG = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def tempo_s(n):
    return np.arange(int(n * SR)) / SR


def passa_baixa(x, corte):
    """Filtro de um polo; `corte` pode ser escalar ou vetor (varredura)."""
    corte = np.broadcast_to(np.asarray(corte, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * corte / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def passa_alta(x, corte):
    return x - passa_baixa(x, corte)


def serra(f, t):
    fase = (f * t) % 1.0
    return 2 * fase - 1


class Mesa:
    """Dois canais e um lugar para colocar cada som no tempo certo."""

    def __init__(self, duracao):
        self.n = int(duracao * SR)
        self.e = np.zeros(self.n)
        self.d = np.zeros(self.n)

    def poe(self, som, quando, ganho=1.0, pan=0.0):
        i = int(quando * SR)
        if i >= self.n or i + len(som) <= 0:
            return
        som = som[: self.n - i]
        self.e[i : i + len(som)] += som * ganho * (1 - max(0, pan))
        self.d[i : i + len(som)] += som * ganho * (1 + min(0, pan))


# ------------------------------------------------------------------ sons ---

def bumbo():
    t = tempo_s(0.4)
    f = 45 + 120 * np.exp(-t * 32)
    corpo = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8)
    clique = RNG.standard_normal(len(t)) * np.exp(-t * 400) * 0.3
    return np.tanh((corpo + clique) * 1.6)


def palma():
    t = tempo_s(0.25)
    ruido = passa_alta(RNG.standard_normal(len(t)), 900)
    env = np.exp(-t * 26)
    # três batidas quase juntas, como mãos de verdade
    for atraso in (0.008, 0.016):
        k = int(atraso * SR)
        env[k:] += np.exp(-t[: len(t) - k] * 30) * 0.6
    return ruido * env * 0.7 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 35) * 0.25


def chimbal(aberto=False):
    t = tempo_s(0.3 if aberto else 0.06)
    ruido = passa_alta(passa_alta(RNG.standard_normal(len(t)), 6000), 6000)
    return ruido * np.exp(-t * (14 if aberto else 70)) * 0.5


def prato():
    t = tempo_s(2.0)
    ruido = passa_alta(RNG.standard_normal(len(t)), 3500)
    return ruido * np.exp(-t * 2.2) * 0.45


def impacto():
    t = tempo_s(2.5)
    sub = np.sin(2 * np.pi * (38 + 40 * np.exp(-t * 6)) * t) * np.exp(-t * 1.6)
    p = prato()
    cauda = np.zeros(len(t))
    cauda[: len(p)] = p
    return np.tanh(sub * 1.4) * 0.9 + cauda


def subida(dur):
    t = tempo_s(dur)
    u = t / dur
    ruido = passa_baixa(RNG.standard_normal(len(t)), 300 + 9000 * u**2)
    varre = np.sin(2 * np.pi * np.cumsum(220 + 1800 * u**2) / SR) * 0.15
    return (ruido * 0.6 + varre) * u**2


def nota_baixo(midi, dur):
    t = tempo_s(dur)
    s = serra(hz(midi), t) * 0.6 + np.sin(2 * np.pi * hz(midi) * t)
    env = np.minimum(1, t / 0.005) * np.exp(-t * 3)
    return passa_baixa(s * env, 420)


def acorde(notas, dur, brilho=1800):
    t = tempo_s(dur)
    s = np.zeros(len(t))
    for m in notas:
        for desafina in (-0.07, 0.07):  # dois osciladores levemente desafinados
            s += serra(hz(m + desafina), t)
    env = np.minimum(1, t / 0.04) * np.minimum(1, (dur - t) / 0.08)
    return passa_baixa(s * env / (2 * len(notas)), brilho)


def nota_arpejo(midi, dur):
    t = tempo_s(dur)
    s = np.sign(np.sin(2 * np.pi * hz(midi) * t)) * 0.5 + np.sin(2 * np.pi * hz(midi + 12) * t) * 0.3
    return passa_baixa(s * np.exp(-t * 14), 3200)


# ------------------------------------------------------------ arranjo ---

def secao_em(folha, t):
    for ini, fim, nome in folha["secoes"]:
        if ini <= t < fim:
            return nome
    return "fim"


def compor(nome):
    folha = FOLHAS[nome]
    dur = folha["duracao"]
    mesa = Mesa(dur + 2.5)
    respiro = np.ones(mesa.n)  # ganho dos acordes, que abaixa a cada bumbo

    # Bateria e baixo, tempo a tempo.
    n_tempos = int(dur / TEMPO)
    for k in range(n_tempos):
        t0 = k * TEMPO
        sec = secao_em(folha, t0)
        if any(c - TEMPO / 2 <= t0 < c for c in folha["silencio_antes"]):
            continue
        acordes, raiz = ACORDES[int(t0 // COMPASSO) % 4]
        if sec in ("construcao", "groove", "groove_leve"):
            mesa.poe(bumbo(), t0, 0.95)
            i = int(t0 * SR)
            j = min(mesa.n, i + int(0.3 * SR))
            respiro[i:j] = np.minimum(respiro[i:j], 1 - 0.55 * np.exp(-np.arange(j - i) / SR * 9))
        if sec in ("groove", "groove_leve") and k % 2 == 1:
            mesa.poe(palma(), t0, 0.55)
        if sec == "construcao":
            # o chimbal acelera com a cascata: colcheia, semicolcheia, fusa
            u = (t0 - 2.5) / 3.5
            div = 2 if u < 0.35 else 4 if u < 0.7 else 8
            for s in range(div):
                mesa.poe(chimbal(), t0 + s * TEMPO / div, 0.35 + 0.3 * u, pan=0.25)
        if sec in ("groove", "groove_leve"):
            mesa.poe(chimbal(), t0, 0.25, pan=0.25)
            mesa.poe(chimbal(aberto=True), t0 + TEMPO / 2, 0.3, pan=-0.2)
            for s in (0, 1):  # baixo em colcheias, oitava acima no contratempo
                mesa.poe(nota_baixo(raiz + 12 * s, TEMPO / 2), t0 + s * TEMPO / 2, 0.55)
        if sec == "groove":
            for s in range(4):  # arpejo em semicolcheias
                m = acordes[(k * 4 + s) % 3] + 12
                mesa.poe(nota_arpejo(m, TEMPO / 4), t0 + s * TEMPO / 4, 0.16, pan=-0.35 if s % 2 else 0.35)

    # Acordes: um por compasso, em todas as seções até o fim.
    acordes_trilha = np.zeros(mesa.n)
    for c in range(int(np.ceil(dur / COMPASSO))):
        t0 = c * COMPASSO
        notas, _ = ACORDES[c % 4]
        sec = secao_em(folha, t0)
        brilho = 900 if sec == "intro" else 2400 if sec == "groove" else 1600
        som = acorde(notas, COMPASSO + 0.05, brilho)
        i = int(t0 * SR)
        som = som[: mesa.n - i]
        acordes_trilha[i : i + len(som)] += som
    acordes_trilha *= respiro
    mesa.e += acordes_trilha * 0.5
    mesa.d += acordes_trilha * 0.5

    # O acorde final soa até o fim, por cima do último compasso.
    notas_fim, raiz_fim = ACORDES[0]
    fim = next(i for i, _, n in folha["secoes"] if n == "fim")
    som = acorde([raiz_fim + 12] + notas_fim, dur - fim + 2.0, 2000)
    som *= np.exp(-np.arange(len(som)) / SR * 0.9)
    mesa.poe(som, fim, 0.7)

    for ini, fim_s in folha["subidas"]:
        mesa.poe(subida(fim_s - ini), ini, 0.55)
    for t0 in folha["impactos"]:
        mesa.poe(impacto(), t0, 0.9)
        mesa.poe(acorde([n + 12 for n in ACORDES[int(t0 // COMPASSO) % 4][0]], 0.6, 4000) * np.exp(-np.arange(int(0.6 * SR)) / SR * 5), t0, 0.6)
    for t0 in folha["acentos"]:
        mesa.poe(bumbo(), t0, 0.9)
        mesa.poe(acorde([n + 12 for n in ACORDES[0][0]], 0.5, 3500) * np.exp(-np.arange(int(0.5 * SR)) / SR * 6), t0, 0.55)
    for t0 in folha["viradas"]:
        mesa.poe(prato(), t0, 0.5)

    # Corta no tamanho do vídeo, com saída suave, e normaliza.
    n = int(dur * SR)
    e, d = mesa.e[:n], mesa.d[:n]
    saida = np.minimum(1, (n - np.arange(n)) / (0.8 * SR))
    e, d = e * saida, d * saida
    # Saturação leve (cola a mistura) e teto de -1 dB.
    e, d = np.tanh(e * 1.3), np.tanh(d * 1.3)
    pico = max(np.abs(e).max(), np.abs(d).max())
    alvo = 10 ** (-1 / 20)
    return e / pico * alvo, d / pico * alvo


def grava(caminho, e, d):
    pcm = np.empty(len(e) * 2, dtype=np.int16)
    pcm[0::2] = np.clip(e * 32767, -32768, 32767).astype(np.int16)
    pcm[1::2] = np.clip(d * 32767, -32768, 32767).astype(np.int16)
    with wave.open(caminho, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    nome, caminho = sys.argv[1], sys.argv[2]
    grava(caminho, *compor(nome))
    print(f"{caminho}: {FOLHAS[nome]['duracao']} s")
