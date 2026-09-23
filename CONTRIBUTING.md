# Contribuer à wm-api

Merci de respecter le périmètre privé du projet et les règles d'accès à l'API
WikiMasters.

## Avant toute contribution

- Utilisez uniquement un compte, des données et un environnement autorisés.
- Ne commitez jamais de cookies, tokens, fichiers `.env`, captures réseau ou
  données personnelles.
- N'ajoutez pas d'opérations mutantes sans tests explicites et validation du
  mainteneur.

## Développement local

```bash
bun install
bun run check
bun run lint
bun run fmt:check
```

Pour corriger le formatage :

```bash
bun run fmt
```

Les tests live nécessitent un fichier `.env` local et un compte de test
autorisé. Ils ne doivent jamais être exécutés automatiquement en CI.

## Pull requests

1. Créez une branche courte et ciblée depuis `develop`.
2. Ajoutez ou mettez à jour les tests concernés.
3. Vérifiez le typecheck, les tests, le lint et le formatage.
4. Décrivez le changement, son impact et les éventuelles limites de l'API.
5. Demandez une revue avant de fusionner.

Les commits doivent rester ciblés et ne contenir aucun secret. Les changements
qui modifient le contrat public du client doivent préciser les migrations
nécessaires.
