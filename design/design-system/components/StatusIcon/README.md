# StatusIcon

Icône de statut d’une pièce : disque teinté + icône au trait dans la couleur du statut. Six statuts, une teinte chacun.

| Statut | Icône | Jetons |
|---|---|---|
| Favori | cœur plein | `status-favori`, `status-favori-bg` |
| Sur le balcon | vent | `status-balcon`, `status-balcon-bg` |
| Au sale | machine à laver | `status-sale`, `status-sale-bg` |
| À sécher | vêtement mouillé, une goutte | `status-secher`, `status-secher-bg` |
| Sur l’étendoir | corde, pinces, T-shirt | `status-etendoir`, `status-etendoir-bg` |
| À repasser | fer, pointe à gauche | `status-repasser`, `status-repasser-bg` |

- Tailles : `size-status` (44 pt) sous la pièce du carrousel ; `size-status-mini` (28 pt) sur une tuile de grille, 24 pt sur une étagère du Linge.
- Sous le carrousel, seuls les statuts actifs s’affichent, centrés. Ce sont des indicateurs : on les change par l’appui long (RadialMenu).
- Statuts du linge exclusifs entre eux (au sale, à sécher, sur l’étendoir, à repasser) ; favori et balcon indépendants. Exception : une pièce à repasser posée sur l’étendoir a les deux (« sur l’étendoir » est alors une localisation).
- Statut inactif (rare, dans les réglages ou la fiche) : icône `status-off`, sans disque.
- La couleur ne porte jamais seule l’état : le disque et le cœur plein marquent l’actif.
- Le tri du soir utilise d’autres couleurs (voir SortCard) : la couleur y dit seulement « va au linge » ou « peut être reportée ».
