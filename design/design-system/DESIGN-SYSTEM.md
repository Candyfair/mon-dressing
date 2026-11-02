# Frog-à-porter

Le système de design de l’application mobile Frog-à-porter (iOS et Android, téléphone uniquement), en deux thèmes : « Cocon du matin » (clair) et « Cocon du soir » (sombre). Il est tiré des écrans validés du canevas (colonne « Écrans validés ») : Aujourd’hui (J, L), changement d’une pièce (AP, AQ) et état guidé (AR, AS), tri du soir (X, Y, AA, AB), Dressing (S, T2, U, V), Linge (AE, AF), ajout en rafale (AG, AH), fiche vêtement (AJ, AK), premier lancement et onboarding (AL, AM), réglages (AN, AO), et du brief de conception.

L’application propose la tenue du jour à partir de la météo, du programme et des vêtements disponibles. On l’utilise le matin, à une main, souvent pressé. Trois valeurs guident chaque choix : la rapidité (décider en quelques secondes), un assistant et pas un journal (aucune corvée quotidienne), la sobriété.

## Thèmes

Le thème suit le réglage du système (clair ou sombre). Les composants utilisent les jetons de rôle, qui changent de valeur selon le thème : `ground`, `ink`, `ink-secondary`, `ink-accent`, `control-ink`, `tab-ink`, `rule`, `action`, `on-action`, `pastille`, `pastille-edge`, `location-ink`, `piece-edge`, `tabbar-pluie`, `tabbar-soleil`, `tabbar-froid`, `select`, `indicator`, `row-icon`, et les surfaces (`glass`, `glass-edge`, `tabbar-edge`, `chip-divider`, `location-tint`, `add-fill`, `add-dash`, `contact-shadow`, `sheet`, `sheet-edge`, `scrim`, `handle`, `control-fill`, `divider`, `option-edge`, `option-on`, `tile-fill`, `tile-edge`, `outline-edge`, `switch-off`). Les autres couleurs sont la palette.

Le mode sombre est conçu, pas inversé : même structure, même échelle des vêtements, mais une autre manière de dire la météo (dégradé de crépuscule au lieu des halos).

## Principes visuels

- **Le fond, c’est la lumière du moment.** Le matin, l’écran est couleur lin avec un halo flou de la couleur de la météo. Le soir, l’écran est de nuit avec un dégradé de crépuscule teinté par la météo et un grain fin.
- **Les vêtements flottent.** Pas de cadre ni de carte autour de la tenue : les pièces sont posées sur le fond, avec une ombre de contact (`contact-shadow`) sous chacune. En sombre, un liseré lumineux (`piece-edge`) les détache de la nuit.
- **Verre dépoli pour les commandes.** Étiquette, boutons ronds et menu sont translucides et floutés. Sur Android d’entrée de gamme, repli sans flou en semi-opaque.
- **Caractère par la typographie.** Grotesque expressive (Space Grotesk) pour la date et la grande température, Instrument Sans pour le reste. Sans empattement uniquement.
- **La couleur ne porte jamais seule l’information.** Chaque état se lit aussi par la forme, la taille ou un texte.

Mots-clés : cosy, lumière chaude du matin, cocon du soir, naturel, assuré, calme, joyeux sans être enfantin.

## Trois ambiances météo

L’application n’a que trois ambiances visuelles. Les autres conditions s’y rattachent ; l’icône et les lignes météo de l’en-tête portent la nuance.

| Ambiance | Conditions rattachées | Icône |
|---|---|---|
| Pluie | pluie, averses, nuageux, couvert | nuage de pluie ou nuage |
| Soleil | ensoleillé, doux, forte chaleur | soleil ou thermomètre |
| Froid | froid, grand froid, neige | thermomètre ou flocon |

## La météo et ses couleurs — thème clair

| Météo | Halo haut (cœur · tache droite) | Tache basse gauche | Coin bas droit |
|---|---|---|---|
| Pluie | `eucalyptus` · `sage` | `eucalyptus` | `sage` |
| Soleil | `sun` · `ochre` | `sun` | `apricot` |
| Froid | `plum-mist` · `pale-plum` | `pale-plum` | `plum-haze` |

Placement sur 375 × 812 pt (composant WeatherBackground) :

