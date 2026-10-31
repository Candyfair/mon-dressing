# Tri du soir

> Spécification de référence pour l’implémentation. Maquettes : `mockups/04-tri-du-soir/`, captures : `screens/04-tri-du-soir/`.

## Objectif

Le soir, ranger la tenue portée en quelques gestes : chaque pièce part au linge, s’aère ou retourne dans l’armoire. Le compteur de ports est mis à jour.

## Composants du design system

SortCard, RadialMenu, StatusIcon, Button, NightBackground. Voir `design-system/components/<Nom>/README.md`.

## Règles et comportements

### Déclenchement
- Après 20 h (réglage « Tri du soir à partir de »), si une tenue a été validée dans la journée, Aujourd’hui devient le tri.
- Carte en haut : « Ranger la tenue du jour », « Appui long sur chaque pièce », progression (« 2 pièces triées sur 5 »).

### Trier une pièce
- Appui long sur une pièce : éventail limité à Favori, Aérer, Au sale, Ranger, autour du doigt ; glisser vers une option puis relâcher. Relâcher sur un statut déjà actif le retire.
- Une option « conseillée » est mise en avant (anneau moutarde) : aérer tant que le nombre de ports avant lavage n’est pas atteint (réglage « Ports avant lavage », valeurs de départ d’après l’ADEME), au sale ensuite. C’est une indication, jamais une décision.
- Favori n’apparaît jamais comme statut sur Aujourd’hui (il reste dans le Dressing).
- Chaussures : « Ranger » par défaut.
- Le choix apparaît en icône en haut à droite de la pièce ; les pièces triées ne sont pas estompées.
- Deux teintes seulement, selon l’issue : linge (`sort-linge`) ou reporté (`sort-reporte`).
- Bouton « Ranger le reste : N pièces » pour finir d’un coup.
- Première fois qu’une pièce peut s’aérer : invite « Aérer plutôt que laver ? » (Activer l’aération / Pas maintenant).

### Fin du tri
- Quand tout est trié : « Tout est trié, il reste à valider » et bouton « Terminer le tri ».
- Fin animée, jouée une fois : les pièces s’envolent vers les onglets (Linge, Dressing), l’écran se vide, puis « Tout est rangé », la météo de demain (« Demain : 11° → 16°, pluie l’après-midi ») et le personnage météo. La carte affiche d’abord « Tenue rangée », le résumé (« 1 au sale · 1 à aérer · 3 rangées ») et « Modifier », puis se retourne sur « 1 lavage évité » avec le compteur du mois qui s’incrémente (« 6 depuis le début du mois »). Des pastilles « +1 » et « +4 » apparaissent sur les onglets Linge et Dressing.
- État final validé (AA2, AB2) : écran vidé, carte « 1 lavage évité », « Tout est rangé », météo de demain, personnage météo, pastilles sur les onglets. Les maquettes HTML d’AA2 et AB2 jouent l’animation en boucle ; la capture montre l’état final.
- La tenue portée perd ses icônes de tri (sauf favori) ; le nombre de ports est conservé.

### Personnage météo
- Grenouille kawaii au trait, 116 pt, six tenues : forte chaleur, ensoleillé, nuageux, pluie, froid, neige. La planche AC est une référence : la version finale sera redessinée par une illustratrice.

## Accessibilité

- Les options de l’éventail sont aussi des actions d’accessibilité sur chaque pièce (« Au sale », « Aérer, conseillé »…).
- La progression est annoncée (« 2 pièces triées sur 5 »).
- Mouvement réduit : pas d’envol, état final directement.

## Questions ouvertes

- Valeurs de départ des ports avant lavage (repères ADEME à confirmer).
- Illustrations finales du personnage météo.

## Écrans validés

### X1 — Tri du soir — carte et progression (1 / 5) (clair)

- Capture : `screens/04-tri-du-soir/Evening-X1-Tri.webp`
- Maquette : `mockups/04-tri-du-soir/Evening-X1-Tri.html`


Textes visibles (dans l’ordre de lecture) :

- « Lun. 27 oct. »
- « Ranger la tenue du jour »
- « Appui long sur chaque pièce »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- img — 2 pièces triées sur 5
- section — Tenue du jour
- button — Couche 1 : Pull mérinos écru, porté 4 fois
- button — Couche 2 : Imperméable kaki
- button — Haut : Chemise blanche, au sale
- button — Bas : Jean brut
- button — Chaussures : Bottines cognac, ranger
- img — Au sale
- img — Ranger
- button — Ranger le reste : 3 pièces
- nav — Navigation principale


### X2 — Tri du soir — appui long sur le pull, « aérer » conseillé (clair)

- Capture : `screens/04-tri-du-soir/Evening-X2-AppuiLong.webp`
- Maquette : `mockups/04-tri-du-soir/Evening-X2-AppuiLong.html`


Textes visibles (dans l’ordre de lecture) :

