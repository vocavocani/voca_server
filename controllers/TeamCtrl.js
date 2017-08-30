'use strict';

const teamModel = require('../models/TeamModel');
const member_permission = require('../utils').member_permission;

/*******************
 *  My Team List
 ********************/
exports.list = async(req, res, next) => {
  let result = '';

  try {

    result = await teamModel.list(req.user_idx);

  } catch (error) {
    return next(error);
  }

  // success
  return res.json(result);
};

/*******************
 *  Create
 ********************/
exports.create = async(req, res, next) => {
  let result = '';

  try {

    // TODO 팀 생성 제한 기능 추가
    let image;
    if (!req.file) { // 이미지가 없는 경우
      image = null;
    } else {
      image = req.file.location;
    }

    const teamData = {
      uIdx: req.user_idx,
      name: req.body.name,
      rule: req.body.rule,
      maxCap: req.body.max_cap,
      isPublic: req.body.is_public,
      tag: req.body.tag,
      image : image
    };

    console.log(teamData);
    result = await teamModel.create(teamData);

  } catch (error) {
    return next(error);
  }

  // sccess
  return res.status(201).json(result);
};

/*******************
 *  Apply
 ********************/
exports.apply = async(req, res, next) => {
  let result = '';

  try {
    // TEAM apply
    const apply_data = {
      team_idx: req.params.team_idx,
      user_idx: req.user_idx,
      team_member_apply_msg: req.body.message,
      team_member_permission: member_permission.APPLY_MEMBER
    };

    // TODO 한번만 지원할 수 있게 할 것!
    result = await teamModel.apply(apply_data);

  } catch (error) {
    return next(error);
  }

  // success
  return res.json(result);
};


/*******************
 *  Confirm
 ********************/
exports.confirm = async(req, res, next) => {
  let result = '';

  console.log(req.body, req.headers);
  try {
    // Team master permission check
    switch (await teamModel.getTeamMemberPermission(req.params.team_idx, req.user_idx)) {
      case member_permission.MASTER_MEMBER: break;
      case null:
        console.log(1)
        return next(400); break;
      default:
        return next(9402);
    }

    // Already confirm user check
    switch (await teamModel.getTeamMemberPermission(req.params.team_idx, req.body.user_idx)) {
      case member_permission.APPLY_MEMBER: break;
      case null:
        console.log(2);
        return next(400); break;
      default:
        return next(1405);
    }

    // Confirm Logic
    const permission = req.body.is_accept ? member_permission.APPROVED_MEMBER : member_permission.REJECTED_MEMBER;
    const confirm_data = [permission, req.body.user_idx, req.params.team_idx];

    result = await teamModel.confirm(confirm_data);

  } catch (error) {
    return next(error);
  }

  // success
  return res.json(result);
};


/*******************
 *  Detail retrieve
 ********************/
exports.retrieve = async(req, res, next) => {
  let result = '';
  try {
    result = await teamModel.retrieve(req.params.team_idx);
  } catch (error) {
    return next(error);
  }
  return res.json(result);
};


exports.info_write = async(req, res, next) => {
  let result= '';

  try {

    switch (await teamModel.getTeamMemberPermission(req.params.team_idx, req.user_idx)) {
      case member_permission.MASTER_MEMBER: break;
      case null:
        return next(400); break;
      default:
        return next(9402);
    }


    const info_data = {
      user_idx: req.user_idx,
      team_idx: req.params.team_idx,
      team_notice_title: req.body.title,
      team_notice_content: req.body.content
    };

    result = await teamModel.info_write(info_data);
  } catch (error) {
    return next(error)
  }

  return res.json(result)
};

exports.info_list = async(req, res, next) => {
  let result = ``;
  try {
    const team_data = req.params.team_idx;

    result = await teamModel.info_list(team_data);

  } catch (error) {
    return next(error)
  }


  return res.status(200).json(result)
};

exports.testing = async(req,res, next) => {
  let results =[];

  try {
    // const tag =['toeic', 'teps' ];
    const tag = req.body.tag;
    console.log(tag);

    for(let i =0 ; i < tag.length ; i++) {
      let result = await teamModel.testing(tag);
      results.push(result)
    }


  } catch (error) {
    return next(error)
  }
  return res.json(results);

};