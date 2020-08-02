'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var axios = require('axios');
var wordWrap = require('word-wrap');
var moment = require('moment');

function parseToCookieKeyValuePairs(cookieHeaders) {
  return cookieHeaders.reduce(function (keyValuePairs, cookie) {
    var cookieInfo = parseSingleCookie(cookie);
    if (!isDeletedCookie(cookieInfo)) {
      keyValuePairs[cookieInfo.key] = cookieInfo.value;
    }
    return keyValuePairs;
  }, {});
}

function isDeletedCookie(cookieInfo) {
  return cookieInfo.value.indexOf('delete') !== -1;
}

function parseSingleCookie(cookieStr) {
  var cookieInfo = {};
  var parts = cookieStr.split(/; */);

  var pair = parts[0].trim();
  var eqIdx = pair.indexOf('=');
  cookieInfo.key = pair.substr(0, eqIdx).trim();
  cookieInfo.value = pair.substr(eqIdx + 1, pair.length).trim();

  for (var i = 1; i < parts.length; ++i) {
    var partPair = parts[i].trim().split('=');
    if (partPair.length < 2) {
      continue;
    }
    cookieInfo[partPair[0].trim()] = partPair[1].trim();
  }
  return cookieInfo;
}

function stringifyCookies(cookiePairs) {
  return Object.keys(cookiePairs).map(function (cookieName) {
    return cookieName + '=' + cookiePairs[cookieName];
  }).join('; ');
}

function fetchCookies(url, method, config) {
  var reqConfig = _extends({ url: url, method: method }, config);

  return axios.request(reqConfig).then(function (response) {
    return parseToCookieKeyValuePairs(response.headers['set-cookie']);
  });
}

function trim(str, chr) {
  str = str || "";
  var regex = new RegExp('(?:^' + escapeRegExp(chr) + '+)|(?:' + escapeRegExp(chr) + '+$)', 'g');
  return str.replace(regex, '');
}

function escapeRegExp(str) {
  return str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
}

var currentPrintStream = process.stderr;

function print(msg) {
  console.log(msg);
}

function resolveNewLines(text) {
  text = text || '';
  return text.replace(/[\n\r]+/g, ' ').trim();
}

function wrapText(text, option) {
  option = _extends({
    trim: false
  }, option);

  return wordWrap(text, option);
}

function startTimer() {
  global.startMoment = moment();
}

function endTimer() {
  return moment().diff(global.startMoment, 'second', true) + 'sec';
}

function makeReqPYMKGET(cookies, _ref, header) {
  var url = _ref.url,
      _ref$query = _ref.query,
      query = _ref$query === undefined ? null : _ref$query;
  var responseType = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'json';

  var csrfToken = trim(cookies.JSESSIONID, '"');
  var headers = _extends({}, header, { cookie: stringifyCookies(cookies), 'csrf-token': csrfToken });
  var reqConfig = {
    headers: headers,
    responseType: responseType
  };
  if (query) reqConfig.params = query;
  return axios.get(url, reqConfig).then(function (response) {
    return response.data;
  });
}

module.exports = {
  fetchCookies: fetchCookies,
  parseToCookieKeyValuePairs: parseToCookieKeyValuePairs,
  stringifyCookies: stringifyCookies,
  trim: trim,
  print: print,
  resolveNewLines: resolveNewLines,
  wrapText: wrapText,
  currentPrintStream: currentPrintStream,
  makeReqPYMKGET: makeReqPYMKGET,
  startTimer: startTimer,
  endTimer: endTimer
};