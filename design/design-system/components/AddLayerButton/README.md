# AddLayerButton

Bouton « Ajouter une couche » : ajoute une colonne de couches (veste, manteau) quand la tenue n’a qu’une colonne.

- Rond de `size-tap`, fond `add-fill`, bordure pointillée 1,5 pt `add-dash`, signe « + » 20 pt en `forest`. Les pointillés disent « emplacement vide », pas « action forte ».
- Placé à gauche des vêtements, à 18 pt du bord de la zone tenue, centré verticalement sur le haut.
- Disparaît dès qu’une couche est ajoutée (passage en deux colonnes).
- Pendant qu’on glisse une pièce de la tenue, il s’efface (opacité 0) et revient au relâchement.
