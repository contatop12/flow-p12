# PRD v4 — Plataforma com Brand ID como Nó Plugável

> **Versão 4** — refina o modelo de uso do Brand Context: ao invés de configuração global no canvas, a identidade vira um **nó plugável** (`Brand ID`) conectável aos nós de IA. Introduz nós `Image-Layout` (estrutura/diagramação) e `Text` (copy estruturada). Adiciona ControlNet via Fal.ai para preservação rígida de layout.
>
> Mudanças desde v3: chip global de Brand Context **removido**; novo nó `Brand ID` com toggles internos; novo nó `Image-Layout` com dois modos (inspiração vs estrutura rígida); nó `Text` evoluído com campos opcionais de copy (headline, subhead, CTA); ControlNet via Fal.ai adicionado à stack; tela de Clientes **mantida igual** v3 (cadastro continua igual, só muda o uso).

---

## 1. Visão Geral do Projeto

Plataforma web de geração e edição de imagens com IA inspirada em **Freepik Spaces** (canvas de nós onde tudo é conectável), com diferenciais únicos:

1. **Brand ID como nó plugável** — você cadastra cada cliente uma vez na tela de Clientes (paleta, fonte, tom, refs), e usa essa identidade no canvas como um nó arrastável. Conecta nos Generate/Edit que devem respeitar a identidade. Mesmo workflow pode usar identidades diferentes em nós diferentes.
2. **Image-Layout como nó de estrutura** — você conecta uma imagem como **molde de diagramação**. A IA preserva a estrutura (composição, posições, hierarquia) e substitui o conteúdo conforme o texto e o Brand ID conectados.
3. **Text estruturado** — copy organizada em campos (headline, subhead, CTA, disclaimer) para melhor renderização de texto em imagem.
4. **Edição não-destrutiva por camadas** (Luma UNI-1.1) — cada modificação reversível.
5. **Equipe com roles** (Super Admin / Admin / Member) e compartilhamento controlado.

## 2. O Modelo Mental do Canvas

Toda receita base segue esse padrão visual:

```
┌──────────────┐
│ Text         │  "50% OFF na pizza"
│ + Headline   │  Headline: "Promoção Insana"
│ + CTA        │  CTA: "Peça já"
└──────┬───────┘
       │
       ├───────┐
                ▼
        ┌─────────────┐
        │             │
        │  Generate   │ ───► [Arte final]
        │  ou Edit    │
        │             │
        └─────────────┘
                ▲
       ┌───────┘
┌──────────────┐
│ Image-Layout │  ← Imagem-base com a diagramação
│ Modo: rígido │     que será preservada
└──────────────┘

┌──────────────┐
│ Brand ID     │  ← Cliente "Padaria do Bairro"
│ ☑ Paleta     │  Toggles internos definem o que
│ ☑ Fonte      │  é injetado na geração
│ ☑ Tom        │
│ ☐ Refs       │
└──────┬───────┘
       │
       └──────────► (Generate)
```

**Vantagens desse modelo:**
- Você cria a "receita" uma vez e duplica trocando só o Brand ID e o Text
- No mesmo workflow, dois nós Generate podem usar IDs diferentes (cliente A + cliente B em comparação)
- Tudo visível no canvas — sem configuração lateral escondida (mental model puro Freepik)

## 3. Diferenciais Competitivos Refinados

| Diferencial | O que entrega | Versus concorrentes |
|---|---|---|
| **Brand ID plugável** | Identidade visual reutilizável como nó conectável | Freepik Spaces não tem; Gravyx tem mas é configuração global |
| **Image-Layout rígido** | Preservação real de diagramação via ControlNet | Freepik não permite; modelos puros (Luma/GPT-Image) só fazem "inspiração", não estrutura |
| **Text estruturado** | Headline/Subhead/CTA em campos separados | Concorrentes só têm prompt monolítico |
| Edição não-destrutiva | Camadas reversíveis na timeline | Freepik tem versão simples; ninguém mais tem |
| Roles e compartilhamento | Super Admin compartilha IDs com equipe | Feature pensada para agências |

## 4. Público-Alvo

(igual v3)

Foco em **agências, designers freelancers, times in-house de marketing e criadores com sub-marcas**. O Brand ID plugável é diferencial direto para quem tem 5-50 clientes ativos.

## 5. Tela de Clientes — Continua como v3

