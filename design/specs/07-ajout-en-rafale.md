# Ajout en rafale

> Spécification de référence pour l’implémentation. Maquettes : `mockups/07-ajout-en-rafale/`, captures : `screens/07-ajout-en-rafale/`.

## Objectif

Ajouter beaucoup de vêtements vite : photo, type, enregistrer, photo suivante.

## Composants du design system

Sheet, Option (tuiles de type, bascules, usages), Button. Voir `design-system/components/<Nom>/README.md`.

## Règles et comportements

### Proposition d’effacer la démo (AV1, AW1)
- Les pièces de démo et celles de l’utilisatrice ne cohabitent pas par défaut.
- Quand l’utilisatrice commence à photographier ses propres vêtements alors que des pièces de démo existent, une popup s’ouvre sur l’appareil photo, avant la première photo : « Supprimer le dressing de démo ? », « Vous commencez votre propre dressing. Les pièces d’exemple disparaissent du Dressing, du Linge et des tenues. », « Si vous les gardez, vous pourrez les supprimer plus tard dans les réglages. », boutons « Garder » (contour) et « Supprimer » (prune).
- « Supprimer » efface toutes les pièces de démo, puis l’appareil photo reste ouvert pour la première photo.
- « Garder » : les pièces de démo restent et se suppriment depuis les réglages (« Supprimer les pièces de démo », `10-reglages.md`). La proposition n’est plus refaite.
- Même composant Popup et mêmes boutons que la suppression du dressing de démo dans les réglages (AN4), sans illustration.

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
- Proposition d’effacer la démo : moment exact (à l’ouverture de l’appareil photo, comme dessiné, ou après la première photo enregistrée) à confirmer.
- Proposition d’effacer la démo : le composant Popup met le focus initial sur l’issue sûre (« Garder »), alors que la non-cohabitation est le comportement par défaut. Garder la règle du Popup ou mettre le focus sur « Supprimer » ?

## Écrans validés

### AV1 — Proposition de supprimer le dressing de démo (clair)

- Capture : `screens/07-ajout-en-rafale/Add-AV1-Supprimer-Demo.webp`
- Maquette : `mockups/07-ajout-en-rafale/Add-AV1-Supprimer-Demo.html`


Textes visibles (dans l’ordre de lecture) :

- « Ajout en rafale »
- « Terminer »
- « Posez la pièce à plat, bien éclairée »
- « Supprimer le dressing de démo ? »
- « Vous commencez votre propre dressing. Les pièces d’exemple disparaissent du Dressing, du Linge et des tenues. »
- « Si vous les gardez, vous pourrez les supprimer plus tard dans les réglages. »
- « Garder »
- « Supprimer »


Noms accessibles :

- button — Fermer
- button — Prendre la photo
- button — Choisir dans la galerie


### AW1 — Sombre — proposition de supprimer le dressing de démo (sombre)

- Capture : `screens/07-ajout-en-rafale/Dark-AW1-Supprimer-Demo.webp`
- Maquette : `mockups/07-ajout-en-rafale/Dark-AW1-Supprimer-Demo.html`


Textes visibles (dans l’ordre de lecture) :

- « Ajout en rafale »
- « Terminer »
- « Posez la pièce à plat, bien éclairée »
- « Supprimer le dressing de démo ? »
- « Vous commencez votre propre dressing. Les pièces d’exemple disparaissent du Dressing, du Linge et des tenues. »
- « Si vous les gardez, vous pourrez les supprimer plus tard dans les réglages. »
- « Garder »
- « Supprimer »


Noms accessibles :

- button — Fermer
- button — Prendre la photo
- button — Choisir dans la galerie


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
- « Frog-à-porter en a besoin pour photographier vos vêtements. Vous pouvez l’autoriser dans les réglages du téléphone. »
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

