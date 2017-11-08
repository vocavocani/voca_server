'use strict';

const quizModel = require('../models/QuizModel');


/**********
 * 퀴즈 출제
 * @param req
 * @param res
 * @param next
 * @returns {Promise.<*>}
 */
exports.setQuiz = async(req, res, next) => {
  let result = '';

  console.log(req.body.quiz_set);


  try {

    //TODO is_right에 true 값만 따로 빼서 저장
    const data = {
      user_idx: req.body.user_idx,
      team_idx: req.body.user_idx,
      quiz_title: req.body.quiz_title,
      quiz_content: JSON.stringify(req.body.quiz_set)
    };
    result = await quizModel.setQuiz(data);

  } catch (error) {
    return next(error);
  }



  // success
  return res.json(result);
};

exports.getQuiz = async(req, res, next) => {
  let result = '';

  try{
    const data = {

    };
    result = await quizModel.getQuiz(data);

    result.quiz_content = JSON.parse(result.quiz_content);


    console.log(result);

  } catch (error){
    return next(error);

  }

  return res.json(result);
};

exports.solveQuiz = async(req, res, next) => {
  let result;

  try {
    const data = {

    };

    console.log(req.body);
    result = await quizModel.solveQuiz(data);

  } catch  (erorr) {
    return next(error);
  }


  return res.json(result)
};