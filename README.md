# Projet NE307
### Requis
- Avoir NodeJS d'installé (https://nodejs.org/en/download/prebuilt-installer/current)
- Utiliser une machine sous Windows (ou Linux mais il faudrait changer les lignes suivantes pour les adapter au terminal utilisé) :
```javascript
    const server = child_process.exec('start cmd.exe /K node server.js'); // ligne 29 de admin.js
    const client = child_process.exec('start cmd.exe /K node client.js'); // ligne 105 de admin.js
```
- Lancer la commande ```npm install``` pour installer les dépendances du projet
### Utilisation
Pour utiliser le programme, il faut utiliser la commande ```node admin.js``` et se laisser guider par le menu

### Notes
L'envoi de message ne fonctionne qu'avec des caractères ASCII