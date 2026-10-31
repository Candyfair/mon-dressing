# Dressing

> Spécification de référence pour l’implémentation. Maquettes : `mockups/05-dressing/`, captures : `screens/05-dressing/`.

## Objectif

Parcourir ses vêtements par catégorie, voir leurs statuts, changer un statut d’un geste, ouvrir une fiche.

## Composants du design system

StatusIcon, RadialMenu, GridTile, EmptyState, AddButton, TabBar. Voir `design-system/components/<Nom>/README.md`.

## Règles et comportements

### En-tête
- Titre « Dressing » et bouton « + » prune (ajout en rafale).
- Catégories en pastilles : Hauts, Couches, Bas, Robes, Chaussures (active crème, contour mousse en clair).
- Filtres prune : Disponibles, Favoris, Sport ; bouton grille à droite.

### Carrousel « étagère » (S1)
- Pièce centrale 270 pt sur une ligne de sol commune, voisines 150 pt estompées. Sous la pièce : badge « Pièce forte », « Porté 1 fois », statuts actifs seulement (44 pt), compteur « 12 / 38 ». Pas de nom de pièce.
- Le carrousel boucle.
- Toucher = ouvrir la fiche (`08-fiche-vetement.md`). Appui long = éventail des statuts (S2, S3) : Favori, Aérer sur le balcon, Au sale, Ranger, À sécher, Sur l’étendoir, À repasser ; option conseillée en anneau moutarde. Relâcher sur un statut actif le retire.

### Grille (T2)
- Deux tuiles en verre par ligne, statuts en mini-pastilles en haut à droite.

### États vides
- Aucune pièce dans la catégorie (U1) : silhouette en pointillés, « Aucun haut pour l’instant », « Photographiez-les à la suite : quelques secondes par pièce. », bouton « Ajouter des hauts ».
- Filtre sans résultat (U2) : où sont les pièces (« 5 au sale », « 2 à repasser »), « Aucun haut disponible », phrase qui s’adapte aux statuts, « Voir tous les hauts » et « Trier le linge ».

### Statuts (icônes validées)
cœur (favori, fond moutarde clair), vent (balcon), machine à laver (au sale), vêtement à une goutte (à sécher), corde à linge (étendoir), fer à pointe (à repasser), armoire (ranger), boucle (porté).

## Accessibilité

- Pièce centrale : « T-shirt rayé, pièce forte, porté 1 fois, favori, sur le balcon. Toucher pour voir la fiche, appui long pour changer les statuts ».
- Les statuts de l’éventail sont aussi des actions d’accessibilité.
- Compteur annoncé « Pièce 12 sur 38 ».

## Questions ouvertes

- Aucune.

## Écrans validés

### S1 — Dressing — seuls les statuts actifs (clair)

- Capture : `screens/05-dressing/Wardrobe-S1-Dressing.webp`
- Maquette : `mockups/05-dressing/Wardrobe-S1-Dressing.html`


Textes visibles (dans l’ordre de lecture) :

- « Dressing »
- « Hauts »
- « Couches »
- « Bas »
- « Robes »
- « Chaussures »
- « Disponibles »
- « Favoris »
- « Sport »
- « Pièce forte »
- « Porté 1 fois »
- « 12 / 38 »
- « Linge »
- « Aujourd’hui »


Noms accessibles :

- button — Ajouter des vêtements
- div — Emplacements
- div — Filtres
- button — Afficher en grille
- section — Hauts, pièce 12 sur 38
- button — Chemise blanche
- button — Chemise en jean
- button — T-shirt rayé, pièce forte, porté 1 fois, favori, sur le balcon. Toucher pour voir la fiche, appui long pour changer les statuts
- list — Statuts
- img — Favori
- img — Sur le balcon
- p — Pièce 12 sur 38
- nav — Navigation principale


### S2 — Appui long — statuts en éventail autour du doigt (clair)

- Capture : `screens/05-dressing/Wardrobe-S2-AppuiLong.webp`
- Maquette : `mockups/05-dressing/Wardrobe-S2-AppuiLong.html`


Textes visibles (dans l’ordre de lecture) :

- « Dressing »
- « Hauts »
- « Couches »
- « Bas »
- « Robes »
- « Chaussures »
- « Disponibles »
- « Favoris »
- « Sport »
- « Pièce forte »
- « Porté 1 fois »
- « 12 / 38 »
- « Linge »
- « Aujourd’hui »


Noms accessibles :

