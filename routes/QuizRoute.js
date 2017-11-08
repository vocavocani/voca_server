'use strict';

const validate = require('express-validation');
const ParamValidation = require('../config/ParamValidation');

const quizCtrl = require('../controllers/QuizCtrl');


module.exports = (router) => {

  router.route('/quiz')
    .get(quizCtrl.getQuiz)
    .post(quizCtrl.setQuiz);

  router.route('/quiz/:quiz_idx')
    .post(quizCtrl.solveQuiz);

  return router;

};
