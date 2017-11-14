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
  let result;

  try{
    const data = {
      quiz_idx: req.params.quiz_idx
    };
    result = await quizModel.getQuiz(data);

    result.quiz_set = JSON.parse(result.quiz_set);


    let contentLength = result.quiz_set.length;
    let answersLength = [];

    for (let i = 0; i < contentLength; i++) { // 선택지가 몇개있는지 확인
      answersLength.push(result.quiz_set[i].answers.length);
    }

    for (let i = 0; i < contentLength; i++) { // 순회하면서 정답 삭제
      for (let j = 0; j < answersLength[i]; j++) {
        result.quiz_set[i].answers[j].is_right = undefined;
      }
    }



  } catch (error){
    return next(error);
  }

  return res.json(result);
};


/************
 * 문제 제출
 * @param req
 * @param res
 * @param next
 * @returns {Promise.<*>}
 */
exports.submitQuiz = async(req, res, next) => {
  let result;


  try {
    const data = {
      quiz_idx: req.params.quiz_idx,
      user_idx: 1,
      quiz_set: JSON.stringify(req.body.quiz_set)
    };

    result = await quizModel.submitQuiz(data);

    console.log(result);
    result.quiz_solved_set = JSON.parse(result.quiz_solved_set);
  }catch (error){
    return next(error);
  }


  return res.json(result);
};


/*****************
 * 문제 채점
 * @param req
 * @param res
 * @param next
 * @returns {Promise.<*>}
 */
exports.grading = async(req, res, next) => {
  let result;
  let quizData;

  try {
    const reqData = {
      quiz_idx: req.params.quiz_idx,
      user_idx: req.body.user_idx,
      quiz_set: req.body.quiz_set
    };

    quizData = await quizModel.getQuiz(reqData); // 디비에서 문제를 불러옴

    // 디비의 값과 바디에 담긴 값을 비교하여 채점

    quizData.quiz_set = JSON.parse(quizData.quiz_set);

    // console.log('quizData: ',quizData);
    // console.log('reqData: ', reqData);


    let contentLength = quizData.quiz_set.length;
    let answersLength = [];

    for (let i = 0; i < contentLength; i++) { // 선택지가 몇개있는지 확인
      answersLength.push(quizData.quiz_set[i].answers.length);
    }
    for (let i = 0; i < contentLength; i++) { // 순회하면서 오답 인덱스 삭제
      for (let j = 0; j < answersLength[i]; j++) {
        if (quizData.quiz_set[i].answers[j].is_right === false){
          quizData.quiz_set[i].answers[j] = undefined;
        }

      }
    }

    let getLength = (obj) => {
      let size = 0, key = null;
      for (key in obj) {
        if (obj.hasOwnProperty(key)) {
          size +=1;
        }
        if (obj[key] === undefined){
          size -= 1;
        }

      }
      return size;
    };





    let correctCnt =0;
    let incorrectCnt =0;

    for(let i =0 ; i<quizData.quiz_set.length; i++){
      for(let j =0 ; j<getLength(quizData.quiz_set[i].answers); j++){

        console.log(quizData.quiz_set[i].answers[j], reqData.quiz_set[i].answers[j]);

        if (quizData.quiz_set[i].answers[j].answer_idx === reqData.quiz_set[i].answers[j].answer_idx){
          correctCnt++;

        } else{
          incorrectCnt++;

        }
      }
    }
    console.log(correctCnt+"개 맞음");
    console.log(incorrectCnt+"개 틀림");


  } catch (error) {
    return next(error);
  }


  return res.json()
};