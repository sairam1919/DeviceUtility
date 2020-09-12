const chai = require('chai');
const fs = require('fs');
const expect = chai.expect;
const uuidv4 = require('uuid/v4');

const FilePath = require('../ServerComponents/DataEntity/FilePath');
const promptClass = require('./promptclass');
const uuid = uuidv4();
const DeviceSystem = require('../ServerComponents/DeviceSystem');
const Validation = require('../ServerComponents/Validation');
const LogManagement = require('../ServerComponents/LogManagement');
const encodedXmlMock = require('./Mock/Encoded_XML_MOCK.js');
const DEVICE_FILESYSTEM_MOCK = require('./Mock/DEVICE_FILESYSTEM_MOCK');
const DEVICE_FILESYSTEM_MOCK_NEGATIVE = require('./Mock/DEVICE_FILESYSTEM_MOCK_NEGATIVE');

let validation = new Validation(uuid);
let loggerService = new LogManagement(uuid, validation);
validation.setLogger(loggerService);
loggerService.init(uuid);
let deviceSystem = new DeviceSystem(uuid, loggerService);
deviceSystem.intialize(uuid);

describe('DeviceSystem', () => {
  describe('listRemovableStorageDevices()', function () {
    it('should return list of removable storage Devices connected to the system', function () {
      var listRemovableStorageDevices = deviceSystem.listRemovableStorageDrives(uuid);
      let temp = promptClass.validateStructure(listRemovableStorageDevices);
      expect(temp).to.equal(true);
    });
  });
  describe('listDrives()', function () {
    it('should return list of storage Devices connected to the system', async function () {
      try {
        let drives = await deviceSystem.listDrives(uuid);
        // console.log(drives);
        expect(drives).to.be.an('array');
        return drives;
      } catch (err) {
        console.log(err);
      }
    });
  });
  describe('findUnknownDevices()', function () {
    it('should return list of removable storage Devices which are connected before intialization', async function () {
      var unknownDevices = await deviceSystem.findUnknownDevices('');
      // console.log(unknownDevices);
      let temp = promptClass.validateStructure(unknownDevices);
      expect(temp).to.equal(true);
      return unknownDevices;
    });
  });
  describe('checkDriveConnected', function () {
    let drive;
    before(async function () {
      drive = await promptClass.promptNewDriveConnection();
      return drive;
    });
    describe('listFiles()', function () {
      it('should return list of files in the selected Device', async function () {
        var folderPath = drive + DEVICE_FILESYSTEM_MOCK._treatmentFilePath._folderPath;
        let fPath = new FilePath(folderPath, '');
        var listFiles = await deviceSystem.listFiles(uuid, fPath);
        expect(listFiles).to.be.an('array');
        return listFiles;
      });
      it('should return list of files in the selected Device(Negative Scenario)', async function () {
        var folderPath = drive + DEVICE_FILESYSTEM_MOCK_NEGATIVE._treatmentFilePath._folderPath;
        let fPath = new FilePath(folderPath, '');
        let files;
        try {
          files = await deviceSystem.listFiles(uuid, fPath);
        } catch (err) {
          expect(err.status.toUpperCase()).equals('ERROR');
        }
        return files;
      });
    });
    describe('readStat()', function () {
      var folderPath = DEVICE_FILESYSTEM_MOCK._programFilePath._folderPath;
      var fileName = DEVICE_FILESYSTEM_MOCK._programFilePath._fileName;
      before(function (done) {
        // console.log(config);
        promptClass.writeMockFile(drive, folderPath, fileName, done);
      });
      it('should return stats of a file & tell wether it is a file or folder', async function () {
        var folderPath = DEVICE_FILESYSTEM_MOCK._programFilePath._folderPath;
        var fileName = DEVICE_FILESYSTEM_MOCK._programFilePath._fileName;
        var Path = drive + '/' + folderPath;
        let fPath = new FilePath(Path, fileName);
        var stats = await deviceSystem.readStat(uuid, fPath);
        expect(stats).to.be.an('object');
        return stats;
      });
    });
    describe('readFile()', function () {
      var folderPath = DEVICE_FILESYSTEM_MOCK._programFilePath._folderPath;
      var fileName = DEVICE_FILESYSTEM_MOCK._programFilePath._fileName;
      before(function (done) {
        promptClass.writeMockFile(drive, folderPath, fileName, done);
      });
      it('should return object of file data and message', async function () {
        var tempPath = drive + '/' + DEVICE_FILESYSTEM_MOCK._programFilePath._folderPath;
        let fPath = new FilePath(tempPath, DEVICE_FILESYSTEM_MOCK._programFilePath._fileName);
        var readfile = await deviceSystem.readFile(uuid, fPath);
        let boolean = false;
        if (readfile.data === encodedXmlMock) {
          boolean = true;
        }
        expect(boolean).to.equal(true);
        return readfile;
      });
      it('should return object of file data and message(Negative Scenario)', async function () {
        var filename = DEVICE_FILESYSTEM_MOCK_NEGATIVE._programFilePath._fileName;
        var tempPath = drive + '/' + DEVICE_FILESYSTEM_MOCK_NEGATIVE._programFilePath._folderPath;
        let fPath = new FilePath(tempPath, filename);
        var readfile = await deviceSystem.readFile(uuid, fPath);
        expect(readfile.status).equals('failure');
        return readfile;
      });
    });
    describe('writeFile()', function () {
      var data = encodedXmlMock;
      it('should write a file to the device and return response message', async function () {
        var tempPath = drive + '/' + DEVICE_FILESYSTEM_MOCK._programFilePath._folderPath;
        let fPath = new FilePath(tempPath, DEVICE_FILESYSTEM_MOCK._programFilePath._fileName);
        var writeFile = await deviceSystem.writeFile(uuid, fPath, data);
        expect(writeFile.status.toUpperCase()).to.equal('SUCCESS');
        return writeFile;
      });
      it('should check file is created or not', function () {
        var fileName = DEVICE_FILESYSTEM_MOCK._programFilePath._fileName;
        var path = drive + '/' + fileName;
        var check = fs.existsSync(path);
        expect(check).to.equal(true);
      });
      // it('should check file is created or not(Negative Scenario)', async function () {
      //   var tempPath = drive + '/' + DEVICE_FILESYSTEM_MOCK_NEGATIVE._programFilePath._folderPath;
      //   let fPath = new FilePath(tempPath, DEVICE_FILESYSTEM_MOCK_NEGATIVE._programFilePath._fileName);
      //   let writeFileNeg;
      //   try {
      //     writeFileNeg = await deviceSystem.writeFile(uuid, fPath, data);
      //   } catch (err) {
      //     console.log('err', err);
      //     console.log('writeFileNeg', writeFileNeg);
      //     expect(writeFileNeg.status.toUpperCase()).equals('ERROR');
      //   }
      //   return writeFileNeg;
      // });
    });
    /**
     * The WriteFile make sures file exists
     */
    describe('deleteFile()', function () {
      var fileName = DEVICE_FILESYSTEM_MOCK._programFilePath._fileName;
      it('should delete a file to the device and return response message', async function () {
        var tempPath = drive;
        let fPath = new FilePath(tempPath, fileName);
        var deleteFile = await deviceSystem.deleteFile(uuid, fPath);
        expect(deleteFile).to.be.an('object');
        return deleteFile;
      });
      it('should check file is deleted or not', function () {
        var path = drive + '/' + fileName;
        var check = fs.existsSync(path);
        expect(check).to.equal(false);
      });
    });
    // describe('createFolder()', function () {
    //   var folderPath = 'treatment2';
    //   it('should delete a file to the device and return response message', async function (done) {
    //     let fPath = new FilePath(drive + '/' + folderPath, '');
    //     var createFolder = await deviceSystem.createFolder(uuid, fPath);
    //     expect(createFolder).to.be.an('object');
    //     done();
    //   });
    //   it('should check file is created or not', function (done) {
    //     var path = drive + '/' + folderPath;
    //     var check = fs.existsSync(path);
    //     expect(check).to.equal(true);
    //     done();
    //   });
    //   it('should delete a file to the device and return response message (Negative Scenario)', async function (done) {
    //     // let fPath = new FilePath('G:' + '/' + folderPath, '');
    //     try {
    //       // var createFolder = await deviceSystem.createFolder(uuid, fPath);
    //     } catch (err) {
    //       expect(err.status.toUpperCase()).equals('ERROR');
    //     }
    //     done();
    //   });
    // });
    describe('deleteFolder()', function () {
      var folderPath = 'test';
      before(function (done) {
        promptClass.isFolderExists(drive, folderPath, done);
      });
      it('should delete a file to the device and return response message', async function () {
        let fPath = new FilePath(drive, folderPath);
        var deleteFolder = await deviceSystem.deleteFolder(uuid, fPath);
        console.log(deleteFolder);
        expect(deleteFolder.status.toLowerCase()).to.equal('success');
        return deleteFolder;
      });
      it('should check file is deleted or not', function () {
        var path = drive + '/' + folderPath;
        var check = fs.existsSync(path);
        expect(check).to.equal(false);
      });
    });
  });
});
