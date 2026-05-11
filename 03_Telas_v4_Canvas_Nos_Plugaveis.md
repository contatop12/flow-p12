# Telas v4 — Mudanças no Canvas (Brand ID Plugável)

> **Versão 4** — documento incremental focado no Canvas. A tela de **Clientes** e o cadastro de identidade visual (`/clients` e `/clients/:id`) **permanecem idênticos à v3** — não há motivo para reabrir, está bem desenhada. Idem para Dashboard, Galeria, Configurações e Equipe.
>
> Foco: novos nós (`Brand ID`, `Image-Layout`, `Text` evoluído), validação de tipos de conexão por cor, remoção do chip global do canvas.

---

## 1. O que muda

| Tela | Status v4 |
|---|---|
| Login/Cadastro | Igual v3 |
| Dashboard | Igual v3 |
| Clientes (lista) | **Igual v3** |
| Detalhe do Cliente | **Igual v3** |
| **Canvas** | **REFORMULADO** — sem chip global, novos nós plugáveis |
| Painel de Camadas | Igual v3 |
| Composer Mode | Igual v3 (fase 2) |
| Galeria | Igual v3 |
| Configurações | Igual v3 |
| Equipe | Igual v3 |

## 2. Canvas — Layout Atualizado

```
┌────────────────────────────────────────────────────────────────────┐
│  [Logo] Dashboard | Projetos | Clientes | Galeria | Config  [@▾]  │
├──────────┬───────────────────────────────────────┬─────────────────┤
│          │                                       │                 │
│ Paleta   │                                       │ Painel de       │
│ de Nós   │            CANVAS REACT FLOW          │ Propriedades    │
│          │                                       │ ou Painel de    │
│ ▾ Dados  │     ┌────────┐                        │ Camadas         │
│   Text   │     │ Text   │═══════╗                │                 │
│   Image  │     └────────┘       ║                │                 │
│   BrandID│                       ▼                │                 │
│   Layout │              ┌──────────────┐         │                 │
│          │              │  Generate    │ ───►Out │                 │
│ ▾ Geração│              │              │         │                 │
│   Generate│             └──────────────┘         │                 │
│   Edit   │                  ▲       ▲             │                 │
│   Style  │     ┌────────┐──╝       ╚─┌─────────┐ │                 │
│   Consist│     │ Layout │              │BrandID  │ │                 │
│          │     └────────┘              └─────────┘│                 │
│ ▾ Aprim. │                                       │                 │
│   Upscale│                                       │                 │
│          │                                       │                 │
│ ▾ Agente │                                       │                 │
│   Prompt │                                       │                 │
│          │                                       │                 │
│ ▾ Output │                                       │                 │
│   Output │                                       │                 │
│          │                                       │                 │
├──────────┴───────────────────────────────────────┴─────────────────┤
│ [▶ Executar] [💾 Salvar] [📂 Carregar] [📤 Exportar]    [🔍 -100%+]│
└────────────────────────────────────────────────────────────────────┘
```

**Notar:**
- **Não há mais chip global** de Brand Context no topo (estava na v3)
- A paleta lateral tem nova categoria "Dados" com os 4 inputs: Text, Image, **BrandID**, **Layout**
- Edges no canvas têm cores diferentes (verde, roxo, azul, cinza) — explicado adiante

## 3. Paleta de Nós (lateral esquerda)

```
▾ Dados
   💬 Text              ← copy estruturada
   🖼 Image             ← upload livre
   🎨 Brand ID          ← identidade de cliente
   📐 Image-Layout      ← referência de diagramação

▾ Geração
   ✨ Generate          ← text-to-image
   📝 Edit              ← edição preservativa
   🎭 StyleTransfer     ← aplicar estilo
   🔗 ConsistencyPack   ← múltiplas refs

▾ Aprimoramento
   ⬆ Upscale            ← Fal.ai upscaler

▾ Agente
   🤖 PromptAgent       ← LLM refina prompt

▾ Output
   📤 Output            ← exibe e salva
```

