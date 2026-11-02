# SwapCarousel

Changer une pièce de la tenue du jour sur Aujourd’hui, sans ouvrir d’autre écran.

**Une colonne** : chaque ligne (haut, bas, chaussures) se glisse horizontalement. **Deux colonnes** : la colonne de droite se glisse dans son couloir (`md-swap-lane`, bords fondus par un masque en dégradé, sans coupure nette) ; toucher une couche de la colonne de gauche ouvre la feuille de choix d’une couche (Sheet).

Comportement :

- La pièce suit le doigt avec son ombre de contact ; la suivante arrive tout près (pas d’écart d’un écran entier).
- Au relâchement, les autres propositions de la ligne s’effacent : opacité de 1 à 0. Sur deux colonnes, la pièce qui sort s’efface de la même façon (pas de flou).
- Tous les carrousels bouclent : après la dernière proposition, on revient à la première, dans les deux sens.
- Une seule pièce compatible : léger rebond qui ramène la pièce en place, pour que le geste ne paraisse pas bloqué.
- Pas de compteur ni de points sur la tenue. Le bouton « Ajouter une couche » s’efface pendant le glissement.
- Pas de lien vers la fiche vêtement : les fiches s’ouvrent seulement depuis le Dressing.

Pièces pleine hauteur (robes, salopettes, combinaisons) :

- Elles sont dans le carrousel des hauts, intercalées selon le même ordre (rotation, favoris avantagés, puis adéquation — voir `SPEC.md` §7).
- Quand une robe arrive, le bas s’efface pendant le glissement (`fading-piece` en maquette) et disparaît au relâchement. Revenir sur un haut fait réapparaître le bas d’avant.
- Si la première proposition du matin est une robe, la ligne des bas est vide dès l’ouverture. Chaussures et couches restent indépendantes.

Mise en œuvre : `react-native-reanimated-carousel` (prop `loop`) ou un `Gesture.Pan` de react-native-gesture-handler avec Reanimated ; l’opacité est interpolée sur la position. Mouvement réduit : pas de glissement animé, fondu enchaîné court.
