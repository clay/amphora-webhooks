'use strict';

const _startCase = require('lodash/startCase'),
  fetch = require('node-fetch'),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require(`./${filename}`);

jest.mock('node-fetch');

describe(_startCase(filename), function () {
  let fakeLog;

  beforeEach(function () {
    fakeLog = jest.fn();
    lib.setLog(fakeLog);
  });

  describe('notify', function () {
    const fn = lib[this.description];

    it('does not throw when event not defined in site', function () {
      const site = {},
        eventName = 'someEvent';

      expect(function () {
        fn(site, eventName);
      }).not.toThrow();
    });

    it('does not throw when event is empty', function () {
      const site = { notify: { webhooks: { someEvent: [] } } },
        eventName = 'someEvent';

      expect(function () {
        fn(site, eventName);
      }).not.toThrow();
    });

    it('notifies without value', function () {
      const hookUrl = 'some_url',
        site = { notify: { webhooks: { someEvent: [hookUrl] } } },
        eventName = 'someEvent';

      fetch.mockResolvedValue();

      return fn(site, eventName).then(function () {
        expect(fetch).toBeCalledWith(
          hookUrl,
          expect.objectContaining({
            headers: { 'X-Event': 'someEvent' },
            method: 'POST'
          })
        );
      });
    });

    it('notifies with string value', function () {
      const hookUrl = 'some-url',
        site = { notify: { webhooks: { someEvent: [hookUrl] } } },
        data = 'some-string',
        eventName = 'someEvent';

      fetch.mockResolvedValue();

      return fn(site, eventName, data).then(function () {
        expect(fetch).toBeCalledWith(
          hookUrl,
          expect.objectContaining({
            body: data,
            headers: {
              'Content-Type': 'text/plain',
              'X-Event': eventName
            },
            method: 'POST'
          })
        );
      });
    });

    it('notifies with object value', function () {
      const hookUrl = 'some-url',
        site = { notify: { webhooks: { someEvent: [hookUrl] } } },
        data = { a: 'b' },
        eventName = 'someEvent';

      fetch.mockResolvedValue();

      return fn(site, eventName, data).then(function () {
        expect(fetch).toBeCalledWith(
          hookUrl,
          expect.objectContaining({
            body: JSON.stringify(data),
            headers: {
              'Content-Type': 'application/json',
              'X-Event': eventName
            },
            method: 'POST'
          })
        );
      });
    });

    it('logs a successful notification', function () {
      const hookUrl = 'some_url',
        site = { notify: { webhooks: { someEvent: [hookUrl] } } },
        eventName = 'someEvent',
        successResp = { status: 200, statusText: 'created', json: Promise.resolve() };

      fetch.mockResolvedValue(successResp);

      return fn(site, eventName).then(() => {
        expect(fakeLog).toBeCalledWith(
          'info',
          expect.any(String),
          expect.objectContaining({ status: 200, statusText: 'created' })
        );
      });
    });

    it('logs an error if the service returns a non 200/300 response', function () {
      const hookUrl = 'some_url',
        site = { notify: { webhooks: { someEvent: [hookUrl] } } },
        eventName = 'someEvent',
        successResp = { status: 404, statusText: 'does not exist', json: Promise.resolve() };

      fetch.mockResolvedValue(successResp);

      return fn(site, eventName).then(() => {
        expect(fakeLog).toBeCalledWith('error', expect.any(String));
      });
    });

    it('logs errors if the fetch fails', function () {
      const hookUrl = 'some_url',
        site = { notify: { webhooks: { someEvent: [hookUrl] } } },
        eventName = 'someEvent';

      fetch.mockRejectedValue(new Error('foo'));

      return fn(site, eventName).then(() => {
        expect(fakeLog).toBeCalledWith('error', expect.any(String));
      });
    });
  });
});
