'use strict';

const postModel = require('../models/PostModel');
const teamModel = require('../models/TeamModel');
const member_permission = require('../utils').member_permission;



exports.list = async(req, res, next) => {
  let result = '';

  try {
    result = await postModel.list(req.params.team_idx);
  } catch (error) {
    return next(error);
  }

  return res.json(result);
};



exports.write = async(req, res, next) => {
  let result = '';


  try {
    //Post write permission check
    switch (await teamModel.getTeamMemberPermission(req.params.team_idx, req.user_idx)){
      case member_permission.MASTER_MEMBER: break;
      case member_permission.APPROVED_MEMBER: break;
      case null:
        return next(400); break;
      default:
        return next(9402);
    }


    let images;
    if (!req.files) {
      images = null
    } else {
      images = req.files
    }

    const post_data = {
      user_idx: req.user_idx,
      team_idx: req.params.team_idx,
      post_title: req.body.title,
      post_content: req.body.content,
      post_image: images
    };

    console.log(post_data);
    result = await postModel.write(post_data);



  } catch (error) {
    console.log(error);
    return next(error);
  }

  return res.json(result);
};



exports.edit = async(req, res, next) => {
  let result = '';

  try {
    //Post edit permission check

    await postModel.editPermissionCheck(req.user_idx, req.params.post_idx);

    const post_data = [
      req.body.contents,
      req.user_idx,
      req.params.post_idx
    ];

    result = await postModel.edit(post_data);

  } catch (error) {
    return next(error);
  }
  return res.json(result);
};



exports.delete = async(req, res, next) => {

};


