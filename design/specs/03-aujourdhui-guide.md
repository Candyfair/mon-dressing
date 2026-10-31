# Aujourd’hui guidé

> Spécification de référence pour l’implémentation. Maquettes : `mockups/03-aujourdhui-guide/`, captures : `screens/03-aujourdhui-guide/`.

## Objectif

Aujourd’hui quand le dressing ne permet pas encore une tenue complète (première utilisation) : montrer ce qui manque et y mener en un geste.

## Composants du design system

EmptySlot, ConfirmOutfitButton (désactivé), WeatherHeader, TabBar. Voir `design-system/components/<Nom>/README.md`.

## Règles et comportements

### Quand
- Seulement pour une catégorie jamais ajoutée (aucun haut, aucun bas, aucune paire de chaussures dans le dressing).
- Si la catégorie existe mais que tout est au linge (AR4) : ce n’est pas le guidage. L’emplacement montre l’icône « au sale », « Vos bas sont au linge » et le lien « Trier le linge ».

### Affichage
- Les pièces présentes à leur place ; une silhouette en pointillés pour chaque pièce manquante, à la même taille, avec un « + » prune centré verticalement.
- Phrase sous l’en-tête : « Encore 1 haut, 1 bas et 1 paire de chaussures », puis « Encore 1 bas et 1 paire de chaussures », puis « Encore 1 paire de chaussures ». Elle disparaît quand la tenue est complète.
- « Ajouter une couche » masqué tant qu’il n’y a pas de haut.

### Actions
- Toucher une silhouette ouvre l’appareil photo de l’ajout en rafale avec le type déjà choisi (haut, bas, chaussures).
- « Je porte cette tenue » est désactivé tant qu’il n’y a pas un haut et un bas (ou une pièce pleine hauteur). Chaussures et couches sont facultatives. Le bouton reste à sa place : fond `action-disabled`, coche `on-action-disabled`, sans ombre.

## Accessibilité

- Bouton désactivé : `accessibilityState={{ disabled: true }}` mais toujours focalisable, avec la raison dans le nom : « Je porte cette tenue, indisponible : il manque un bas ».
- La phrase est une région annoncée (`accessibilityLiveRegion="polite"` sur Android) : elle est relue quand elle change.
- Silhouettes : boutons « Ajouter un bas », « Ajouter des chaussures ».

## Questions ouvertes

- Aucune.

## Écrans validés

### AR1 — Dressing vide — trois silhouettes (clair)

- Capture : `screens/03-aujourdhui-guide/Guided-AR1-Vide.webp`
- Maquette : `mockups/03-aujourdhui-guide/Guided-AR1-Vide.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven. 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Encore 1 haut, 1 bas et 1 paire de chaussures »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Ajouter un haut
- button — Ajouter un bas
- button — Ajouter des chaussures
- button — Je porte cette tenue, indisponible : il manque un haut et un bas
- nav — Navigation principale


### AR2 — Un haut — bas et chaussures à ajouter (clair)

- Capture : `screens/03-aujourdhui-guide/Guided-AR2-Haut.webp`
- Maquette : `mockups/03-aujourdhui-guide/Guided-AR2-Haut.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven. 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Encore 1 bas et 1 paire de chaussures »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Ajouter un bas
- button — Ajouter des chaussures
- button — Ajouter une couche
- button — Je porte cette tenue, indisponible : il manque un bas
- nav — Navigation principale


### AR3 — Haut et bas — la tenue peut se porter (clair)

- Capture : `screens/03-aujourdhui-guide/Guided-AR3-Haut-Bas.webp`
- Maquette : `mockups/03-aujourdhui-guide/Guided-AR3-Haut-Bas.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven. 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Encore 1 paire de chaussures »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Bas : Jean brut
- button — Ajouter des chaussures
- button — Ajouter une couche
- button — Je porte cette tenue
- nav — Navigation principale


### AR4 — Bas existants mais tous au linge (clair)

- Capture : `screens/03-aujourdhui-guide/Guided-AR4-Bas-Au-Linge.webp`
- Maquette : `mockups/03-aujourdhui-guide/Guided-AR4-Bas-Au-Linge.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven. 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Vos bas sont au linge »
- « Trier le linge »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Chaussures : Baskets blanches
- button — Ajouter une couche
- button — Je porte cette tenue, indisponible : vos bas sont au linge
- nav — Navigation principale


### AS1 — Sombre — dressing vide (sombre)

- Capture : `screens/03-aujourdhui-guide/Dark-AS1-Vide.webp`
- Maquette : `mockups/03-aujourdhui-guide/Dark-AS1-Vide.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven. 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Encore 1 haut, 1 bas et 1 paire de chaussures »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Ajouter un haut
- button — Ajouter un bas
- button — Ajouter des chaussures
- button — Je porte cette tenue, indisponible : il manque un haut et un bas
- nav — Navigation principale


### AS2 — Sombre — un haut (sombre)

- Capture : `screens/03-aujourdhui-guide/Dark-AS2-Haut.webp`
- Maquette : `mockups/03-aujourdhui-guide/Dark-AS2-Haut.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven. 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Encore 1 bas et 1 paire de chaussures »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Ajouter un bas
- button — Ajouter des chaussures
- button — Ajouter une couche
- button — Je porte cette tenue, indisponible : il manque un bas
- nav — Navigation principale


### AS3 — Sombre — haut et bas (sombre)

- Capture : `screens/03-aujourdhui-guide/Dark-AS3-Haut-Bas.webp`
- Maquette : `mockups/03-aujourdhui-guide/Dark-AS3-Haut-Bas.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven. 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Encore 1 paire de chaussures »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Bas : Jean brut
- button — Ajouter des chaussures
- button — Ajouter une couche
- button — Je porte cette tenue
- nav — Navigation principale


### AS4 — Sombre — bas au linge (sombre)

- Capture : `screens/03-aujourdhui-guide/Dark-AS4-Bas-Au-Linge.webp`
- Maquette : `mockups/03-aujourdhui-guide/Dark-AS4-Bas-Au-Linge.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven. 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Vos bas sont au linge »
- « Trier le linge »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Chaussures : Baskets blanches
- button — Ajouter une couche
- button — Je porte cette tenue, indisponible : vos bas sont au linge
- nav — Navigation principale

