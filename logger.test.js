'use strict';

const _startCase = require('lodash/startCase'),
  clayLog = require('clay-log'),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require(`./${filename}`);

describe(_startCase(filename), function () {
  let fakeLog;

  beforeEach(function () {
    fakeLog = jest.fn();
  });

  describe('init', function () {
    const fn = lib[this.description];

    it('returns if a log instance is set', function () {
      clayLog.init = jest.fn();

      lib.setLogger(fakeLog);
      fn();
      expect(clayLog.init).not.toBeCalled();
    });
  });
});
