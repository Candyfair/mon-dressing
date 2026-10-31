# EmptySlot

Silhouette d’une pièce manquante dans la tenue du jour, quand le dressing ne contient pas encore de pièce de cette catégorie (Aujourd’hui guidé).

- Même taille et même place que la pièce qu’elle remplace (`garment-top`, `garment-bottom`, `garment-shoes`), sans ombre de contact.
- Contour en pointillés `slot-edge` (3,5 / 3), remplissage `slot-fill`.
- Au centre de la pièce, un « + » rond 40 pt en `add-action` avec `shadow-add` : centré verticalement sur la silhouette (le pantalon au niveau de l’entrejambe, les chaussures sur la tige).
- Toute la silhouette est la zone tactile ; elle ouvre l’appareil photo de l’ajout en rafale avec le type déjà choisi. Nom accessible : « Ajouter un bas ».
- Sous l’en-tête, une phrase dit ce qui manque (`md-hint`, `role="status"`) : « Encore 1 haut, 1 bas et 1 paire de chaussures », puis « Encore 1 bas et 1 paire de chaussures », puis « Encore 1 paire de chaussures ». Elle disparaît quand la tenue est complète.
- Le bouton « Ajouter une couche » est masqué tant qu’il n’y a pas de haut.
- Seulement pour une catégorie jamais ajoutée. Si les pièces existent mais sont toutes au linge, l’emplacement affiche l’icône « au sale », « Vos bas sont au linge » et le lien « Trier le linge ».
