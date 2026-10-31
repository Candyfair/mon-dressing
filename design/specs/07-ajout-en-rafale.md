# Ajout en rafale

> Spécification de référence pour l’implémentation. Maquettes : `mockups/07-ajout-en-rafale/`, captures : `screens/07-ajout-en-rafale/`.

## Objectif

Ajouter beaucoup de vêtements vite : photo, type, enregistrer, photo suivante.

## Composants du design system

Sheet, Option (tuiles de type, bascules, usages), Button. Voir `design-system/components/<Nom>/README.md`.

## Règles et comportements

### Appareil photo (AG1)
- Plein écran, toujours sombre (dans les deux thèmes). « Ajout en rafale », « Terminer », consigne « Posez la pièce à plat, bien éclairée », pile des photos prises avec leur nombre.

### Feuille de type (AG2, AG4, AG5)
- Après la photo : détourage en cours (« Détourage… »), puis « Quel type de pièce ? » : récents, puis tous les types en tuiles.
- Bascules : Favori, Pièce forte, Se repasse.
- « Plus de détails · facultatif » : usages par groupes — Météo (Chaud, Doux, Frais, Froid, Pluie), Activité (Bureau, Télétravail, Détente, Sport), Déplacement (À pied, Vélo, Trottinette, Transports en commun, Voiture, Moto), Occasion (Quotidien, Soirée, Festif, Cérémonie, Entretien professionnel).
- Texte d’aide : « Sans précision dans une sous-catégorie, la pièce est proposée dans tous les cas. Choisissez des usages pour ne la proposer qu’à ces moments-là. »
- L’application ne déduit jamais les usages et ne fait pas de recommandation.
- « Enregistrer · photo suivante » : enregistre et revient à l’appareil photo.
- La feuille suit le thème ; l’appareil photo reste sombre.

### Accès refusé (AG3)
- « L’appareil photo est désactivé », explication, « Ouvrir les réglages », « Choisir dans la galerie ».

### Mise en œuvre
- Détourage local sur le téléphone (aucun envoi d’image). Si le détourage échoue, la photo d’origine est utilisée (voir la fiche, AJ3).

## Accessibilité

- Bascules : rôle interrupteur, état annoncé.
- Usages : boutons à bascule (`aria-pressed`), coche visible en plus du contour.
- Déclencheur photo : nom « Prendre la photo ».

## Questions ouvertes

- Bibliothèque de détourage sur l’appareil (iOS : Vision ; Android : ML Kit Subject Segmentation) à valider.

## Écrans validés

### AG1 — Ajout en rafale — appareil photo (toujours sombre) (clair)

- Capture : `screens/07-ajout-en-rafale/Add-AG1-Camera.webp`
- Maquette : `mockups/07-ajout-en-rafale/Add-AG1-Camera.html`


Textes visibles (dans l’ordre de lecture) :

- « Ajout en rafale »
- « Terminer »
- « Posez la pièce à plat, bien éclairée »
- « 3 »


Noms accessibles :

- button — Fermer
- button — 3 pièces ajoutées, voir
- button — Prendre la photo
- button — Choisir dans la galerie


### AG2 — Ajout en rafale — type de pièce, détourage en cours (clair)

- Capture : `screens/07-ajout-en-rafale/Add-AG2-Type.webp`
- Maquette : `mockups/07-ajout-en-rafale/Add-AG2-Type.html`


Textes visibles (dans l’ordre de lecture) :

- « Reprendre »
- « Détourage… »
- « Quel type de pièce ? »
- « Récents »
- « T-shirt »
- « Chemise »
- « Jean »
- « Tous les types »
- « Pull »
- « Débardeur »
- « Pantalon »
- « Robe »
- « Jupe »
- « Manteau »
- « Baskets »
- « Bottines »
- « Sweat »
- « Favori »
- « Pièce forte »
- « Se repasse »
- « Plus de détails »
- « · facultatif »
- « Enregistrer · photo suivante »


Noms accessibles :

- button — Reprendre la photo


### AG4 — Ajout en rafale — « Plus de détails » ouvert (clair)

- Capture : `screens/07-ajout-en-rafale/Add-AG4-Plus-De-Details.webp`
- Maquette : `mockups/07-ajout-en-rafale/Add-AG4-Plus-De-Details.html`


Textes visibles (dans l’ordre de lecture) :

- « Reprendre »
- « Pièce détourée »
- « T-shirt »
- « Changer de type »
- « Favori »
- « Pièce forte »
- « Se repasse »
- « Plus de détails »
- « · facultatif »
- « Sans précision dans une sous-catégorie, la pièce est proposée dans tous les cas. Choisissez des usages pour ne la proposer qu’à ces moments-là. »
- « Météo »
- « Chaud »
- « Doux »
- « Frais »
- « Froid »
- « Pluie »
- « Activité »
- « Bureau »
- « Télétravail »
- « Détente »
- « Sport »
- « Déplacement »
- « À pied »
- « Vélo »
- « Trottinette »
- « Transports en commun »
- « Voiture »
- « Moto »
- « Occasion »
- « Quotidien »
- « Soirée »
- « Festif »
- « Cérémonie »
- « Entretien professionnel »
- « Enregistrer · photo suivante »


Noms accessibles :

- button — Reprendre la photo
- group — Météo
- group — Activité
- group — Déplacement
- group — Occasion


### AG5 — « Plus de détails » — fin de la liste (défilement) (clair)

