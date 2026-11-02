# Réglages

> Spécification de référence pour l’implémentation. Maquettes : `mockups/10-reglages/`, captures : `screens/10-reglages/`.

## Objectif

Régler la semaine, les horaires, le linge et les notifications ; à propos de l’application.

## Composants du design system

SettingsGroup (lignes, interrupteurs, compteurs), Popup, Sheet, Button. Voir `design-system/components/<Nom>/README.md`.

## Règles et comportements

### Groupes (AN1, AN2)
- Ma semaine : Semaine type, Trajet du bureau, « Je sors le midi » (« La météo entre 11 h et 15 h compte dans la tenue. »), Ville.
- Horaires : Tenue prête à (7 h 00), Départ pour le bureau (8 h 30), Retour du bureau (18 h 30), Tri du soir à partir de (20 h 00). Les heures de départ et de retour fixent la météo qui compte dans la tenue les jours de bureau (`01-aujourdhui.md`).
- Linge : « L’étendoir sert de rangement », Temps de séchage (24 h), Aération, Ports avant lavage.
- Notifications : Tenue du matin, Rappel du tri du soir, Linge sec.
- Dressing de démo :
  - « Essayer avec le dressing de démo » seulement quand le dressing est entièrement vide : aucune pièce de l’utilisatrice et aucune pièce de démo. Les données de démo ne s’installent que dans ce cas.
  - Dès qu’il existe une pièce de l’utilisatrice, cette ligne disparaît, même après la suppression des pièces de démo.
  - Tant que des pièces de démo existent (installées, puis gardées quand l’utilisatrice a commencé son propre dressing) : « Supprimer les pièces de démo » (AN4, popup de confirmation).
  - Plus de pièces de démo et au moins une pièce de l’utilisatrice : le groupe « Dressing de démo » disparaît.
- À propos : Frog-à-porter et moi, Offrez-moi un thé, Écrire à la développeuse, Politique de confidentialité, Données météo, Version.

### Ports avant lavage (AN3)
- Compteur par type (T-shirt, Débardeur, Chemise, Robe, Pull, Jean, Pantalon, Manteau), valeurs de départ d’après l’ADEME (à confirmer), « Revenir aux valeurs de départ ».

### Frog-à-porter et moi (AN5)
- Présentation de la développeuse, origine du projet (texte à rédiger), « Vos données restent sur votre téléphone » (aucun compte, aucune donnée personnelle collectée ; seule la ville est envoyée au service météo), contact, gratuité.

### Offrez-moi un thé (AN6)
- Achats intégrés consommables : 2 €, 5 €, 10 €. Pas de lien de paiement externe (règles App Store / Google Play). Aucune fonction débloquée.

## Accessibilité

- Interrupteurs : rôle switch, nommés par le libellé de leur ligne (à ajouter : les maquettes n’ont pas de nom sur les interrupteurs).
- Toute la ligne est la zone tactile.

## Questions ouvertes

- Texte « L’origine du projet », photo, adresse e-mail de contact.
- Politique de confidentialité (à rédiger avant publication ; lien obligatoire dans les stores et dans l’application).
- Sources météo et attribution.

## Écrans validés

### AN1 — Réglages — haut (clair)

- Capture : `screens/10-reglages/Settings-AN1-Reglages.webp`
- Maquette : `mockups/10-reglages/Settings-AN1-Reglages.html`


Textes visibles (dans l’ordre de lecture) :

- « Réglages »
- « Ma semaine »
- « Semaine type »
- « Bureau 3 j · Télé 2 j »
- « Trajet du bureau »
- « Vélo »
- « Je sors le midi »
- « La météo entre 11 h et 15 h compte dans la tenue. »
- « Ville »
- « Lyon · position »
- « Horaires »
- « Tenue prête à »
- « 7 h 00 »
- « Départ pour le bureau »
- « 8 h 30 »
- « Retour du bureau »
- « 18 h 30 »
- « Tri du soir à partir de »
- « 20 h 00 »
- « Linge »
- « L’étendoir sert de rangement »
- « Les pièces sèches restent disponibles. »
- « Temps de séchage »
- « 24 h »
- « Aération »


Noms accessibles :

- button — Retour à Aujourd’hui


