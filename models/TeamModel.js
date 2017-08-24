'use strict';

const mysql = require('mysql');
const DBConfig = require('./../config/DBConfig');
const pool = mysql.createPool(DBConfig);
const transactionWrapper = require('./TransactionWrapper');


/*******************
 *  Team Member Permission
 *  @param: team_idx, user_idx
 ********************/
exports.getTeamMemberPermission = (team_idx, user_idx) => {
  return new Promise((resolve, reject) => {
    const sql =
      "SELECT team_member_permission " +
      "FROM team_member " +
      "WHERE team_idx = ? AND user_idx = ?";

    pool.query(sql, [team_idx, user_idx], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        if (rows.length === 0) {
          // Not Team Member
          resolve(null);
        } else {
          resolve(rows[0].team_member_permission);
        }
      }
    });
  });
};

/**
 * My Team List
 * @param user_idx
 */
exports.list = (user_idx) => {
  return new Promise((resolve, reject) => {
    //TODO 태그 추가
    const sql =
      `
      SELECT
        t.team_idx,
        t.team_name
      FROM team AS t
        LEFT JOIN team_member AS tm ON t.team_idx = tm.team_idx
      WHERE tm.user_idx = ? AND team_member_permission >= 0;
      `;
    pool.query(sql, user_idx, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    })
  })
};

/*******************
 *  Create
 *  @param: team_data = {user_idx, team_name, team_rule, team_category, team_max_cap, team_is_public}
 ********************/

exports.create = (teamData) => {
  return new Promise((resolve, reject) => {
    transactionWrapper.getConnection(pool)
      .then(transactionWrapper.beginTransaction)
      .then((context) => {
        return new Promise((resolve, reject) => {
          const sql =
            "INSERT INTO team(team_name, team_rule, team_max_cap, team_is_public,  team_image) " +
            "VALUES ( ?, ?, ?, ?, ?) ";
          context.conn.query(sql, [teamData.name, teamData.rule, teamData.maxCap, teamData.isPublic, teamData.image], (err, rows) => {
            if (err) {
              context.error = err;
              reject(context)
            } else {
              if (rows.affectedRows === 1) { // 쓰기 시도 성공
                context.result = rows;
                resolve(context)
              } else {
                context.error = new Error("Team Create Custom Error 1");
                reject(context);
              }
            }
          })
        });
      })
      .then((context) => {
        return new Promise((resolve, reject) => {
          const sql =
            "INSERT INTO team_member(team_idx, user_idx, team_member_permission) VALUES (?, ?, 1) ";
          context.conn.query(sql, [context.result.insertId, teamData.uIdx], (err, rows) => {
            if (err) {
              context.error = err;
              reject(context)
            } else {
              if (rows.affectedRows === 1) {
                resolve(context); // ??? context ????
              } else {
                context.error = new Error("Team Create Custom Error 2")
                reject(context);
              }
            }
          })
        })
      })
      .then((context) => {
        return new Promise((resolve, reject) => {
          const sql = "SELECT * FROM team WHERE team_idx = ? ";

          context.conn.query(sql, [context.result.insertId], (err, rows) => {
            if (err) {
              context.error = err;
              reject(context)
            } else {
              context.result = rows;
              resolve(context)
            }
          })

        });
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
  });
};


/*******************
 *  Apply
 *  @param: apply_data = {team_idx, user_idx, team_member_apply_msg}
 ********************/
exports.apply = (apply_data) => {
  return new Promise((resolve, reject) => {
      const sql = "INSERT INTO team_member SET ?";

      pool.query(sql, apply_data, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          if (rows.affectedRows === 1) {
            resolve(rows);
          } else {
            const _err = new Error("Team Apply Custom error");
            reject(_err);
          }
        }
      });
    }
  ).then((result) => {
      return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM team_member WHERE team_member_idx = ?";

        pool.query(sql, result.insertId, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    }
  );
};

/*******************
 *  Confirm
 *  @param: confirm_data = [confirm, user_idx, team_idx]
 ********************/
exports.confirm = (confirm_data) => {
  return new Promise((resolve, reject) => {
      const sql = "UPDATE team_member SET team_member_permission = ? WHERE user_idx = ? AND team_idx = ?";

      pool.query(sql, confirm_data, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          if (rows.affectedRows === 1) {
            resolve([confirm_data[1], confirm_data[2]]);  // user_idx, team_idx
          } else {
            const _err = new Error("Team Confirm Custom error");
            reject(_err);
          }
        }
      });
    }
  ).then((data) => {
      return new Promise((resolve, reject) => {
        const sql =
          "SELECT team_idx, user_idx, team_member_permission " +
          "FROM team_member " +
          "WHERE user_idx = ? AND team_idx = ?";


        pool.query(sql, data, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    }
  );
};



exports.info_write = (info_data) => {
  return new Promise((resolve, reject) => {
    const sql = "INSERT INTO team_notice(user_idx, team_idx, team_notice_title, team_notice_content) VALUES(?, ?, ?, ?) ";

    pool.query(sql, [info_data.user_idx, info_data.team_idx, info_data.team_notice_title, info_data.team_notice_content], (err,rows) => {
      if (err) {
        reject(err)
      } else {
        if (rows.affectedRows === 1) {
          resolve(rows)
        } else {
          const _err = new Error("Info Write Custom Error");
          reject(_err)
        }
      }
    });
  })
    .then((result) => {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT * FROM team_notice WHERE team_notice_idx =? ";
      pool.query(sql, [result.insertId], (err, rows) => {
        if (err) {
          reject(err)
        } else{
          resolve(rows)
        }
      })
    })
    })
};

exports.info_list = (team_data) => {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM team_notice WHERE team_idx = ? ";
    pool.query(sql, team_data, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  });
};

