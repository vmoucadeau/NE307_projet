# Projet NE307
Auteur : Vincent MOUCADEAU
Last edit : 16-06-2024

### Requis
- Avoir NodeJS d'installé (https://nodejs.org/en/download/prebuilt-installer/current)
- ~~Utiliser une machine sous Windows~~  : L'application est maintenant compatible avec l'invité de commande Windows ainsi qu'avec gnome-terminal sur Linux (il suffit d'avoir l'interface graphique Gnome, présente sur Fedora et Ubuntu par exemple)
- Lancer la commande ```npm install``` pour installer les dépendances du projet
### Utilisation
Pour utiliser le programme, il faut utiliser la commande ```node admin.js``` et se laisser guider par le menu

### Notes
- ~~Il y a un petit bug d'envoi de message avec les caractères non ASCII pour le moment~~ Les caractères ascii étendu sont maintenant pris en charge, notamment les accents
- ~~L'action suppresion de client ne fonctionne pas encore avec l'admin~~ Il est maintenant possible de supprimer un client depuis l'admin

### Bugs connus
- Lors de l'envoi d'un message trop long (environ 1600 caractères), le client crash. Je n'ai pas encore identifié la source du problème.
