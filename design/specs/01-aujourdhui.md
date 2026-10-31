# Aujourd’hui

> Spécification de référence pour l’implémentation. Maquettes : `mockups/01-aujourdhui/`, captures : `screens/01-aujourdhui/`.

## Objectif

Écran d’accueil le matin : la tenue du jour, choisie à partir de la météo, du programme du jour et des vêtements disponibles. On décide en quelques secondes, à une main.

## Composants du design system

WeatherBackground (clair), NightBackground (sombre), WeatherHeader, ProgramChip, IconButton, OutfitPiece, LocationBadge, AddLayerButton, ConfirmOutfitButton, TabBar. Voir `design-system/components/<Nom>/README.md`.

## Règles et comportements

### Structure (375 × 812 pt, iPhone 12 mini de référence)
1. En-tête à 50 pt du haut : date courte, étiquette de programme (activité + icône de transport), bouton réglages, grande température, maximum du jour, deux lignes météo, filet de 2 pt.
2. Tenue de 194 à 684 pt, sans cadre : les pièces flottent avec une ombre de contact.
3. Bouton rond « Je porte cette tenue » à droite, centre à 684 pt.
4. Menu du bas (Linge, Aujourd’hui, Dressing).

### Météo
- Trois ambiances seulement : pluie, soleil, froid. Les autres conditions s’y rattachent (voir `design-system/README.md`).
- Clair : fond lin et halos de la couleur de la météo. Sombre : nuit, crépuscule teinté, lueur de lampe, grain ; menu teinté selon la météo.
- Le thème suit le réglage du système.
- Lignes météo : une prévision utile (« Pluie 70 % vers 18 h ») et un conseil (« Parapluie conseillé vers 12 h 30 »). Si « Je sors le midi » est activé, la météo entre 11 h et 15 h compte dans la tenue.

### Tenue
- Une colonne : haut, bas, chaussures. Deux colonnes dès qu’il y a des couches : couches à gauche (la couche 1 alignée sur le haut), haut / bas / chaussures à droite.
- Pièce pleine hauteur (robe, salopette, combinaison) : une seule pièce à la place du haut et du bas.
- Badge de localisation contre l’épaule d’une pièce qui n’est pas dans l’armoire (balcon, étendoir).
- « Ajouter une couche » à gauche du haut quand il n’y a qu’une colonne.
- Toucher une pièce de la tenue ne mène pas à sa fiche : les fiches s’ouvrent seulement depuis le Dressing.
- Après 20 h (réglable), l’écran devient le tri du soir (voir `04-tri-du-soir.md`).

### Choix de la tenue
- L’application ne décide rien à la place de l’utilisatrice et ne fait pas de recommandation : elle filtre les pièces disponibles selon les usages que l’utilisatrice leur a donnés (météo, activité, déplacement, occasion).
- Une pièce sans usage dans un groupe est proposée dans tous les cas de ce groupe.
- Ordre des propositions dans chaque ligne : rotation selon la date du dernier port, favoris avantagés (sans priorité absolue), puis adéquation à la météo et au programme. *Écart validé le 31/10/2026 par rapport au handoff (« favoris d’abord, puis adéquation ») : voir `SPEC.md` §7.*
- Pièces exclues : au sale, à sécher, à repasser. Sur l’étendoir : disponibles si l’étendoir sert de rangement (réglage) et si elles ne sont pas à repasser.

## Accessibilité

- Chaque pièce est un bouton nommé par sa place et sa description : « Couche 1 : Pull mérinos écru, au balcon, porté 3 fois sur 10 ».
- L’icône de transport a un nom accessible (« à vélo »).
- Le bouton de validation n’a pas de texte visible : nom accessible « Je porte cette tenue ».
- Mouvement réduit : pas d’animation de fond.

## Questions ouvertes

- Fournisseur météo (seule la ville est envoyée) et attribution à afficher dans « Données météo ».
- Règle exacte d’adéquation météo (seuils de température par usage « Chaud / Doux / Frais / Froid »).

## Écrans validés

### J1 — Pluvieux — fond lin, halos haut et bas (clair)

- Capture : `screens/01-aujourdhui/States-J1-Pluie-Lin.webp`
- Maquette : `mockups/01-aujourdhui/States-J1-Pluie-Lin.html`


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


### J2 — Ensoleillé — fond lin, halos haut et bas (clair)

- Capture : `screens/01-aujourdhui/States-J2-Soleil-Lin.webp`
- Maquette : `mockups/01-aujourdhui/States-J2-Soleil-Lin.html`


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


### J3 — Froid — fond lin, halos haut et bas (clair)

- Capture : `screens/01-aujourdhui/States-J3-Froid-Lin.webp`
- Maquette : `mockups/01-aujourdhui/States-J3-Froid-Lin.html`


Textes visibles (dans l’ordre de lecture) :

- « Sam. 13 déc. »
- « Détente »
- « −2° »
- « → 4° »
- « Ciel dégagé »
- « Gel jusqu’à 10 h »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- img — à pied
- button — Réglages
- section — Tenue du jour
- button — Couche 1 : Pull mérinos écru
- button — Couche 2 : Manteau en laine camel
- button — Haut : Chemise blanche
- button — Bas : Jean brut
- button — Chaussures : Bottines cognac
- button — Je porte cette tenue
- nav — Navigation principale


### L1 — Crépuscule teinté — pluvieux (sombre)

- Capture : `screens/01-aujourdhui/Dark-L1-Pluie.webp`
- Maquette : `mockups/01-aujourdhui/Dark-L1-Pluie.html`


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


### L2 — Crépuscule teinté — ensoleillé (sombre)

- Capture : `screens/01-aujourdhui/Dark-L2-Soleil.webp`
- Maquette : `mockups/01-aujourdhui/Dark-L2-Soleil.html`


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


### L3 — Crépuscule teinté — froid (sombre)

- Capture : `screens/01-aujourdhui/Dark-L3-Froid.webp`
- Maquette : `mockups/01-aujourdhui/Dark-L3-Froid.html`


Textes visibles (dans l’ordre de lecture) :

- « Sam. 13 déc. »
- « Détente »
- « −2° »
- « → 4° »
- « Ciel dégagé »
- « Gel jusqu’à 10 h »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- img — à pied
- button — Réglages
- section — Tenue du jour
- button — Couche 1 : Pull mérinos écru
- button — Couche 2 : Manteau en laine camel
- button — Haut : Chemise blanche
- button — Bas : Jean brut
- button — Chaussures : Bottines cognac
- button — Je porte cette tenue
- nav — Navigation principale