### AN2 — Réglages — bas (défilement) (clair)

- Capture : `screens/10-reglages/Settings-AN2-Reglages-Bas.webp`
- Maquette : `mockups/10-reglages/Settings-AN2-Reglages-Bas.html`


Textes visibles (dans l’ordre de lecture) :

- « Réglages »
- « Ports avant lavage »
- « Repères »
- « Notifications »
- « Tenue du matin »
- « Rappel du tri du soir »
- « Linge sec »
- « Dressing de démo »
- « Essayer avec le dressing de démo »
- « Proposé tant que votre dressing est vide. »
- « À propos »
- « Frog-à-porter et moi »
- « Offrez-moi un thé »
- « Écrire à la développeuse »
- « Politique de confidentialité »
- « Données météo »
- « Sources »
- « Version »
- « 1.0 »


Noms accessibles :

- button — Retour à Aujourd’hui


### AN3 — Réglages — ports avant lavage (clair)

- Capture : `screens/10-reglages/Settings-AN3-Ports-Avant-Lavage.webp`
- Maquette : `mockups/10-reglages/Settings-AN3-Ports-Avant-Lavage.html`


Textes visibles (dans l’ordre de lecture) :

- « Ports avant lavage »
- « Au-delà, l’icône conseillée du tri du soir passe de « aérer » à « au sale ». Vous restez libre de votre choix. »
- « T-shirt »
- « 1 »
- « Débardeur »
- « Chemise »
- « 2 »
- « Robe »
- « Pull »
- « 5 »
- « Jean »
- « 6 »
- « Pantalon »
- « 4 »
- « Manteau »
- « 10 »
- « Valeurs de départ d’après les repères de l’ADEME, à confirmer. »
- « Revenir aux valeurs de départ »


Noms accessibles :

- button — Retour aux réglages
- button — Moins
- button — Plus


### AN4 — Réglages — supprimer le dressing de démo (clair)

- Capture : `screens/10-reglages/Settings-AN4-Supprimer-Demo.webp`
- Maquette : `mockups/10-reglages/Settings-AN4-Supprimer-Demo.html`


Textes visibles (dans l’ordre de lecture) :

- « Réglages »
- « Aération »
- « Proposer d’aérer plutôt que laver. »
- « Ports avant lavage »
- « Repères »
- « Notifications »
- « Tenue du matin »
- « Rappel du tri du soir »
- « Linge sec »
- « Dressing de démo »
- « Supprimer les pièces de démo »
- « Vos propres pièces sont conservées. »
- « À propos »
- « Frog-à-porter et moi »
- « Offrez-moi un thé »
- « Écrire à la développeuse »
- « Politique de confidentialité »
- « Données météo »
- « Sources »
- « Version »
- « 1.0 »
- « Supprimer le dressing de démo ? »
- « Les pièces d’exemple disparaissent du Dressing, du Linge et des tenues. Vos propres pièces sont conservées. »
- « Garder »
- « Supprimer »


Noms accessibles :

- button — Retour à Aujourd’hui


### AN5 — Réglages — Frog-à-porter et moi (clair)

- Capture : `screens/10-reglages/Settings-AN5-A-Propos.webp`
- Maquette : `mockups/10-reglages/Settings-AN5-A-Propos.html`


Textes visibles (dans l’ordre de lecture) :

- « Frog-à-porter et moi »
- « Photo »
- « Bonjour, moi c’est Candice »
- « Développeuse de Frog-à-porter »
- « L’origine du projet »
- « Texte à rédiger : pourquoi cette application, pour qui, ce qui vous tient à cœur. »
- « Vos données restent sur votre téléphone »
- « Aucun compte, aucune donnée personnelle collectée. Vos photos et vos vêtements sont enregistrés uniquement sur ce téléphone. Seule votre ville est envoyée au service météo pour obtenir les prévisions. »
- « Politique de confidentialité »
- « Une idée, un souci ? »
- « Écrivez-moi : je lis tous les messages. »
- « adresse e-mail à définir »
- « Frog-à-porter est gratuit »
- « Sans publicité ni abonnement. Si l’application vous rend service, vous pouvez m’offrir un thé. »


Noms accessibles :

- button — Retour aux réglages
- img — Photo ou illustration de la développeuse