- Halo haut : conteneur de 290 pt de haut, masqué en dégradé (opaque jusqu’à 45 %, transparent en bas) pour s’éteindre avant les vêtements.
- Tache basse gauche : ellipse 340 × 380 pt dont le haut est à 600 pt, centrée sur le bord gauche ; elle déborde par le bas de l’écran et laisse le milieu de l’écran clair.
- Coin bas droit : ellipse 280 × 240 pt dont le haut est à 720 pt, à partir de x = 250 pt.
- Intensité : 100 % (`blur-halo`).

## La météo et ses couleurs — thème sombre

Pas de halo : les taches lumineuses ne se marient pas avec un fond de nuit. À la place (composant NightBackground) :

| Météo | Crépuscule (haut) | Écho (bas gauche) | Menu |
|---|---|---|---|
| Pluie | `twilight-pluie` | `twilight-pluie-low` | `tabbar-pluie` (cacao) |
| Soleil | `twilight-soleil` | `twilight-soleil-low` | `tabbar-soleil` (prune) |
| Froid | `twilight-froid` | `twilight-froid-low` | `tabbar-froid` (prune profonde) |

- Fond `night` commun aux trois météos.
- Crépuscule : dégradé linéaire vertical sur les 360 pt du haut, de la teinte pleine à 55 % vers 45 %, puis transparent.
- Écho : dégradé radial ancré dans le coin bas gauche (ellipse 85 % × 100 % de 375 × 300 pt).
- Lueur de lampe `lamp-glow` derrière la tenue.
- Grain : bruit fractal en niveaux de gris sur tout l’écran, à `grain-opacity`.
- Les teintes sont volontairement proches : la météo se devine plus qu’elle ne se voit.

## Rôles des couleurs

- `action` est réservé à l’action principale (« Je porte cette tenue », « Lessive faite ») : vert forêt en clair, moutarde en sombre. L’état actif de la navigation ne l’utilise jamais.
- Menu : sauge unique en clair ; une teinte par météo en sombre (cacao, prune, prune profonde). Pastille active crème dans les deux thèmes, cerclée de `moss-deep` en clair seulement.
- `ink` pour le texte, `ink-secondary` pour le texte secondaire. Jamais `moss` ni `olive` en texte.
- `secondary` (prune) pour les actions secondaires et les filtres ; `add-action` (prune) pour l’ajout de vêtements ; `mustard` en accent rare en clair (favori, icône conseillée).
- Statuts d’une pièce : une teinte par statut (`status-*`), voir StatusIcon. Tri du soir : deux teintes seulement, selon l’issue (`sort-linge`, `sort-reporte`). Les deux systèmes ne s’affichent jamais ensemble.
- Sélection (Linge, options, interrupteurs, tuile de type) : `select`, vert forêt en clair, moutarde en sombre, comme `action`. Les boutons principaux de l’onboarding sont aussi en `action`.
- Indicateurs (points de carrousel, étapes) : `indicator`, vert forêt en clair, crème en sombre.
- Suppression : `destructive` (prune) après une popup de confirmation.
- Pas de rouge ni de couleur d’alarme, même pour le linge sale.

## L’écran Aujourd’hui

De haut en bas, sur 375 × 812 pt (iPhone 12 mini, écran de référence) :

1. **En-tête** à 50 pt du haut, marges `space-16` : date, étiquette de programme alignée à droite avant le bouton réglages, grande température et lignes météo, filet `rule` de 2 pt.
2. **Tenue** de 194 à 684 pt, sans cadre.
3. **Bouton de validation** rond, flottant à droite (`space-40` du bord), son centre à 684 pt.
4. **Menu du bas** centré, à `space-24` du bas.

La barre d’état et l’indicateur d’accueil du système ne sont jamais dessinés : la zone reste libre.

## La tenue : règles de taille

On habille une vraie personne, ce n’est pas un catalogue produit.

- **Une colonne** (pas de couche) : haut et bas à la même échelle (`garment-top` = `garment-bottom`), chaussures plus petites (`garment-shoes`). `space-10` entre les pièces, jamais de chevauchement. Colonne centrée.
- **Deux colonnes** (couches) : la colonne de gauche porte la couche 1 puis la couche 2 (`garment-layer`), la couche 1 alignée horizontalement avec le haut. La colonne de droite porte haut, bas et chaussures (`garment-two-col` pour haut et bas).
- **Pièce pleine hauteur** (robe, salopette, combinaison) : une pièce unique pour le haut et le bas, à la même échelle. Son haut s’aligne sur celui d’un haut ; les chaussures restent à leur place en bas. L’espace entre les deux figure les jambes. Elle se trouve dans le carrousel des hauts (voir SwapCarousel).
- Le bouton « Ajouter une couche » apparaît à gauche du haut quand il n’y a qu’une colonne.
- Le badge de localisation se pose contre l’épaule de la pièce concernée.
- En sombre, chaque pièce reçoit `piece-edge` (drop-shadow 0 0 0,75 pt) puis `shadow-piece-glow`.

