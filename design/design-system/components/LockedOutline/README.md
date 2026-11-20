# LockedOutline

Contour dessiné à main levée autour de la tenue, tant qu’elle est validée pour la journée. Il dit « cette tenue est choisie » sans ajouter de pictogramme : le seul cadenas est dans la pastille « Portée aujourd’hui » du bouton de validation, qui chevauche le coin bas droit du contour.

- Rectangle arrondi (rayon 40 pt) autour de la boîte englobante des pièces, marge 12 pt, en une ou deux colonnes.
- Deux traits `action` : principal 2,6 pt, second 1,2 pt à 55 %, légèrement décalé. Bouts et jonctions arrondis, le tracé dépasse un peu son départ.
- Tremblé déterministe (graine fixe) : le même contour à chaque ouverture.
- Se dessine en 760 ms à la validation, s’efface en remontant son tracé (300 ms) à l’annulation ; affiché sans animation quand l’app s’ouvre sur une tenue déjà validée. Mouvement réduit : fondu de 200 ms.
- Décoratif pour le lecteur d’écran : l’état est porté par le bouton (« Portée aujourd’hui, toucher pour annuler »).
- Valeurs exactes : `design/specs/01-aujourdhui.md`, section « Validation de la tenue ».