- « Lun. 27 oct. »
- « Ranger la tenue du jour »
- « Appui long sur chaque pièce »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- img — 2 pièces triées sur 5
- section — Tenue du jour
- button — Couche 1 : Pull mérinos écru, porté 4 fois
- button — Couche 2 : Imperméable kaki
- button — Haut : Chemise blanche, au sale
- button — Bas : Jean brut
- button — Chaussures : Bottines cognac, ranger
- img — Au sale
- img — Ranger
- button — Ranger le reste : 3 pièces
- nav — Navigation principale
- menuitem — Favori
- menuitem — Aérer, conseillé
- menuitem — Au sale
- menuitem — Ranger


### X3 — Tri du soir — invite « aérer » (première fois) (clair)

- Capture : `screens/04-tri-du-soir/Evening-X3-Invite-Aerer.webp`
- Maquette : `mockups/04-tri-du-soir/Evening-X3-Invite-Aerer.html`


Textes visibles (dans l’ordre de lecture) :

- « Lun. 27 oct. »
- « Ranger la tenue du jour »
- « Appui long sur chaque pièce »
- « Linge »
- « Aujourd’hui »
- « Dressing »
- « Aérer plutôt que laver ? »
- « Un pull ou une veste peut se porter plusieurs fois. Mon Dressing vous proposera de l’aérer, puis le remettra dans vos tenues. »
- « Activer l’aération »
- « Pas maintenant »
- « Modifiable à tout moment dans les réglages. »


Noms accessibles :

- button — Réglages
- img — 2 pièces triées sur 5
- section — Tenue du jour
- button — Couche 1 : Pull mérinos écru, porté 4 fois
- button — Couche 2 : Imperméable kaki
- button — Haut : Chemise blanche, au sale
- button — Bas : Jean brut
- button — Chaussures : Bottines cognac, ranger
- img — Au sale
- img — Ranger
- button — Ranger le reste : 3 pièces
- nav — Navigation principale


### Y1 — Tri du soir sombre — carte et progression (sombre)

- Capture : `screens/04-tri-du-soir/Dark-Y1-Tri.webp`
- Maquette : `mockups/04-tri-du-soir/Dark-Y1-Tri.html`


Textes visibles (dans l’ordre de lecture) :

- « Lun. 27 oct. »
- « Ranger la tenue du jour »
- « Appui long sur chaque pièce »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- img — 2 pièces triées sur 5
- section — Tenue du jour
- button — Couche 1 : Pull mérinos écru, porté 4 fois
- button — Couche 2 : Imperméable kaki
- button — Haut : Chemise blanche, au sale
- button — Bas : Jean brut
- button — Chaussures : Bottines cognac, ranger
- img — Au sale
- img — Ranger
- button — Ranger le reste : 3 pièces
- nav — Navigation principale


### Y2 — Tri du soir sombre — appui long (sombre)

- Capture : `screens/04-tri-du-soir/Dark-Y2-AppuiLong.webp`
- Maquette : `mockups/04-tri-du-soir/Dark-Y2-AppuiLong.html`


Textes visibles (dans l’ordre de lecture) :

- « Lun. 27 oct. »
- « Ranger la tenue du jour »
- « Appui long sur chaque pièce »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- img — 2 pièces triées sur 5
- section — Tenue du jour
- button — Couche 1 : Pull mérinos écru, porté 4 fois
- button — Couche 2 : Imperméable kaki
- button — Haut : Chemise blanche, au sale
- button — Bas : Jean brut
- button — Chaussures : Bottines cognac, ranger
- img — Au sale
- img — Ranger
- button — Ranger le reste : 3 pièces
- nav — Navigation principale
- menuitem — Favori
- menuitem — Aérer, conseillé
- menuitem — Au sale
- menuitem — Ranger


### Y3 — Tri du soir sombre — invite « aérer » (sombre)

- Capture : `screens/04-tri-du-soir/Dark-Y3-Invite-Aerer.webp`
- Maquette : `mockups/04-tri-du-soir/Dark-Y3-Invite-Aerer.html`


Textes visibles (dans l’ordre de lecture) :

- « Lun. 27 oct. »
- « Ranger la tenue du jour »
- « Appui long sur chaque pièce »
- « Linge »
- « Aujourd’hui »
- « Dressing »
- « Aérer plutôt que laver ? »
- « Un pull ou une veste peut se porter plusieurs fois. Mon Dressing vous proposera de l’aérer, puis le remettra dans vos tenues. »
- « Activer l’aération »
- « Pas maintenant »
- « Modifiable à tout moment dans les réglages. »


Noms accessibles :

- button — Réglages
- img — 2 pièces triées sur 5
- section — Tenue du jour
- button — Couche 1 : Pull mérinos écru, porté 4 fois
- button — Couche 2 : Imperméable kaki
- button — Haut : Chemise blanche, au sale
- button — Bas : Jean brut
- button — Chaussures : Bottines cognac, ranger
- img — Au sale
- img — Ranger
- button — Ranger le reste : 3 pièces
- nav — Navigation principale