Les illustrations de vêtements des maquettes sont provisoires : les vraies pièces seront des photos détourées, avec la photo d’origine en repli. Vérifier la lisibilité des pièces blanches sur `linen` et des pièces foncées sur `night`.

## L’écran Dressing

- En-tête : titre « Dressing » 34 pt et AddButton ; catégories en pastilles (Hauts, Couches, Bas, Robes, Chaussures ; active crème, contour `moss-deep` en clair) ; filtres prune (Disponibles, Favoris, Sport) et bouton grille à droite.
- Carrousel « étagère » : pièce centrale `garment-carousel` sur une ligne de sol commune, voisines 150 pt écartées et estompées. Sous la pièce, centrés : badge « Pièce forte », « Porté 1 fois » (icône boucle), statuts actifs (StatusIcon 44 pt), compteur « 12 / 38 ». Pas de nom.
- Grille : GridTile, deux par ligne. États vides : EmptyState.

## Changer une pièce

Sur Aujourd’hui, chaque ligne de la tenue se glisse pour proposer une autre pièce compatible (SwapCarousel). Au relâchement, les autres propositions s’effacent. Les carrousels bouclent. Une seule pièce compatible : léger rebond. En deux colonnes, la colonne de droite se glisse dans son couloir et toucher une couche ouvre une feuille de choix (Sheet). Pas de lien vers la fiche vêtement depuis Aujourd’hui.

## Aujourd’hui guidé

Tant que le dressing ne permet pas une tenue complète, Aujourd’hui montre ce qui manque au lieu d’un écran vide : les pièces présentes à leur place, une silhouette en pointillés (EmptySlot) pour chaque catégorie jamais ajoutée, et une phrase sous l’en-tête (« Encore 1 bas et 1 paire de chaussures »). Toucher une silhouette ouvre l’ajout en rafale avec le type choisi. Le bouton de validation est désactivé jusqu’à ce que la tenue ait un haut et un bas (ou une pièce pleine hauteur) ; chaussures et couches restent facultatives. Si une catégorie existe mais que tout est au linge, ce n’est pas le guidage : « Vos bas sont au linge » et « Trier le linge ».

## Feuilles et popups

Une tâche courte s’ouvre dans une feuille (Sheet) qui garde l’écran visible sous un voile ; sa hauteur suit son contenu. Une action qu’on ne peut pas défaire se confirme dans une popup centrée (Popup), jamais empilée sur une feuille.

## La fiche vêtement

Ouverte seulement depuis le Dressing (toucher une pièce), dans une feuille. On n’y change pas les statuts de linge : ils se gèrent dans le Linge et le tri du soir. Suppression par une popup avec la pièce en grand.

## L’ajout en rafale

Appareil photo plein écran, photo puis type : une feuille propose les tuiles de type (Option), les bascules Favori, Pièce forte et Se repasse, et le volet « Plus de détails » (usages par groupes : Météo, Activité, Déplacement, Occasion). Les usages sont toujours posés par l’utilisatrice ; l’application ne recommande rien. Sans usage dans un groupe, la pièce est proposée dans tous les cas. L’appareil photo reste sombre dans les deux thèmes ; la feuille suit le thème.

## Premier lancement et onboarding

Deux portes : commencer, ou « Découvrir avec un dressing de démo ». Trois étapes (ville, semaine type, trajet) avec points d’étapes (Dots), « Retour » et « Passer » ; bouton principal pleine largeur en `action`. L’écran final repropose « Essayer avec le dressing de démo ». Les deux libellés restent différents.

## Les réglages

Écran ouvert depuis le bouton réglages de l’en-tête : groupes de lignes en verre (SettingsGroup). Ma semaine (dont « Je sors le midi » : la météo entre 11 h et 15 h compte), Horaires, Linge, Notifications, Dressing de démo, À propos. Le pourboire passe par l’achat intégré des stores ; la politique de confidentialité est un lien obligatoire (stores et application).

## Le tri du soir

