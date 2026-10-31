# Sheet

Feuille qui monte du bas pour une tâche courte, sans quitter l’écran : fiche vêtement (depuis le Dressing), type de pièce et « Plus de détails » (ajout en rafale), choix d’une couche (Aujourd’hui, deux colonnes).

- Fond `sheet`, coins hauts `radius-sheet`, `shadow-sheet`. En sombre, filet `sheet-edge` en haut.
- Voile `scrim` sur l’écran derrière : on voit encore d’où vient la feuille.
- En tête : poignée `handle` (40 × 5 pt) centrée et bouton rond « Fermer » (`size-close`, fond `control-fill`, zone tactile `size-tap`). On ferme aussi en glissant vers le bas ou en touchant le voile.
- Hauteur ajustée au contenu : pas de zone vide. Elle ne s’étire que si le contenu le demande (fiche étirée, « Plus de détails » qui défile).
- Choix d’une couche : pas de titre ni de texte. Carrousel qui boucle, pièce centrale `garment-sheet`, voisines 150 pt à `neighbour-opacity`, points de position, puis « Retirer cette couche » (bouton secondaire prune). Glisser = choisir ; la tenue se met à jour derrière.
- Le défilement d’une feuille ne déclenche pas le geste de fermeture tant que son contenu n’est pas revenu en haut.
- Accessibilité : `role="dialog"`, `aria-modal`, nom accessible ; le focus entre dans la feuille et revient sur la pièce touchée à la fermeture.
