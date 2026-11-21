# Aujourd’hui guidé

> Spécification de référence pour l’implémentation. Maquettes : `mockups/03-aujourdhui-guide/`, captures : `screens/03-aujourdhui-guide/`.

## Objectif

Aujourd’hui quand le dressing ne permet pas encore une tenue complète (première utilisation) : montrer ce qui manque et y mener en un geste.

## Composants du design system

EmptySlot, ConfirmOutfitButton (désactivé sans aucune pièce, confirmation quand la tenue est incomplète), WeatherHeader, TabBar. Voir `design-system/components/<Nom>/README.md`.

## Règles et comportements

### Quand
- Seulement pour une catégorie jamais ajoutée (aucun haut, aucun bas, aucune paire de chaussures dans le dressing).
- Si la catégorie existe mais que tout est au linge (AR4) : ce n’est pas le guidage. L’emplacement montre l’icône « au sale », « Vos bas sont à la buanderie » (« Vos hauts… », « Vos chaussures… ») et le lien « Trier le linge » vers la Buanderie. Texte choisi par Candice le 21/11/2026.

### Affichage
- Les pièces présentes à leur place ; une silhouette en pointillés pour chaque pièce manquante, à la même taille, avec un « + » prune centré verticalement.
- Phrase en bas à gauche, à côté des chaussures, à hauteur du bouton (décision de Candice du 21/11/2026, plus lisible sur un petit écran que sous l’en-tête) : « Encore 1 haut, 1 bas et 1 paire de chaussures », puis « Encore 1 bas et 1 paire de chaussures », puis « Encore 1 paire de chaussures ». Elle disparaît quand la tenue est complète.
- « Ajouter une couche » masqué tant qu’il n’y a pas de haut.

### Actions
- Toucher une silhouette ouvre l’appareil photo de l’ajout en rafale avec le type déjà choisi (haut, bas, chaussures).
- « Je porte cette tenue » est actif dès que la tenue a une pièce, avec le même aspect que pour une tenue complète. Sans haut et bas (ou pièce pleine hauteur), le premier appui ouvre la pastille de confirmation « Il manque un bas · Valider quand même ? » et un second appui valide (voir `01-aujourdhui.md`, « Validation de la tenue »). Chaussures et couches sont facultatives. Décisions de Candice du 21/11/2026 : une pièce achetée et pas encore photographiée doit pouvoir se porter le matin même.
- Sans aucune pièce, le bouton est désactivé et reste à sa place : fond `action-disabled`, coche `on-action-disabled`, sans ombre.

## Accessibilité

- Tenue incomplète : « Je porte cette tenue, il manque un bas » ; la pastille de confirmation est annoncée quand elle s’ouvre.
- Bouton désactivé (aucune pièce) : `accessibilityState={{ disabled: true }}` mais toujours focalisable, nom « Validation de la tenue impossible, aucune pièce sélectionnée ».
- La phrase est une région annoncée (`accessibilityLiveRegion="polite"` sur Android) : elle est relue quand elle change.
- Silhouettes : boutons « Ajouter un bas », « Ajouter des chaussures ».

## Questions ouvertes

- Aucune.

## Écrans validés

Les maquettes datent d’avant le 21/11/2026 : elles montrent le bouton désactivé dès qu’il manque un haut ou un bas, et « au linge ». Les noms accessibles ci-dessous sont à jour ; la spec fait foi.

### AR1 — Dressing vide — trois silhouettes (clair)

- Capture : `screens/03-aujourdhui-guide/Guided-AR1-Vide.webp`
- Maquette : `mockups/03-aujourdhui-guide/Guided-AR1-Vide.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Encore 1 haut, 1 bas et 1 paire de chaussures »
- « Buanderie »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Ajouter un haut
- button — Ajouter un bas
- button — Ajouter des chaussures
- button — Validation de la tenue impossible, aucune pièce sélectionnée
- nav — Navigation principale


### AR2 — Un haut — bas et chaussures à ajouter (clair)

- Capture : `screens/03-aujourdhui-guide/Guided-AR2-Haut.webp`
- Maquette : `mockups/03-aujourdhui-guide/Guided-AR2-Haut.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Encore 1 bas et 1 paire de chaussures »
- « Buanderie »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Ajouter un bas
- button — Ajouter des chaussures
- button — Ajouter une couche
- button — Je porte cette tenue, il manque un bas
- nav — Navigation principale


### AR3 — Haut et bas — la tenue peut se porter (clair)

- Capture : `screens/03-aujourdhui-guide/Guided-AR3-Haut-Bas.webp`
- Maquette : `mockups/03-aujourdhui-guide/Guided-AR3-Haut-Bas.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Encore 1 paire de chaussures »
- « Buanderie »
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

- « Ven 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Vos bas sont à la buanderie »
- « Trier le linge »
- « Buanderie »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Chaussures : Baskets blanches
- button — Ajouter une couche
- button — Je porte cette tenue, il manque un bas
- nav — Navigation principale


### AS1 — Sombre — dressing vide (sombre)

- Capture : `screens/03-aujourdhui-guide/Dark-AS1-Vide.webp`
- Maquette : `mockups/03-aujourdhui-guide/Dark-AS1-Vide.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Encore 1 haut, 1 bas et 1 paire de chaussures »
- « Buanderie »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Ajouter un haut
- button — Ajouter un bas
- button — Ajouter des chaussures
- button — Validation de la tenue impossible, aucune pièce sélectionnée
- nav — Navigation principale


### AS2 — Sombre — un haut (sombre)

- Capture : `screens/03-aujourdhui-guide/Dark-AS2-Haut.webp`
- Maquette : `mockups/03-aujourdhui-guide/Dark-AS2-Haut.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Encore 1 bas et 1 paire de chaussures »
- « Buanderie »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Ajouter un bas
- button — Ajouter des chaussures
- button — Ajouter une couche
- button — Je porte cette tenue, il manque un bas
- nav — Navigation principale


### AS3 — Sombre — haut et bas (sombre)

- Capture : `screens/03-aujourdhui-guide/Dark-AS3-Haut-Bas.webp`
- Maquette : `mockups/03-aujourdhui-guide/Dark-AS3-Haut-Bas.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Encore 1 paire de chaussures »
- « Buanderie »
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

- « Ven 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Vos bas sont à la buanderie »
- « Trier le linge »
- « Buanderie »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Chaussures : Baskets blanches
- button — Ajouter une couche
- button — Je porte cette tenue, il manque un bas
- nav — Navigation principale

