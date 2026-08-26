# Courtside

Prototype d'application de réservation de terrains de tennis, dans l'esprit de Playtomic. Réserver un terrain, partager la note entre joueurs, enregistrer ses scores et rejoindre des matchs avec des inconnus de son niveau.

En ligne : **https://courtside-eta-henna.vercel.app**

Deux versions cohabitent dans ce dépôt.

| Version | Dossier | Ce qu'elle apporte |
|---|---|---|
| **v2** (actuelle) | [`v2/`](v2/README.md) | Interface blanc, rouge et noir. Choix de la surface de jeu, niveau calculé par surface, animations. |
| v1 (archive) | [`v1/`](v1/README.md) | Première version, conservée pour comparaison. Palette verte, sans les surfaces. |

## Lancer en local

```
python3 -m http.server 4178
```

Puis ouvrir http://localhost:4178 et choisir une version. La vue mobile des devtools est recommandée.

## Fonctionnalités

- **Réservation** : clubs, surfaces, créneaux horaires, durée. La disponibilité est propre à chaque couple club et surface.
- **Partage de la note** : répartition à parts égales au centime près, suivi des paiements, ajout d'un joueur après coup, partage par le menu natif du téléphone.
- **Matchs ouverts** : rejoindre un match publié par un inconnu, filtré par niveau et par surface. Rejoindre crée la réservation et partage la note automatiquement.
- **Niveau** : Elo de 1000 à 2200 affiché comme un niveau de 1.00 à 7.00. Le résultat compte pour 70 pour cent, l'écart de jeux pour 30 pour cent. Les cinq premiers matchs sont provisoires. La v2 tient un niveau par surface.
- **Amis et profil** : liste d'amis, statistiques, surface préférée.

## Technique

HTML, CSS et JavaScript natifs. Aucune dépendance, aucun build, aucun backend. L'état est conservé dans le `localStorage` du navigateur, sous une clé distincte par version.

## Limites connues

C'est une démonstration, pas un service. Les clubs, les joueurs, les tarifs et les disponibilités sont fictifs. Les scores sont saisis par un seul joueur sans validation de l'adversaire, et les matchs ouverts sont générés localement, donc rien n'est partagé entre appareils. Un vrai service demanderait un backend, une validation croisée des résultats et un paiement en ligne.
