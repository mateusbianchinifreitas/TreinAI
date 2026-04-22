# TreinAI 🏋️

**Smart Workout Tracker** com IA, dark mode e rastreamento por perfil.

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- npm v9 ou superior

## Como rodar

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em modo desenvolvimento
npm run dev

# 3. Acessar no navegador
# http://localhost:5173
```

## Deploy no Vercel

```bash
# Opção 1 — via CLI
npm install -g vercel
vercel

# Opção 2 — Import pelo site
# 1. Suba o projeto para um repositório GitHub
# 2. Acesse https://vercel.com/new
# 3. Importe o repositório
# 4. Clique em Deploy (sem precisar configurar nada)
```

## Build para produção

```bash
npm run build
# Arquivos gerados em ./dist/
```

## Estrutura do projeto

```
treainai/
├── public/
│   └── logo.png              # Logo do app
├── src/
│   ├── components/
│   │   ├── Avatar.jsx        # Avatar SVG dos perfis
│   │   ├── Charts.jsx        # Sparkline + LineChart
│   │   ├── Figure.jsx        # Figura muscular interativa
│   │   ├── Icons.jsx         # Ícones SVG inline
│   │   ├── LogoMark.jsx      # Logo do header
│   │   └── Timer.jsx         # Timer de descanso
│   ├── data/
│   │   └── constants.js      # Tokens, músculos, exercícios, seed
│   ├── App.jsx               # App principal + todas as telas
│   └── main.jsx              # Entry point React
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Funcionalidades

- 🏠 **Home** — streak real, volume semanal, análise IA automática, histórico de treinos
- 🏋️ **Treino** — treino rápido por músculo, treino livre, treinos salvos editáveis
- 📈 **Evolução** — gráficos por músculo, variação de carga, análise IA
- 🏆 **Ranking** — PRs por grupo muscular, comparativo entre atletas
- 👤 **Perfil** — múltiplos perfis, evolução do peso corporal por data
- 🔴 Dados separados por perfil — cada atleta tem seu histórico próprio
