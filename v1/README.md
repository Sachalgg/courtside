# Courtside

> Deux versions cohabitent. Cette page documente la v1. La refonte visuelle (blanc, rouge, noir, animations, surfaces de jeu) vit dans [v2/](v2/README.md) et se lance sur le port 4178.

Application de reservation de terrains de tennis entre amis, dans l'esprit de Playtomic.

## Lancer

```
cd "AI CODING DAAM/tennis-app"
python3 -m http.server 4177
```

Puis ouvrir http://localhost:4177 (vue mobile recommandee dans les devtools).

## Ce qui marche

- **Terrains** : 5 clubs bruxellois, surface, distance, prix horaire. Selection du jour sur 10 jours, grille de creneaux horaires. Les creneaux complets ou passes sont barres. La disponibilite est deterministe (meme club + meme jour = memes creneaux).
- **Reservation** : duree 1h / 1h30 / 2h, invitation des amis, recapitulatif du prix et de la part par joueur avant confirmation.
- **Partage de la note** : repartition a parts egales au centime pres (le reliquat va a l'organisateur), suivi de qui a paye, barre de progression, ajout d'un joueur apres coup avec recalcul, bouton "Partager la note" (Web Share API, repli sur le presse-papiers).
- **Matchs avec des inconnus** : matchs ouverts publies par la communaute sur 7 jours (club, horaire, simple ou double, places libres, niveau du match). Filtre "A mon niveau" par defaut, tolerance de plus ou moins 0.75. Rejoindre un match cree automatiquement la reservation et repartit la note entre tous les joueurs.
- **Score et niveau** : saisie du score set par set, avec le niveau de l'adversaire. L'app calcule un niveau affiche de 1.00 a 7.00, base sur un Elo (1000 a 2200) adapte au tennis. Le resultat pese 70 pour cent, l'ecart de jeux 30 pour cent, donc battre un joueur plus fort rapporte beaucoup et perdre de peu contre un bien meilleur ne coute presque rien. Les 5 premiers matchs sont "provisoires" (K de 60 au lieu de 24) pour converger vite vers le vrai niveau.
- **Amis** : ajout libre, suggestions, retrait.
- **Profil** : niveau et progression vers le palier suivant, position dans la communaute, bilan victoires et defaites, informations personnelles. Le niveau declare au depart se verrouille des le premier match enregistre.

Tout est persiste dans `localStorage` sous la cle `courtside.v1` (profil, elo, resultats, amis, reservations, matchs rejoints). Le bouton "Reinitialiser les donnees" du profil remet a zero.

## Structure

- `index.html` : coque de l'app (topbar, vue, barre d'onglets, feuille modale, toast)
- `styles.css` : tokens de couleur, mode sombre automatique, composants
- `app.js` : etat, routage, vues, logique de reservation et de partage, moteur de niveau et de matchmaking

Aucune dependance, aucun build.

## Prochaines etapes possibles

- Backend reel (comptes, vraies disponibilites club, matchs ouverts partages entre joueurs)
- Validation croisee des scores: les deux joueurs confirment le resultat avant qu'il compte
- Niveaux separes simple et double, comme Playtomic
- Paiement in-app pour regler sa part au lieu de cocher manuellement
- Notifications d'invitation et de relance de paiement
- Recherche de partenaires par niveau, matchs ouverts a rejoindre
