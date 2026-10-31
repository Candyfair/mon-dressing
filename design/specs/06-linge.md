# Linge

> Spécification de référence pour l’implémentation. Maquettes : `mockups/06-linge/`, captures : `screens/06-linge/`.

## Objectif

Suivre le linge par lots : ce qui est au sale, ce qui sèche, ce qui est sur l’étendoir, ce qui attend le fer.

## Composants du design system

LaundryShelf, StatusIcon, Button. Voir `design-system/components/<Nom>/README.md`.

## Règles et comportements

### Cycle
Au sale → « Lessive faite » → À sécher → (automatique après 24 h, réglable) → Sur l’étendoir → « Linge rangé » → Dressing.
- L’étendoir compte comme rangement (pièces disponibles) par défaut ; désactivable dans les réglages.
- Une pièce « se repasse » (option de la fiche) passe aussi dans « À repasser » : double statut tant qu’elle est sur l’étendoir. Rangée sans être repassée, elle reste dans « À repasser » (panier propre).

### Étagères
- En-tête de section : icône de statut, titre, compte, sous-titre éventuel (« Sec demain vers 9 h », « 3 prêtes · 2 à repasser »), action à droite.
- Toucher une pièce la sélectionne (exception à « toucher = voir en grand », propre au Linge) : coche en bas à droite. La sélection est propre à chaque section et se vide après l’action.
- Pastille « Tout » : pointillés au repos, pleine quand tout est sélectionné, repasse en pointillés dès qu’une pièce est décochée.
- Actions en contour au repos (inactives), remplies avec le compte dès qu’il y a une sélection (« Lessive faite · 2 »).
- À sécher : pas de pastille « Tout », seulement le lien « Déjà sec ? ».
- Badges : étendoir sur les pièces de « À repasser » qui sont sur l’étendoir ; fer sur les pièces de l’étendoir à repasser.

## Accessibilité

- Chaque section est une région nommée (« Au sale, 5 pièces »).
- Pièces sélectionnables : état coché annoncé.
- « Tout » : « Tout sélectionner ».

## Questions ouvertes

- Carrousel de repassage (non dessiné).

## Écrans validés

### AE1 — Linge — repos, actions en contour (clair)

- Capture : `screens/06-linge/Laundry-AE1-Repos.webp`
- Maquette : `mockups/06-linge/Laundry-AE1-Repos.html`


Textes visibles (dans l’ordre de lecture) :

- « Linge »
- « 13 pièces en cours »
- « Au sale »
- « 5 »
- « Lessive faite »
- « Tout »
- « À sécher »
- « 2 »
- « Sec demain vers 9 h »
- « Déjà sec ? »
- « Sur l’étendoir »
- « 3 prêtes · 2 à repasser »
- « Linge rangé »
- « À repasser »
- « 3 »
- « Repassé »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- section — Au sale, 5 pièces
- button — Tout sélectionner
- button — Chemise blanche
- button — T-shirt rayé
- button — Débardeur noir
- button — Pull en laine gris
- section — À sécher, 2 pièces
- button — Jean brut
- button — T-shirt blanc
- section — Sur l’étendoir, 5 pièces
- button — Chemise bleu ciel
- img — À repasser
- button — Chemise en jean
- button — Robe portefeuille
- button — Chemise à carreaux
- section — À repasser, 3 pièces
- img — Sur l’étendoir
- button — Chemise en lin
- nav — Navigation principale


### AE2 — Linge — deux pièces sélectionnées (clair)

- Capture : `screens/06-linge/Laundry-AE2-Quelques-Pieces.webp`
- Maquette : `mockups/06-linge/Laundry-AE2-Quelques-Pieces.html`


Textes visibles (dans l’ordre de lecture) :

- « Linge »
- « 13 pièces en cours »
- « Au sale »
- « 5 »
- « Lessive faite · 2 »
- « Tout »
- « À sécher »
- « 2 »
- « Sec demain vers 9 h »
- « Déjà sec ? »
- « Sur l’étendoir »
- « 3 prêtes · 2 à repasser »
- « Linge rangé »
- « À repasser »
- « 3 »
- « Repassé »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- section — Au sale, 5 pièces
- button — Tout sélectionner
- button — Chemise blanche
- button — T-shirt rayé
- button — Débardeur noir
- button — Pull en laine gris
- section — À sécher, 2 pièces
- button — Jean brut
- button — T-shirt blanc
- section — Sur l’étendoir, 5 pièces
- button — Chemise bleu ciel
- img — À repasser
- button — Chemise en jean
- button — Robe portefeuille
- button — Chemise à carreaux
- section — À repasser, 3 pièces
- img — Sur l’étendoir
- button — Chemise en lin
- nav — Navigation principale


### AE3 — Linge — « Tout » sélectionné (clair)

- Capture : `screens/06-linge/Laundry-AE3-Tout.webp`
- Maquette : `mockups/06-linge/Laundry-AE3-Tout.html`


