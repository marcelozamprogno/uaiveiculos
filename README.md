# Uai Veículos - Site de Repasse

Site moderno, responsivo e de alta conversão para catálogo de carros de repasse, pronto para publicação no **GitHub** e hospedagem na **Vercel**.

## 🚀 Estrutura do Projeto

```
UAI VEICULOS/
├── index.html        # Estrutura da landing page e modais
├── css/
│   └── styles.css    # Estilização em Dark Mode, responsividade e animações
├── js/
│   ├── data.js       # Catálogo de veículos de repasse e preços FIPE
│   └── app.js        # Filtros, buscas, API de mapa/localização e pop-ups
└── vercel.json       # Configuração para deploy na Vercel
```

## 🛠️ Como subir para o GitHub

1. Inicialize o repositório git no seu terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Uai Veiculos Repasse"
   ```

2. Crie um repositório no seu GitHub e vincule:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/uai-veiculos.git
   git branch -M main
   git push -u origin main
   ```

## ⚡ Como hospedar na Vercel

1. Acesse [Vercel.com](https://vercel.com) e faça login com seu GitHub.
2. Clique em **"Add New Project"** e selecione o repositório `uai-veiculos`.
3. Mantenha as configurações padrão (Framework Preset: **Other / Static**) e clique em **Deploy**.
