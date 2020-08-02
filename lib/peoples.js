'use strict';

var axios = require('axios');
var utils = require('./utils');
var constants = require('./constants');

function fetch(sessionCookies, requestData) {
  return utils.makeReqPYMKGET(sessionCookies, requestData, constants.headers.peopleYouMayKnowGET).then(function (data) {
    return normalize(data);
  });
}

function normalize(data) {
  return data.included.reduce(function (peoples, datum) {
    if (datum.$type === constants.peopleProfileType) {
      peoples.push({
        firstName: datum.firstName,
        lastName: datum.lastName,
        occupation: datum.occupation,
        profileId: extractProfileId(datum.entityUrn),
        publicIdentifier: datum.publicIdentifier,
        trackingId: datum.trackingId
      });
    }
    return peoples;
  }, []);
}

function extractProfileId(entityUrn) {
  return entityUrn.substr(entityUrn.lastIndexOf(':') + 1, entityUrn.length);
}

module.exports = {
  fetch: fetch
};