A tela `/clients` e o cadastro de identidade (com extração automática de imagem) **permanecem idênticos à v3**. Você cria os clientes lá, uma vez, com toda a identidade (paleta + fonte + tom + referências). Não há mudança no schema D1 nem na UX dessa tela.

O que muda é só **como essa identidade é consumida**: no canvas, ela vira um nó.

(Para detalhes da tela de Clientes, ver `03_Telas_v4.md` seção 4 ou consultar v3.)

## 6. Os Três Novos Nós Centrais

### 6.1. Nó `Brand ID`

**Função:** trazer a identidade visual de um cliente cadastrado para dentro do workflow.

**Painel de propriedades:**

```
🎨 BRAND ID

Cliente: [Padaria do Bairro ▾]
   (lista dropdown com todos clientes acessíveis)

Preview compacto:
   Logo: 🥖
   Paleta: 🟤🟡⚫🤍🔴
   Fonte: Bree Serif
   Tom: "rústico e artesanal..."

────────────────────────────

O que injetar:
☑ Paleta de cores
☑ Tipografia
☑ Tom visual
☐ Referências de estilo (image_refs)

⚠ Refs só funcionam em nós Luma
   (Edit, StyleTransfer, ConsistencyPack)
```

**Saída do nó:** um objeto estruturado `BrandPayload` que carrega tudo selecionado nos toggles.

**Cores das conexões:** roxo/lilás (cor da identidade) para diferenciar visualmente dos outros tipos de dado.

### 6.2. Nó `Image-Layout`

**Função:** servir como referência estrutural/diagramação para a geração, com fidelidade controlável via slider único.

**Painel de propriedades:**

```
📐 IMAGE-LAYOUT

[Drop imagem aqui ou clique para upload]

   [thumbnail do layout]

────────────────────────────

Fidelidade à referência:

   0 ─ 10 ─ 20 ─ 30 ─ 40 ─ 50 ─ 60 ─ 70 ─ 80 ─ 90 ─ 100
                                       ●
                                      70%

ℹ Em 70% a IA usa a imagem como referência
  significativa, mantendo estrutura geral
  com pequenas liberdades criativas.

────────────────────────────

Modo técnico:
◉ Automático (recomendado)
   Sistema escolhe pipeline conforme o slider:
   • 0-50%: modo inspiração (mais barato)
   • 51-100%: ControlNet rígido (preciso)

○ Forçar inspiração
   Sempre usa como ref, mesmo em 100%.

○ Forçar rígido (ControlNet)
   Sempre usa ControlNet, mesmo em 10%.

────────────────────────────

Tipo de estrutura (se modo rígido):
○ Bordas (Canny) - bom para logos, texto
◉ Profundidade (Depth) - bom para fotos
○ Linhas (MLSD) - bom para banners/posters
○ Pose (OpenPose) - bom para pessoas

────────────────────────────

💰 Custo: $0.030 (ControlNet ativo)
⏱ Latência extra: ~3-5s (1ª vez)
```

**Como o slider funciona tecnicamente:**

- Steps fixos de 10 em 10% (0, 10, 20...100)
- Default: **70%** (alto, referência significativa)
- No modo Automático:
  - 0-50% → pipeline inspiração: imagem vira `image_ref` para Luma ou referência para GPT-Image/Nano Banana, com instrução de prompt proporcional ("loose reference" em valores baixos, "strong reference" em valores altos)
  - 51-100% → pipeline ControlNet: o valor mapeia para `conditioning_scale` via fórmula `(slider - 50) / 50`, então 60% = 0.2, 70% = 0.4, 80% = 0.6, 100% = 1.0
- No modo Forçar inspiração: o slider só influencia o prompt (a Luma e modelos puros não têm parâmetro numérico real para isso)
- No modo Forçar rígido: o slider mapeia diretamente para `conditioning_scale = slider / 100`

**Por que steps de 10%:** evita o usuário pensar demais ("66% vs 68%, qual escolher?"). Steps grandes forçam decisões claras: 70% é "alto", 90% é "muito alto", 50% é "metade". Também facilita memorizar valores que funcionaram em workflows anteriores.

**Saída do nó:** objeto `LayoutPayload` com a imagem, o valor do slider, o modo escolhido e o tipo ControlNet.

**Cores das conexões:** azul (referência estrutural).

### 6.3. Nó `Text` (evoluído)

**Função:** copy e prompt estruturados para a geração.

**Painel de propriedades:**

