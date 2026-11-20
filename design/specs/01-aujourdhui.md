# Aujourd’hui

> Spécification de référence pour l’implémentation. Maquettes : `mockups/01-aujourdhui/`, captures : `screens/01-aujourdhui/`.

## Objectif

Écran d’accueil le matin : la tenue du jour, choisie à partir de la météo, du programme du jour et des vêtements disponibles. On décide en quelques secondes, à une main.

## Composants du design system

WeatherBackground (clair), NightBackground (sombre), WeatherHeader, ProgramChip, IconButton, OutfitPiece, LocationBadge, AddLayerButton, ConfirmOutfitButton, ValidationStamp, LockedOutline, TabBar. Voir `design-system/components/<Nom>/README.md`.

## Règles et comportements

### Structure (375 × 812 pt, iPhone 12 mini de référence)
1. En-tête à 50 pt du haut : date courte, étiquette de programme (activité + icône de transport), bouton réglages, grande température, maximum du jour, deux lignes météo, filet de 2 pt.
2. Tenue de 194 à 684 pt, sans cadre : les pièces flottent avec une ombre de contact.
3. Bouton rond « Je porte cette tenue » à droite, centre à 684 pt.
4. Menu du bas (Buanderie, Aujourd’hui, Dressing).

### Météo
- Trois ambiances seulement : pluie, soleil, froid. Les autres conditions s’y rattachent (voir `design-system/README.md`).
- Clair : fond lin et halos de la couleur de la météo. Sombre : nuit, crépuscule teinté, lueur de lampe, grain ; menu teinté selon la météo.
- Le thème suit le réglage du système.
- Lignes météo : une prévision utile (« Pluie 70 % vers 18 h ») et un conseil (« Parapluie conseillé vers 12 h 30 »).
- Météo qui compte dans la tenue : celle des heures de départ et de retour du bureau (réglages « Départ pour le bureau » et « Retour du bureau », par défaut 8 h 30 et 18 h 30), plus 11 h – 15 h si « Je sors le midi » est activé.
- Jours sans bureau : Détente et Sport, de 9 h à 20 h par défaut ; Télétravail, aucune plage (sauf déplacement ajouté pour la journée), plus 11 h – 15 h si « Je sors le midi » est activé. Voir `SPEC.md` §6.2.

### Tenue
- Une colonne : haut, bas, chaussures. Deux colonnes dès qu’il y a des couches : couches à gauche (la couche 1 alignée sur le haut), haut / bas / chaussures à droite.
- Pièce pleine hauteur (robe, salopette, combinaison) : une seule pièce à la place du haut et du bas.
- Badge de localisation contre l’épaule d’une pièce qui n’est pas dans l’armoire (balcon, étendoir).
- « Ajouter une couche » à gauche du haut quand il n’y a qu’une colonne.
- Toucher une pièce de la tenue ne mène pas à sa fiche : les fiches s’ouvrent seulement depuis le Dressing.
- Après 20 h (réglable), l’écran devient le tri du soir (voir `04-tri-du-soir.md`).

### Choix de la tenue
- L’application ne décide rien à la place de l’utilisatrice et ne fait pas de recommandation : elle filtre les pièces disponibles selon les usages que l’utilisatrice leur a donnés (météo, activité, occasion). Les usages de déplacement ne filtrent pas : une pièce qui a un mode en commun avec la journée passe devant, les autres restent proposées. *Décision de Candice du 19/11/2026, voir `SPEC.md` §7.*
- Une pièce sans usage dans un groupe est proposée dans tous les cas de ce groupe.
- Ordre des propositions dans chaque ligne : les pièces dont un usage correspond explicitement au programme (activité, déplacement, occasion) passent devant, puis celles qui correspondent à la météo, puis les autres ; dans chaque groupe, rotation selon la date du dernier port, favoris avantagés (sans priorité absolue). *Écart validé le 31/10/2026 par rapport au handoff (« favoris d’abord, puis adéquation »), précisé le 15/11/2026 : voir `SPEC.md` §7.*
- Une seule pièce forte par tenue : la tenue proposée n’en contient jamais deux. Si l’utilisatrice en choisit une deuxième en glissant, un indicateur discret le signale et rien n’est corrigé (voir `02-changer-une-piece.md`, AT1 et AU1). Une pièce pleine hauteur pièce forte compte pour une.
- Pièces exclues : au sale, à sécher, à repasser. Sur l’étendoir : disponibles si l’étendoir sert de rangement (réglage) et si elles ne sont pas à repasser.

