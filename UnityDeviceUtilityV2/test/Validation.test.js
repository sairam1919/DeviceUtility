const chai = require('chai');
const expect = chai.expect;

const Validation = require('../ServerComponents/Validation');
const LogManagement = require('../ServerComponents/LogManagement');
const promptClass = require('./promptclass');
const uuidv4 = require('uuid/v4');
const DEVICE_FILESYSTEM_MOCK = require('./Mock/DEVICE_FILESYSTEM_MOCK');
const DeviceSystem = require('../ServerComponents/DeviceSystem');
const uuid = uuidv4();
let validation = new Validation(uuid);
let loggerService = new LogManagement(uuid, validation);
validation.setLogger(loggerService);
loggerService.init(uuid);
let deviceSystem = new DeviceSystem(uuid, loggerService);
deviceSystem.intialize(uuid);
validation.setDeviceSystem(deviceSystem);

describe('Validation', () => {
  describe('validateFileSystem', () => {
    var fileSystem = DEVICE_FILESYSTEM_MOCK;
    var validateFileSystem;
    it('should validate the folder structure', function (done) {
      validateFileSystem = validation.validateFileSystem('', fileSystem);
      expect(validateFileSystem).to.be.an('object');
      done();
    });
    it('should validate the folder structure error scenario', function (done) {
      var negativeFileSystem = {
        programFilePath: { folderPath: undefined, fileName: '' },
        treatmentFilePath: { folderPath: '', fileName: '' },
        folderStructureInDevice: []
      };
      try{
        validateFileSystem = validation.validateFileSystem('', negativeFileSystem);
      } catch(err) {
        validateFileSystem = err.message;
      }
      expect(validateFileSystem).to.equal('Device File path is invalid');
      done();
    });
  });
  describe('validateDrive', () => {
    let drive;
    var validateDrive
    before(async function () {
      drive = await promptClass.checkDriveConnected(drive);
      return drive;
    });
    it('should validate the drive is in the list or not', function (done) {
      validateDrive = validation.validateDrive('', drive);
      expect(validateDrive).to.equal(undefined);
      done();
    });
    it('should validate the drive is in the list or not', function (done) {
      drive = 'G:';
      try {
        validateDrive = validation.validateDrive('', drive);
      } catch (err) {
        validateDrive = err.message;
      }
      expect(validateDrive).to.equal('Device not connected');
      done();
    });
    it('should validate the drive is in the list or not (error scenario)', function (done) {
      let device = undefined;
      try {
        validateDrive = validation.validateDrive('', device);
      } catch (err) {
        validateDrive = err.message;
      }
      expect(validateDrive).to.equal('Drive path is invalid');
      done();
    });
  });
  describe('validateFilePath', () => {
    var validateFilePath;
    it('should validate the filePath', function (done) {
      var programFilePath = DEVICE_FILESYSTEM_MOCK._programFilePath;
      validateFilePath = validation.validateFilePath('', programFilePath);
      expect(validateFilePath).to.be.an('object');
      done();
    });
    it('should validate the filePath (error scenario)', function (done) {
      var programFilePath = { folderPath: undefined, fileName: 'file.xml' };
      try {
        validateFilePath = validation.validateFilePath('', programFilePath);
      } catch (err) {
        validateFilePath = err.message;
      }
      expect(validateFilePath).to.equal('Device File path is invalid');
      done();
    });
  });
  describe('validateAppInfo', () => {
    it('should validate the package json data', function (done) {
      let jsonData = { name: 'DeviceUtility', version: '1.0.0' };
      var validateAppInfo = validation.validateAppInfo('', jsonData);
      expect(validateAppInfo.data).to.equal(undefined);
      done();
    });
    it('should validate the package json data(Negative Scenario)', function (done) {
      let jsonData = { name: '', version: '' };
      var validateAppInfo = validation.validateAppInfo('', jsonData);
      expect(validateAppInfo.status).to.equal('error');
      done();
    });
  });
});