- button — Ajouter des vêtements
- div — Emplacements
- div — Filtres
- button — Afficher en grille
- section — Hauts, pièce 12 sur 38
- button — Chemise blanche
- button — Chemise en jean
- button — T-shirt rayé, pièce forte, porté 1 fois, favori, sur le balcon. Toucher pour voir la fiche, appui long pour changer les statuts
- list — Statuts
- img — Favori
- img — Sur le balcon
- p — Pièce 12 sur 38
- nav — Navigation principale
- menuitem — Favori
- menuitem — Sur le balcon
- menuitem — Au sale
- menuitem — À sécher
- menuitem — Sur l’étendoir
- menuitem — À repasser


### S3 — Appui long — avec « Ranger » et icône conseillée (clair)

- Capture : `screens/05-dressing/Wardrobe-S3-AppuiLong-Ranger.webp`
- Maquette : `mockups/05-dressing/Wardrobe-S3-AppuiLong-Ranger.html`


Textes visibles (dans l’ordre de lecture) :

- « Dressing »
- « Hauts »
- « Couches »
- « Bas »
- « Robes »
- « Chaussures »
- « Disponibles »
- « Favoris »
- « Sport »
- « Pièce forte »
- « Porté 1 fois »
- « 12 / 38 »
- « Linge »
- « Aujourd’hui »


Noms accessibles :

- button — Ajouter des vêtements
- div — Emplacements
- div — Filtres
- button — Afficher en grille
- section — Hauts, pièce 12 sur 38
- button — Chemise blanche
- button — Chemise en jean
- button — T-shirt rayé, pièce forte, porté 1 fois, favori. Toucher pour voir la fiche, appui long pour changer les statuts
- list — Statuts
- img — Favori
- p — Pièce 12 sur 38
- nav — Navigation principale
- menuitem — Favori
- menuitem — Aérer sur le balcon
- menuitem — Au sale, conseillé
- menuitem — Ranger
- menuitem — À sécher
- menuitem — Sur l’étendoir
- menuitem — À repasser


### T2 — Grille — tuiles en verre (clair)

- Capture : `screens/05-dressing/Wardrobe-T2-Grille-Tuiles.webp`
- Maquette : `mockups/05-dressing/Wardrobe-T2-Grille-Tuiles.html`


Textes visibles (dans l’ordre de lecture) :

- « Dressing »
- « Hauts »
- « Couches »
- « Bas »
- « Robes »
- « Chaussures »
- « Disponibles »
- « Favoris »
- « Sport »
- « Linge »
- « Aujourd’hui »


Noms accessibles :

- button — Ajouter des vêtements
- div — Emplacements
- div — Filtres
- button — Afficher en carrousel
- button — T-shirt rayé, favori, pièce forte
- img — Favori
- button — Chemise blanche
- button — Chemise en jean, sur l’étendoir
- img — Sur l’étendoir
- button — T-shirt blanc, sur le balcon
- img — Sur le balcon
- button — Débardeur noir, favori
- button — Blouse terracotta, sur l’étendoir
- nav — Navigation principale


### U1 — Dressing vide — aucun haut (clair)

- Capture : `screens/05-dressing/Wardrobe-U1-Vide.webp`
- Maquette : `mockups/05-dressing/Wardrobe-U1-Vide.html`


Textes visibles (dans l’ordre de lecture) :

- « Dressing »
- « Hauts »
- « Couches »
- « Bas »
- « Robes »
- « Chaussures »
- « Aucun haut pour l’instant »
- « Photographiez-les à la suite : quelques secondes par pièce. »
- « Ajouter des hauts »
- « Linge »
- « Aujourd’hui »


Noms accessibles :

- button — Ajouter des vêtements
- div — Emplacements
- nav — Navigation principale


### U2 — Aucun résultat — aucun haut disponible (clair)

- Capture : `screens/05-dressing/Wardrobe-U2-Filtre-Vide.webp`
- Maquette : `mockups/05-dressing/Wardrobe-U2-Filtre-Vide.html`


Textes visibles (dans l’ordre de lecture) :

- « Dressing »
- « Hauts »
- « Couches »
- « Bas »
- « Robes »
- « Chaussures »
- « Disponibles »
- « Favoris »
- « Sport »
- « 5 »
- « au sale »
- « 2 »
- « à repasser »
- « Aucun haut disponible »
- « Tous vos hauts sont à laver ou à repasser. »
- « Voir tous les hauts »
- « Trier le linge »
- « Linge »
- « Aujourd’hui »


Noms accessibles :

- button — Ajouter des vêtements
- div — Emplacements
- div — Filtres
- button — Afficher en grille
- list — Où sont les hauts
- nav — Navigation principale


### V1 — Dressing sombre — carrousel (S1) (sombre)

- Capture : `screens/05-dressing/Dark-V1-Dressing.webp`
- Maquette : `mockups/05-dressing/Dark-V1-Dressing.html`


Textes visibles (dans l’ordre de lecture) :

