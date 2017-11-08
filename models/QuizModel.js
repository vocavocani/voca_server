'use strict';

const mysql = require('mysql');
const DBConfig = require('./../config/DBConfig');
const pool = mysql.createPool(DBConfig);
const transactionWrapper = require('./TransactionWrapper');


/*******************
 * 퀴즈 출제
 * @param data
 * @returns {Promise}
 */
exports.setQuiz = (data) => {
  return new Promise((resolve, reject) => {
    const sql =
      `
        INSERT INTO quiz(user_idx, team_idx, quiz_title, quiz_content)
        VALUES (?, ?, ?, ?);
      `;
    pool.query(sql, [data.user_idx, data.team_idx, data.quiz_title, data.quiz_content], (err, rows) => {
      if (err){
        reject(err);
      } else{
        resolve(rows);
      }
    })
  });
};

exports.getQuiz = (data) => {
  return new Promise((resolve, reject) => {
    const sql =
      `
      SELECT 
        quiz_idx,
        quiz_title,
        quiz_content
      FROM quiz
      WHERE quiz_idx = 4; 
      `;
    pool.query(sql, [data], (err, rows) => {
      if (err){
        reject(err)
      } else{
        resolve(rows[0]);
      }
    });
  });
};


exports.solveQuiz = (data) => {
  return new Promise((resolve, reject) => {
    const sql =
      `
      SELECT 
        quiz_idx,
        quiz_title,
        quiz_content
      FROM quiz
      WHERE quiz_idx = 4;
      `;
    pool.query(sql, data, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows);
      }
    });
  });

};