```
💬 TEXT

Prompt/Conceito principal:
┌──────────────────────────────────────┐
│ Banner promocional de pizza         │
│ com 50% de desconto, ambiente       │
│ aconchegante                        │
└──────────────────────────────────────┘

▾ Copy estruturada (opcional)

Headline:
┌──────────────────────────────────────┐
│ Promoção Insana                     │
└──────────────────────────────────────┘

Subhead:
┌──────────────────────────────────────┐
│ Toda pizza pela metade do preço     │
└──────────────────────────────────────┘

CTA:
┌──────────────────────────────────────┐
│ Peça já no WhatsApp                 │
└──────────────────────────────────────┘

Disclaimer (rodapé pequeno):
┌──────────────────────────────────────┐
│ Válido até 15/05                    │
└──────────────────────────────────────┘

▾ Avançado

Usar template do cliente: [Banner promocional ▾]
   (templates salvos no cliente conectado)
```

**Saída do nó:** objeto `TextPayload` com prompt + campos estruturados.

**Cores das conexões:** verde (texto/copy).

### 6.4. Como tudo se combina

Os nós `Brand ID`, `Image-Layout` e `Text` são **inputs plugáveis** dos seguintes nós de IA:

| Nó de IA | Aceita Text? | Aceita Image-Layout? | Aceita Brand ID? |
|---|---|---|---|
| `Generate` | Sim (obrigatório) | Sim (opcional) | Sim (opcional) |
| `Edit` | Sim (obrigatório) | Sim (opcional, modo inspiração apenas) | Sim (opcional) |
| `StyleTransfer` | Não (style vem do Brand) | Sim (opcional) | Sim (obrigatório) |
| `ConsistencyPack` | Sim (opcional) | Não | Sim (obrigatório) |
| `Upscale` | Não | Não | Não |
| `PromptAgent` (LLM) | Sim (entrada) | Não | Sim (contexto) |

**Validação no canvas:** tipos de conexão são coloridos. Tentar conectar Brand ID em Upscale recebe feedback visual de incompatibilidade.

## 7. Decisões de Arquitetura de Provedores

### 7.1. Provedor por tipo de operação (igual v3 + adição de ControlNet)

| Operação | Provedor primário |
|---|---|
| Geração base text-to-image | GPT-Image 2 ou Nano Banana 2 |
| Edição preservativa | Luma UNI-1.1 |
| Style transfer | Luma UNI-1.1 com `style` |
| Consistência multi-cena | Luma UNI-1.1 com `image_ref[]` |
| **Layout rígido (ControlNet)** | **Fal.ai (`fal-ai/controlnet`)** |
| Upscaling | Fal.ai Creative Upscaler |
| Análise de imagem para Brand | Claude 3.7 Sonnet Vision |
| Extração de fonte | WhatFontIs API |
| Agente de prompts | Claude ou GPT |

### 7.2. Fluxo de geração baseado no slider de Image-Layout

A lógica de pipeline depende do valor do slider e do modo técnico escolhido:

**Modo Automático (default):**

- **Slider 0-50%**: pipeline inspiração
  - Imagem vira `image_ref` (Luma) ou referência (GPT-Image/Nano Banana)
  - Prompt adiciona instrução proporcional: 10% = "loose visual inspiration", 30% = "moderate reference", 50% = "strong reference, maintain general structure"
  - Sem ControlNet, sem custo extra
- **Slider 51-100%**: pipeline ControlNet rígido
  - Backend chama Fal.ai ControlNet com tipo escolhido → extrai estrutura
  - Envia para SDXL/Flux com `conditioning_scale = (slider - 50) / 50` (60% → 0.2, 70% → 0.4, 100% → 1.0)
  - Custo extra: ~$0.005 (extração) + diferença de provider
  - Latência extra: 3-5s na primeira vez (cacheada depois por 30 dias)

**Modo Forçar Inspiração:**

- Sempre pipeline inspiração, mesmo em 100%
- Slider controla apenas a intensidade na descrição do prompt
- Bom para quando o usuário quer flexibilidade criativa sem custo de ControlNet

**Modo Forçar Rígido:**

- Sempre ControlNet, mesmo em 10%
- Slider mapeia diretamente para `conditioning_scale = slider / 100`
- Bom para casos onde sempre precisa preservar estrutura (ex: criar várias variações de um banner aprovado)

