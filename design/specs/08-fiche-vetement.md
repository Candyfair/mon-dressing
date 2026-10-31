# Fiche vêtement

> Spécification de référence pour l’implémentation. Maquettes : `mockups/08-fiche-vetement/`, captures : `screens/08-fiche-vetement/`.

## Objectif

Voir et modifier une pièce : type, photo, options et usages. Ouverte seulement depuis le Dressing.

## Composants du design system

Sheet, Popup, Option, Button. Voir `design-system/components/<Nom>/README.md`.

## Règles et comportements

- Feuille qui monte sur le Dressing (AJ1), étirable (AJ2). « Enregistré automatiquement » : pas de bouton Enregistrer.
- Contenu : type et « Changer de type », « Porté 4 fois · Disponible », choix de l’image (Détourée / Photo d’origine), bascules (Favori, Pièce forte, Se repasse), usages par groupes avec résumé (« Chaud, Doux », « Tous les cas »), « Supprimer la pièce » en bas.
- Les statuts de linge ne se changent pas depuis la fiche (Linge, tri du soir et appui long du Dressing).
- Détourage échoué (AJ3) : « Le détourage n’a pas fonctionné. La photo d’origine est utilisée. » et « Réessayer ».
- Suppression (AJ4) : la feuille se ferme, popup centrée avec la pièce en grand (150 pt), « Supprimer ce T-shirt ? », conséquence, « Garder » / « Supprimer » (prune, jamais rouge).

## Accessibilité

- Feuille modale, focus rendu à la pièce du Dressing à la fermeture.
- Popup : alerte, focus initial sur « Garder ».

## Questions ouvertes

- Aucune.

## Écrans validés

### AJ1 — Fiche en feuille — sur le Dressing (clair)

- Capture : `screens/08-fiche-vetement/Garment-AJ1-Feuille.webp`
- Maquette : `mockups/08-fiche-vetement/Garment-AJ1-Feuille.html`


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
- « Enregistré automatiquement »
- « T-shirt »
- « Changer de type »
- « Porté 4 fois · Disponible »
- « Détourée »
- « Photo d’origine »
- « Favori »
- « Se repasse »
- « Usages »
- « Météo »
- « Chaud, Doux »
- « Chaud »
- « Doux »
- « Frais »
- « Froid »
- « Pluie »
- « Activité »
- « Télétravail, Détente »
- « Déplacement »
- « Tous les cas »
- « Occasion »
- « Quotidien »
- « Supprimer la pièce »


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
- button — Fermer la fiche
- radiogroup — Affichage


### AJ2 — Fiche en feuille — étirée, bas de la fiche (clair)

- Capture : `screens/08-fiche-vetement/Garment-AJ2-Feuille-Etiree.webp`
- Maquette : `mockups/08-fiche-vetement/Garment-AJ2-Feuille-Etiree.html`


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
- « Enregistré automatiquement »
- « Porté 4 fois · Disponible »
- « Détourée »
- « Photo d’origine »
- « Favori »
- « Se repasse »
- « Usages »
- « Météo »
- « Chaud, Doux »
- « Chaud »
- « Doux »
- « Frais »
- « Froid »
- « Pluie »
- « Activité »
- « Télétravail, Détente »
- « Déplacement »
- « Tous les cas »
- « Occasion »
- « Quotidien »
- « Supprimer la pièce »


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
- button — Fermer la fiche
- radiogroup — Affichage


### AJ3 — Fiche en feuille — détourage échoué (clair)

- Capture : `screens/08-fiche-vetement/Garment-AJ3-Feuille-Detourage-Echoue.webp`
- Maquette : `mockups/08-fiche-vetement/Garment-AJ3-Feuille-Detourage-Echoue.html`


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
- « Enregistré automatiquement »
- « T-shirt »
- « Changer de type »
- « Porté 4 fois · Disponible »
- « Détourée »
- « Photo d’origine »
- « Le détourage n’a pas fonctionné. La photo d’origine est utilisée. »
- « Réessayer »
- « Favori »
- « Se repasse »
- « Usages »
- « Météo »
- « Chaud, Doux »
- « Chaud »
- « Doux »
- « Frais »
- « Froid »
- « Pluie »
- « Activité »
- « Télétravail, Détente »
- « Déplacement »
- « Tous les cas »


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
- button — Fermer la fiche
- radiogroup — Affichage


### AJ4 — Fiche en feuille — suppression en fenêtre centrée (clair)

