'use strict';

const app = require('../app.js');
const should = require('should');
const request = require('supertest');

const user_spec = require('./1user.spec');
const mysql = require('mysql');
const DBConfig = require('../config/DBConfig');
const pool = mysql.createPool(DBConfig);


async function resetDB (table) {
  return new Promise((resolve, reject) => {
    const sql =
      "SET foreign_key_checks = 0 ";
    pool.query(sql, [], (err,row) => {
      if(err) {
        reject(err)
      } else {
        resolve(row)
      }
    });
  }).then(() => {
    return new Promise((resolve, reject) => {
      const sql = `truncate ${table}`;
      pool.query(sql, [], (err,rows) => {
        if(err) {
          reject(err)
        } else {
          resolve(rows)
        }
      });
    })
  }).then(() => {
    return new Promise((resolve, reject) => {
      const sql = "SET foreign_key_checks = 1 ";
      pool.query(sql, [], (err,rows) => {
        if(err) {
          reject(err)
        } else {
          resolve(rows)
        }
      });
    })
  });
}



resetDB('team');


describe('POST /api/teams ', () => {
  describe('팀 생성 성공 ', () => {
    it('성공시 201 반환', (done) => {
      request(app)
        .post('/api/teams')
        .set()
        .send({
          user_idx: 1,
          team_name: 'vocavocani',
          team_rule: 'gg',
          team_category_idx: 1,
          team_max_cap: 8,
          team_is_public: 1,
          image: 'test image',
        })
        .expect(201)
        .end(done);
    });
  });

  describe('팀 생성 실패 ', () => {

  });

});