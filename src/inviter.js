const readline = require('readline');
const axios = require('axios');
const colors = require('colors/safe');
const utils = require('./utils');
const constants = require('./constants');

const invitationStatus = {
  success: 0,
  failed: 0,
};
let cursorRelYPos;
let isFirstTime = true;

function invite(sessionCookies, invitees) {
  let idx = 0;
  return new Promise((resolve) => {
    (function func() {
      if (idx < invitees.length) {
        makeReqInvitationsPOST(sessionCookies, invitees[idx])
         .then(() => {
           func();
         });
        idx++;
      } else {
        resolve();
      }
    }());
  });
}

function makeReqInvitationsPOST(cookies, invitee) {
  const csrfToken = utils.trim(cookies.JSESSIONID, '"');

  const invitationsData = JSON.stringify({
    excludeInvitations: [],
    invitations: [],
    trackingId: invitee.trackingId,
    invitee: {
      'com.linkedin.voyager.growth.invitation.InviteeProfile': {
        profileId: invitee.profileId,
      },
    },
  });

  const headers = {
    ...constants.headers.normInvitationsPOST,
    cookie: utils.stringifyCookies(cookies),
    'csrf-token': csrfToken,
  };

  const reqConfig = {
    headers,
    responseType: 'text',
  };

  return axios.post(constants.urls.normInvitations, invitationsData, reqConfig)
    .then(() => {
      invitationStatus.success++;
      printInvite(invitee, true, invitationStatus.success, invitationStatus.failed);
    })
    .catch((err) => {
      invitationStatus.failed++;
      printInvite(invitee, false, invitationStatus.success, invitationStatus.failed);

      const statusCode = err.response.status;
      if (statusCode === 429) {
        // console.log(`${colors.red('error')}:   too many requests`);
        process.exit(1);
        throw Error("too many requests");
      }
    });
}

function printInvite(invitee, isSuccess, successCount, failedCount) {
  const isFirstCard = isFirstTime;

  if (isFirstCard) {
    isFirstTime = false;
    utils.print('\n');
    cursorRelYPos = printInviteCard(invitee, isSuccess, successCount, failedCount);
  } else {
      cursorRelYPos = printInviteCard(invitee, isSuccess, successCount, failedCount);
  }
  if(failedCount===1)
  {
    console.log("exit")
    process.exit(1);
  }
}

function printInviteCard(invitee, isSuccess, successCount, failedCount) {
  let totNewLines = 0;
  const wrapTextWidth = utils.currentPrintStream.columns - 10;
  const wrapOption = {width: wrapTextWidth, indent: '    '};

  const wrappedInvName = utils.wrapText(inviteeName(invitee), wrapOption);
  const wrappedInvOccupation = utils.wrapText(
   utils.resolveNewLines(invitee.occupation),
   wrapOption,
  );

  const invTitle = wrappedInvName.trim();
  const invOccupation = colors.grey(wrappedInvOccupation);
  const statusChar = isSuccess ? colors.green('✓') : colors.red('⨯');
  const successCountMsg = `${colors.grey('Success:')} ${colors.green(`${successCount}`)}`;
  const failedCountMsg = `${colors.grey('Failed:')} ${colors.red(`${failedCount}`)}`;
  const elapsedTimeMsg = `${colors.grey('Elapsed:')} ${colors.cyan(utils.endTimer())}`;

  utils.print(`${statusChar} | ${invTitle} | ${invOccupation} | ${successCountMsg} | ${failedCountMsg} | ${elapsedTimeMsg}`)


  return totNewLines;
}

function inviteeName(invitee) {
  return utils.resolveNewLines(`${invitee.firstName.trim()} ${invitee.lastName.trim()}`);
}

module.exports = {
  invite,
};
