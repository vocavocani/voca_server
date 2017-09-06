'use strict';

const postModel = require('../models/PostModel');
const teamModel = require('../models/TeamModel');
const memberPermission = require('../utils').memberPermission;

// TODO 글 상세보기 ( 댓글 조회 포함 )
// TODO 댓글 작

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
      case memberPermission.MASTER_MEMBER: break;
      case memberPermission.APPROVED_MEMBER: break;
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

    const postData = {
      user_idx: req.user_idx,
      team_idx: req.params.team_idx,
      post_flag: req.body.flag,
      post_title: req.body.title,
      post_content: req.body.content,
      post_image: images
    };

    result = await postModel.write(postData);



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


