# TabBar

Menu du bas flottant : Linge à gauche, Aujourd’hui au centre dans une bosse arrondie, Dressing à droite.

- Silhouette unique en verre de `tabbar-width` × `tabbar-height` : barre de 64 pt aux bouts `radius-tabbar`, bosse de 24 pt au centre, flou `blur-surface`. Liseré `tabbar-edge` qui suit la bosse ; ombre douce `shadow-tabbar`.
- Couleur du menu :
  - Clair : sauge translucide `tabbar-glass`, la même pour toutes les météos.
  - Sombre : une teinte par météo, `tabbar-pluie` (cacao), `tabbar-soleil` (prune), `tabbar-froid` (prune profonde). Classes `md-tabbar-pluie`, `md-tabbar-soleil`, `md-tabbar-froid`.
- Onglet actif Aujourd’hui : pastille `pastille` (crème) de `size-pastille`, contour 1 pt `pastille-edge` (`moss-deep` en clair, aucun en sombre), cintre 28 pt en `forest-deep` au-dessus du libellé `tab-active` en `ink`. Jamais en `forest`, `mustard` ou dans la couleur de `action` : l’état actif ne doit pas ressembler à l’action principale.
- Onglets latéraux : icône 22 pt et libellé `tab-label`, en `tab-ink`, centrés sur l’arrondi des bouts (x = 40 et 255 pt).
- Onglet actif Linge ou Dressing : gélule `md-tab-capsule` de 72 × 56 pt qui contient l’icône et le libellé, concentrique avec le bout du menu (4 pt de marge), symétrique ; mêmes couleurs que la pastille.
- Quand Aujourd’hui n’est pas actif : cintre 42 pt et libellé 15 pt, sans vide entre eux.
- Centré, à `space-24` du bas. L’application s’ouvre toujours sur Aujourd’hui.
- Aucune couleur de météo ne passe derrière le centre du menu.
