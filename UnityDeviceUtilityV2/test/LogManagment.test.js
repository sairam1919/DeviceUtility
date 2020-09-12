const chai = require('chai');
const expect = chai.expect;
const uuidv4 = require('uuid/v4');
const LogManagement = require('../ServerComponents/LogManagement');
const Validation = require('../ServerComponents/Validation');
const uuid = uuidv4();
const fs = require('fs');
const Promise = require('promise');
const config = require('../log/config');

let validation = new Validation(uuid);
let loggerService = new LogManagement(uuid, validation);
validation.setLogger(loggerService);
loggerService.init(uuid);

describe('LogManagment', () => {
  describe('handleErrorMesssage', () => {
    var handleErrorMesssage;
    it('should not store the log messages', function (done) {
      loggerService.disableLog();
      handleErrorMesssage = loggerService.handleErrorMesssage('107fd483-502e-4257-9e4b-c02be11500cf', 'Error Message');
      expect(handleErrorMesssage).to.equal(undefined);
      done();
    });
    it('should handle the error messges', function (done) {
      loggerService.enableLog();
      handleErrorMesssage = loggerService.handleErrorMesssage('107fd483-502e-4257-9e4b-c02be11500cf', 'Error Message');
      expect(handleErrorMesssage).to.equal(undefined);
      done();
    });
    it('Log Message written to file or not Should check(handleErrorMesssage)', function (done) {
      fs.readFile('./log/deviceUtility.log', 'utf8', function (err, data) {
        let logMessage = "107fd483-502e-4257-9e4b-c02be11500cf";
        let temp = data.includes(logMessage);
        expect(temp).to.be.true;
        done();
      });
    });
  });

  describe('log', () => {
    var log;
    var logData;
    it('should not store the log messages', function (done) {
      loggerService.disableLog();
      log = loggerService.log('107fd483-502e-4257-9e4b-c02be11500cf', 'Message From the Log Test Case', 'debug');
      expect(log).to.equal(undefined);
      done();
    });
    it('should store the log messages', function (done) {
      loggerService.enableLog();
      log = loggerService.log('107fd483-502e-4257-9e4b-c02be11500cf', 'Message From the Log Test Case', 'debug');
      expect(log).to.equal(undefined);
      done();
    });
    it('Log Message written to file or not Should check(Log)', function (done) {
      const logData = fs.readFile('./log/deviceUtility.log', 'utf8', function (err, data) {
        let logMessage = "107fd483-502e-4257-9e4b-c02be11500cf";
        let temp = data.includes(logMessage);
        expect(temp).to.be.true;
        done();
      });
    });
  });
})
