'use strict';

const mysql = require('mysql');
const DBConfig = require('./../config/DBConfig');
const pool = mysql.createPool(DBConfig);
const transactionWrapper = require('./TransactionWrapper');


/**
 * TODO 조회값 추가
 * Post retrieve
 * @param team_idx
 */
exports.list = (team_idx) => {
  return new Promise((resolve, reject) => {
    const sql =
      `SELECT p.post_idx, p.user_idx, p.team_idx, p.post_content, p.post_created_at, p.post_updated_at, u.user_nickname
    FROM post as p
    LEFT JOIN user as u ON p.user_idx = u.user_idx
    WHERE p.team_idx = ? 
    `;

    pool.query(sql, team_idx, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};


/**
 * Post write
 * @param post_data = {user_idx, team_idx, post_contents}
 **/

exports.write = (postData) => {
  let postedIdx;
  return new Promise((resolve, reject) => {
    transactionWrapper.getConnection(pool)
      .then(transactionWrapper.beginTransaction)
      .then((context) => {
        return new Promise((resolve, reject) => {
          const sql =
            "INSERT INTO post (user_idx, team_idx, post_falg, post_title, post_content) " +
            "VALUES (?, ?, ?, ?, ?) ";
          context.conn.query(sql, [postData.user_idx, postData.team_idx, postData.post_flag, postData.post_title, postData.post_content], (err, rows) => {
            if (err) {
              context.error = err;
              reject(context)
            } else {
              if (rows.affectedRows === 1 ) {
                postedIdx = rows.insertId;
                context.result = rows;
                resolve(context)
              } else {
                context.error = new Error("Post Write Custom Error 1");
                reject(context)
              }
            }
          })
        })
      })
      .then((context) => {
        return new Promise((resolve, reject) => {

          let images = [];
          for(let i =0 ; i < postData.post_image.length; i++){
            images[i] = [context.result.insertId];
            images[i].push(postData.post_image[i].location)
          }

          const sql =
            "INSERT INTO post_image(post_idx, post_image_url) " +
            "VALUES ? ";
          context.conn.query(sql, [images], (err,rows) => {
            if (err) {
              context.error = err;
              reject(context)
            } else {
              if (rows.affectedRows === postData.post_image.length ) {
                context.result = rows;
                resolve(context)
              } else {
                context.error = new Error("Post Write Custom Error 2");
                reject(context)
              }
            }
          })
        });
      })
      .then((context) => {
        return new Promise((resolve, reject) => {
          const sql =
            `
              SELECT *
              FROM post AS p
              LEFT JOIN post_image AS pi ON pi.post_idx = p.post_idx
              WHERE p.post_idx = ? ;
            `;
          context.conn.query(sql, [postedIdx], (err,rows ) => {
            if (err) {
              context.error = err;
              reject(context)
            } else {
              context.result = rows;
              resolve(context)
            }
          })
        })
      })
      .then(transactionWrapper.commitTransaction)
      .then((context) => {
        context.conn.release();
        resolve(context.result);
      })
      .catch((context) => {
        context.conn.rollback(() => {
          context.conn.release();
          reject(context.error);
        })
      })
  })
};



// 담벼락 수정/삭제 권한 확인
// 본인이 작성한 글만 수정삭제 가능
// 팀장은 팀원이 작성한 글 !삭!제!만 예외로 가능
// 팀에 속해야함 and 본인이 써야함


exports.editPermissionCheck = (...check_data) => {
  return new Promise((resolve, reject) => {
    const sql =
      "SELECT user_idx " +
      "FROM post " +
      "WHERE user_idx =? AND post_idx =? ";

    pool.query(sql, check_data, (err, rows) => {
      console.log(rows[0]);
      console.log(check_data[0]);
      if (err) {
        reject(err);
      } else {
        if (rows[0].user_idx === check_data[0]) {
          resolve(null);
        } else {
          reject(9402);
        }
      }
    })
  })
};



exports.edit = (post_data) => {
  return new Promise((resolve, reject) => {

    const sql =
      "UPDATE post SET post_contents = ? " +
      "WHERE user_idx = ? AND post_idx =? ";

    pool.query(sql, post_data, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (rows.affectedRows === 1) { // 담벼락 수정 시도
          resolve(rows);
        } else {
          const _err = new Error("Post Edit Error");
          reject(_err);
        }
      }
    });

  });
};


exports.delete = () => {

};