### Validation de la tenue (AX, AY)

Décisions de design du 19/11/2026. Le comportement (tenue figée pour la journée, annulation en touchant de nouveau le bouton, ports annulés) est défini dans `SPEC.md` §7 et n’est pas repris ici. Prototype de référence : `mockups/01-aujourdhui/Validation-AX-Prototype.html` (durées et courbes de référence ; le code HTML n’est pas à porter tel quel). Retour visuel seulement : ni vibration ni son.

**Bouton « Je porte cette tenue » (ConfirmOutfitButton)**

| État | Rendu | Animation |
|---|---|---|
| Désactivé | Fond `action-disabled`, coche `on-action-disabled`, sans ombre, immobile. | Toucher : secousse horizontale 0, −6, 6, −4, 4, −2, 0 pt en 360 ms (ease-in-out) et un trait `action` de 2 pt souligne la phrase « Encore… » sous l’en-tête (déroulé de gauche à droite sur 45 % de 1 200 ms, puis s’efface). |
| Activation (la tenue devient complète) | Fond `action`, coche `on-action`, ombre `shadow-cta`. | Les pièces ajoutées tombent en place (−26 pt → +4 pt → 0, échelle 0,92 → 1,02 → 1, 420 ms, chaussures décalées de 90 ms). 260 ms après : le fond se remplit depuis le centre (échelle 0 → 1, 380 ms, `cubic-bezier(.34,1.56,.64,1)`), la coche se trace (300 ms, délai 160 ms) ; 220 ms plus tard, un anneau `action` de 2 pt s’échappe (échelle 1 → 1,9, opacité 0,55 → 0, 620 ms) et le bouton rebondit (1 → 1,12 → 1, 380 ms). |
| Appui | — | Écrasement à 0,9 en 120 ms au contact ; au relâchement 0,9 → 1,18 → 1 en 340 ms, anneau, et une petite gerbe de 14 points aux couleurs de l’app autour du bouton (environ 570 ms). |
| Validé | Pastille « Portée aujourd’hui » : fond verre flouté (`glass`, `blur-glass`, liseré `glass-edge`), ombre douce `shadow-glass`, hauteur 56 pt, rayon complet. Texte en Instrument Sans 14,5 pt, 600, couleur `ink`, à 18 pt du bord gauche ; cadenas 22 pt en `ink` à droite, à la place de la coche. Elle part du bouton rond et s’étire en glissant vers le centre de l’écran, où elle se pose centrée horizontalement. Largeur selon le texte (environ 196 pt à la taille de texte par défaut), sur une seule ligne. Elle monte se poser à cheval sur le trait du bas du contour dessiné, centrée sur son épaisseur, comme un sceau qui le ferme : le cadenas et le contour se lisent ensemble, et la pastille reste au-dessus du menu sur les petits écrans. Elle ne descend jamais (si le contour finit plus bas que le bouton rond, elle reste à sa hauteur). Décisions de Candice du 20/11/2026. | 1,5 s après l’appui, pendant que le tampon est encore visible : la coche s’efface (160 ms), le bouton s’étire de 56 à environ 196 pt en montant sur le contour et en glissant au centre (420 ms, `cubic-bezier(.34,1.4,.64,1)`), le texte apparaît en fondu (200 ms, délai 160 ms) et le cadenas grandit (échelle 0,4 → 1, 320 ms, ressort). De l’appui jusqu’à la pastille en place, le bouton ignore les touchers, sans changer d’aspect : l’animation va toujours jusqu’à la pastille. Décision de Candice du 20/11/2026. |
| Annulation | Retour au bouton rond actif. | Le texte s’efface (120 ms), la pastille se resserre à 56 pt en redescendant à la place du bouton rond (300 ms, `cubic-bezier(.4,0,.2,1)`), puis la coche se trace de nouveau et l’anneau s’échappe une fois ; le contour s’efface en même temps (voir plus bas). |