- Capture : `screens/08-fiche-vetement/Garment-AJ4-Feuille-Supprimer.webp`
- Maquette : `mockups/08-fiche-vetement/Garment-AJ4-Feuille-Supprimer.html`


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
- « Enregistré automatiquement »
- « T-shirt »
- « Changer de type »
- « Porté 4 fois · Disponible »
- « Détourée »
- « Photo d’origine »
- « Favori »
- « Se repasse »
- « Usages »
- « Météo »
- « Chaud, Doux »
- « Chaud »
- « Doux »
- « Frais »
- « Froid »
- « Pluie »
- « Activité »
- « Télétravail, Détente »
- « Déplacement »
- « Tous les cas »
- « Occasion »
- « Quotidien »
- « Supprimer la pièce »
- « Supprimer ce T-shirt ? »
- « Il disparaîtra du Dressing et ne sera plus proposé dans vos tenues. »
- « Garder »
- « Supprimer »


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
- button — Fermer la fiche
- radiogroup — Affichage


### AK1 — Fiche sombre — feuille sur le Dressing (sombre)

- Capture : `screens/08-fiche-vetement/Dark-AK1-Feuille.webp`
- Maquette : `mockups/08-fiche-vetement/Dark-AK1-Feuille.html`


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
- « Enregistré automatiquement »
- « T-shirt »
- « Changer de type »
- « Porté 4 fois · Disponible »
- « Détourée »
- « Photo d’origine »
- « Favori »
- « Se repasse »
- « Usages »
- « Météo »
- « Chaud, Doux »
- « Chaud »
- « Doux »
- « Frais »
- « Froid »
- « Pluie »
- « Activité »
- « Télétravail, Détente »
- « Déplacement »
- « Tous les cas »
- « Occasion »
- « Quotidien »
- « Supprimer la pièce »


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
- button — Fermer la fiche
- radiogroup — Affichage


### AK2 — Fiche sombre — étirée (sombre)

- Capture : `screens/08-fiche-vetement/Dark-AK2-Feuille-Etiree.webp`
- Maquette : `mockups/08-fiche-vetement/Dark-AK2-Feuille-Etiree.html`


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
- « Enregistré automatiquement »
- « Porté 4 fois · Disponible »
- « Détourée »
- « Photo d’origine »
- « Favori »
- « Se repasse »
- « Usages »
- « Météo »
- « Chaud, Doux »
- « Chaud »
- « Doux »
- « Frais »
- « Froid »
- « Pluie »
- « Activité »
- « Télétravail, Détente »
- « Déplacement »
- « Tous les cas »
- « Occasion »
- « Quotidien »
- « Supprimer la pièce »


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
- button — Fermer la fiche
- radiogroup — Affichage


### AK3 — Fiche sombre — détourage échoué (sombre)

- Capture : `screens/08-fiche-vetement/Dark-AK3-Detourage-Echoue.webp`
- Maquette : `mockups/08-fiche-vetement/Dark-AK3-Detourage-Echoue.html`


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
- « Enregistré automatiquement »
- « T-shirt »
- « Changer de type »
- « Porté 4 fois · Disponible »
- « Détourée »
- « Photo d’origine »
- « Le détourage n’a pas fonctionné. La photo d’origine est utilisée. »
- « Réessayer »
- « Favori »
- « Se repasse »
- « Usages »
- « Météo »
- « Chaud, Doux »
- « Chaud »
- « Doux »
- « Frais »
- « Froid »
- « Pluie »
- « Activité »
- « Télétravail, Détente »
- « Déplacement »
- « Tous les cas »


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
- button — Fermer la fiche
- radiogroup — Affichage


### AK4 — Fiche sombre — suppression (sombre)

- Capture : `screens/08-fiche-vetement/Dark-AK4-Supprimer.webp`
- Maquette : `mockups/08-fiche-vetement/Dark-AK4-Supprimer.html`


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
- « Enregistré automatiquement »
- « T-shirt »
- « Changer de type »
- « Porté 4 fois · Disponible »
- « Détourée »
- « Photo d’origine »
- « Favori »
- « Se repasse »
- « Usages »
- « Météo »
- « Chaud, Doux »
- « Chaud »
- « Doux »
- « Frais »
- « Froid »
- « Pluie »
- « Activité »
- « Télétravail, Détente »
- « Déplacement »
- « Tous les cas »
- « Occasion »
- « Quotidien »
- « Supprimer la pièce »
- « Supprimer ce T-shirt ? »
- « Il disparaîtra du Dressing et ne sera plus proposé dans vos tenues. »
- « Garder »
- « Supprimer »


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
- button — Fermer la fiche
- radiogroup — Affichage

