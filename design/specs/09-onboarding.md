# Premier lancement et onboarding

> Spécification de référence pour l’implémentation. Maquettes : `mockups/09-onboarding/`, captures : `screens/09-onboarding/`.

## Objectif

Premier lancement : promettre la valeur en une phrase, régler le strict nécessaire (ville, semaine, trajet), puis mener à l’ajout en rafale ou au dressing de démo.

## Composants du design system

Button, Dots, Option, Sheet. Voir `design-system/components/<Nom>/README.md`.

## Règles et comportements

- AL1 : « Chaque matin, une tenue prête selon la météo et votre journée. » Deux portes : « Créer mon dressing » et « Découvrir avec un dressing de démo ».
- AL2 Ville : « Utiliser ma position » ou recherche de ville. Seule la ville sert à la météo.
- AL3 Semaine type : chaque jour Bureau / Télétravail / Détente. Un jour différent se change le matin même.
- AL4 Trajet : plusieurs choix possibles (À pied, Vélo, Trottinette, Transports en commun, Voiture, Moto).
- AL5 Prêt : « Il ne manque que vos vêtements », « Commencer l’ajout en rafale », « Essayer avec le dressing de démo », « Plus tard ». Les libellés de démo d’AL1 et AL5 restent différents.
- En-tête : « Retour », points d’étapes, « Passer ». Bouton principal pleine largeur en `action` (vert forêt / moutarde).
- Dressing de démo : pièces d’exemple marquées comme telles. Elles ne s’installent que si le dressing est vide, et ne cohabitent pas par défaut avec les pièces de l’utilisatrice.
- Dès que l’utilisatrice commence à photographier ses propres vêtements, l’application propose d’effacer les pièces de démo (`07-ajout-en-rafale.md`, AV1 et AW1). Si elle refuse, elles restent et se suppriment d’un coup dans les réglages, sans toucher à ses propres pièces.

## Accessibilité

- Étapes : barre de progression « Étape 2 sur 3 ».
- Choix de la semaine : groupes de boutons radio par jour.

## Questions ouvertes

- Contenu exact du dressing de démo.
- Illustration d’accueil du personnage.

## Écrans validés

### AL1 — Premier lancement — deux portes (clair)

- Capture : `screens/09-onboarding/Onboarding-AL1-Accueil.webp`
- Maquette : `mockups/09-onboarding/Onboarding-AL1-Accueil.html`


Textes visibles (dans l’ordre de lecture) :

- « Frog-à-porter »
- « Chaque matin, une tenue prête selon la météo et votre journée. »
- « Avec les vêtements que vous avez vraiment, et rien à remplir chaque jour. »
- « Grenouille »
- « accueil »
- « Créer mon dressing »
- « Découvrir avec un dressing de démo »


Noms accessibles :

- img — Personnage météo : grenouille


### AL2 — Onboarding — ville (clair)

- Capture : `screens/09-onboarding/Onboarding-AL2-Ville.webp`
- Maquette : `mockups/09-onboarding/Onboarding-AL2-Ville.html`


Textes visibles (dans l’ordre de lecture) :

- « Passer »
- « Où êtes-vous ? »
- « Pour la météo de chaque matin. Vous pourrez la changer dans les réglages. »
- « Utiliser ma position »
- « ou »
- « Lyo »
- « Lyon »
- « Rhône »
- « Lyon 3e Arrondissement »
- « Lyons-la-Forêt »
- « Eure »


Noms accessibles :

- button — Retour
- progressbar — Étape 1 sur 3
- listbox — Villes


### AL3 — Onboarding — semaine type (clair)

- Capture : `screens/09-onboarding/Onboarding-AL3-Semaine.webp`
- Maquette : `mockups/09-onboarding/Onboarding-AL3-Semaine.html`


Textes visibles (dans l’ordre de lecture) :

- « Passer »
- « Votre semaine type »
- « Elle sert à choisir la bonne tenue chaque jour. Un jour différent ? On le change le matin même. »
- « Lundi »
- « Bureau »
- « Télétravail »
- « Détente »
- « Mardi »
- « Mercredi »
- « Jeudi »
- « Vendredi »
- « Samedi »
- « Dimanche »
- « Continuer »


Noms accessibles :

- button — Retour
- progressbar — Étape 2 sur 3
- radiogroup — Lundi
- radiogroup — Mardi
- radiogroup — Mercredi
- radiogroup — Jeudi
- radiogroup — Vendredi
- radiogroup — Samedi
- radiogroup — Dimanche


### AL4 — Onboarding — trajet du bureau (clair)

- Capture : `screens/09-onboarding/Onboarding-AL4-Trajet.webp`
- Maquette : `mockups/09-onboarding/Onboarding-AL4-Trajet.html`