Cada categoria pode ser arrastada/recolhida. Hover em cada nó mostra tooltip com descrição rápida.

## 4. Nó `Text` — Painel de Propriedades

```
┌─────────────────────────────────────────┐
│ 💬 TEXT                                 │
├─────────────────────────────────────────┤
│                                         │
│ Prompt/Conceito principal               │
│ ┌─────────────────────────────────────┐ │
│ │ Banner promocional de pizza com     │ │
│ │ 50% de desconto, ambiente           │ │
│ │ aconchegante e família feliz        │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ▾ Copy estruturada (opcional)           │
│                                         │
│   Headline                              │
│   ┌─────────────────────────────────┐   │
│   │ Promoção Insana                 │   │
│   └─────────────────────────────────┘   │
│                                         │
│   Subhead                               │
│   ┌─────────────────────────────────┐   │
│   │ Toda pizza pela metade do preço │   │
│   └─────────────────────────────────┘   │
│                                         │
│   CTA                                   │
│   ┌─────────────────────────────────┐   │
│   │ Peça já no WhatsApp             │   │
│   └─────────────────────────────────┘   │
│                                         │
│   Disclaimer (rodapé pequeno)           │
│   ┌─────────────────────────────────┐   │
│   │ Válido até 15/05                │   │
│   └─────────────────────────────────┘   │
│                                         │
│ ▾ Avançado                              │
│                                         │
│   Usar template salvo:                  │
│   [Banner promocional ▾]                │
│   (templates do cliente conectado)      │
│                                         │
│   Idioma da copy: [Português BR ▾]      │
│                                         │
├─────────────────────────────────────────┤
│ Saída: tipo TEXT (verde)                │
└─────────────────────────────────────────┘
```

**Aparência no canvas (compacto):**

```
┌──────────────────────┐
│ 💬 Text              │
│                      │
│ "Banner promocional  │
│  de pizza..."        │
│                      │
│ + Headline ✓         │
│ + CTA ✓              │
│                      │
│              [out]●──│  (handle verde)
└──────────────────────┘
```

## 5. Nó `Brand ID` — Painel de Propriedades

```
┌─────────────────────────────────────────┐
│ 🎨 BRAND ID                             │
├─────────────────────────────────────────┤
│                                         │
│ Cliente                                 │
│ ┌─────────────────────────────────────┐ │
│ │ Padaria do Bairro                ▾  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [📋 Ver detalhes do cliente]            │
│                                         │
│ ─── Preview ─────                       │
│                                         │
│   Logo: 🥖                              │
│   Paleta: 🟤🟡⚫🤍🔴                    │
│   Fonte primária: Bree Serif            │
│   Fonte secundária: Inter               │
│   Tom: "rústico e artesanal, paleta     │
│         quente terrosa..."              │
│   Refs art-style: 4 imagens             │
│                                         │
│ ─── O que injetar na geração ───        │
│                                         │
│ ☑ Paleta de cores                       │
│   Cores aparecem como descrição no      │
│   prompt da IA.                         │
│                                         │
│ ☑ Tipografia                            │
│   Estilo de fonte descrito no prompt.   │
│                                         │
│ ☑ Tom visual                            │
│   Tom da marca adicionado ao prompt.    │
│                                         │
│ ☐ Referências de estilo (image_refs)    │
│   ⚠ Só funciona em nós Luma             │
│   (Edit, StyleTransfer, ConsistencyPack)│
│   Adiciona até 9 refs como condicion.   │
│                                         │
│ ─── Forçar paleta no pós ───            │
│                                         │
│ ☐ Aplicar color grading                 │
│   Após geração, força paleta via LUT.   │
│   Pode estragar imagens em que paleta   │
│   não faz sentido.                      │
│                                         │
├─────────────────────────────────────────┤
│ Saída: tipo BRAND (roxo)                │
└─────────────────────────────────────────┘
```

**Aparência no canvas (compacto):**

```
┌──────────────────────┐
│ 🎨 Brand ID          │
│                      │
│ Padaria do Bairro    │
│                      │
│ 🟤🟡⚫🤍🔴            │
│ Bree Serif           │
│                      │
│ ☑P ☑T ☑V ☐R          │
│                      │
│              [out]●──│  (handle roxo)
└──────────────────────┘
```

