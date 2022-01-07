const fs = require('fs');
const _ = require('lodash');

const express = require('express');
const app = express();

app.use(express.json());

/*
  Il s'agit de mettre en oeuvre une API ultra-basique avec
  un CRUD (Create Read Update Delete) pour illustrer l'approche
  REST.

  Le sujet : une collection de films

  Le support de BDD : un fichier JSON contenant une collection de
  films => support de persistance devra utiliser le module 'fs'
  de NodeJS

  Les routes (URI / endpoints), autrement dit, en termes REST,
  les RESSOURCES

    /movies       => collection de tous les films dans la BDD
    /movies/:id   => un film identifié par son ID

    /             => racine de l'API


  Les méthodes HTTP :
    GET           => lecture / recherche
    POST          => ajouter un film dans la collection
    PUT           => mettre à jour l'entrée d'un film dans la BDD
    DELETE        => suppression d'un film

  Configuration du routeur Express.JS :
    GET / : racine de l'API

    GET /movies : collection des films / recherche
    POST /movies : ajout d'un film
    GET /movies/:id : information d'un film par ID
    PUT /movies/:id : mettre à jour un film (par ID)
    DELETE /movies/:id : suppression d'un film (par ID)

*/

// Fonctionnalités annexes
//  ======================
// Chargement de la base de données depuis le fichier movies.json :
//  - lire le fichier
//  - parser le texte JSON en objet JS
//  - avoir la BDD dans une variable (en RAM)
// Sauvegarde de la base de données dans le fichier movies.json :
//  - sérialiser l'objet JS de la BDD en texte
//  - écrire le nouveau contenu du fichier

function db_load() {
  return new Promise((resolve, reject) => {
    fs.readFile('movies.json', { encoding: 'utf8' }, (err, data) => {
      err ? reject(err) : resolve(JSON.parse(data));
    });
  });
}

function db_save(data) {
  return new Promise((resolve, reject) => {
    fs.writeFile('movies.json', { encoding: 'utf8' }, JSON.stringify(data), (err) => {
      err ? reject(err) : resolve();
    });
  });
}

db_load().then((data) => {

  app.get('/', (req, res) => {
    res.json({
      version: '1.0',
    });
  });

  app.get('/movies', (req, res) => {
    // Toute recherche est implémentée ici ;-)
    // Comme nous sommes en logique de ressource (une URI = une ressource)
    // les recherches se font via la QS :
    //  - possibilité de faire des recherches par champ
    //  - possibilité de donner un paramètre pour limiter le nombre d'items
    //    dans la collection répondue
    //  - possibilité de "paginer" les résultats.
    res.json(data);
  });

  app.get('/movies/:id', (req, res) => {
    const { id } = req.params;

    const movie = _.find(data, (item) => {
      return (item.id === id);
    });

    if(movie) {
      res.json(movie);
    } else {
      res.status(404).json({
        code: 404,
        message: "Not Found"
      });
    }
  });

  app.post('/movies', (req, res) => {
    // ajout d'un élément dans la BDD

  });

  app.put('/movies/:id', (req, res) => {

  });

  app.delete('/movies/:id', (req, res) => {

  });

  app.listen(3000, () => {
    console.log('Listening on :3000...');
  });

}).catch((err) => {
  console.log('Impossible de charger la DB !');
})