Textes visibles (dans l’ordre de lecture) :

- « Passer »
- « Comment allez-vous au bureau ? »
- « Plusieurs choix possibles. Il apparaîtra à côté de votre programme, chaque matin. »
- « À pied »
- « Vélo »
- « Trottinette »
- « Transports en commun »
- « Voiture »
- « Moto »
- « Continuer »


Noms accessibles :

- button — Retour
- progressbar — Étape 3 sur 3


### AL5 — Onboarding — prêt, vers l’ajout en rafale (clair)

- Capture : `screens/09-onboarding/Onboarding-AL5-Pret.webp`
- Maquette : `mockups/09-onboarding/Onboarding-AL5-Pret.html`


Textes visibles (dans l’ordre de lecture) :

- « Grenouille »
- « contente »
- « Il ne manque que vos vêtements »
- « Photographiez-les à la suite : quelques secondes par pièce. Commencez par les hauts, les bas et une paire de chaussures. »
- « Commencer l’ajout en rafale »
- « Essayer avec le dressing de démo »
- « Plus tard »


Noms accessibles :

- img — Personnage météo : grenouille


### AM1 — Premier lancement — sombre (sombre)

- Capture : `screens/09-onboarding/Dark-AM1-Accueil.webp`
- Maquette : `mockups/09-onboarding/Dark-AM1-Accueil.html`


Textes visibles (dans l’ordre de lecture) :

- « Frog-à-porter »
- « Chaque matin, une tenue prête selon la météo et votre journée. »
- « Avec les vêtements que vous avez vraiment, et rien à remplir chaque jour. »
- « Grenouille »
- « accueil »
- « Créer mon dressing »
- « Découvrir avec un dressing de démo »


Noms accessibles :

- img — Personnage météo : grenouille


### AM2 — Onboarding sombre — ville (sombre)

- Capture : `screens/09-onboarding/Dark-AM2-Ville.webp`
- Maquette : `mockups/09-onboarding/Dark-AM2-Ville.html`


Textes visibles (dans l’ordre de lecture) :

- « Passer »
- « Où êtes-vous ? »
- « Pour la météo de chaque matin. Vous pourrez la changer dans les réglages. »
- « Utiliser ma position »
- « ou »
- « Lyo »
- « Lyon »
- « Rhône »
- « Lyon 3e Arrondissement »
- « Lyons-la-Forêt »
- « Eure »


Noms accessibles :

- button — Retour
- progressbar — Étape 1 sur 3
- listbox — Villes


### AM3 — Onboarding sombre — semaine type (sombre)

- Capture : `screens/09-onboarding/Dark-AM3-Semaine.webp`
- Maquette : `mockups/09-onboarding/Dark-AM3-Semaine.html`


Textes visibles (dans l’ordre de lecture) :

- « Passer »
- « Votre semaine type »
- « Elle sert à choisir la bonne tenue chaque jour. Un jour différent ? On le change le matin même. »
- « Lundi »
- « Bureau »
- « Télétravail »
- « Détente »
- « Mardi »
- « Mercredi »
- « Jeudi »
- « Vendredi »
- « Samedi »
- « Dimanche »
- « Continuer »


Noms accessibles :

- button — Retour
- progressbar — Étape 2 sur 3
- radiogroup — Lundi
- radiogroup — Mardi
- radiogroup — Mercredi
- radiogroup — Jeudi
- radiogroup — Vendredi
- radiogroup — Samedi
- radiogroup — Dimanche


### AM4 — Onboarding sombre — trajet (sombre)

- Capture : `screens/09-onboarding/Dark-AM4-Trajet.webp`
- Maquette : `mockups/09-onboarding/Dark-AM4-Trajet.html`


Textes visibles (dans l’ordre de lecture) :

- « Passer »
- « Comment allez-vous au bureau ? »
- « Plusieurs choix possibles. Il apparaîtra à côté de votre programme, chaque matin. »
- « À pied »
- « Vélo »
- « Trottinette »
- « Transports en commun »
- « Voiture »
- « Moto »
- « Continuer »


Noms accessibles :

- button — Retour
- progressbar — Étape 3 sur 3


### AM5 — Onboarding sombre — prêt (sombre)

- Capture : `screens/09-onboarding/Dark-AM5-Pret.webp`
- Maquette : `mockups/09-onboarding/Dark-AM5-Pret.html`


Textes visibles (dans l’ordre de lecture) :

- « Grenouille »
- « contente »
- « Il ne manque que vos vêtements »
- « Photographiez-les à la suite : quelques secondes par pièce. Commencez par les hauts, les bas et une paire de chaussures. »
- « Commencer l’ajout en rafale »
- « Essayer avec le dressing de démo »
- « Plus tard »


Noms accessibles :

- img — Personnage météo : grenouille

