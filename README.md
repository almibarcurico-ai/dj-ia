# DJ_IA System 🎧

DJ inteligente con videos de YouTube, dos platos, crossfader automático y chat IA.

## Deploy en Vercel (5 minutos)

### 1. Crear repo en GitHub
```bash
git init
git add .
git commit -m "feat: DJ_IA initial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/dj-ia.git
git push -u origin main
```

### 2. Importar en Vercel
1. Entra a vercel.com → New Project → importa el repo
2. Framework: **Vite** (lo detecta solo)
3. En **Environment Variables** agrega:
   - `ANTHROPIC_API_KEY` = `sk-ant-...` (tu clave de Anthropic)
4. Click en **Deploy**

### 3. Listo
Tu URL será algo como `dj-ia.vercel.app` — funciona en cualquier equipo simultáneamente.

## Estructura
```
dj-ia/
├── api/
│   └── chat.js          ← proxy seguro para Anthropic API
├── src/
│   ├── main.jsx
│   └── App.jsx          ← toda la app
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

## Cómo agregar tracks
1. Ir a pestaña "Biblioteca"
2. Pegar URL de YouTube + título, artista, género, BPM y energía
3. Click "+ Agregar"

## Uso del DJ_IA
Escribe en el chat cosas como:
- *"Primera hora reggaeton suave, 100 personas 25-35 años"*
- *"Sube la energía ahora"*
- *"Arma el set completo para una boda"*
