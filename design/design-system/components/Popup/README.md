# Popup

Popup centrée pour confirmer une action qu’on ne peut pas défaire (supprimer une pièce, supprimer les pièces de démo). Jamais empilée sur une feuille : la feuille se ferme d’abord.

- Fond `sheet`, `radius-popup`, `shadow-popup` ; en sombre, filet `sheet-edge` tout autour. Voile `scrim` derrière.
- Contenu centré : la pièce concernée en grand (`garment-popup`, avec son ombre de contact), titre en question (« Supprimer ce T-shirt ? »), une phrase qui dit la conséquence.
- Deux boutons côte à côte (`size-button-dialog`) : l’issue sûre à gauche en contour (« Garder »), l’action à droite en `destructive` (« Supprimer »). Pas de rouge.
- Accessibilité : `role="alertdialog"`, titre et texte reliés ; le focus initial va sur « Garder ».
