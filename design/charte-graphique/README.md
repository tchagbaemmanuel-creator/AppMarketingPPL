# Charte graphique

Déposez ici les éléments de votre identité visuelle. L'application les utilisera automatiquement une fois configurés.

## Structure

```
charte-graphique/
├── logos/          → logo principal, favicon, version blanche
├── couleurs/       → palette (PDF, PNG ou fichier .json)
├── polices/        → fichiers .woff2 / .ttf
└── README.md       → ce fichier
```

## Appliquer vos couleurs

1. Ouvrez `design/brand.css`
2. Modifiez les variables `--brand-*` avec vos couleurs
3. Redémarrez le serveur (`npm run dev`)

## Appliquer votre logo

1. Placez votre logo dans `public/charte-graphique/logos/logo.svg` (ou `.png`)
2. Copiez aussi une version dans `design/charte-graphique/logos/` pour archivage
3. Modifiez `src/components/brand/brand-logo.tsx` pour utiliser `<Image src="/charte-graphique/logos/logo.svg" ... />`

## Appliquer vos polices

1. Ajoutez les fichiers dans `polices/`
2. Déclarez-les dans `design/brand.css` (section `@font-face`)
3. Mettez à jour `--font-brand` et `--font-heading`

## Fichier couleurs JSON (optionnel)

Vous pouvez créer `couleurs/palette.json` :

```json
{
  "primary": "#0f2744",
  "primaryHover": "#1a3a5c",
  "secondary": "#2563eb",
  "accent": "#38bdf8"
}
```

Puis recopiez ces valeurs dans `design/brand.css`.