Textes visibles (dans l’ordre de lecture) :

- « Linge »
- « 13 pièces en cours »
- « Au sale »
- « 5 »
- « Lessive faite · 5 »
- « Tout »
- « À sécher »
- « 2 »
- « Sec demain vers 9 h »
- « Déjà sec ? »
- « Sur l’étendoir »
- « 3 prêtes · 2 à repasser »
- « Linge rangé »
- « À repasser »
- « 3 »
- « Repassé »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- section — Au sale, 5 pièces
- button — Tout sélectionner
- button — Chemise blanche
- button — T-shirt rayé
- button — Débardeur noir
- button — Pull en laine gris
- section — À sécher, 2 pièces
- button — Jean brut
- button — T-shirt blanc
- section — Sur l’étendoir, 5 pièces
- button — Chemise bleu ciel
- img — À repasser
- button — Chemise en jean
- button — Robe portefeuille
- button — Chemise à carreaux
- section — À repasser, 3 pièces
- img — Sur l’étendoir
- button — Chemise en lin
- nav — Navigation principale


### AF1 — Linge sombre — repos (sombre)

- Capture : `screens/06-linge/Dark-AF1-Linge-Repos.webp`
- Maquette : `mockups/06-linge/Dark-AF1-Linge-Repos.html`


Textes visibles (dans l’ordre de lecture) :

- « Linge »
- « 13 pièces en cours »
- « Au sale »
- « 5 »
- « Lessive faite »
- « Tout »
- « À sécher »
- « 2 »
- « Sec demain vers 9 h »
- « Déjà sec ? »
- « Sur l’étendoir »
- « 3 prêtes · 2 à repasser »
- « Linge rangé »
- « À repasser »
- « 3 »
- « Repassé »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- section — Au sale, 5 pièces
- button — Tout sélectionner
- button — Chemise blanche
- button — T-shirt rayé
- button — Débardeur noir
- button — Pull en laine gris
- section — À sécher, 2 pièces
- button — Jean brut
- button — T-shirt blanc
- section — Sur l’étendoir, 5 pièces
- button — Chemise bleu ciel
- img — À repasser
- button — Chemise en jean
- button — Robe portefeuille
- button — Chemise à carreaux
- section — À repasser, 3 pièces
- img — Sur l’étendoir
- button — Chemise en lin
- nav — Navigation principale


### AF2 — Linge sombre — deux pièces sélectionnées (sombre)

- Capture : `screens/06-linge/Dark-AF2-Linge-Selection.webp`
- Maquette : `mockups/06-linge/Dark-AF2-Linge-Selection.html`


Textes visibles (dans l’ordre de lecture) :

- « Linge »
- « 13 pièces en cours »
- « Au sale »
- « 5 »
- « Lessive faite · 2 »
- « Tout »
- « À sécher »
- « 2 »
- « Sec demain vers 9 h »
- « Déjà sec ? »
- « Sur l’étendoir »
- « 3 prêtes · 2 à repasser »
- « Linge rangé »
- « À repasser »
- « 3 »
- « Repassé »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- section — Au sale, 5 pièces
- button — Tout sélectionner
- button — Chemise blanche
- button — T-shirt rayé
- button — Débardeur noir
- button — Pull en laine gris
- section — À sécher, 2 pièces
- button — Jean brut
- button — T-shirt blanc
- section — Sur l’étendoir, 5 pièces
- button — Chemise bleu ciel
- img — À repasser
- button — Chemise en jean
- button — Robe portefeuille
- button — Chemise à carreaux
- section — À repasser, 3 pièces
- img — Sur l’étendoir
- button — Chemise en lin
- nav — Navigation principale


### AF3 — Linge sombre — « Tout » sélectionné (sombre)

- Capture : `screens/06-linge/Dark-AF3-Linge-Tout.webp`
- Maquette : `mockups/06-linge/Dark-AF3-Linge-Tout.html`


Textes visibles (dans l’ordre de lecture) :

- « Linge »
- « 13 pièces en cours »
- « Au sale »
- « 5 »
- « Lessive faite · 5 »
- « Tout »
- « À sécher »
- « 2 »
- « Sec demain vers 9 h »
- « Déjà sec ? »
- « Sur l’étendoir »
- « 3 prêtes · 2 à repasser »
- « Linge rangé »
- « À repasser »
- « 3 »
- « Repassé »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- section — Au sale, 5 pièces
- button — Tout sélectionner
- button — Chemise blanche
- button — T-shirt rayé
- button — Débardeur noir
- button — Pull en laine gris
- section — À sécher, 2 pièces
- button — Jean brut
- button — T-shirt blanc
- section — Sur l’étendoir, 5 pièces
- button — Chemise bleu ciel
- img — À repasser
- button — Chemise en jean
- button — Robe portefeuille
- button — Chemise à carreaux
- section — À repasser, 3 pièces
- img — Sur l’étendoir
- button — Chemise en lin
- nav — Navigation principale