**Por que o threshold de 50% no modo Automático:** abaixo disso, a inspiração textual entrega resultados similares ao ControlNet em fidelidade baixa, com custo zero. Acima de 50%, ControlNet entrega precisão matemática que inspiração textual não consegue alcançar. O ponto de corte foi calibrado para maximizar custo-benefício do usuário.

### 7.3. Roteamento dinâmico do `image-router`

O `image-router` decide o provedor com base na topologia do grafo + valor do slider:

- `Generate` sem Image-Layout → GPT-Image / Nano Banana / Luma (escolha do usuário)
- `Generate` com Image-Layout em pipeline inspiração (slider 0-50% em Auto, ou Forçar inspiração) → mesmo provedor + ref de imagem
- `Generate` com Image-Layout em pipeline ControlNet (slider 51-100% em Auto, ou Forçar rígido) → **Fal.ai SDXL/Flux + ControlNet** (sobrescreve a escolha de provedor do usuário, com aviso claro na UI)
- `Edit` com Image-Layout → Luma `image_edit` usando como source (ControlNet não é suportado em edit)

A UI avisa claramente quando o pipeline força um provedor específico, incluindo motivo e estimativa de custo atualizada em tempo real conforme o usuário move o slider.

## 8. Conceito Central: Camadas (igual v3)

Mantida sem alterações. Cada operação de IA gera uma camada na timeline da imagem resultante.

## 9. Stack Tecnológica (adições à v3)

| Adição | Para que |
|---|---|
| Fal.ai ControlNet endpoints | Image-Layout em modo rígido |
| Pipeline SDXL/Flux via Fal | Geração condicionada por ControlNet |
| Validador de tipos de conexão no React Flow | Impedir conexões inválidas (Brand → Upscale, etc.) |

## 10. APIs de IA Integradas (atualizada)

| API | Função |
|---|---|
| Luma UNI-1.1 | Edição preservativa, consistência multi-ref |
| GPT-Image 2 | Geração premium fotorrealista |
| Gemini Nano Banana 2 | Geração rápida com texto bem renderizado |
| **Fal.ai ControlNet** (novo destaque) | Image-Layout rígido |
| **Fal.ai SDXL / Flux** | Geração condicionada por ControlNet |
| Fal.ai Creative Upscaler | Upscaling |
| Claude Vision | Análise de imagem para Brand |
| WhatFontIs | Extração de fonte |

## 11. Telas do Sistema (resumo)

1. Login/Cadastro
2. Dashboard
3. **Clientes** (igual v3) — cadastro com extração automática
4. **Detalhe do Cliente** (igual v3) — editor de identidade
5. **Canvas de Workflow** (atualizado) — sem chip global; novos nós Brand ID, Image-Layout, Text estruturado
6. Painel de Camadas (igual v2/v3)
7. Composer Mode (fase 2, igual v2/v3)
8. Galeria (igual v3 — filtros por cliente continuam)
9. Configurações (igual v3 — Equipe, Chaves, etc.)

## 12. Tipos de Nós no Canvas (lista final para MVP)

**Inputs/Dados:**
- `Text` (evoluído com campos estruturados)
- `ImageInput` (upload livre)
- `Brand ID` (cliente cadastrado) — NOVO
- `Image-Layout` (referência de diagramação) — NOVO

**Geração/Edição (IA):**
- `Generate` (text-to-image; aceita Text + Image-Layout + Brand ID)
- `Edit` (edição Luma; aceita Text + Image-Layout + Brand ID)
- `StyleTransfer` (Luma `style`; aceita Image-Layout + Brand ID)
- `ConsistencyPack` (Luma `image_ref[]`; aceita Brand ID + Text)
- `Upscale` (Fal.ai; aceita só imagem)
- `PromptAgent` (LLM; aceita Text + Brand ID como contexto)

**Output:**
- `Output` (exibe e salva)

**Roadmap fase 8+:**
- `Composer` (Composer Mode)
- `LogoGenerator` (usa refs `logo-reference` do Brand)
- `MoodBoardComposer`

## 13. Roadmap de Implementação Atualizado

### Fase 1 — Infra e Frontend Base (semanas 1-3)
(igual v3)

### Fase 2 — Auth Multi-tenant e Persistência (semanas 4-6)
(igual v3)

