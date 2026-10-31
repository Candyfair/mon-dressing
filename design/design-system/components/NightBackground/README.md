# NightBackground

Fond de l’écran Aujourd’hui en sombre : nuit, dégradé de crépuscule teinté par la météo, écho en bas à gauche, lueur de lampe et grain.

- Fond `night` commun aux trois météos ; pas de halo lumineux.
- Crépuscule : dégradé vertical sur les 360 pt du haut, de `twilight-pluie`, `twilight-soleil` ou `twilight-froid` vers transparent (dans les écrans validés : 55 % de la teinte à 45 % de la hauteur).
- Écho : dégradé radial depuis le coin bas gauche, en `twilight-…-low`, sur 375 × 300 pt.
- Lampe : ellipse `lamp-glow` de 335 × 480 pt derrière la tenue.
- Grain : bruit fractal en niveaux de gris (fréquence 0,9, deux octaves) sur tout l’écran, à `grain-opacity`. Dans l’application, une petite texture répétée suffit.
- Le menu prend la teinte de la météo (`tabbar-pluie`, `tabbar-soleil`, `tabbar-froid`) ; le bouton de validation passe en `action` (moutarde).
- L’aperçu montre les trois écrans à 43 % de leur taille.
