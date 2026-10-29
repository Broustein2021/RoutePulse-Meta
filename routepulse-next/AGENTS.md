- Répertoire de travail : `E:\TOUT LES PROJETS ACTUELS\RoutePulse\routepulse-next` (racine de l'app Next). Tous les chemins ci-dessous sont relatifs à ce dossier. Ne modifie rien en dehors (en particulier pas `..\frontend`, `..\backend`).
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Règles du projet RoutePulse CI
- Base : Neon (Postgres) via `src/lib/db.js` (`sql` tagged template, requêtes toujours paramétrées). Schéma dans `schema.sql`. Plus de Supabase à terme.
- Aucun appel direct à une base depuis le navigateur : tout passe par `src/app/api/**/route.js`.
- Next 16 : lire la doc dans `node_modules/next/dist/docs/` avant d'écrire des route handlers. En App Router récent, `params` des routes dynamiques est une Promise (`await params`).
- Ne jamais lire, afficher, modifier ni commiter `.env*`. Ne jamais mettre de secret dans le code.
- Aucune nouvelle dépendance sans me le demander.
- Ne fais aucun `git commit` ni `git push`.
- Textes d'interface et commentaires en français. Ne change pas le design existant.
- Termine toujours par : liste des fichiers créés/modifiés, résultat de `npm run lint` sur ces fichiers, commandes de test.