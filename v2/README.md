# Courtside v2

Refonte complète de l'interface, en blanc, rouge et noir. La v1 (à la racine du dossier parent) reste intacte pour comparaison.

## Lancer

```
python3 -m http.server 4178 --directory "AI CODING DAAM/tennis-app/v2"
```

Puis http://localhost:4178, en vue mobile.

## Ce qui change par rapport à la v1

### Direction visuelle

Trois couleurs seulement. Le noir porte la hiérarchie, le blanc l'espace, le rouge est réservé à l'action et à l'état actif. Aucune autre teinte, y compris pour les surfaces, qui se distinguent par leur icône et non par une couleur.

- Rayons très larges: 34px sur les blocs héros, 26px sur les cartes, pastilles à 999px
- Titres en 800, interlettrage serré, tailles montées (26px en barre de titre, 56px sur le niveau)
- Mode sombre complet: le héros noir devient blanc, le rouge reste identique

### Animations

- Entrée en cascade des blocs de chaque écran (décalage de 34ms par bloc)
- Pastille de l'onglet actif qui glisse d'un onglet à l'autre, ressort `cubic-bezier(.2,.9,.28,1)`
- Indicateur des segments (surface, filtres) qui glisse et se redimensionne, avec défilement automatique vers le choix actif quand la liste déborde
- Créneaux horaires qui apparaissent un par un, ondulation au toucher sur les boutons, enfoncement à l'appui
- Barres de progression qui se déploient depuis zéro, niveau qui compte jusqu'à sa nouvelle valeur après un match
- Feuilles modales en glissement avec voile flouté
- Tout est neutralisé sous `prefers-reduced-motion`

### Surfaces de jeu

Quatre surfaces: terre battue, dur, gazon, indoor. Elles ne sont pas décoratives, elles traversent toute l'app.

- Chaque club a un nombre de terrains ET un prix par surface (le gazon coûte plus cher que le dur)
- Filtre par surface sur la liste des clubs, avec le prix recalculé sur la surface filtrée
- Sélecteur de surface sur la fiche club: la disponibilité des créneaux est propre à la surface choisie
- Surface transportée dans la réservation, dans la note partagée et dans les matchs ouverts
- Filtre par surface sur les matchs ouverts, cumulable avec le filtre de niveau
- Surface préférée dans le profil: elle présélectionne le sélecteur et marque les clubs qui la proposent
- **Un niveau par surface**: chaque résultat met à jour le niveau global ET le niveau de la surface jouée, donc on peut être 3.64 sur terre battue et 2.99 en indoor

## Structure

- `index.html` : coque (barre de titre, vue, barre d'onglets, feuille modale, toast)
- `styles.css` : tokens, thème clair et sombre, composants, animations
- `app.js` : catalogue, état, niveau et Elo, matchs ouverts, vues, interactions

Aucune dépendance, aucun build. Données dans `localStorage` sous `courtside.v2` (clé distincte de la v1, les deux cohabitent).
