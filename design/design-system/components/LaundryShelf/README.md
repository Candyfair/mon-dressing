# LaundryShelf

Étagère d’une section du Linge (Au sale, À sécher, Sur l’étendoir, À repasser), qui défile horizontalement.

- En-tête : StatusIcon 30 pt, titre et compte, sous-titre éventuel, action à droite.
- Pièces `garment-shelf` posées sur une ombre de contact ; la première pièce est toujours alignée (même sans pastille « Tout »).
- Toucher une pièce la sélectionne (exception à « toucher = voir en grand », propre au Linge) : coche `select` en bas à droite. La sélection est propre à chaque section et se vide après l’action.
- Pastille « Tout » en tête : pointillés au repos, pleine `select` quand tout est sélectionné ; repasse en pointillés dès qu’une pièce est décochée. Sur l’étendoir, elle ne prend que les pièces prêtes à porter.
- Actions : contour au repos, inactives ; remplies avec le compte dès qu’une pièce est sélectionnée (« Lessive faite · 2 »). « Lessive faite » en `select`, les autres (« Linge rangé », « Repassé ») en `secondary`.
- À sécher : étape automatique (24 h par défaut, réglable) vers l’étendoir ; seulement un lien « Déjà sec ? » (sur la sélection s’il y en a, sinon toute la section), pas de pastille « Tout ».
- Sur l’étendoir : un espace de rangement (pièces disponibles, badge étendoir dans le Dressing). Les pièces à repasser y figurent avec l’icône fer ; dans « À repasser », celles qui sont sur l’étendoir portent l’icône étendoir (sinon : panier propre ou armoire).
- Ranger l’étendoir avec des pièces à repasser : elles quittent l’étendoir mais restent dans « À repasser » (panier de linge propre en attente).
