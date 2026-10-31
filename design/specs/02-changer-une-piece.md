# Changer une pièce

> Spécification de référence pour l’implémentation. Maquettes : `mockups/02-changer-une-piece/`, captures : `screens/02-changer-une-piece/`.

## Objectif

Changer une pièce de la tenue proposée sans quitter Aujourd’hui.

## Composants du design system

SwapCarousel, Sheet, Dots, Button (secondaire), AddLayerButton. Voir `design-system/components/<Nom>/README.md`.

## Règles et comportements

### Une colonne (AP1)
- Chaque ligne (haut, bas, chaussures) se glisse horizontalement. La pièce suit le doigt avec son ombre de contact ; la suivante arrive tout près.
- Au relâchement, les autres propositions de la ligne s’effacent (opacité 1 → 0).
- « Ajouter une couche » s’efface pendant le glissement.
- Pas de compteur ni de points sur la tenue.

### Deux colonnes (AP2, AP3)
- La colonne de droite se glisse dans son couloir : bords fondus par un masque en dégradé, pas de coupure nette, pas de flou. La pièce qui sort s’efface avec le même fondu.
- Toucher une couche de la colonne de gauche ouvre une feuille (AP3) : pas de titre ni de texte, carrousel des couches compatibles (pièce centrale 250 pt, voisines 150 pt estompées), points de position, bouton « Retirer cette couche ». Hauteur de la feuille ajustée au contenu.
- Jamais deux carrousels horizontaux côte à côte dans la même zone de geste : vérifier sur le prototype qu’un glissement reste dans sa colonne.

### Bouclage
- Tous les carrousels bouclent : après la dernière proposition, on revient à la première, dans les deux sens.
- Une seule pièce compatible : léger rebond qui ramène la pièce en place.

### Pièces pleine hauteur (AP4)
- Robes, salopettes, combinaisons sont dans le carrousel des hauts, intercalées selon le même ordre (favoris d’abord, puis adéquation).
- Quand une robe arrive, le bas s’efface pendant le glissement et disparaît au relâchement. Revenir sur un haut fait réapparaître le bas d’avant (le garder en mémoire).
- Si la première proposition du matin est une robe, la ligne des bas est vide dès l’ouverture. Chaussures et couches restent indépendantes.

### Mise en œuvre suggérée
- `react-native-reanimated-carousel` (prop `loop`) ou `Gesture.Pan` (react-native-gesture-handler) + Reanimated 4 ; opacité interpolée sur la position.
- Durées d’animation à régler sur le prototype.

## Accessibilité

- Chaque ligne expose des actions d’accessibilité « Pièce suivante » / « Pièce précédente » (le glissement n’est pas accessible seul).
- La feuille de couche : `accessibilityViewIsModal`, nom « Couche 1, choisir parmi les couches compatibles », focus rendu à la couche touchée à la fermeture.
- Mouvement réduit : changement de pièce par fondu, sans glissement animé.

## Questions ouvertes

- Durées et courbes des animations (glissement, fondu, rebond).

## Écrans validés

### AP1 — Une colonne — glisser le haut (clair)