Toggles abreviados visíveis: P=Paleta, T=Tipografia, V=Tom Visual, R=Refs.

## 6. Nó `Image-Layout` — Painel de Propriedades

```
┌─────────────────────────────────────────┐
│ 📐 IMAGE-LAYOUT                         │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │    [arraste imagem ou clique]       │ │
│ │                                     │ │
│ │   ou conecte um nó Image            │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ (após upload mostra thumbnail)          │
│                                         │
│ ─── Fidelidade à referência ───         │
│                                         │
│   0 ─10─20─30─40─50─60─70─80─90─100     │
│                       ●                 │
│                      70%                │
│                                         │
│ ℹ Em 70%: a IA mantém estrutura geral   │
│   com pequenas liberdades criativas.    │
│   Pipeline: ControlNet (rígido).        │
│                                         │
│ ─── Modo técnico ───                    │
│                                         │
│ ◉ Automático (recomendado)              │
│   0-50%: inspiração (mais barato)       │
│   51-100%: ControlNet (preciso)         │
│                                         │
│ ○ Forçar inspiração                     │
│   Sempre usa como ref, mesmo em 100%.   │
│                                         │
│ ○ Forçar rígido (ControlNet)            │
│   Sempre ControlNet, mesmo em 10%.      │
│                                         │
│ ─── Tipo de estrutura (se rígido) ───   │
│                                         │
│ ○ Bordas (Canny)                        │
│   Logos, elementos com contornos.       │
│                                         │
│ ◉ Profundidade (Depth)                  │
│   Fotos, cenas com sensação 3D.         │
│                                         │
│ ○ Linhas (MLSD)                         │
│   Banners, posters, grid arquitetural.  │
│                                         │
│ ○ Pose (OpenPose)                       │
│   Pessoas e personagens.                │
│                                         │
│ ─── Pipeline ativo ───                  │
│                                         │
│ ⚠ ControlNet ativo (slider acima 50%)   │
│   Provider Generate será sobrescrito    │
│   para Fal.ai SDXL+ControlNet.          │
│                                         │
│ 💰 Custo extra: $0.030                  │
│ ⏱ Latência extra: 3-5s (1ª vez)         │
│                                         │
├─────────────────────────────────────────┤
│ Entrada: tipo IMAGE (cinza)             │
│ Saída: tipo LAYOUT (azul)               │
└─────────────────────────────────────────┘
```

**Comportamento do slider:**

- Steps fixos de 10 em 10% (clique-arraste ou setinhas do teclado)
- Valor default: **70%**
- Informação contextual abaixo do slider muda em tempo real conforme o usuário move:
  - 0-20%: "Influência mínima. A IA usa apenas como inspiração distante."
  - 30-50%: "Influência moderada. Pipeline: inspiração. Sem custo extra."
  - 60-80%: "Influência significativa. Pipeline: ControlNet. Estrutura preservada."
  - 90-100%: "Cópia estrutural quase exata. Pipeline: ControlNet máximo."
- Indicador de pipeline ativo (inspiração vs ControlNet) atualiza imediatamente
- Bloco de custo/latência aparece/desaparece conforme cruza o threshold de 50%

**Aparência no canvas (compacto):**

```
┌──────────────────────┐
│ 📐 Image-Layout      │
│                      │
│  ┌────────────┐      │
│  │ [thumbnail]│      │
│  └────────────┘      │
│                      │
│ Fid: 70% · Depth     │
│ ⚙ ControlNet ativo   │
│                      │
│  [img]●────[out]●──  │  (handle cinza in, azul out)
└──────────────────────┘
```

## 7. Nó `Generate` — Atualizado

