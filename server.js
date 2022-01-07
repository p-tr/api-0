const fs = require('fs');
const _ = require('lodash');

const express = require('express');
const app = express();

const { connect, model, Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

// Middlewares

// 406 & 415 status code middleware
app.use((req, res, next) => {
  if(!req.accepts('json')) {
    return res.status(406).json({ code: 406, message: 'Not Acceptable' });

  }

  if(req.is('json') === false) {
    return res.status(415).json({ code: 415, message: 'Unsupported Media Type' });
  }

  next();
});

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

connect('mongodb://localhost:27017/api').then(() => {

  // Mongoose Schemas
  const movieSchema = new Schema({
    title: {
      type: String,
      required: true,
      unique: true
    },

    description: {
      type: String,
      default: ""
    },

    year: {
      type: Number,
      required: true
    },

    director: {
      type: String,
      required: true
    },

    producers: {
      type: [String],
      required: true
    },
  });

  movieSchema.plugin(uniqueValidator);

  const Movie = model('Movie', movieSchema);



  app.get('/', (req, res) => {
    res.json({
      version: '1.0',
    });
  });

  app.get('/movies', async (req, res) => {
    // Toute recherche est implémentée ici ;-)
    // Comme nous sommes en logique de ressource (une URI = une ressource)
    // les recherches se font via la QS :
    //  - possibilité de faire des recherches par champ
    //  - possibilité de donner un paramètre pour limiter le nombre d'items
    //    dans la collection répondue
    //  - possibilité de "paginer" les résultats.
    const movies = await Movie.find({}).exec();
    res.json(movies);
  });

  app.get('/movies/:id', async (req, res) => {
    const { id } = req.params;

    const movie = await Movie.findById(id).exec();

    if(movie) {
      res.json(movie);
    } else {
      res.status(404).json({
        code: 404,
        message: "Not Found"
      });
    }
  });

  app.post('/movies', async (req, res) => {
    // ajout d'un élément dans la BDD
    const { title, description, year, director, producers } = req.body;
    const movie = await Movie.create({ title, description, year, director, producers });
    res.status(201).json(movie);
  });

  app.put('/movies/:id', async (req, res) => {
    const { title, description, year, director, producers } = req.body;
    const { id } = req.params;

    const movie = await Movie.findByIdAndUpdate(
      id,
      { title, description, year, director, producers },
      { runValidators: true }
    );

    if(movie) {
      res.status(204).end();
    } else {
      res.status(404).json({
        code: 404,
        message: "Not Found"
      });
    }
  });

  app.delete('/movies/:id', async (req, res) => {
    const { id } = req.params;

    const removed = await Movie.findByIdAndRemove(id);

    if(removed) {
      res.status(204).end();
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
  console.log('Mongoose connection error');
})