**Tampon « Tenue du jour validée » (ValidationStamp)**

- Cadre : `assets/frog-stamp.svg` (tête de grenouille sur le trait du haut, double trait, yeux et sourire), affiché en vectoriel avec `react-native-svg`, couleur `action` (vert forêt en clair, moutarde en sombre). Intérieur du cadre rempli du voile, pour rester lisible sur les vêtements.
- Taille 290 × 174 pt (`viewBox` 300 × 180), centré horizontalement, haut du cadre à 318 pt sur 812, incliné de −8°.
- Textes écrits par l’app, en Space Grotesk, centrés : « TENUE DU JOUR » (13 pt, 600, interlettrage 2,4), « VALIDÉE » (44 pt, 700, interlettrage 1,6), date du jour en capitales « VEN. 13 JUIN » (11,5 pt, 600, interlettrage 1,6). Lignes de base à 94, 139 et 157 dans le `viewBox`.
- Texture d’encre : bruit fractal en masque sur tout le tampon (le prototype utilise `feTurbulence`, fréquence 0,9). Dans l’app, une petite texture de bruit pré-rendue en masque suffit.
- Voile derrière le tampon : dégradé radial `veil` (ellipse 66 % × 28 % de l’écran, centrée), lin à 64 % en clair, nuit à 68 % en sombre. Apparition 220 ms, disparition 360 ms à 2,3 s.
- Séquence (environ 2,75 s) :
  1. 0 ms : le tampon tombe (opacité 0 → 1, rotation −14° → −8°, échelle 2,6 → 0,94 → 1, 320 ms, `cubic-bezier(.55,0,.8,.2)`).
  2. 200 ms : impact. Les pièces tremblent (0, 2,5, −2, 1, 0 pt en 220 ms) et un second contour du cadre s’échappe (échelle 1 → 1,22, opacité 0,5 → 0, 460 ms).
  3. Jusqu’à 2,3 s : le tampon reste immobile, environ 2 s lisible.
  4. 2,3 s : il s’efface (400 ms, échelle 1 → 1,04).
- Mouvement réduit : le tampon apparaît en fondu (260 ms), sans chute, sans impact ni gerbe, reste le même temps et s’efface en fondu.

**Tenue validée : contour dessiné (LockedOutline)**

- Un trait à main levée entoure toute la tenue, comme au feutre : rectangle arrondi (rayon 40 pt) autour de la boîte englobante des pièces, avec une marge de 12 pt ; un second trait plus fin le double, légèrement décalé.
- Trait principal 2,6 pt en `action` ; second trait 1,2 pt en `action` à 55 %. Bouts et jonctions arrondis. Le tracé dépasse un peu son point de départ, comme un vrai trait de feutre.
- Tremblé déterministe (amplitude 1,6 pt et 2,2 pt, graine fixe) : la même tenue donne toujours le même trait, il ne « bouge » pas d’une ouverture à l’autre.
- Apparition 500 ms après l’appui, une fois que le tampon a frappé la tenue et pendant qu’il est encore visible : le trait se dessine en 760 ms (`cubic-bezier(.5,.1,.3,1)`), le second 120 ms plus tard ; la pastille « Portée aujourd’hui » vient ensuite s’y poser (1,5 s après l’appui). Décision de Candice du 20/11/2026.
- Annulation : le trait s’efface en remontant son tracé (300 ms, ease-in).
- Pas de pictogramme sur le contour : le seul cadenas est dans la pastille « Portée aujourd’hui », pour éviter la confusion.
- À la réouverture de l’app sur une tenue déjà validée : contour et pastille sont affichés directement, sans animation ni tampon.
- Mouvement réduit : le contour apparaît et disparaît en fondu (200 ms).