```
┌─────────────────────────────────────────┐
│ ✨ GENERATE                             │
├─────────────────────────────────────────┤
│                                         │
│ Entradas conectadas:                    │
│   ✓ Text: "Banner promocional..."       │
│   ✓ Brand ID: Padaria do Bairro         │
│   ✓ Layout: rígido (depth, 60%)         │
│                                         │
│ ─── Provider ───                        │
│                                         │
│ ⚠ Pipeline ajustado automaticamente:    │
│ ┌─────────────────────────────────────┐ │
│ │ Layout rígido detectado.            │ │
│ │ Forçando: Fal.ai SDXL+ControlNet    │ │
│ │ (provider escolhido seria GPT-Image)│ │
│ │ [Trocar para Layout inspiração]     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Provider escolhido: [GPT-Image 2 ▾]     │
│ (será sobrescrito pelo layout rígido)   │
│                                         │
│ ─── Parâmetros ───                      │
│                                         │
│ Aspect ratio: [16:9 ▾]                  │
│ Quality: [High ▾]                       │
│                                         │
│ ─── Estimativa ───                      │
│                                         │
│ 💰 Custo: $0.035                        │
│ ⏱ Latência estimada: 18-25s             │
│                                         │
│ ─── Prompt final (preview) ───          │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Banner promocional de pizza com 50% │ │
│ │ de desconto, ambiente aconchegante. │ │
│ │                                     │ │
│ │ Include the following text:         │ │
│ │ - Headline: "Promoção Insana"       │ │
│ │ - CTA: "Peça já no WhatsApp"        │ │
│ │                                     │ │
│ │ Color palette: #8B4513 (marrom),    │ │
│ │ #F4D03F (amarelo)...                │ │
│ │                                     │ │
│ │ Brand tone: rústico, artesanal...   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [▶ Executar este nó]                    │
│                                         │
├─────────────────────────────────────────┤
│ Entradas: Text (verde) + Brand (roxo) + │
│           Layout (azul)                 │
│ Saída: Image (cinza)                    │
└─────────────────────────────────────────┘
```

**Importante:** o usuário sempre vê o prompt final que vai ser enviado. Transparência total.

**Aparência no canvas (compacto):**

```
              ●  ●  ●
              │  │  │   (text, brand, layout entrando)
              ▼  ▼  ▼
        ┌──────────────┐
        │ ✨ Generate  │
        │              │
        │ [thumbnail]  │
        │              │
        │ SDXL+CN      │
        │ ($0.035)     │
        │              │
        │       [out]●─│   (image saindo)
        └──────────────┘
```

## 8. Conexões — Cores e Validação

Edges no React Flow têm cor baseada no tipo:

| Tipo | Cor | Conecta de... para... |
|---|---|---|
| `text` | Verde claro (`#84cc16`) | Text → Generate, Edit, ConsistencyPack, PromptAgent |
| `image` | Cinza (`#9ca3af`) | Image, Output de IA → Edit, Style, Upscale, Output, ImageLayout |
| `brand` | Roxo (`#a855f7`) | BrandID → Generate, Edit, Style, Consistency, PromptAgent |
| `layout` | Azul (`#3b82f6`) | ImageLayout → Generate, Edit, Style |

**Validação visual:**
- Handles de input/output têm a cor do tipo aceito
- Tentar conectar verde em roxo → linha tracejada vermelha pulsante + mensagem "Tipos incompatíveis: Text não pode conectar em Brand"
- Hover em handle mostra tooltip com tipos aceitos

## 9. Receitas Pré-prontas no Canvas

Botão "Receita" na action bar abre menu com workflows pré-construídos:

```
┌─────────────────────────────────────────┐
│ RECEITAS                                │
├─────────────────────────────────────────┤
│                                         │
│ 🍕 Banner promocional                   │
│ Text + Image-Layout + BrandID →         │
│ Generate → Output                       │
│ [Inserir no canvas]                     │
│                                         │
│ 👤 Avatar consistente                   │
│ Text + BrandID → ConsistencyPack →      │
│ Output (×4 variações)                   │
│ [Inserir no canvas]                     │
│                                         │
│ 📸 Foto de produto                      │
│ Image + Text + BrandID → Edit           │
│ (trocar fundo) → Upscale → Output       │
│ [Inserir no canvas]                     │
│                                         │
│ 🎨 Pacote de identidade visual          │
│ BrandID → Generate ×5 (variações)       │
│ → Output                                │
│ [Inserir no canvas]                     │
│                                         │
└─────────────────────────────────────────┘
```

