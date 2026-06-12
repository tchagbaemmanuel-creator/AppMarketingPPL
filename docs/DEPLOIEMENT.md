# Guide de déploiement sur Render

Ce guide décrit le déploiement pas à pas de l'application sur [Render](https://render.com) avec Supabase.

---

## Étape 1 — Préparer Supabase

### 1.1 Créer le projet

1. Connectez-vous à [supabase.com](https://supabase.com)
2. **New Project** → choisissez un nom et une région proche de vos utilisateurs
3. Notez le mot de passe de la base de données

### 1.2 Exécuter le schéma SQL

1. Ouvrez **SQL Editor** dans le dashboard Supabase
2. Copiez-collez tout le contenu de `supabase/schema.sql`
3. Cliquez **Run**
4. Vérifiez dans **Table Editor** que les 4 tables existent

### 1.3 Configurer l'authentification

1. Allez dans **Authentication > Providers**
2. Assurez-vous que **Email** est activé
3. Dans **Authentication > URL Configuration**, ajoutez :
   - **Site URL** : `https://votre-app.onrender.com` (à mettre à jour après déploiement)
   - **Redirect URLs** : `https://votre-app.onrender.com/auth/callback`

### 1.4 Récupérer les clés API

Dans **Settings > API**, copiez :

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 1.5 Créer le premier administrateur

1. **Authentication > Users > Add user** → créez un compte avec email/mot de passe
2. Dans **SQL Editor** :
   ```sql
   UPDATE public.users
   SET role = 'admin'
   WHERE email = 'admin@votre-organisation.com';
   ```

---

## Étape 2 — Pousser le code sur GitHub

```bash
cd gestion-outils-marketing
git add .
git commit -m "MVP gestion outils marketing"
git remote add origin https://github.com/VOTRE-ORG/gestion-outils-marketing.git
git push -u origin main
```

---

## Étape 3 — Déployer sur Render

### 3.1 Créer le service Web

1. Connectez-vous à [render.com](https://render.com)
2. **New +** → **Web Service**
3. Connectez votre dépôt GitHub
4. Sélectionnez le repo `gestion-outils-marketing`

### 3.2 Configuration

| Champ | Valeur |
|-------|--------|
| **Name** | `gestion-outils-marketing` |
| **Region** | Frankfurt ou la plus proche |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free (ou Starter pour la prod) |

### 3.3 Variables d'environnement

Ajoutez dans **Environment** :

| Clé | Valeur |
|-----|--------|
| `NODE_VERSION` | `20` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon de Supabase |

### 3.4 Déployer

Cliquez **Create Web Service**. Le premier build prend 3–5 minutes.

---

## Étape 4 — Finaliser la configuration

### 4.1 Mettre à jour Supabase

Une fois Render déployé, notez l'URL (ex. `https://gestion-outils-marketing.onrender.com`).

Retournez dans Supabase **Authentication > URL Configuration** :

- **Site URL** : `https://gestion-outils-marketing.onrender.com`
- **Redirect URLs** : `https://gestion-outils-marketing.onrender.com/auth/callback`

### 4.2 Tester l'application

1. Ouvrez l'URL Render
2. Connectez-vous avec le compte admin
3. Vérifiez le tableau de bord
4. Testez une demande de retrait et sa validation

---

## Étape 5 — Créer des comptes membres

### Option A — Dashboard Supabase

**Authentication > Users > Add user** pour chaque membre.

### Option B — Inscription (si activée)

Activez **Sign up** dans Supabase Auth. Les nouveaux utilisateurs auront le rôle `membre` par défaut.

---

## Déploiement automatique (optionnel)

Render redéploie automatiquement à chaque push sur `main`.

Vous pouvez aussi utiliser le fichier `render.yaml` à la racine pour une config Infrastructure as Code :

1. **New +** → **Blueprint**
2. Connectez le repo
3. Render détectera `render.yaml`

---

## Dépannage

### Build échoue sur Render

- Vérifiez que `NODE_VERSION=20` est défini
- Consultez les logs de build dans le dashboard Render

### Erreur de connexion

- Vérifiez les variables `NEXT_PUBLIC_SUPABASE_*`
- Vérifiez que l'email existe dans Supabase Auth

### Stock insuffisant à la validation

- Le trigger SQL empêche la validation si le stock est insuffisant
- Ajoutez du stock via **Ressources > Stock**

### Page blanche après déploiement

- Vérifiez les logs Runtime sur Render
- Assurez-vous que le **Start Command** est `npm start`

---

## Coûts estimés

| Service | Plan gratuit |
|---------|--------------|
| Render Web Service | ✅ (avec mise en veille après inactivité) |
| Supabase | ✅ (500 Mo BDD, 50 000 utilisateurs actifs/mois) |

Pour la production, envisagez le plan Starter Render (~7 $/mois) pour éviter la mise en veille.
