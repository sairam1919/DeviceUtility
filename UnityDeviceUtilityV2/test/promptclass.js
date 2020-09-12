var fs = require('fs');
const Promise = require('promise');
const uuidv4 = require('uuid/v4');

const encodedXmlMock = require('./Mock/Encoded_XML_MOCK.js');
const DeviceSystem = require('../ServerComponents/DeviceSystem');
const LogManagement = require('../ServerComponents/LogManagement');
const Validation = require('../ServerComponents/Validation');
const uuid = uuidv4();

let deviceSystem;
class PromptClass {
  constructor() {
    let validation = new Validation(uuid);
    let loggerService = new LogManagement(uuid, validation);
    validation.setLogger(loggerService);
    loggerService.init(uuid);
    deviceSystem = new DeviceSystem(uuid, loggerService);
    deviceSystem.intialize(uuid);
    // console.log('prompt-class initialized');
  }
  promptNewDriveConnection() {
    var p = new Promise(function (resolve, reject) {
      console.log(`Please insert USB drive to continue: `);
      deviceSystem.on('attach', function (uuid, drive) {
        // console.log('drive', drive);
        deviceSystem.removeAllListeners();
        resolve(drive.path);
      });
    });
    return p;
  }
  async checkDriveConnected(drive) {
    // var connected = false;
    var drv = await this.promptNewDriveConnection(drive);
    return drv;
  }
  isFolderExists(drive, folderPath, done) {
    var fPath = drive + '/' + folderPath;
    // console.log(fPath);
    var connected = false;
    if (fs.existsSync(fPath)) {
      connected = true;
    } else {
      // console.log('The given path is not correct');
      fs.mkdirSync(fPath);
      connected = true;
    }
    if (connected && done) {
      done();
    }
    return connected;
  }
  async writeMockFile(drive, folderPath, fileName, done) {
    var connected = false;
    // console.log('folderpath', folderPath);
    let temp = drive + '/' + folderPath;
    let filepath = temp + '/' + fileName;
    let fldrcheck = this.isFolderExists(drive, folderPath);
    // console.log('folder check completed', fldrcheck);
    if (fldrcheck) {
      if (fs.existsSync(filepath)) {
        // console.log('The file exists');
        // return 'The file exists';
        connected = true;
      } else {
        // console.log(filepath);
        fs.writeFileSync(filepath, Buffer.from(encodedXmlMock, 'base64'));
        connected = true;
      }
    }
    if (connected) {
      done();
    }
  }

  validateStructure(data) {
    if (data === undefined) {
      return false;
    } else if (data.length === 0) {
      return true;
    } else {
      for (let i = 0; i < data.length; i++) {
        if (data[i].path === undefined || data[i].deviceName === undefined ||
          data[i].productID === undefined || data[i].vendorID === undefined) {
          return false;
        }
      }
    }
    return true;
  }
}
const promptClass = new PromptClass();
module.exports = promptClass;
