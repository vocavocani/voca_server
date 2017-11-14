'use strict';

const validate = require('express-validation');
const ParamValidation = require('../config/ParamValidation');

const quizCtrl = require('../controllers/QuizCtrl');


module.exports = (router) => {

  router.route('/quiz')
    .post(quizCtrl.setQuiz);

  router.route('/quiz/:quiz_idx')
    .get(quizCtrl.getQuiz)
    .post(quizCtrl.submitQuiz);

  router.route('/quiz/:quiz_idx/grading')
    .post(quizCtrl.grading);

  return router;

};
