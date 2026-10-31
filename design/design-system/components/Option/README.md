# Option

Choix posés par l’utilisatrice dans l’ajout en rafale et la fiche vêtement. L’application ne déduit jamais rien : sans choix, rien n’est restreint.

- **Tuile de type** (`md-type-tile`) : quatre par ligne, hauteur `type-tile-height`, `radius-type-tile`, contour `tile-edge` sur `tile-fill`. Choisie : pleine `select`, texte `on-select`. Un seul type par pièce.
- **Bascule** (`md-option`, `role="switch"`) : Favori, Pièce forte, Se repasse. Hauteur `size-option`, contour `option-edge` ; activée, contour `select` et fond `option-on`. L’icône reste la même dans les deux états : c’est le contour et le fond qui changent, et l’état est annoncé par `aria-checked`.
- **Usage** (`md-option-small`, `aria-pressed`) : options du volet « Plus de détails », par groupes (Météo, Activité, Déplacement, Occasion), titre de groupe `md-group-title`. Choisie : coche 14 pt devant le libellé, en plus du contour.
- Règle des usages : sans choix dans un groupe, la pièce est proposée dans tous les cas ; dès qu’on en choisit, elle n’est proposée qu’à ces moments-là. Le texte d’aide le dit sous le titre du volet.