## Accessibilité

- Chaque pièce est un bouton nommé par sa place et sa description : « Couche 1 : Pull mérinos écru, au balcon, porté 3 fois sur 10 ».
- L’icône de transport a un nom accessible (« à vélo »).
- Le bouton de validation n’a pas de texte visible : nom accessible « Je porte cette tenue ». Validé : « Portée aujourd’hui, toucher pour annuler » (état sélectionné) ; le nom commence par le texte visible de la pastille, pour la commande vocale. Désactivé : la raison dans le nom (« Je porte cette tenue, indisponible : il manque un bas »).
- Tampon : annoncé une fois, « Tenue validée pour aujourd’hui » (annonce existante `today.validatedAnnouncement`) ; le dessin du tampon et le contour sont décoratifs pour le lecteur d’écran.
- Mouvement réduit : pas d’animation de fond ; validation en fondus (voir « Validation de la tenue »).

## Questions ouvertes

- Fournisseur météo (seule la ville est envoyée) et attribution à afficher dans « Données météo ».
- ~~Règle exacte d’adéquation météo~~ : tranchée le 15/11/2026, voir `SPEC.md` §6.3.
- Écran sans chaussures (journée de télétravail à l’intérieur, `SPEC.md` §6.3) : à dessiner avant S7.

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
- « Buanderie »
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
- « Buanderie »
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
- « Buanderie »
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
- « Buanderie »
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
- « Buanderie »
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
- « Buanderie »
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


### AX1 — Tampon « Tenue du jour validée » à l’impact (clair)

- Capture : `screens/01-aujourdhui/Today-AX1-Tampon.webp`
- Maquette : `mockups/01-aujourdhui/Validation-AX-Prototype.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven. 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « TENUE DU JOUR »
- « VALIDÉE »
- « VEN. 13 JUIN »
- « Buanderie »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Bas : Jean brut
- button — Chaussures : Baskets blanches
- img — Tenue du jour validée, vendredi 13 juin
- button — Je porte cette tenue
- nav — Navigation principale


### AX2 — Tenue validée, contour dessiné et pastille « Portée aujourd’hui » (clair)

- Capture : `screens/01-aujourdhui/Today-AX2-Tenue-Verrouillee.webp`
- Maquette : `mockups/01-aujourdhui/Validation-AX-Prototype.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven. 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Portée aujourd’hui »
- « Buanderie »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Bas : Jean brut
- button — Chaussures : Baskets blanches
- button — Portée aujourd’hui, toucher pour annuler
- nav — Navigation principale


### AY1 — Sombre — tampon à l’impact (sombre)

- Capture : `screens/01-aujourdhui/Dark-AY1-Tampon.webp`
- Maquette : `mockups/01-aujourdhui/Validation-AX-Prototype.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven. 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « TENUE DU JOUR »
- « VALIDÉE »
- « VEN. 13 JUIN »
- « Buanderie »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Bas : Jean brut
- button — Chaussures : Baskets blanches
- img — Tenue du jour validée, vendredi 13 juin
- button — Je porte cette tenue
- nav — Navigation principale


### AY2 — Sombre — tenue validée, contour et pastille « Portée aujourd’hui » (sombre)

- Capture : `screens/01-aujourdhui/Dark-AY2-Tenue-Verrouillee.webp`
- Maquette : `mockups/01-aujourdhui/Validation-AX-Prototype.html`


Textes visibles (dans l’ordre de lecture) :

- « Ven. 13 juin »
- « Télétravail »
- « 19° »
- « → 27° »
- « Ensoleillé toute la journée »
- « Max. 27° vers 16 h »
- « Portée aujourd’hui »
- « Buanderie »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- section — Tenue du jour
- button — Haut : T-shirt rayé, pièce forte
- button — Bas : Jean brut
- button — Chaussures : Baskets blanches
- button — Portée aujourd’hui, toucher pour annuler
- nav — Navigation principale
