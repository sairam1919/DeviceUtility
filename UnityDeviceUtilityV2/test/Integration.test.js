const chai = require('chai');
const expect = chai.expect;
const request = require('request');
const uuidv4 = require('uuid/v4');
const DEVICE_FILESYSTEM_MOCK = require('./Mock/DEVICE_FILESYSTEM_MOCK');
const DEVICE_FILESYSTEM_MOCK_NEGATIVE = require('./Mock/DEVICE_FILESYSTEM_MOCK_NEGATIVE');
const ENCODED_XML_MOCK = require('./Mock/Encoded_XML_MOCK');
const config = require('../log/config');

let uuid = uuidv4();
let options = {
  method: 'GET',
  headers: { 'content-type': 'application/json', 'uuid': uuid },
  url: 'http://localhost:3009/deviceutility/Services/IsRunning'
};
let drive, filePath;

describe('IntegrationTest', function () {
  describe('IsRunning', function () {
    it('it should return application name and version', (done) => {
      request(options, function (err, res) {
        if (err) throw new Error(err);
        let r = JSON.parse(res.body);
        expect(r.status).equals('SUCCESS');
        expect(r.data.appName).to.be.an('string');
        expect(r.data.version).to.be.an('string');
        expect(r.data.deviceMetaData).to.be.an('array');
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
  });
  describe('ListRemovableDevices', function (done) {
    it('it should return array of connected devices', (done) => {
      options.url = 'http://localhost:3009/deviceutility/Services/ListRemovableStorageDevices';
      request(options, function (err, res) {
        if (err) throw new Error(err);
        let r = JSON.parse(res.body);
        expect(r.status).equals('SUCCESS');
        expect(r.data).to.be.an('array');
        expect(r.data).length.greaterThan(0, 'Please connect atleast one USB drive to exectute this test suite');
        expect(res.statusCode).to.equal(200);
        // assign first connected drive.
        drive = r.data[0].path;
        done();
      });
    });
  });
  describe('ReadProgramFile', () => {
    it('it should read a filefrom the Device and return object', (done) => {
      let body = { drive: drive, fileSystem: DEVICE_FILESYSTEM_MOCK };
      options.method = 'POST';
      options.url = 'http://localhost:3009/deviceutility/services/ReadProgram';
      options.body = body;
      options.json = true;
      request(options, function (error, res) {
        if (error) throw new Error(error);
        let r = res.body;
        expect(r.status).equals('SUCCESS');
        expect(r.data).to.be.an('object');
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
    it('it should read a filefrom the Device and return object(Negative Scenario)', (done) => {
      let body = { drive: drive, fileSystem: DEVICE_FILESYSTEM_MOCK_NEGATIVE };
      options.method = 'POST';
      options.url = 'http://localhost:3009/deviceutility/services/ReadProgram';
      options.body = body;
      options.json = true;
      request(options, function (error, res) {
        if (error) throw new Error(error);
        let r = res.body;
        expect(r.status).equals('failure');
        done();
      });
    });
  });

  describe('ListTreatmentFiles', () => {
    it('it should GET all the TreatmentFiles ', (done) => {
      let body = { drive: drive, fileSystem: DEVICE_FILESYSTEM_MOCK };
      options.url = 'http://localhost:3009/deviceutility/services/ListTreatmentFiles';
      options.body = body;
      options.json = true;
      request(options, function (error, res, body) {
        if (error) throw new Error(error);
        let r = res.body;
        expect(r.status).equals('SUCCESS');
        expect(r.data).to.be.an('array');
        expect(r.data).length.greaterThan(0, 'Require atleast one Treatment file to perform Read Treatment file operation');
        filePath = r.data[0].path;
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
    it('it should GET all the TreatmentFiles(Negative Scenario) ', (done) => {
      let body = { drive: drive, fileSystem: DEVICE_FILESYSTEM_MOCK_NEGATIVE };
      options.url = 'http://localhost:3009/deviceutility/services/ListTreatmentFiles';
      options.body = body;
      options.json = true;
      request(options, function (error, res, body) {
        if (error) throw new Error(error);
        let r = res.body;
        expect(r.status).equals('error');
        done();
      });
    });
  });
  describe('ReadTreatmentFile', () => {
    it('it should read a file from the Device and return data', (done) => {
      filePath = {
        _folderPath: filePath.folderPath,
        _fileName: filePath.fileName
      };
      let body = { drive: drive, filePath: filePath };
      options.url = 'http://localhost:3009/deviceutility/services/ReadTreatmentFile';
      options.body = body;
      request(options, function (error, res) {
        // console.log('res', res.statusCode, res.status, res.body);
        if (error) throw new Error(error);
        let r = res.body;
        expect(res.statusCode).to.equal(200);
        expect(r.status).equals('SUCCESS');
        expect(r.data).to.be.an('string');
        done();
      });
    });
    it('it should read a file from the Device and return data(Negative Scenario)', (done) => {
      filePath = {
        _folderPath: DEVICE_FILESYSTEM_MOCK_NEGATIVE._treatmentFilePath._folderPath,
        _fileName: config.treatmentFile
      };
      let body = { drive: drive, filePath: filePath };
      options.url = 'http://localhost:3009/deviceutility/services/ReadTreatmentFile';
      options.body = body;
      request(options, function (error, res) {
        if (error) throw new Error(error);
        let r = res.body;
        expect(r.status.toUpperCase()).equals('ERROR');
        done();
      });
    });
  });
  // describe('IntializeDevice', () => {
  //   it('it should Check the Device is empty or not and if empty should create Folder Structure ', (done) => {
  //     options.url = 'http://localhost:3009/deviceutility/services/intializeDevice';
  //     options.body = { drive: drive, fileSystem: DEVICE_FILESYSTEM_MOCK };
  //     request(options, function (error, res, body) {
  //       if (error) throw new Error(error);
  //       expect(res.statusCode).to.equal(200);
  //       let r = res.body;
  //       expect(r.status).equals('SUCCESS');
  //       done();
  //     });
  //   });
  //   // Negative Scenario
  //   it('it should Check the Device is empty or not and if empty should create Folder Structure(Negative Scenario) ', (done) => {
  //     options.url = 'http://localhost:3009/deviceutility/services/intializeDevice';
  //     options.body = { drive: 'G:', fileSystem: DEVICE_FILESYSTEM_MOCK_NEGATIVE };
  //     request(options, function (error, res, body) {
  //       if (error) throw new Error(error);
  //       let r = res.body;
  //       expect(r.status.toUpperCase()).equals('ERROR');
  //       done();
  //     });
  //   });
  // });

  describe('UnAssignDrive ', () => {
    it('it should clean up the Device', (done) => {
      options.url = 'http://localhost:3009/deviceutility/services/UnAssignDrive';
      options.body = { drive: drive };
      request(options, function (error, res) {
        if (error) throw new Error(error);
        expect(res.statusCode).to.equal(200);
        let r = res.body;
        expect(r.status).equals('SUCCESS');
        done();
      });
    });
    // Negative Scenario
    it('it should clean up the Device', (done) => {
      options.url = 'http://localhost:3009/deviceutility/services/UnAssignDrive';
      options.body = { drive: config.drive };
      request(options, function (error, res) {
        if (error) throw new Error(error);
        let r = res.body;
        expect(r.status.toUpperCase()).equals('ERROR');
        done();
      });
    });
  });

  describe('WritePrescriptionFile', () => {
    it('it should write a file to the selected device and return success message', (done) => {
      options.url = 'http://localhost:3009/deviceutility/services/WriteProgram';
      options.body = { drive: drive, fileSystem: DEVICE_FILESYSTEM_MOCK };
      options.body.data = ENCODED_XML_MOCK;
      request(options, function (error, res) {
        if (error) throw new Error(error);
        expect(res.body).to.be.an('object');
        expect(res.statusCode).to.equal(200);
        done();
      });
    });
  });
});