- Capture : `screens/07-ajout-en-rafale/Add-AG5-Plus-De-Details-Fin.webp`
- Maquette : `mockups/07-ajout-en-rafale/Add-AG5-Plus-De-Details-Fin.html`


Textes visibles (dans l’ordre de lecture) :

- « Reprendre »
- « Pièce détourée »
- « T-shirt »
- « Changer de type »
- « Favori »
- « Pièce forte »
- « Se repasse »
- « Plus de détails »
- « · facultatif »
- « Sans précision dans une sous-catégorie, la pièce est proposée dans tous les cas. Choisissez des usages pour ne la proposer qu’à ces moments-là. »
- « Météo »
- « Chaud »
- « Doux »
- « Frais »
- « Froid »
- « Pluie »
- « Activité »
- « Bureau »
- « Télétravail »
- « Détente »
- « Sport »
- « Déplacement »
- « À pied »
- « Vélo »
- « Trottinette »
- « Transports en commun »
- « Voiture »
- « Moto »
- « Occasion »
- « Quotidien »
- « Soirée »
- « Festif »
- « Cérémonie »
- « Entretien professionnel »
- « Enregistrer · photo suivante »


Noms accessibles :

- button — Reprendre la photo
- group — Météo
- group — Activité
- group — Déplacement
- group — Occasion


### AG3 — Ajout en rafale — accès à l’appareil photo refusé (clair)

- Capture : `screens/07-ajout-en-rafale/Add-AG3-Acces-Refuse.webp`
- Maquette : `mockups/07-ajout-en-rafale/Add-AG3-Acces-Refuse.html`


Textes visibles (dans l’ordre de lecture) :

- « L’appareil photo est désactivé »
- « Mon Dressing en a besoin pour photographier vos vêtements. Vous pouvez l’autoriser dans les réglages du téléphone. »
- « Ouvrir les réglages »
- « Choisir dans la galerie »


Noms accessibles :

- button — Fermer


### AH2 — Feuille sombre — type de pièce (sombre)

- Capture : `screens/07-ajout-en-rafale/Dark-AH2-Type.webp`
- Maquette : `mockups/07-ajout-en-rafale/Dark-AH2-Type.html`


Textes visibles (dans l’ordre de lecture) :

- « Reprendre »
- « Détourage… »
- « Quel type de pièce ? »
- « Récents »
- « T-shirt »
- « Chemise »
- « Jean »
- « Tous les types »
- « Pull »
- « Débardeur »
- « Pantalon »
- « Robe »
- « Jupe »
- « Manteau »
- « Baskets »
- « Bottines »
- « Sweat »
- « Favori »
- « Pièce forte »
- « Se repasse »
- « Plus de détails »
- « · facultatif »
- « Enregistrer · photo suivante »


Noms accessibles :

- button — Reprendre la photo


### AH4 — Feuille sombre — « Plus de détails » (sombre)

- Capture : `screens/07-ajout-en-rafale/Dark-AH4-Plus-De-Details.webp`
- Maquette : `mockups/07-ajout-en-rafale/Dark-AH4-Plus-De-Details.html`


Textes visibles (dans l’ordre de lecture) :

- « Reprendre »
- « Pièce détourée »
- « T-shirt »
- « Changer de type »
- « Favori »
- « Pièce forte »
- « Se repasse »
- « Plus de détails »
- « · facultatif »
- « Sans précision dans une sous-catégorie, la pièce est proposée dans tous les cas. Choisissez des usages pour ne la proposer qu’à ces moments-là. »
- « Météo »
- « Chaud »
- « Doux »
- « Frais »
- « Froid »
- « Pluie »
- « Activité »
- « Bureau »
- « Télétravail »
- « Détente »
- « Sport »
- « Déplacement »
- « À pied »
- « Vélo »
- « Trottinette »
- « Transports en commun »
- « Voiture »
- « Moto »
- « Occasion »
- « Quotidien »
- « Soirée »
- « Festif »
- « Cérémonie »
- « Entretien professionnel »
- « Enregistrer · photo suivante »


Noms accessibles :

- button — Reprendre la photo
- group — Météo
- group — Activité
- group — Déplacement
- group — Occasion


### AH5 — Feuille sombre — fin de la liste (sombre)

- Capture : `screens/07-ajout-en-rafale/Dark-AH5-Plus-De-Details-Fin.webp`
- Maquette : `mockups/07-ajout-en-rafale/Dark-AH5-Plus-De-Details-Fin.html`


Textes visibles (dans l’ordre de lecture) :

- « Reprendre »
- « Pièce détourée »
- « T-shirt »
- « Changer de type »
- « Favori »
- « Pièce forte »
- « Se repasse »
- « Plus de détails »
- « · facultatif »
- « Sans précision dans une sous-catégorie, la pièce est proposée dans tous les cas. Choisissez des usages pour ne la proposer qu’à ces moments-là. »
- « Météo »
- « Chaud »
- « Doux »
- « Frais »
- « Froid »
- « Pluie »
- « Activité »
- « Bureau »
- « Télétravail »
- « Détente »
- « Sport »
- « Déplacement »
- « À pied »
- « Vélo »
- « Trottinette »
- « Transports en commun »
- « Voiture »
- « Moto »
- « Occasion »
- « Quotidien »
- « Soirée »
- « Festif »
- « Cérémonie »
- « Entretien professionnel »
- « Enregistrer · photo suivante »


Noms accessibles :

- button — Reprendre la photo
- group — Météo
- group — Activité
- group — Déplacement
- group — Occasion

