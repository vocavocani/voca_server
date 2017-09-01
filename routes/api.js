'use strict';

const validate = require('express-validation');
const ParamValidation = require('../config/ParamValidation');

const imageCtrl = require('../controllers/ImageCtrl');
const authCtrl = require('../controllers/AuthCtrl');
const userCtrl = require('../controllers/UserCtrl');
const teamCtrl = require('../controllers/TeamCtrl');
const postCtrl = require('../controllers/PostCtrl');


module.exports = (router) => {

  // ROOT
  router.route('/t')
    .post(teamCtrl.testing);

  // USER
  router.route('/users/register')
    .post(validate(ParamValidation.user_register),imageCtrl.uploadSingle, userCtrl.register);
  router.route('/users/check')
    .post(userCtrl.check);

  router.route('/users/login')
    .post(validate(ParamValidation.user_login),userCtrl.login);

  // PROFILE
  router.route('/users')
    .get(authCtrl.auth, userCtrl.profile);




  // TEAM
  router.route('/teams')
    .get(authCtrl.auth, teamCtrl.list)
    .post(authCtrl.auth, imageCtrl.uploadSingle ,teamCtrl.create);

  router.route('/teams/:team_idx/apply')
    .post(authCtrl.auth, teamCtrl.apply);
  router.route('/teams/:team_idx/confirm')
    .put(authCtrl.auth, teamCtrl.confirm);


  router.route('/teams/:team_idx/info')
    .get(authCtrl.auth, teamCtrl.info_list)
    .post(authCtrl.auth, teamCtrl.info_write);
  router.route('/teams/:team_idx/posts')
    .get(authCtrl.auth, postCtrl.list)
    .post(authCtrl.auth, imageCtrl.uploadArray, postCtrl.write);

  return router;
};