### Fase 3 — Provedores e Nós Básicos (semanas 7-10)
1. Worker `image-router` com roteamento
2. Cloudflare Queues
3. **Nó `Text` evoluído** (com campos estruturados)
4. Nó `ImageInput`
5. Nó `Generate` (GPT-Image + Nano Banana via Fal)
6. Nó `Output`
7. Tela de Configurações
8. Galeria básica
9. **Validador de tipos de conexão React Flow**

### Fase 4 — Tela de Clientes/Brand Core (semanas 11-13)
(igual v3 fase 4)

### Fase 5 — Brand ID Node e Luma (semanas 14-17)
1. **Nó `Brand ID` plugável** com toggles internos
2. Integração Luma UNI-1.1
3. Nós `Edit`, `StyleTransfer`, `ConsistencyPack`
4. Worker `brand-context-injector` adaptado para receber payload do nó (não mais do chip global)
5. Painel de Camadas
6. Nó `Upscale`

### Fase 6 — Image-Layout e ControlNet (semanas 18-20) — NOVA
1. **Nó `Image-Layout`** com upload e seletor de modo
2. Integração Fal.ai ControlNet (4 tipos: canny, depth, mlsd, openpose)
3. Pipeline SDXL/Flux + ControlNet via Fal.ai
4. Validação de roteamento: Generate com Layout rígido → força Fal.ai
5. UI: indicador no nó Generate quando o provedor for sobrescrito pelo Layout
6. Estimativa de custo dinâmica no nó (mostra custo extra do ControlNet)

### Fase 7 — Compartilhamento e Equipe (semanas 21-22)
(igual v3 fase 6)

### Fase 8 — Polimento, LLM Agent e Beta (semanas 23-25)
(igual v3 fase 7)

### Fase 9+ — Composer Mode (mês 7-9, pós-lançamento)
(igual v3 fase 8)

### Fase 10+ — Brand-aware Avançado (mês 10+)
(igual v3 fase 9)

**Total revisado: MVP em 25 semanas.** O acréscimo de 3 semanas vs v3 é exatamente a fase 6 — Image-Layout e ControlNet. Justifica porque preservação rígida de layout é o que torna o produto realmente útil para agências (mesma diagramação reutilizada para múltiplos clientes).

## 14. Casos de Uso Concretos

### 14.1. Agência criando banners para 10 clientes diferentes

Designer cria um workflow "Banner Promoção" com:
- `Image-Layout` (modo rígido, depth): screenshot do banner base já aprovado
- `Text` (com Headline + CTA configurados)
- `Brand ID` (cliente A) → `Generate` → `Output`

Depois duplica o workflow 10 vezes, em cada um troca só o Brand ID. Resultado: 10 banners com **diagramação idêntica** mas identidade visual do cliente correspondente. Trabalho de 30 minutos para o que levaria uma semana manualmente.

### 14.2. Criador de conteúdo com múltiplas sub-marcas

Tem 3 sub-marcas (canal principal, secundário, podcast). Cria os 3 Brand IDs uma vez. Para cada post novo, conecta um único Image-Layout (formato Instagram quadrado) e troca o Brand ID + Text. Mantém consistência visual de cada marca sem trabalho manual.

### 14.3. Time de marketing fazendo A/B test de campanha

No mesmo canvas, dois nós Generate:
- Versão A: mesmo Text + mesmo Image-Layout + Brand ID "Marca tradicional"
- Versão B: mesmo Text + mesmo Image-Layout + Brand ID "Marca rebrand 2026"

Compara visualmente os dois resultados lado a lado para decidir qual direção tomar.

## 15. Considerações Finais

- **Tipo de conexão como cores**: investimos em código de cor no React Flow (verde=texto, roxo=brand, azul=layout, cinza=imagem genérica) para reduzir erros de conexão.
- **Discovery do produto**: o tour guiado da primeira sessão constrói um workflow completo (Text + Image-Layout + Brand ID + Generate) para o usuário entender o modelo desde o primeiro uso.
- **Custos com ControlNet**: cada geração rígida custa ~$0.02 a mais. Para usuário Pro com 100 imagens/mês, se 30% usam ControlNet → +$0.60/mês. Embutido no plano.
- **Cache de ControlNet**: se a mesma imagem-layout for usada várias vezes, o resultado da extração (canny/depth) é cacheada no KV por 30 dias. Economiza custo em workflows duplicados (uso típico de agência).

---

> Próximos artefatos: `02_Arquitetura_v4.md` (foco nas mudanças de roteamento e ControlNet) e `03_Telas_v4.md` (novos nós no canvas).