Après 20 h, Aujourd’hui devient le tri de la tenue portée : SortCard, RadialMenu limité à favori, aérer, au sale, ranger, et fin animée (envol vers les onglets, écran vidé, météo du lendemain, personnage météo, carte « lavage évité »). Les animations se jouent une fois ; mouvement réduit : état final directement.

## Le Linge

Quatre étagères (LaundryShelf) dans l’ordre du cycle : Au sale → « Lessive faite » → À sécher → (24 h, réglable) → Sur l’étendoir → « Linge rangé » → Dressing. Les pièces à repasser ont un double statut tant qu’elles sont sur l’étendoir ; rangées sans être repassées, elles restent dans « À repasser » (panier propre). L’étendoir comme espace de rangement est activé par défaut et désactivable dans les réglages ; il s’explique à l’onboarding ou au bon moment.

## Personnage météo

Une grenouille kawaii, au trait seul (même trait que les icônes), sans couleur, 116 pt. Six tenues selon la météo du lendemain : forte chaleur (contente), ensoleillé (lunettes de soleil), nuageux (manteau), pluie (parapluie et bottes), froid (bonnet et écharpe), neige (skis et bâtons). Les esquisses du canevas (planche AC) servent de référence : la version finale sera redessinée. En sombre, trait crème.

## Typographie

Deux familles Google Fonts (OFL), sans fichier local : `display` (Space Grotesk) et `text` (Instrument Sans). Les styles sont dans `tokens.json`. Chiffres tabulaires pour la température. Le texte suit la taille de police du système (Dynamic Type) ; prévoir que les libellés français sont plus longs.

## Iconographie

Icônes au trait, grille 24 pt, trait 1,7 à 1,8 pt, bouts et jonctions arrondis, couleur héritée du texte. Pas d’émoji.

- **Étiquette de programme** : l’activité en texte, le mode de transport en icône seule (vélo, vélo de route, à pied, transports en commun en train). L’icône porte un nom accessible (« à vélo »). Sans transport (« Télétravail »), pas d’icône.
- **Menu** : machine à laver (Linge), cintre (Aujourd’hui), armoire (Dressing).
- **Statuts et tri** : cœur (favori), vent (balcon, aérer), machine à laver (au sale), vêtement mouillé à une goutte (à sécher), corde à linge (étendoir), fer à pointe (à repasser), armoire (ranger), boucle (porté), feuille (lavage évité).
- **Météo** : nuage de pluie, parapluie, soleil, thermomètre, flocon.

## Gestes

Grammaire fixe : glisser = choisir ou parcourir (tous les carrousels bouclent) ; toucher = voir en grand ; appui long = agir (menu flottant, voir RadialMenu). Exception : dans le Linge, toucher une pièce la sélectionne (écran de tâches par lots). Pas de double toucher. Jamais deux carrousels horizontaux côte à côte : en mode deux colonnes, le prototype Expo doit vérifier qu’un glissement reste dans sa colonne.

## Accessibilité

- Contraste texte ≥ 4,5:1 ; éléments d’interface et indicateurs ≥ 3:1, dans les deux thèmes.
- Clair : la pastille active tient son contraste par le contour `moss-deep` ; ne pas l’éclaircir.
- Sombre : coche `on-action` sur moutarde ≈ 6,5:1 ; pastille crème sur les trois menus ≥ 5:1 ; `ink-secondary` à vérifier sous le crépuscule.
- Cibles tactiles ≥ 44 pt (`size-tap`).
- Les actions de l’appui long sont aussi exposées comme actions d’accessibilité.
- Mouvement réduit : carrousel à plat, fondus enchaînés ; changer une pièce se fait par fondu, sans glissement animé.
- Feuilles et popups : le focus y entre à l’ouverture et revient sur l’élément d’origine à la fermeture.

## Voix

Interface en français d’abord (anglais au niveau 2). Phrases courtes, verbes d’action : « Je porte cette tenue », « Lessive faite », « Ajouter une couche ». Contenus réalistes, jamais de texte de remplissage. Espaces insécables avant `%` et dans les heures (« 18 h », « 12 h 30 »).

## Implémentation

React Native / Expo, Reanimated 4, expo-image. Le verre utilise expo-blur avec un repli semi-opaque sur Android. Le grain peut être une petite texture répétée plutôt qu’un filtre. Les composants de ce système sont des maquettes HTML de référence, pas du code à importer.

## Pas encore couvert

Carrousel de repassage, personnage météo final, durées d’animation (à régler sur le prototype Expo).
