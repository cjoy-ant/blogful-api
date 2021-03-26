const path = require("path");
const express = require("express");
const xss = require("xss");
const ArticlesService = require("./articles-service");

const articlesRouter = express.Router();
const jsonParser = express.json();

const serializeArticle = (article) => ({
  id: article.id,
  title: xss(article.title),
  style: article.style,
  content: xss(article.content),
  date_published: article.date_published,
});

articlesRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    ArticlesService.getAllArticles(knexInstance)
      .then((articles) => {
        res.json(articles.map(serializeArticle));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { title, content, style } = req.body;
    const newArticle = { title, content, style };
    const knexInstance = req.app.get("db");

    // refractored req.body validation code above for required params
    for (const [key, value] of Object.entries(newArticle)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` },
        });
      }
    }

    ArticlesService.insertArticle(knexInstance, newArticle)
      .then((article) => {
        res
          .status(201)
          //.location(`articles/${article.id}`)
          //.location(req.originalUrl + `/${article.id}`)
          .location(path.posix.join(req.originalUrl, `/${article.id}`))
          .json(serializeArticle(article));
      })
      .catch(next);
  });

articlesRouter
  .route("/:article_id")
  .all((req, res, next) => {
    const knexInstance = req.app.get("db");
    ArticlesService.getById(knexInstance, req.params.article_id)
      .then((article) => {
        if (!article) {
          return res.status(404).json({
            error: { message: `Article doesn't exist` },
          });
        }
        res.article = article; // save the article for the next middleware
        next(); // don't forget to call next so the next middleware happens!
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json({
      id: res.article.id,
      style: res.article.style,
      title: xss(res.article.title), // sanitize title
      content: xss(res.article.content), // sanitize content
      date_published: res.article.date_published,
    });
  })
  .delete((req, res, next) => {
    const knexInstance = req.app.get("db");
    ArticlesService.deleteArticle(knexInstance, req.params.article_id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { title, content, style } = req.body;
    const articleToUpdate = { title, content, style };

    const numberOfValues = Object.values(articleToUpdate).filter(Boolean)
      .length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body must contain either 'title', 'style' or 'content'`,
        },
      });
    }

    const knexInstance = req.app.get("db");
    ArticlesService.updateArticle(
      knexInstance,
      req.params.article_id,
      articleToUpdate
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = articlesRouter;
