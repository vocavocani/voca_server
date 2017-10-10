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
        t.team_name,
        t.team_image,
        (SELECT GROUP_CONCAT(t.tag_name)
      FROM tag AS t LEFT JOIN team_to_tag AS tt ON t.tag_idx = tt.tag_idx
       WHERE tt.team_idx = t.team_idx) AS tags
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

exports.create = (teamData, tagIdx) => {
  return new Promise((resolve, reject) => {
    transactionWrapper.getConnection(pool)
      .then(transactionWrapper.beginTransaction)
      .then((context) => {
        return new Promise((resolve, reject) => {
          const sql =
            "INSERT INTO team(team_name, team_rule, team_max_cap, team_is_public,  team_image) " +
            "VALUES ( ?, ?, ?, ?, ?) "; // 팀 추가
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
                context.error = new Error("Team Create Custom Error 2");
                reject(context);
              }
            }
          })
        })
      })
      .then((context) => {
        return new Promise((resolve, reject) => {

          let data = [];
          for(let i =0 ; i < tagIdx.length; i++){
            data[i] = [context.result.insertId];
            data[i].push(tagIdx[i])
          }
          // bulk insert
          const sql =
            `
            INSERT INTO team_to_tag(team_idx, tag_idx)
            VALUES ?
            `;

          context.conn.query(sql, [data], (err,rows) => {
            if (err) {
              context.error = err;
              reject(context)
            } else {
              if (rows.affectedRows !== 0) {
                resolve(context)
              } else {
                context.error = new Error('Team Create Custom Error 3');
                reject(context)
              }
            }
          })

        })
      })
      .then((context) => {
        return new Promise((resolve, reject) => {
          const sql =
            `
            SELECT
              team_idx,
              team_name,
              team_rule,
              team_max_cap,
              team_cur_cap,
              team_is_public,
              team_image
            FROM team
            WHERE team_idx = ?
            `;

          context.conn.query(sql, [context.result.insertId], (err, rows) => {
            if (err) {
              context.error = err;
              reject(context)
            } else {
              context.result = rows[0];
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
exports.apply = (applyData) => {
  return new Promise((resolve, reject) => {
      const sql = "INSERT INTO team_member SET ?";

      pool.query(sql, applyData, (err, rows) => {
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


exports.tagging = (tag) => {
  return new Promise((resolve, reject) => {
    const sql =
      `
      SELECT tag_idx, tag_name, tag_count
      FROM tag
      WHERE tag_name = ?;
      `;
    pool.query(sql, [tag], (err, rows) => {
      if (err) {
        reject(err)
      } else {
        let data = {};
        if (rows.length === 0) {
          data = {
            'isInsert': true,
            'tag_count': 0
          };
          //resolve(true) // 태그가 없을 경우
          resolve(data)
        } else {
          data = {
            'isInsert': false,
            'tag_count': rows[0].tag_count
          };
          //resolve(false) // 태그가 있는 경우
          resolve(data)
        }
      }
    })
  }).then((data)=> {
    if (data.isInsert) { // 태그가 없을 경우
      return new Promise((resolve, reject) => {
        const sql =
          `
          INSERT INTO tag(tag_name, tag_count) VALUES ( ?, 1 ) 
          `;
        pool.query(sql, [tag], (err, rows) => {
          if (err) {
            reject(err)
          } else {
            if (rows.affectedRows === 1) {
              resolve(rows)
            } else {
              const _err = new Error("INSERT Tag Custom Error");
              reject(_err)
            }
          }
        });
      })
    }
    else { // 태그가 있을 경우
      return new Promise((resolve, reject) => {
        const sql =
          `
          UPDATE tag SET tag_count = ? WHERE tag_name = ?
          `;
        let tag_count = parseInt(data.tag_count + 1, 10);
        pool.query(sql, [tag_count, tag], (err,rows) => {
          if(err){
            reject(err)
          } else {
            if (rows.affectedRows === 1 ) {
              resolve(rows)
            } else {
              const _err = new Error("UPDATE tag Custom Error");
              reject(_err)
            }
          }
        })
      })
    }
  }).then(() => {
    return new Promise((resolve, reject) => {
      const sql =
        `
        SELECT tag_idx, tag_name, tag_count
        FROM tag
        WHERE tag_name = ?
        `;
      pool.query(sql, [tag], (err, rows) => {
        if(err) {
          reject(err)
        } else {
          resolve(rows[0])
        }
      })

    })
  })
};

