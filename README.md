# WikiMasters private API client

Client Bun/TypeScript typé pour l'API privée de WikiMasters.

> Projet privé et expérimental. L'utilisation est réservée aux comptes et
> environnements autorisés.

## Installation

Pré-requis : [Bun](https://bun.sh/).

```bash
bun install
bun run check
```

## Configuration

Copiez le modèle d'environnement et renseignez une session de test autorisée :

```bash
cp .env.example .env
```

Variables disponibles :

- `WIKIMASTERS_COOKIE_0` et `WIKIMASTERS_COOKIE_1` : morceaux du cookie de session ;
- `WIKIMASTERS_BASE_URL` : URL de l'API, avec une valeur par défaut adaptée ;
- `WIKIMASTERS_TIMEOUT_MS` : délai maximal d'une requête.

Ne commitez jamais `.env` ni aucun cookie de session.

## Utilisation

```ts
import { WikiMastersClient } from "./src";

const api = new WikiMastersClient({
	authTokenParts: {
		part0: process.env.WIKIMASTERS_COOKIE_0!,
		part1: process.env.WIKIMASTERS_COOKIE_1!,
	},
});

const cards = await api.getCards({ page: 1, sort: "recent" });
const collection = await api.getMyCollection({ page: 1 });
```

## Commandes

```bash
bun run check       # vérification TypeScript et tests unitaires
bun run lint        # analyse statique
bun run fmt:check   # vérification du formatage
bun run test:api    # tests live en lecture seule, avec .env
```

Les opérations mutantes ne sont pas exécutées automatiquement.

## Structure

```text
src/
├── client.ts          # façade publique
├── transport.ts       # HTTP, cookies, paramètres et timeout
├── auth.ts            # authentification par cookies
├── normalize.ts       # normalisation des réponses
├── errors.ts          # erreurs API structurées
├── types.ts           # modèles de données
└── resources/         # méthodes par domaine
```
