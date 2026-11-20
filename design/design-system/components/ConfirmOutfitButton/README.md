# ConfirmOutfitButton

Bouton rond « Je porte cette tenue », l’action principale de l’écran Aujourd’hui.

- Rond de `size-cta`, fond `action`, coche 26 pt en `on-action`, ombre `shadow-cta`. Clair : vert forêt et coche crème. Sombre : moutarde et coche vert foncé (≈ 6,5:1). Pas de texte visible ; nom accessible « Je porte cette tenue ».
- Flotte à droite, à `space-40` du bord, au-dessus du menu sans le toucher, à hauteur du bas de la zone tenue (centre à 684 pt sur 812).
- Une seule action `action` par écran. Le menu n’utilise jamais cette couleur pour son état actif.
- **Désactivé** tant que la tenue n’a pas de haut et de bas (ou de pièce pleine hauteur) : fond `action-disabled`, coche `on-action-disabled`, sans ombre. Il reste à sa place pour que la tenue ne bouge pas quand il s’active. `aria-disabled="true"` (et non `disabled`) pour rester trouvable au lecteur d’écran, avec la raison dans le nom : « Je porte cette tenue, indisponible : il manque un bas ».
- **Validé** : pastille « Portée aujourd’hui » en verre (`glass`, `blur-glass`, liseré `glass-edge`), hauteur `size-cta`, texte 14,5 pt 600 en `ink` et cadenas 22 pt à droite, à la place de la coche. Elle part du bouton rond, s’étire en glissant vers le centre de l’écran et s’y pose centrée horizontalement, largeur selon le texte (environ 196 pt), une seule ligne, et monte se poser à cheval sur le trait du bas du contour (LockedOutline), sans jamais descendre. Nom accessible « Portée aujourd’hui, toucher pour annuler », état sélectionné. Toucher annule la validation (comportement : `SPEC.md` §7), mais pas avant que la pastille soit en place : de l’appui sur « Je porte cette tenue » jusque-là, les touchers sont ignorés, sans changement d’aspect.
- Animations (désactivé, activation, appui, validation, annulation) : `design/specs/01-aujourdhui.md`, section « Validation de la tenue », et le prototype `mockups/01-aujourdhui/Validation-AX-Prototype.html`.
