'use strict';

const app = require('../app.js');
const should = require('should');
const request = require('supertest');


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



resetDB('user');

describe('POST /api/users/register', () => {

  describe('회원가입 성공', ()=> {

    let body;
    before((done) => {
      request(app)
        .post('/api/users/register')
        .send({
          id: 'aksguraksgur1',
          pw: 'aksguraksgur',
          nickname: 'aksguraksgur',
          // img: {
          //   location: 'testest'
          // }
        })
        .expect(201)
        .end((err,res) => {
          body = res.body;
          done();
        });
    });
    it('유저 정보를 반환', (done) => {
      const userData = ['user_idx', 'user_id', 'user_nickname', 'user_img'];
      body.should.have.properties(userData);
      done();
    });
  });

  describe('회원가입 실패', () => {
    it('파라미터 부족 400 반환', (done) => {
      request(app)
        .post('/api/users/register')
        .send({})
        .expect(400)
        .end(done);
    });

  });
});

describe('POST /api/users/check', () => {

  describe('아이디 중복체크 ', () => {

    it('아이디 중복이면 409 반환', (done)=> {
      request(app)
        .post('/api/users/check')
        .send({
          id: 'aksguraksgur1',
        })
        .expect(409)
        .end(done)
    });

    it('아이디가 중복이지 않으면 200 반환', (done) => {
      request(app)
        .post('/api/users/check')
        .send({
          id: 'manhyuk',
        })
        .expect(200)
        .end(done);
    });
  })
});

describe('POST /api/users/login' , () => {
  let body;
  describe('로그인 성공', () => {
    before((done) => {
      request(app)
        .post('/api/users/login')
        .send({
          id: 'aksguraksgur1',
          pw: 'aksguraksgur',
        })
        .expect(200)
        .end((err,res) => {
          body = res.body;
          done();
        });
    });
    it('200 반환, 토큰 발급 ', (done) => {
      const data = ['profile', 'token'];
      body.should.have.properties(data);
      done();
    });
  });


  describe('로그인 실패', () => {
    it('파라미터 부족 400 반환', (done) => {
      request(app)
        .post('/api/users/login')
        .send({})
        .expect(400)
        .end(done)
    });
  });
});