### AN6 — Réglages — offrez-moi un thé (clair)

- Capture : `screens/10-reglages/Settings-AN6-The.webp`
- Maquette : `mockups/10-reglages/Settings-AN6-The.html`


Textes visibles (dans l’ordre de lecture) :

- « Frog-à-porter et moi »
- « Photo »
- « Bonjour, moi c’est Candice »
- « Développeuse de Frog-à-porter »
- « L’origine du projet »
- « Texte à rédiger : pourquoi cette application, pour qui, ce qui vous tient à cœur. »
- « Vos données restent sur votre téléphone »
- « Aucun compte, aucune donnée personnelle collectée. Vos photos et vos vêtements sont enregistrés uniquement sur ce téléphone. Seule votre ville est envoyée au service météo pour obtenir les prévisions. »
- « Politique de confidentialité »
- « Une idée, un souci ? »
- « Écrivez-moi : je lis tous les messages. »
- « adresse e-mail à définir »
- « Frog-à-porter est gratuit »
- « Sans publicité ni abonnement. Si l’application vous rend service, vous pouvez m’offrir un thé. »
- « Offrez-moi un thé »
- « Un don libre, sans rien débloquer en échange : l’application reste la même pour tout le monde. Merci ! »
- « Un thé »
- « 2 € »
- « Un thé et une part de gâteau »
- « 5 € »
- « Une théière pour toute l’équipe »
- « 10 € »
- « Paiement sécurisé par l’App Store ou Google Play. »


Noms accessibles :

- button — Retour aux réglages
- img — Photo ou illustration de la développeuse


### AO1 — Réglages sombres (sombre)

- Capture : `screens/10-reglages/Dark-AO1-Reglages.webp`
- Maquette : `mockups/10-reglages/Dark-AO1-Reglages.html`


Textes visibles (dans l’ordre de lecture) :

- « Réglages »
- « Ma semaine »
- « Semaine type »
- « Bureau 3 j · Télé 2 j »
- « Trajet du bureau »
- « Vélo »
- « Je sors le midi »
- « La météo entre 11 h et 15 h compte dans la tenue. »
- « Ville »
- « Lyon · position »
- « Horaires »
- « Tenue prête à »
- « 7 h 00 »
- « Départ pour le bureau »
- « 8 h 30 »
- « Retour du bureau »
- « 18 h 30 »
- « Tri du soir à partir de »
- « 20 h 00 »
- « Linge »
- « L’étendoir sert de rangement »
- « Les pièces sèches restent disponibles. »
- « Temps de séchage »
- « 24 h »
- « Aération »


Noms accessibles :

- button — Retour à Aujourd’hui


### AO2 — Réglages sombres — bas (sombre)

- Capture : `screens/10-reglages/Dark-AO2-Reglages-Bas.webp`
- Maquette : `mockups/10-reglages/Dark-AO2-Reglages-Bas.html`


Textes visibles (dans l’ordre de lecture) :

- « Réglages »
- « Ports avant lavage »
- « Repères »
- « Notifications »
- « Tenue du matin »
- « Rappel du tri du soir »
- « Linge sec »
- « Dressing de démo »
- « Essayer avec le dressing de démo »
- « Proposé tant que votre dressing est vide. »
- « À propos »
- « Frog-à-porter et moi »
- « Offrez-moi un thé »
- « Écrire à la développeuse »
- « Politique de confidentialité »
- « Données météo »
- « Sources »
- « Version »
- « 1.0 »


Noms accessibles :

- button — Retour à Aujourd’hui


### AO3 — Réglages sombres — ports avant lavage (sombre)

- Capture : `screens/10-reglages/Dark-AO3-Ports-Avant-Lavage.webp`
- Maquette : `mockups/10-reglages/Dark-AO3-Ports-Avant-Lavage.html`


Textes visibles (dans l’ordre de lecture) :

- « Ports avant lavage »
- « Au-delà, l’icône conseillée du tri du soir passe de « aérer » à « au sale ». Vous restez libre de votre choix. »
- « T-shirt »
- « 1 »
- « Débardeur »
- « Chemise »
- « 2 »
- « Robe »
- « Pull »
- « 5 »
- « Jean »
- « 6 »
- « Pantalon »
- « 4 »
- « Manteau »
- « 10 »
- « Valeurs de départ d’après les repères de l’ADEME, à confirmer. »
- « Revenir aux valeurs de départ »


