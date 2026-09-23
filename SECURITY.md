# Politique de sécurité

Ce dépôt contient un client pour une API privée. Toute vulnérabilité ou
exposition de données doit être signalée de manière privée au mainteneur du
dépôt, et non dans une issue publique.

## À signaler immédiatement

- cookie, token ou donnée personnelle présent dans Git ;
- contournement d'authentification ou accès non autorisé ;
- fuite de secrets dans les logs, tests ou messages d'erreur ;
- opération destructive ou mutante déclenchée involontairement.

En cas de secret exposé, révoquez-le d'abord auprès du service concerné, puis
signalez le commit et le chemin concernés. Ne republiez pas la valeur secrète
dans le signalement.

Les versions de développement ne sont pas garanties compatibles avec l'API de
production.
