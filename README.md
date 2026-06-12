# Gestion Ressources Marketing

Application web pour gérer les outils marketing et les ressources de votre organisation.

## Emplacement du projet

```
C:\Users\tchag\gestion-outils-marketing-formation\gestion-ressources-marketing\
```

## Structure

```
gestion-ressources-marketing/
├── design/
│   ├── brand.css              ← Couleurs & tokens (charte graphique)
│   └── charte-graphique/      ← Déposez logos, polices, couleurs ici
│       ├── logos/
│       ├── couleurs/
│       └── polices/
├── public/charte-graphique/   ← Assets servis par l'app (logos)
├── src/                       ← Code Next.js
├── supabase/                  ← Schéma SQL
├── docs/                      ← Documentation
└── README.md
```

## Charte graphique

1. Placez vos fichiers dans `design/charte-graphique/`
2. Modifiez les couleurs dans `design/brand.css`
3. Consultez `design/charte-graphique/README.md` pour le détail

## Démarrage

```bash
cd gestion-ressources-marketing
npm install
cp .env.example .env.local
npm run dev
```

## Documentation

- [Déploiement Render](./DEPLOIEMENT.md)
- [Charte graphique](./design/charte-graphique/README.md)
