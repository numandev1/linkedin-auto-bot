'use strict';

var colors = require('colors/safe');
var constants = require('./constants');
var login = require('./login');
var peoples = require('./peoples');
var inviter = require('./inviter');
var utils = require('./utils');

var credentials = void 0,
    keyword = void 0;

function start(email, password, skeyword) {
  keyword = skeyword.toLowerCase();
  if (keyword === "") {
    keyword = "all";
  }
  storeCredentials(email, password);
  startScraping();
}

function startScraping() {
  utils.print('\n  ' + colors.grey('Connecting to the LinkedIn server..'));

  var requestData = void 0,
      pages = false;
  if (keyword === 'all') {
    requestData = {
      url: constants.urls.peopleYouMayKnow,
      query: {
        count: constants.fetchingPeoplesCount,
        includeInsights: false,
        start: 0,
        usageContext: 'd_flagship3_people'
      }
    };
  } else {
    requestData = {
      url: constants.urls.peoplesearch,
      query: {
        count: 10,
        guides: "List(v->PEOPLE,facetNetwork->S|O)",
        keywords: keyword,
        origin: 'FACETED_SEARCH',
        q: 'guided',
        start: 0
      }
    };
    pages = true;
  }

  login.sessionCookies(credentials.email, credentials.password).then(function (sessionCookies) {
    // console.log(sessionCookies)
    utils.print('\n  ' + colors.green('Connected.'));
    utils.print('\n  ');
    utils.startTimer();
    getConnectionsCount(sessionCookies).then(function (data) {
      if (data) {
        getUserData(sessionCookies, data.id).then(function (profileData) {
          if (profileData) {
            utils.print('Welcome ' + colors.yellow(profileData.firstName, profileData.lastName) + '\n  ');
            utils.print('Total Connections: ' + colors.yellow(data.connections) + '\n  ');
            utils.print('Username: ' + colors.yellow(profileData.publicIdentifier) + '\n  ');

            getDashboardData(sessionCookies, profileData.publicIdentifier).then(function (dashboardData) {
              utils.print('Profile Views: ' + colors.yellow(dashboardData.numProfileViews) + '\n  ');
              utils.print('Search Appearances: ' + colors.yellow(dashboardData.numSearchAppearances) + '\n  ');
              utils.print('Posts Views: ' + colors.yellow(dashboardData.numLastUpdateViews) + '\n  ');
              utils.print('\n  ');

              fetchNextPeoples(sessionCookies, requestData, pages);
            }).catch(function (err) {
              onError(err);
            });
          }
        }).catch(function (err) {
          onError(err);
        });
      }
    }).catch(function (err) {
      onError(err);
    });
  }).catch(function (err) {
    if (err.response.status === 303) {
      utils.print('' + colors.green('Connected.'));
      utils.startTimer();
      var cookies = utils.parseToCookieKeyValuePairs(err.response.headers['set-cookie']);
      fetchNextPeoples(cookies, requestData, pages);
    } else {
      onError(err);
    }
  });
}

function getConnectionsCount(sessionCookies) {
  var requestData = {
    url: constants.urls.connectionsSummary,
    query: null
  };
  return utils.makeReqPYMKGET(sessionCookies, requestData, constants.headers.peopleYouMayKnowGET).then(function (response) {
    if (response && response.data && response.data.numConnections) return {
      connections: response.data.numConnections,
      id: response.data.entityUrn.replace('urn:li:fs_relConnectionsSummary:', '')
    };else return null;
  });
  ;
}

function getUserData(sessionCookies, id) {
  var requestData = {
    url: constants.urls.profileDatas,
    query: { keyVersion: 'LEGACY_INBOX' }
  };
  return utils.makeReqPYMKGET(sessionCookies, requestData, constants.headers.peopleYouMayKnowGET).then(function (response) {
    // console.log(response.included, id);
    var profileData = void 0;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = response.included[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var profile = _step.value;

        if (profile.firstName && profile.entityUrn === 'urn:li:fs_miniProfile:' + id) {
          profileData = profile;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    return profileData;
  });
  ;
}

function getDashboardData(sessionCookies, username) {
  var requestData = {
    url: constants.urls.dashboard.replace('{username}', username),
    query: null
  };

  return utils.makeReqPYMKGET(sessionCookies, requestData, constants.headers.peopleYouMayKnowGET).then(function (response) {
    return response.data;
  });
  ;
}

function fetchNextPeoples(sessionCookies, requestData, pages) {
  peoples.fetch(sessionCookies, requestData).then(function (peoples) {
    // console.log(peoples);
    if (peoples.length == 0) {
      utils.print('\n  ' + colors.red('No profiles found. Page \'' + requestData.query.start));
      process.exit(0);
    }
    if (pages === true) requestData.query.start += 10;
    inviter.invite(sessionCookies, peoples).then(function () {
      setTimeout(function () {
        fetchNextPeoples(sessionCookies, requestData, pages);
      }, constants.requestInterval);
    }).catch(function (e) {
      console.log(e.message);
    });;
  }).catch(function (err) {
    onError(err);
  });
}

function storeCredentials(email, password) {
  credentials = { email: email, password: password };
}

function onError(err) {
  var errMsg = void 0;
  if (err.response) {
    var statusCode = err.response.status;
    if (statusCode === 401 || statusCode === 403) {
      errMsg = 'incorrect authentication';
    } else {
      errMsg = err.message;
    }
  } else if (err.request) {
    errMsg = 'couldn\'t connect to the LinkedIn server';
  } else {
    errMsg = err.message;
  }
  console.error('\n  ' + colors.red('error') + ':   ' + errMsg);
}

module.exports = { start: start };