### AA1 — Tout est trié — bouton « Terminer le tri » (clair)

- Capture : `screens/04-tri-du-soir/Done-AA1-Tout-Trie.webp`
- Maquette : `mockups/04-tri-du-soir/Done-AA1-Tout-Trie.html`


Textes visibles (dans l’ordre de lecture) :

- « Lun. 27 oct. »
- « Ranger la tenue du jour »
- « Tout est trié, il reste à valider »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- img — 5 pièces triées sur 5
- section — Tenue du jour
- button — Couche 1 : Pull mérinos écru, porté 4 fois
- button — Couche 2 : Imperméable kaki
- button — Haut : Chemise blanche, au sale
- button — Bas : Jean brut
- button — Chaussures : Bottines cognac, ranger
- img — Aérer
- img — Ranger
- img — Au sale
- button — Terminer le tri
- nav — Navigation principale


### AA2 — Tri terminé — météo de demain, zone du personnage (clair)

- Capture : `screens/04-tri-du-soir/Done-AA2-Termine.webp`
- Maquette : `mockups/04-tri-du-soir/Done-AA2-Termine.html`


Textes visibles (dans l’ordre de lecture) :

- « Lun. 27 oct. »
- « Tenue rangée »
- « 1 au sale · 1 à aérer · 3 rangées »
- « Modifier »
- « 1 lavage évité »
- « depuis le début du mois »
- « Tout est rangé »
- « Demain : 11° → 16°, pluie l’après-midi »
- « Grenouille »
- « tenue « pluie » »
- « Linge »
- « Aujourd’hui »
- « Dressing »
- « +1 »
- « +4 »


Noms accessibles :

- button — Réglages
- img — 5 pièces triées sur 5
- section — Tenue du jour, rangée
- img — Aérer
- img — Ranger
- img — Au sale
- img — Personnage météo : grenouille en tenue de pluie
- nav — Navigation principale


### AB1 — Sombre — tout est trié (sombre)

- Capture : `screens/04-tri-du-soir/Dark-AB1-Tout-Trie.webp`
- Maquette : `mockups/04-tri-du-soir/Dark-AB1-Tout-Trie.html`


Textes visibles (dans l’ordre de lecture) :

- « Lun. 27 oct. »
- « Ranger la tenue du jour »
- « Tout est trié, il reste à valider »
- « Linge »
- « Aujourd’hui »
- « Dressing »


Noms accessibles :

- button — Réglages
- img — 5 pièces triées sur 5
- section — Tenue du jour
- button — Couche 1 : Pull mérinos écru, porté 4 fois
- button — Couche 2 : Imperméable kaki
- button — Haut : Chemise blanche, au sale
- button — Bas : Jean brut
- button — Chaussures : Bottines cognac, ranger
- img — Aérer
- img — Ranger
- img — Au sale
- button — Terminer le tri
- nav — Navigation principale


### AB2 — Sombre — tri terminé, zone du personnage (sombre)

- Capture : `screens/04-tri-du-soir/Dark-AB2-Termine.webp`
- Maquette : `mockups/04-tri-du-soir/Dark-AB2-Termine.html`


Textes visibles (dans l’ordre de lecture) :

- « Lun. 27 oct. »
- « Tenue rangée »
- « 1 au sale · 1 à aérer · 3 rangées »
- « Modifier »
- « 1 lavage évité »
- « depuis le début du mois »
- « Tout est rangé »
- « Demain : 11° → 16°, pluie l’après-midi »
- « Grenouille »
- « tenue « pluie » »
- « Linge »
- « Aujourd’hui »
- « Dressing »
- « +1 »
- « +4 »


Noms accessibles :

- button — Réglages
- img — 5 pièces triées sur 5
- section — Tenue du jour, rangée
- img — Aérer
- img — Ranger
- img — Au sale
- img — Personnage météo : grenouille en tenue de pluie
- nav — Navigation principale


### AC — Personnages météo — six tenues (référence pour l’illustration) (clair)

- Capture : `screens/04-tri-du-soir/Mascot-AC-Planche.webp`
- Maquette : `mockups/04-tri-du-soir/Mascot-AC-Planche.html`


Textes visibles (dans l’ordre de lecture) :

- « Trait seul, sans couleur · hauteur ≈ celle des chaussures (116 pt) · style kawaii »
- « Hérisson »
- « Forte chaleur »
- « Ensoleillé »
- « Nuageux »
- « Pluie »
- « Froid »
- « Neige »
- « Grenouille »


Noms accessibles :

- section — Hérisson
- img — Hérisson, forte chaleur
- img — Hérisson, ensoleillé
- img — Hérisson, nuageux
- img — Hérisson, pluie
- img — Hérisson, froid
- img — Hérisson, neige
- section — Grenouille
- img — Grenouille, forte chaleur
- img — Grenouille, ensoleillé
- img — Grenouille, nuageux
- img — Grenouille, pluie
- img — Grenouille, froid
- img — Grenouille, neige

