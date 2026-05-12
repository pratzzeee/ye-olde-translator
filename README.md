# Ye Olde Tongue 🪶

Translates modern English into authentic 1800s Victorian English.

## Project structure

```
ye-olde-translator/
├── api/
│   └── translate.js   ← Vercel serverless function (secure proxy)
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── vercel.json         ← routing config
├── package.json
└── .gitignore
```

## How it works

- `public/` — static frontend served to the user
- `api/translate.js` — serverless function that holds the API key and calls Anthropic
- The browser never touches Anthropic directly — all requests go through `/api/translate`

## Security features

- ✅ API key stored in Vercel environment variable (never in code)
- ✅ Rate limiting: 10 requests per IP per minute
- ✅ Input validation: type check, empty check, 2000 char max
- ✅ CORS: locked to your own domain via `ALLOWED_ORIGIN` env var

## Environment variables

Set these in Vercel dashboard → Project → Settings → Environment Variables:

| Variable           | Value                          | Required |
|--------------------|--------------------------------|----------|
| `ANTHROPIC_API_KEY`| `sk-ant-...`                   | ✅ Yes   |
| `ALLOWED_ORIGIN`   | `https://your-app.vercel.app`  | ✅ Yes   |

## Local development

```bash
npm i -g vercel
vercel dev
```

This runs both the static files and the serverless function locally on http://localhost:3000.

## Deploy

```bash
vercel --prod
```

## License

MIT — do with it what thou wilt.