- « Dressing »
- « Hauts »
- « Couches »
- « Bas »
- « Robes »
- « Chaussures »
- « Disponibles »
- « Favoris »
- « Sport »
- « Pièce forte »
- « Porté 1 fois »
- « 12 / 38 »
- « Linge »
- « Aujourd’hui »


Noms accessibles :

- button — Ajouter des vêtements
- div — Emplacements
- div — Filtres
- button — Afficher en grille
- section — Hauts, pièce 12 sur 38
- button — Chemise blanche
- button — Chemise en jean
- button — T-shirt rayé, pièce forte, porté 1 fois, favori, sur le balcon. Toucher pour voir la fiche, appui long pour changer les statuts
- list — Statuts
- img — Favori
- img — Sur le balcon
- p — Pièce 12 sur 38
- nav — Navigation principale


### V2 — Dressing sombre — appui long (S3) (sombre)

- Capture : `screens/05-dressing/Dark-V2-AppuiLong.webp`
- Maquette : `mockups/05-dressing/Dark-V2-AppuiLong.html`


Textes visibles (dans l’ordre de lecture) :

- « Dressing »
- « Hauts »
- « Couches »
- « Bas »
- « Robes »
- « Chaussures »
- « Disponibles »
- « Favoris »
- « Sport »
- « Pièce forte »
- « Porté 1 fois »
- « 12 / 38 »
- « Linge »
- « Aujourd’hui »


Noms accessibles :

- button — Ajouter des vêtements
- div — Emplacements
- div — Filtres
- button — Afficher en grille
- section — Hauts, pièce 12 sur 38
- button — Chemise blanche
- button — Chemise en jean
- button — T-shirt rayé, pièce forte, porté 1 fois, favori. Toucher pour voir la fiche, appui long pour changer les statuts
- list — Statuts
- img — Favori
- p — Pièce 12 sur 38
- nav — Navigation principale
- menuitem — Favori
- menuitem — Aérer sur le balcon
- menuitem — Au sale, conseillé
- menuitem — Ranger
- menuitem — À sécher
- menuitem — Sur l’étendoir
- menuitem — À repasser


### V3 — Dressing sombre — grille (T2) (sombre)

- Capture : `screens/05-dressing/Dark-V3-Grille.webp`
- Maquette : `mockups/05-dressing/Dark-V3-Grille.html`


Textes visibles (dans l’ordre de lecture) :

- « Dressing »
- « Hauts »
- « Couches »
- « Bas »
- « Robes »
- « Chaussures »
- « Disponibles »
- « Favoris »
- « Sport »
- « Linge »
- « Aujourd’hui »


Noms accessibles :

- button — Ajouter des vêtements
- div — Emplacements
- div — Filtres
- button — Afficher en carrousel
- button — T-shirt rayé, favori, pièce forte
- img — Favori
- button — Chemise blanche
- button — Chemise en jean, sur l’étendoir
- img — Sur l’étendoir
- button — T-shirt blanc, sur le balcon
- img — Sur le balcon
- button — Débardeur noir, favori
- button — Blouse terracotta, sur l’étendoir
- nav — Navigation principale


### V4 — Dressing sombre — aucun haut (U1) (sombre)

- Capture : `screens/05-dressing/Dark-V4-Vide.webp`
- Maquette : `mockups/05-dressing/Dark-V4-Vide.html`


Textes visibles (dans l’ordre de lecture) :

- « Dressing »
- « Hauts »
- « Couches »
- « Bas »
- « Robes »
- « Chaussures »
- « Aucun haut pour l’instant »
- « Photographiez-les à la suite : quelques secondes par pièce. »
- « Ajouter des hauts »
- « Linge »
- « Aujourd’hui »


Noms accessibles :

- button — Ajouter des vêtements
- div — Emplacements
- nav — Navigation principale


### V5 — Dressing sombre — aucun haut disponible (U2) (sombre)

- Capture : `screens/05-dressing/Dark-V5-Filtre-Vide.webp`
- Maquette : `mockups/05-dressing/Dark-V5-Filtre-Vide.html`


Textes visibles (dans l’ordre de lecture) :

- « Dressing »
- « Hauts »
- « Couches »
- « Bas »
- « Robes »
- « Chaussures »
- « Disponibles »
- « Favoris »
- « Sport »
- « 5 »
- « au sale »
- « 2 »
- « à repasser »
- « Aucun haut disponible »
- « Tous vos hauts sont à laver ou à repasser. »
- « Voir tous les hauts »
- « Trier le linge »
- « Linge »
- « Aujourd’hui »


Noms accessibles :

- button — Ajouter des vêtements
- div — Emplacements
- div — Filtres
- button — Afficher en grille
- list — Où sont les hauts
- nav — Navigation principale