Noms accessibles :

- button — Retour aux réglages
- button — Moins
- button — Plus


### AO4 — Réglages sombres — supprimer la démo (sombre)

- Capture : `screens/10-reglages/Dark-AO4-Supprimer-Demo.webp`
- Maquette : `mockups/10-reglages/Dark-AO4-Supprimer-Demo.html`


Textes visibles (dans l’ordre de lecture) :

- « Réglages »
- « Aération »
- « Proposer d’aérer plutôt que laver. »
- « Ports avant lavage »
- « Repères »
- « Notifications »
- « Tenue du matin »
- « Rappel du tri du soir »
- « Linge sec »
- « Dressing de démo »
- « Supprimer les pièces de démo »
- « Vos propres pièces sont conservées. »
- « À propos »
- « Frog-à-porter et moi »
- « Offrez-moi un thé »
- « Écrire à la développeuse »
- « Politique de confidentialité »
- « Données météo »
- « Sources »
- « Version »
- « 1.0 »
- « Supprimer le dressing de démo ? »
- « Les pièces d’exemple disparaissent du Dressing, du Linge et des tenues. Vos propres pièces sont conservées. »
- « Garder »
- « Supprimer »


Noms accessibles :

- button — Retour à Aujourd’hui


### AO5 — Réglages sombres — Frog-à-porter et moi (sombre)

- Capture : `screens/10-reglages/Dark-AO5-A-Propos.webp`
- Maquette : `mockups/10-reglages/Dark-AO5-A-Propos.html`


Textes visibles (dans l’ordre de lecture) :

- « Frog-à-porter et moi »
- « Photo »
- « Bonjour, moi c’est Candice »
- « Développeuse de Frog-à-porter »
- « L’origine du projet »
- « Texte à rédiger : pourquoi cette application, pour qui, ce qui vous tient à cœur. »
- « Vos données restent sur votre téléphone »
- « Aucun compte, aucune donnée personnelle collectée. Vos photos et vos vêtements sont enregistrés uniquement sur ce téléphone. Seule votre ville est envoyée au service météo pour obtenir les prévisions. »
- « Politique de confidentialité »
- « Une idée, un souci ? »
- « Écrivez-moi : je lis tous les messages. »
- « adresse e-mail à définir »
- « Frog-à-porter est gratuit »
- « Sans publicité ni abonnement. Si l’application vous rend service, vous pouvez m’offrir un thé. »


Noms accessibles :

- button — Retour aux réglages
- img — Photo ou illustration de la développeuse


### AO6 — Réglages sombres — offrez-moi un thé (sombre)

- Capture : `screens/10-reglages/Dark-AO6-The.webp`
- Maquette : `mockups/10-reglages/Dark-AO6-The.html`


Textes visibles (dans l’ordre de lecture) :

- « Frog-à-porter et moi »
- « Photo »
- « Bonjour, moi c’est Candice »
- « Développeuse de Frog-à-porter »
- « L’origine du projet »
- « Texte à rédiger : pourquoi cette application, pour qui, ce qui vous tient à cœur. »
- « Vos données restent sur votre téléphone »
- « Aucun compte, aucune donnée personnelle collectée. Vos photos et vos vêtements sont enregistrés uniquement sur ce téléphone. Seule votre ville est envoyée au service météo pour obtenir les prévisions. »
- « Politique de confidentialité »
- « Une idée, un souci ? »
- « Écrivez-moi : je lis tous les messages. »
- « adresse e-mail à définir »
- « Frog-à-porter est gratuit »
- « Sans publicité ni abonnement. Si l’application vous rend service, vous pouvez m’offrir un thé. »
- « Offrez-moi un thé »
- « Un don libre, sans rien débloquer en échange : l’application reste la même pour tout le monde. Merci ! »
- « Un thé »
- « 2 € »
- « Un thé et une part de gâteau »
- « 5 € »
- « Une théière pour toute l’équipe »
- « 10 € »
- « Paiement sécurisé par l’App Store ou Google Play. »


Noms accessibles :

- button — Retour aux réglages
- img — Photo ou illustration de la développeuse