- Capture : `screens/02-changer-une-piece/Swap-AP1-Une-Colonne.webp`
- Maquette : `mockups/02-changer-une-piece/Swap-AP1-Une-Colonne.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven. 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Bas : Jean brut
- button — Chaussures : Baskets blanches
- button — Ajouter une couche
- button — Je porte cette tenue
- nav — Navigation principale


### AP2 — Deux colonnes — glisser la colonne de droite (clair)

- Capture : `screens/02-changer-une-piece/Swap-AP2-Deux-Colonnes.webp`
- Maquette : `mockups/02-changer-une-piece/Swap-AP2-Deux-Colonnes.html`


Textes visibles (dans l’ordre de lecture) :

- « Lun. 27 oct. »
- « Bureau »
- « 9° »
- « → 14° »
- « Pluie 70 % vers 18 h »
- « Parapluie conseillé vers 12 h 30 »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- img — à vélo
- button — Réglages
- section — Tenue du jour
- button — Couche 1 : Pull mérinos écru, au balcon, porté 3 fois sur 10
- button — Couche 2 : Imperméable kaki
- button — Haut : Chemise blanche
- button — Bas : Jean brut
- button — Chaussures : Bottines cognac
- button — Je porte cette tenue
- nav — Navigation principale


### AP3 — Deux colonnes — toucher une couche, feuille de choix (clair)

- Capture : `screens/02-changer-une-piece/Swap-AP3-Feuille-Couche.webp`
- Maquette : `mockups/02-changer-une-piece/Swap-AP3-Feuille-Couche.html`


Textes visibles (dans l’ordre de lecture) :

- « Lun. 27 oct. »
- « Bureau »
- « 9° »
- « → 14° »
- « Pluie 70 % vers 18 h »
- « Parapluie conseillé vers 12 h 30 »
- « Linge »
- « Aujourd’hui »
- « Dressing »
- « Retirer cette couche »


Noms accessibles :

- img — à vélo
- button — Réglages
- section — Tenue du jour
- button — Couche 1 : Pull mérinos écru, au balcon, porté 3 fois sur 10
- button — Couche 2 : Imperméable kaki
- button — Haut : Chemise blanche
- button — Bas : Jean brut
- button — Chaussures : Bottines cognac
- button — Je porte cette tenue
- nav — Navigation principale
- dialog — Couche 1, choisir parmi les couches compatibles
- button — Fermer
- img — Pull mérinos écru, 2 sur 4
- img — Couche 2 sur 4


### AP4 — Une colonne — du haut vers une robe, le bas s’efface (clair)

- Capture : `screens/02-changer-une-piece/Swap-AP4-Vers-Robe.webp`
- Maquette : `mockups/02-changer-une-piece/Swap-AP4-Vers-Robe.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven. 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Bas : Jean brut
- button — Chaussures : Baskets blanches
- button — Ajouter une couche
- button — Je porte cette tenue
- nav — Navigation principale


### AQ1 — Sombre — une colonne, glisser le haut (sombre)

- Capture : `screens/02-changer-une-piece/Dark-AQ1-Une-Colonne.webp`
- Maquette : `mockups/02-changer-une-piece/Dark-AQ1-Une-Colonne.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven. 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Bas : Jean brut
- button — Chaussures : Baskets blanches
- button — Ajouter une couche
- button — Je porte cette tenue
- nav — Navigation principale


### AQ2 — Sombre — deux colonnes, glisser la colonne de droite (sombre)

- Capture : `screens/02-changer-une-piece/Dark-AQ2-Deux-Colonnes.webp`
- Maquette : `mockups/02-changer-une-piece/Dark-AQ2-Deux-Colonnes.html`


Textes visibles (dans l’ordre de lecture) :

- « Lun. 27 oct. »
- « Bureau »
- « 9° »
- « → 14° »
- « Pluie 70 % vers 18 h »
- « Parapluie conseillé vers 12 h 30 »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- img — à vélo
- button — Réglages
- section — Tenue du jour
- button — Couche 1 : Pull mérinos écru, au balcon, porté 3 fois sur 10
- button — Couche 2 : Imperméable kaki
- button — Haut : Chemise blanche
- button — Bas : Jean brut
- button — Chaussures : Bottines cognac
- button — Je porte cette tenue
- nav — Navigation principale


### AQ3 — Sombre — feuille de choix de la couche (sombre)

- Capture : `screens/02-changer-une-piece/Dark-AQ3-Feuille-Couche.webp`
- Maquette : `mockups/02-changer-une-piece/Dark-AQ3-Feuille-Couche.html`


Textes visibles (dans l’ordre de lecture) :

- « Lun. 27 oct. »
- « Bureau »
- « 9° »
- « → 14° »
- « Pluie 70 % vers 18 h »
- « Parapluie conseillé vers 12 h 30 »
- « Linge »
- « Aujourd’hui »
- « Dressing »
- « Retirer cette couche »


Noms accessibles :

- img — à vélo
- button — Réglages
- section — Tenue du jour
- button — Couche 1 : Pull mérinos écru, au balcon, porté 3 fois sur 10
- button — Couche 2 : Imperméable kaki
- button — Haut : Chemise blanche
- button — Bas : Jean brut
- button — Chaussures : Bottines cognac
- button — Je porte cette tenue
- nav — Navigation principale
- dialog — Couche 1, choisir parmi les couches compatibles
- button — Fermer
- img — Pull mérinos écru, 2 sur 4
- img — Couche 2 sur 4


### AQ4 — Sombre — du haut vers une robe (sombre)

- Capture : `screens/02-changer-une-piece/Dark-AQ4-Vers-Robe.webp`
- Maquette : `mockups/02-changer-une-piece/Dark-AQ4-Vers-Robe.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven. 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Bas : Jean brut
- button — Chaussures : Baskets blanches
- button — Ajouter une couche
- button — Je porte cette tenue
- nav — Navigation principale

