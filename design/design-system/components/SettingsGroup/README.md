# SettingsGroup

Groupe de lignes de réglage sur une carte en verre (`md-glass`, `radius-card`), précédé d’un titre de groupe en petites capitales (`md-group-title`). Les réglages sont un écran à part, ouvert depuis le bouton réglages de l’en-tête.

- Ligne (`md-row`) : hauteur minimale 52 pt, icône `row-icon` 20 pt, libellé 15 pt, sous-titre facultatif en `ink-secondary`, séparateur `divider` (pas après la dernière ligne).
- À droite, une seule commande : valeur + chevron (ouvre un écran ou un sélecteur), interrupteur (`md-switch`, rail `switch-off`, `select` quand il est activé, curseur `cream`), ou compteur (`md-stepper`, boutons ronds 34 pt en contour `outline-edge`, zone tactile `size-tap`).
- Ligne de suppression : texte et icône `secondary` (prune), sous-titre qui rassure (« Vos propres pièces sont conservées. »). Toujours suivie d’une popup de confirmation.
- Groupes validés : Ma semaine, Horaires, Linge, Notifications, Dressing de démo (essayer quand le dressing est vide, supprimer sinon), À propos (Mon Dressing et moi, Offrez-moi un thé, Écrire à la développeuse, Politique de confidentialité, Données météo, Version).
- Le pourboire « Offrez-moi un thé » passe par l’achat intégré des stores (2, 5 et 10 €), jamais par un lien de paiement externe.
- Accessibilité : un interrupteur porte `role="switch"` et le nom de sa ligne ; toute la ligne est la zone tactile.
