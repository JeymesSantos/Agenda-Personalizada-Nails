# Design tokens — extraídos do Figma

Fonte: página "01 · Identidade Visual", frame "Brand Board · Leticia Fagundes"
([arquivo](https://www.figma.com/design/iTZZOI3KZwIkgRNLdkFLlh/MinhaAgenda-%E2%80%94-Fluxo-de-P%C3%A1ginas---Identidade-Visual--c%C3%B3pia-), nó `4:42`).
Extraído pela API REST do Figma em 2026-10-31. O tema é **escuro apenas**.

## Cores

| Token               | Hex       | Uso                           |
| ------------------- | --------- | ----------------------------- |
| `brand/magenta-700` | `#9C0D65` | Pressionado, gradiente        |
| `brand/magenta-500` | `#E51C98` | Ações primárias, destaques    |
| `brand/magenta-400` | `#F0479F` | Hover, gráficos               |
| `brand/pink-300`    | `#F5A7D7` | Labels, ícones ativos, preços |
| `brand/pink-100`    | `#FCE4F2` | Texto sobre magenta           |
| `bg/base`           | `#0E0A0C` | Fundo da aplicação            |
| `bg/surface`        | `#171114` | Cards                         |
| `bg/surface-2`      | `#211820` | Inputs, listas                |
| `bg/elevated`       | `#2A1F27` | Modais, menus                 |
| `border/subtle`     | `#33252E` | Divisores                     |
| `border/strong`     | `#4A3843` | Bordas de input               |
| `text/primary`      | `#F8EFF4` | Títulos e texto               |
| `text/secondary`    | `#BBA7B2` | Texto de apoio                |
| `text/muted`        | `#7F6C77` | Placeholders                  |
| `feedback/success`  | `#3DD598` | Confirmado, receita           |
| `feedback/warning`  | `#F5B544` | Pendente                      |
| `feedback/error`    | `#FF5C7A` | Cancelado, despesa            |
| `feedback/info`     | `#8C9BFF` | Informativo                   |

Gradientes vistos nas telas:

- Botão primário: horizontal `#F0479F → #E51C98` com glow (sombra magenta difusa).
- Fundo de hero/cabeçalho: radial magenta escuro (`#9C0D65` a ~30%) sobre `bg/base`, saindo do canto superior.
- Cards de foto placeholder: gradientes entre `#9C0D65`, `#E51C98`, `#F5A7D7` e `bg/surface`.

## Tipografia

Famílias: **Montserrat** (Light 300, Regular 400) para marca e títulos display; **DM Sans** (400, 500, 600, 700) para interface.

| Estilo        | Fonte                          | Tamanho / altura | Tracking | Exemplo                                     |
| ------------- | ------------------------------ | ---------------- | -------- | ------------------------------------------- |
| Display/XL    | Montserrat Light               | 56 / 64          | 6%       | LETÍCIA FAGUNDES (hero desktop)             |
| Display/L     | Montserrat Light               | 34 / 41          | 4%       | PORTFÓLIO, MEUS HORÁRIOS, ESCOLHA O SERVIÇO |
| Display/Label | Montserrat Regular, caixa alta | 12 / 17          | 30%      | PASSO 1 DE 3, TRABALHOS RECENTES            |
| Heading/H1    | DM Sans Bold                   | 28 / 34          | -2%      | Agende seu horário                          |
| Heading/H2    | DM Sans SemiBold               | 22 / 28          | -1%      | Escolha seu serviço                         |
| Heading/H3    | DM Sans SemiBold               | 17 / 22          | 0        | Alongamento em gel                          |
| KPI           | DM Sans Bold                   | 32 / 35          | -2%      | R$ 4.820                                    |
| Body/L        | DM Sans Regular                | 16 / 24          | 0        | parágrafos                                  |
| Body/M        | DM Sans Regular                | 14 / 21          | 0        | texto padrão                                |
| Body/M Medium | DM Sans Medium                 | 14 / 21          | 0        | rótulos de item                             |
| Caption       | DM Sans Medium, caixa alta     | 11 / 15          | 8%       | Hoje · 14:30, rótulos de campo              |
| Button        | DM Sans SemiBold               | 15 / 15          | 1%       | Confirmar agendamento                       |

## Raios e formas

| Raio | Uso                                              |
| ---- | ------------------------------------------------ |
| 999  | Botões primários, chips/filtros, badges, toggles |
| 24   | Sheets inferiores, cards de hero                 |
| 14   | Cards de conteúdo, inputs grandes                |
| 12   | Cards pequenos, itens de lista, slots de horário |
| 5    | Barras de progresso, tags                        |

Ícones: traço 1,5 px, estilo linear fino (lucide-react atende). Conjunto citado: calendar, clock, home, image, user, users, chart, wallet, sparkles.

## Componentes recorrentes nas telas

- **Bottom nav cliente** (4 itens): Início, Portfólio, Agendar, Meus horários; ativo em `pink-300` com ponto abaixo.
- **Bottom nav admin** (5 itens): Início, Agenda, Serviços, Financeiro, Mais.
- **Sidebar admin** (desktop): logo + "Painel da profissional", itens Dashboard, Agenda, Serviços, Portfólio, Despesas, Clientes, Bio & links; rodapé "Ver minha página pública" e "Sair". Item ativo com fundo magenta sólido.
- **Chips de filtro**: contorno `border/strong`, ativo contorno + texto magenta.
- **Slot de horário**: pill 12px; disponível `surface-2`, selecionado gradiente magenta, indisponível tracejado com cadeado.
- **Calendário mensal**: dia com ponto verde (com horários), ponto cinza (lotado), riscado (fechado); dia selecionado círculo magenta.
- **Badges de status**: CONFIRMADO (verde), PENDENTE (âmbar), CANCELADO (vermelho), caixa alta 11px.
- **KPI card**: ícone em quadrado magenta 12px, rótulo, valor 32px, variação verde.
- **Cartão de resumo**: lista rótulo/valor com ícones, valor monetário em `pink-300`.
- **Avisos**: caixa `info` com fundo `#8C9BFF` a 12% e ícone sino/relógio.
- **Segmented control**: Dia / Semana / Mês / Ano e Próximos / Anteriores, pill com item ativo em `surface-2`.
- **Comprovante**: código `#LF-2481` (prefixo das iniciais do estúdio + sequencial).
