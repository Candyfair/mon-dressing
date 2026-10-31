# WeatherBackground

Fond de l’écran Aujourd’hui : lin, halo de la météo en haut, taches en bas à gauche et dans le coin bas droit.

- Fond `linen` sur tout l’écran ; aucune couleur dans la zone des vêtements.
- Halo haut : deux taches floues (cœur à gauche, tache secondaire à droite) dans un conteneur de 290 pt masqué en dégradé, pour qu’il s’éteigne avant la tenue.
- Tache basse gauche : ellipse 340 × 380 pt, haut à 600 pt, centrée sur le bord gauche, qui déborde par le bas. Coin bas droit : ellipse 280 × 240 pt, haut à 720 pt, à partir de x = 250 pt. Rien derrière le centre du menu.
- Couleurs par météo : voir la table du README (pluie `eucalyptus`/`sage`, soleil `sun`/`ochre`/`apricot`, froid `plum-mist`/`pale-plum`/`plum-haze`).
- Flou `blur-halo`. Sur Android d’entrée de gamme, remplacer le flou par des dégradés radiaux pré-calculés.
- L’aperçu montre les trois écrans à 43 % de leur taille.
