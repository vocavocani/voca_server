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
        INSERT INTO quiz(user_idx, team_idx, quiz_title, quiz_set)
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
        quiz_set
      FROM quiz
      WHERE quiz_idx = ?; 
      `;
    pool.query(sql, [data.quiz_idx], (err, rows) => {
      if (err){
        reject(err)
      } else{
        resolve(rows[0]);
      }
    });
  });
};


/***************
 * 퀴즈 제출
 * @param data
 */
exports.submitQuiz = (data) => {
  return new Promise((resolve, reject) => {
    const sql =
      `
      INSERT INTO quiz_solved(user_idx, quiz_idx, quiz_solved_set)
      VALUES (?, ?, ?);
      `;
    pool.query(sql, [data.user_idx, data.quiz_idx, data.quiz_set], (err, rows) => {
      if (err){
        reject(err);
      } else {
        if(rows.affectedRows === 1){ // INSERT SUCCESS
          resolve(rows);
        } else {
          const _err = new Error('Quiz submit error');
          reject(_err);
        }
      }
    });
  }).then((result) => {
    return new Promise((resolve ,reject) => {
      const sql =
        `
        SELECT *
        FROM quiz_solved
        WHERE quiz_solved_idx = ?
        `;
      pool.query(sql, [result.insertId], (err, rows) => {
        if (err){
          reject(err);
        } else {
          resolve(rows[0]);
        }
      });
    });
  });
};


/***********
 * 문제 채점
 * @param data
 * @returns {Promise}
 */
exports.grading = (data) => {
  return new Promise((resolve, reject) => {
    const sql =
      `
      SELECT
        quiz_idx,
        quiz_title,
        quiz_set
      FROM quiz
      WHERE quiz_idx = ?
      `;
    pool.query(sql, [data.quiz_idx], (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows[0]);
      }
    });
  });
};



