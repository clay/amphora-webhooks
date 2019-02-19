'use strict';

const bluebird = require('bluebird'),
  fetch = require('node-fetch'),
  _get = require('lodash/get'),
  _isPlainObject = require('lodash/isPlainObject'),
  _isString = require('lodash/isString');

let log = require('./logger').setup({ file: __filename });

/**
 * @param {string} event
 * @param {string} url
 * @param {object} data
 * @returns {Promise}
 */
function callWebhook(event, url, data) {
  const contentType = 'Content-Type',
    headers = {
      'X-Event': event
    },
    options = {
      method: 'POST',
      headers
    };

  if (_isPlainObject(data)) {
    headers[contentType] = 'application/json';
    options.body = JSON.stringify(data);
  } else if (_isString(data)) {
    headers[contentType] = 'text/plain';
    options.body = data;
  }

  return fetch(url, options)
    .then(function (resp) {
      const { status, statusText } = resp;

      if (status < 400) {
        log('info', `successfully called webhook ${url}`, { status, statusText });
      } else {
        log('error', `error calling webhook ${url}`);
      }

      // Node Fetch does not close a connection unless
      // you call `.json()`, `.text()` or `.buffer()`
      return resp.json();
    })
    .catch(err => log('error', err.message));
}

/**
 * @param {object} site
 * @param {string} eventName
 * @param {*} [data]
 * @returns {Promise}
 */
function notify(site, eventName, data) {
  const events = _get(site, 'notify.webhooks', '');

  if (events && Array.isArray(events[eventName])) {
    return bluebird.all(events[eventName].map(url => callWebhook(eventName, url, data) ));
  }

  return bluebird.resolve();
}

module.exports.notify = notify;
// For testing
module.exports.setLog = fakeLogger => { log = fakeLogger; };
