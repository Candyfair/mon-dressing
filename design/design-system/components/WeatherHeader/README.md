# WeatherHeader

En-tête de l’écran Aujourd’hui : date, programme, réglages, grande température, lignes météo et filet.

- Ligne du haut (44 pt) : date en style `date`, puis l’étiquette de programme (ProgramChip) alignée à droite, puis le bouton réglages (IconButton).
- Ligne météo (70 pt) : température actuelle en `temperature`, maximum en `temperature-range` (couleur `forest`), et à droite une colonne de deux lignes `weather-line` avec icône 16 pt : la météo, puis le rappel (« Parapluie conseillé vers 12 h 30 »).
- Filet de 2 pt en `forest-deep` sous l’ensemble.
- Placé à 50 pt du haut, marges `space-16`, posé directement sur le halo météo.

Le consommateur fournit la date courte, les températures, deux lignes météo au plus et le programme du jour. Une ligne longue passe sur deux lignes, jamais sous la date.
