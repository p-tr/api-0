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
    fs.readFile('movies.json', { encoding: 'utf8' }, (err, movies) => {
      err ? reject(err) : resolve(JSON.parse(movies));
    });
  });
}

function db_save(movies) {
  return new Promise((resolve, reject) => {
    fs.writeFile('movies.json', JSON.stringify(movies), { encoding: 'utf8' }, (err) => {
      err ? reject(err) : resolve();
    });
  });
}

db_load().then((movies) => {

  function findMovieById(id) {
    return _.find(movies, (item) => {
      return (item.id === id);
    })
  }

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
    res.json(movies);
  });

  app.get('/movies/:id', (req, res) => {
    const { id } = req.params;

    const movie = findMovieById(id);

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
    const { title, description, year, director, producer, id } = req.body;

    let movie = findMovieById(id);

    if(movie) {
      res.status(409).json({
        code: 409,
        message: "Movie already exists !",
      });
    } else {
      movie = { title, description, year, director, producer, id };
      movies.push(movie);

      db_save(movies).then(() => {
        res.status(201).json(movie);
      }).catch((err) => {
        console.error("Erreur d'écriture dans la BDD");
        console.error(err);
      });

      /*
        version avec await :
          - nécessite async (req, res) au lieu de (req, res)
          - db_save().then(() => { ... }) remplacé par await db_save(); ...

        try {
          await db_save();
          res.status(201).json(movie);
        } catch(err) {
          console.error(...);
        }
      */
    }
  });

  app.put('/movies/:id', async (req, res) => {
    const { title, description, year, director, producer } = req.body;
    const { id } = req.params;

    let movie = findMovieById(id);

    if(movie) {
      movie.title = title;
      movie.description = description;
      movie.year = year;
      movie.director = director;
      movie.producer = producer;

      db_save(movies).then(() => {
        res.status(204).end();
      });

    } else {
      res.status(404).json({
        code: 404,
        message: "Not Found"
      });
    }
  });

  app.delete('/movies/:id', (req, res) => {
    const { id } = req.params;

    const removed = _.remove(movies, (item) => {
      return item.id === id;
    });

    if(removed) {
      db_save(movies).then(() => {
        res.status(204).end();
      });
    } else {
      res.status(404).json({
        code: 404,
        message: "Not Found"
      });
    }
  });

  app.listen(3000, () => {
    console.log('Listening on :3000...');
  });

}).catch((err) => {
  console.log('Error while loading database');
})
