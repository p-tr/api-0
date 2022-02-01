const fs = require('fs');
const _ = require('lodash');

const express = require('express');
const app = express();

const { connect, model, Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const jwt = require('jsonwebtoken');

const cookieParser = require('cookie-parser');

const secret = 'ChangeMe!';

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

// Parse HTTP cookies
app.use(cookieParser());

// Parse HTTP request body
app.use(express.json());

// Middleware d'authentification
app.use((req, res, next) => {
  // les cookies sont dans req.cookies
  // l'en tête d'autorisation est dans req.get('authorization')

  res.locals.user = null;

  const data = [
    req.cookies.authorization,
    req.get('authorization')
  ].map((item) => {
    if(item) {
      const splitted = item.trim().split(' ');
      const token = splitted.length > 1
        ? splitted[splitted.length - 1]
        : splitted[0];

      try {
        const decoded = jwt.verify(token, secret);
        return decoded;
      } catch(err) {
        return null;
      }
    } else {
      return null;
    }
  });

  const session = data.find((element) => {
    return (typeof element === 'object');
  })

  res.locals.user = session ? { _id: session.sub } : null;

  next();
});

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

    POST /auth/token : authentification
    DELETE /auth/token : désauthentification
    GET /auth/token : décodage du token d'authentification

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

  function getStatusCode(err) {
    let status = 500;

    if(err.name === "ValidationError") {
      status = 400;

      const { errors } = err;

      for(property in errors) {
        if(errors[property].kind === "unique") {
          status = 409;
        }
      }
    }

    return status;
  }

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
    try {
      const movies = await Movie.find({}).exec();
      res.json(movies);
    } catch(err) {
      const status = getStatusCode(err);
      res.status(status).json(err);
    }
  });

  app.get('/movies/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const movie = await Movie.findById(id).exec();

      if(movie) {
        res.json(movie);
      } else {
        res.status(404).json({
          code: 404,
          message: "Not Found"
        });
      }
    } catch(err) {
      const status = getStatusCode(err);
      res.status(status).json(err);
    }
  });

  app.post('/movies', async (req, res) => {
    // ajout d'un élément dans la BDD
    const { title, description, year, director, producers } = req.body;
    try {
      const movie = await Movie.create({ title, description, year, director, producers });
      res.status(201).json(movie);
    } catch(err) {
      const status = getStatusCode(err);
      res.status(status).json(err);
    }
  });

  app.put('/movies/:id', async (req, res) => {
    const { title, description, year, director, producers } = req.body;
    const { id } = req.params;

    try {
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
    } catch(err) {
      const status = getStatusCode(err);
      res.status(status).json(err);
    }
  });

  app.delete('/movies/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const removed = await Movie.findByIdAndRemove(id);

      if(removed) {
        res.status(204).end();
      } else {
        res.status(404).json({
          code: 404,
          message: "Not Found"
        });
      }
    } catch(err) {
      const status = getStatusCode(err);
      res.status(status).json(err);
    }
  });

  app.post('/auth/token', (req, res) => {
    const { username = "", password = "" } = req.body;
    const expiresIn = 3600;

    // En temps normal, le processus d'authentification est implémenté ici.

    const token = jwt.sign(
      { sub: username },
      secret,
      // HS256 = HMAC SHA 256 => symétrique
      // RS512 = RSA SHA 512 => asymétrique
      { algorithm: 'HS256', expiresIn }
    );

    res.cookie('authorization', token, { httpOnly: true });
    res.set('Authorization', token);

    res.status(201).json({
      token,
      expiresIn
    });
  });

  app.get('/user', (req, res) => {
    res.json(res.locals.user);
  });

  app.delete('/auth/token', (req, res) => {
    res.clearCookie('authorization');
  });

  app.listen(3000, () => {
    console.log('Listening on :3000...');
  });

}).catch((err) => {
  console.log(err);
})