Cada receita coloca os nós já conectados, faltando só o usuário escolher o Brand ID e ajustar o Text/Layout.

## 10. Action Bar Atualizada

```
┌────────────────────────────────────────────────────────────────────┐
│ [▶ Executar] [💾 Salvar] [📂 Carregar] [🎨 Receitas] [📤 Exportar]  │
│                                              [🔍 -100%+] [Layout ▾]│
└────────────────────────────────────────────────────────────────────┘
```

Novo botão "Receitas". Novo dropdown "Layout" para auto-organizar nós no canvas (tipo "horizontal flow", "compact", "grid").

## 11. Indicador de Status no Nó

Cada nó de IA mostra status durante execução:

```
┌──────────────────────┐
│ ✨ Generate          │
│ ⏳ Extraindo layout..│  ← step 1 (structure-extractor)
│ ░░░░░░░░░░ 20%       │
│                      │
└──────────────────────┘

[3s depois]

┌──────────────────────┐
│ ✨ Generate          │
│ ⏳ Gerando imagem... │  ← step 2 (SDXL+ControlNet)
│ █████░░░░░ 50%       │
│ ⏱ ~15s restantes     │
│                      │
└──────────────────────┘

[20s depois]

┌──────────────────────┐
│ ✨ Generate    [✓]   │
│                      │
│  [thumbnail final]   │
│                      │
│ $0.035 · 23s         │
└──────────────────────┘
```

## 12. Acessibilidade Adicional para Conexões

- Cada handle tem `aria-label` descrevendo o tipo aceito
- Validação de conexão anuncia via screen reader: "Conexão inválida: Text não pode conectar em Brand"
- Atalho `Tab` navega entre nós; `Shift+Tab` entre handles do nó selecionado
- Atalho `Enter` em um handle inicia modo de conexão; setas direcionais navegam para outros handles compatíveis (destacados em verde)

## 13. Migração de Workflows v3 → v4

Quando o usuário abre um workflow criado na v3 (com chip global de Brand Context):

```
┌─────────────────────────────────────────────────┐
│  Workflow criado na versão anterior        [✕]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Este workflow usa o modelo antigo de           │
│  Brand Context (chip global). Na nova           │
│  versão, a identidade vira um nó plugável.     │
│                                                 │
│  Podemos migrar automaticamente:                │
│  - Adicionar um nó BrandID conectado a cada    │
│    nó de IA com a mesma identidade.             │
│  - Manter exatamente os toggles que você tinha. │
│                                                 │
│  ◉ Migrar automaticamente (recomendado)         │
│  ○ Abrir no modo legado (sem migração)          │
│                                                 │
│  [Cancelar]                       [Migrar]      │
└─────────────────────────────────────────────────┘
```

Após migração, mostra um banner por 30s: "Workflow migrado. Você pode ajustar os nós BrandID individualmente agora."

---

## 14. Resumo Visual: v3 vs v4

| Aspecto | v3 | v4 |
|---|---|---|
| Onde fica o Brand Context | Chip global no topo do canvas | Nó plugável (BrandID) por nó de IA |
| Pode usar IDs diferentes no mesmo workflow | Não | Sim |
| Image-Layout | Não existia | Novo nó com modo rígido (ControlNet) ou inspiração |
| Text | Campo único | Estruturado: prompt + headline + subhead + CTA + disclaimer |
| Cores das edges | Genérica | 4 tipos: verde, roxo, azul, cinza |
| Validação de conexão | Sem | Por tipo, com feedback visual |
| Cadastro de cliente | Tela `/clients` (igual) | **Igual** — não muda |

A reformulação é do **uso**, não do dado. Você cadastra o cliente uma vez e depois usa onde quiser, quantas vezes quiser, no canvas. Mesmo workflow, vários clientes, mesma diagramação.
