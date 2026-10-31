# SortCard

Tri du soir sur Aujourd’hui (après 20 h). Remplace l’étiquette de programme, la température et le filet.

- Carte en verre 343 × 84 pt, `radius-card` : « Ranger la tenue du jour », « Appui long sur chaque pièce », anneau de progression (pièces triées / total). Les chaussures ont « Ranger » par défaut et comptent comme triées.
- Les badges du matin disparaissent : la tenue a été portée, son statut repart de zéro (seul le nombre de ports est gardé ; le favori reste géré à part et n’apparaît jamais ici).
- Choix d’une pièce : icône 28 pt en haut à droite de la pièce. Couleurs par issue : `sort-linge` (au sale) ou `sort-reporte` (aérer, ranger). Les pièces restent affichées normalement, sans opacité.
- Bouton rond (place de « Je porte cette tenue ») : armoire « Ranger le reste » tant que des pièces n’ont pas d’icône ; coche « Terminer le tri » quand tout est trié.
- Fin : anneau plein et coche, « Tenue rangée », résumé, lien « Modifier » (jusqu’au lendemain matin). Les pièces filent vers leur onglet (+1 Linge, +4 Dressing), la zone se vide : « Tout est rangé », météo du lendemain, personnage météo (`mascot`). La carte se retourne sur « 1 lavage évité » quand une pièce a été aérée.
- Première fois : invite « Aérer plutôt que laver ? » (Activer l’aération / Pas maintenant).
