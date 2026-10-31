# Mon Dressing — guide pour Claude Code

Application mobile (iOS et Android, téléphone uniquement) qui propose chaque matin la tenue du jour à partir de la météo, du programme et des vêtements disponibles. Développeuse unique : Candice. Ce dossier est la passation design → code : tout ce qui est ici a été validé écran par écran.

## Où trouver quoi

Ce guide est dans `design/` : tous les chemins ci-dessous sont relatifs à ce dossier (`specs/01-aujourdhui.md` = `design/specs/01-aujourdhui.md`). Le code de l’application vit hors de `design/`, qui n’est que de la documentation de référence.

- `handoff.html` : vue d’ensemble lisible dans un navigateur (tous les écrans validés, clair et sombre).
- `specs/` : une spécification par parcours (règles, états, textes exacts, noms accessibles, questions ouvertes). **À lire avant de coder un écran.**
- `specs/01-aujourdhui.md` — Aujourd’hui
- `specs/02-changer-une-piece.md` — Changer une pièce
- `specs/03-aujourdhui-guide.md` — Aujourd’hui guidé
- `specs/04-tri-du-soir.md` — Tri du soir
- `specs/05-dressing.md` — Dressing
- `specs/06-linge.md` — Linge
- `specs/07-ajout-en-rafale.md` — Ajout en rafale
- `specs/08-fiche-vetement.md` — Fiche vêtement
- `specs/09-onboarding.md` — Premier lancement et onboarding
- `specs/10-reglages.md` — Réglages
- `design-system/DESIGN-SYSTEM.md` : principes, thèmes, couleurs, tailles, gestes, accessibilité, voix.
- `design-system/tokens.json` : **source de vérité** des jetons (couleurs par thème `matin` / `soir`, espacements, rayons, ombres, tailles, opacités). Les valeurs `{nom}` renvoient à un autre jeton.
- `design-system/components/<Nom>/README.md` : règles de chaque composant ; `preview.html` et `bundle.css` sont des références visuelles HTML, pas du code à importer.
- `mockups/` : maquettes HTML statiques de chaque écran validé (375 × 812 pt). Référence de mise en page et de textes, **pas du code React Native à copier**.
- `screens/` : captures des maquettes (WebP, 2×).

## Pile technique

- React Native + Expo, TypeScript.
- Reanimated 4, react-native-gesture-handler, expo-image, expo-blur (repli semi-opaque sans flou sur Android d’entrée de gamme).
- Carrousels qui bouclent : `react-native-reanimated-carousel` (prop `loop`) ou `Gesture.Pan` + Reanimated.
- Polices Google Fonts (OFL) : Space Grotesk (affichage) et Instrument Sans (texte), via `expo-font`.

## Règles du projet

- Identifiants et commentaires de code **en anglais**. Textes d’interface **en français**, repris exactement des specs (espaces insécables avant `%` et dans les heures : « 18 h », « 12 h 30 »).
- Thème clair « Cocon du matin » et sombre « Cocon du soir », selon le réglage du système. Générer le thème de l’application à partir de `design-system/tokens.json` (un objet par thème) plutôt que de recopier des valeurs à la main.
- Utiliser les jetons de rôle (`ground`, `ink`, `action`, `select`, `sheet`…) dans les composants, jamais les couleurs de palette directement.
- Aucune donnée personnelle collectée, aucun compte, aucune publicité. Tout est stocké sur le téléphone (photos et données). Seule la ville est envoyée au service météo.
- L’application ne décide pas et ne recommande pas : elle filtre selon les usages que l’utilisatrice a donnés à chaque pièce. Sans usage dans un groupe, la pièce est proposée dans tous les cas.
- Pas de rouge ni de couleur d’alarme. Suppression en prune, après une popup de confirmation.
- Gestes : glisser = choisir ou parcourir (tous les carrousels bouclent) ; toucher = voir en grand ; appui long = agir (éventail). Exception : dans le Linge, toucher sélectionne.
- Accessibilité : contraste texte ≥ 4,5:1, cibles ≥ 44 pt, chaque geste a une action d’accessibilité équivalente, Dynamic Type respecté (libellés français plus longs), mouvement réduit respecté.
- Les illustrations de vêtements des maquettes sont provisoires : les vraies pièces sont des photos détourées sur l’appareil, avec la photo d’origine en repli.

## Façon de travailler

1. Lire la spec du parcours, puis `DESIGN-SYSTEM.md` et les README des composants qu’elle cite.
2. Comparer le rendu avec la capture correspondante dans `screens/` (clair et sombre).
3. En cas de doute ou de conflit entre une maquette et une spec, la spec fait foi ; signaler l’écart plutôt que trancher seul.
4. Les points listés en « Questions ouvertes » ne sont pas décidés : demander avant de les implémenter.

## Hors périmètre pour l’instant

- Politique de confidentialité (rédigée avant publication).
- Illustrations finales du personnage météo.
- Carrousel de repassage.
- Durées d’animation (à régler sur le prototype).
