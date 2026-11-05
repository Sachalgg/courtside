# Courtside mobile

Application mobile native de réservation de terrains de tennis à Bruxelles, en TypeScript avec React Native et Expo (SDK 58). Elle reprend l'identité de la v2 web (blanc, rouge, noir, mode sombre) et la porte sur iOS et Android.

| Carte | Club | Récapitulatif | Confirmation |
|---|---|---|---|
| ![Carte](docs/carte.png) | ![Club](docs/club.png) | ![Récapitulatif](docs/recapitulatif.png) | ![Confirmation](docs/confirmation.png) |

## Lancer

```
cd mobile
npm install
npx expo start
```

Puis scanner le QR code avec Expo Go (iOS ou Android). `npx expo start --web` ouvre la version navigateur.

## Parcours

1. **Explorer** : carte des 12 clubs avec le prix d'appel sur chaque épingle, carrousel de fiches synchronisé avec la carte, ou liste triable par distance, prix ou note. Recherche par nom, commune ou adresse (sans tenir compte des accents), filtre par surface et par favoris. Le bouton de position trie par distance réelle, sinon les distances partent de la Grand-Place.
2. **Club** : surface (terre battue, dur, gazon, indoor), 14 jours, durée de 1h, 1h30 ou 2h, puis grille de créneaux par demi-heure avec prix et nombre de terrains libres. Heures pleines (soirs de semaine, matins de week-end) à +20 %.
3. **Récapitulatif** : simple ou double avec la part par joueur, paiement par carte (fictif) ou au club, conditions d'annulation. Sans compte, le bouton ouvre la connexion puis revient ici.
4. **Confirmation** : numéro de terrain attribué, référence à donner à l'accueil, partage par le menu natif, itinéraire.
5. **Réservations** : à venir et historique. Annulation gratuite jusqu'à 24 h avant, ensuite l'app propose d'appeler le club.
6. **Compte** : inscription et connexion locales, niveau, surface préférée (présélectionnée sur les fiches club), statistiques, clubs favoris, déconnexion, effacement des données.

## Règles métier

- Les réservations des autres joueurs sont simulées par un hachage déterministe du club, du terrain, du jour et de l'heure, avec une demande plus forte aux heures pleines. La grille est donc stable d'un lancement à l'autre.
- Toute réservation faite sur le téléphone bloque son terrain, quel que soit le compte.
- Impossible de réserver deux créneaux qui se chevauchent, même dans deux clubs différents.
- Un créneau doit commencer au moins 15 minutes plus tard. À minuit, la fiche club repasse d'elle-même au jour courant.
- Les dates sont formatées à la main en français, parce que Hermes sur Android n'embarque pas toutes les données `Intl`.

## Technique

- Expo Router (`src/app/`) : onglets Explorer, Réservations, Compte, plus les écrans club, récapitulatif, réservation et connexion.
- État dans un contexte React persisté avec AsyncStorage (`src/state/store.tsx`).
- Logique pure et testée dans `src/lib/` : catalogue, disponibilités, prix, annulation, dates, distances, validation du formulaire.
- Carte native avec `react-native-maps` (Apple Plans sur iOS, Google Maps sur Android). Sur le web, `ClubMap.web.tsx` dessine un plan schématique de la Région bruxelloise, parce que `react-native-maps` ne tourne pas dans un navigateur.
- Icônes en SVG (`react-native-svg`), mêmes tracés que la v2.

## Vérifier

```
npm run typecheck
npm test
npx expo export --platform ios
```

## Limites

C'est une démonstration. Clubs, tarifs et disponibilités sont fictifs (les communes et coordonnées sont réelles), le paiement n'est pas branché, et le compte reste sur le téléphone sans mot de passe stocké. Pour un build Android autonome (hors Expo Go), Google Maps demande une clé API dans `app.json`.
