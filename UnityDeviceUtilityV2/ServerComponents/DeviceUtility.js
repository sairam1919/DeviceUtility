// modules require
const path = require('path');
const SSE = require('sse-node');
const fs = require('fs');
// services require
const DeviceSystem = require('./DeviceSystem');

// DataEntity require
const ResMessage = require('./DataEntity/ResMessage');
const FileMetaData = require('./DataEntity/FileMetaData');
const FilePath = require('./DataEntity/FilePath');
let packageJSON;
// Package json
try {
  packageJSON = require('../package.json');
} catch (err) {
  packageJSON = require('../../package.json');
}

let deviceSystem, validation, logManagement;

/**
 * DeviceUtilty class interacts with the respective class.
 * 
 * @class DeviceUtility
 */
class DeviceUtility {
  constructor(uuid, validate, log) {
    try {
      deviceSystem = new DeviceSystem(uuid, log);
    } catch (err) {
      logManagement.log(uuid, err, 'error');
    }
  }

  /**
   * intialize will take input from package.JSON and validate for application information.
   * 
   * @param {any} uuid 
   * @param {any} validate 
   * @param {any} log 
   * @memberof DeviceUtility
   */
  async intialize(uuid, validate, log) {
    logManagement = log;
    logManagement.log(uuid, 'Start: DeviceUtility.intialize', 'debug');
    await deviceSystem.intialize(uuid);
    validation = validate;
    validation.setDeviceSystem(deviceSystem);
    this.clients = [];
    this.applicationInformation = validation.validateAppInfo(uuid, packageJSON);
    this.subscribeEvents(uuid);
    logManagement.log(uuid, 'End: DeviceUtility.intialize', 'debug');
  }
  /**
   * isRunning is to get the application information and unknownDeviceList.
   * Application information contains devicemetadata,AppName,Version of the application.
   * It will take uuid as a request header.
   *
   * @param {any} req
   * @param {any} res
   * @memberof DeviceUtility
   */
  isRunning(req, res) {
    let uuid = validation.validateUUID(req.headers.uuid);
    logManagement.log(uuid, 'Start: DeviceUtility.IsRunning', 'debug');
    let response = new ResMessage();
    try {
      let devices = deviceSystem.listUnknownDevices(uuid);
      this.applicationInformation.deviceMetaData = devices;
      response.message = 'List of Devices connected';
      response.status = 'SUCCESS';
      response.data = this.applicationInformation;
      logManagement.log(uuid, JSON.stringify(response), 'debug');
      res.send(response);
      logManagement.log(uuid, 'End: DeviceUtility.IsRunning', 'debug');
    } catch (err) {
      response.message = 'Error while fetching unknown devices';
      response.status = 'error';
      response.data = '';
      logManagement.handleErrorMesssage(response);
      res.send(response);
    }
  }
  /**
   * listRemovableStirageDrives is to get the USB Devices connected to the system.
   * It will take uuid as a request header.
   *
   * @param {any} req
   * @param {any} res
   * @memberof DeviceUtility
   */
  listRemovableStorageDrives(req, res) {
    let uuid = validation.validateUUID(req.headers.uuid);
    logManagement.log(uuid, 'Start: DeviceUtility.listRemovableStorageDrives', 'debug');
    let response = new ResMessage();
    try {
      logManagement.log(uuid, '/ListRemovableStorageDevices request received', 'debug');
      let devices = deviceSystem.listRemovableStorageDrives(uuid);
      response.message = 'List of Devices connected';
      response.status = 'SUCCESS';
      response.data = devices;
      res.send(response);
      logManagement.log(uuid, '/ListRemovableStorageDevices request responded', 'debug');
    } catch (err) {
      logManagement.handleErrorMesssage(uuid, err);
      response = new ResMessage('Error while reading list removable storage devices', 'error', ' ');
      res.send(response);
    }
  }

  /**
   * readProgramFile function is used to read the program file.
   * This programfile gets the filename as an input.
   * In return it will send the filedata object as a response.
   * It will take uuid as a request header.
   *
   * @param {any} req
   * @param {any} res
   * @memberof DeviceUtility
   */
  async readProgramFile(req, res) {
    let uuid = validation.validateUUID(req.headers.uuid);
    logManagement.log(uuid, 'Start: DeviceUtility.readProgramFile', 'debug');
    try {
      logManagement.log(uuid, 'readProgramFile request received', 'debug');
      let drive = req.body.drive;
      let fileSystem = req.body.fileSystem;
      validation.validateDrive(uuid, drive);
      fileSystem = validation.validateFileSystem(uuid, fileSystem);
      let fPath = fileSystem.programFilePath;
      fPath.folderPath = drive + ((fPath.folderPath.length > 0 && fPath.folderPath[0] !== '/') ? '/' + fPath.folderPath : fPath.folderPath);
      let readFileRes = await deviceSystem.readFile(uuid, fPath);
      let response = await deviceSystem.listFiles(uuid, fPath);
      if (readFileRes.status.toLowerCase() === 'failure' && response.length <= 1) {
        readFileRes.data = {
          fileData: '',
          state: 'empty'
        };
      } else if (readFileRes.status.toLowerCase() === 'failure') {
        readFileRes.data = {
          fileData: '',
          state: 'noProgram'
        };
      }
      if (readFileRes.status.toLowerCase() === 'success') {
        let childs;
        let fpath = fileSystem.treatmentFilePath;
        fpath.folderPath = drive + ((fpath.folderPath.length > 0 && fpath.folderPath[0] !== '/') ? '/' + fpath.folderPath : fpath.folderPath);
        try {
          childs = await deviceSystem.listFiles(uuid, fpath);
          if (childs.length > 0) {
            readFileRes.data = {
              fileData: readFileRes.data,
              state: 'both'
            };
          } else {
            readFileRes.data = {
              fileData: readFileRes.data,
              state: 'program'
            };
          }
        } catch (err) {
          readFileRes.data = {
            fileData: readFileRes.data,
            state: 'program'
          };
        }
      }
      res.send(readFileRes);
      logManagement.log(uuid, 'End: DeviceUtility.readProgramFile', 'debug');
    } catch (err) {
      logManagement.handleErrorMesssage(uuid, err);
      let response = new ResMessage();
      response.message = 'Error while Reading file from storage device';
      response.status = 'error';
      response.data = ' ';
      res.send(response);
    }
  }

  /**
   * writePrescriptionFile will write the prescription to the usb.
   * This will take File as an input and UUID in header.
   * It will take uuid as a request header.
   *
   * @param {any} req
   * @param {any} res
   * @memberof DeviceUtility
   */
  async writePrescriptionFile(req, res) {
    let uuid = validation.validateUUID(req.headers.uuid);
    logManagement.log(uuid, 'Start: DeviceUtility.writePrescriptionFile', 'debug');
    try {
      logManagement.log(uuid, 'writePrescriptionFile request received', 'debug');
      let drive = req.body.drive;
      let fileSystem = req.body.fileSystem;
      let data = req.body.data;
      validation.validateDrive(uuid, drive);
      fileSystem = validation.validateFileSystem(uuid, fileSystem);
      let programFilePath = fileSystem.programFilePath;
      programFilePath.folderPath = drive +
        (programFilePath.folderPath.length > 0 ? '/' + programFilePath.folderPath : '');
      try {
        await deviceSystem.deleteFile(uuid, programFilePath);
      } catch (err) {
        logManagement.log(uuid, err, 'error');
      }
      let writeFileRes = await deviceSystem.writeFile(uuid, programFilePath, data);
      let response = new ResMessage();
      response.message = 'The Program Data is Written to USB';
      response.status = 'SUCCESS';
      response.data = writeFileRes;
      logManagement.log(uuid, JSON.stringify(response), 'debug');
      res.send(writeFileRes);
      logManagement.log(uuid, 'End: DeviceUtility.writePrescriptionFile', 'debug');
    } catch (err) {
      logManagement.handleErrorMesssage(uuid, err);
      let response = new ResMessage();
      response.message = 'Error while writing file to storage devices ';
      response.status = 'error';
      response.data = err;
      res.send(response);
    }
  }

  /**
   * listTreatmentFiles will take drive letter and folder as an input.
   * it will return an array of file in the given input folder.
   * It will take uuid as a request header.
   *
   * @param {any} req
   * @param {any} res
   * @memberof DeviceUtility
   */
  async listTreatmentFiles(req, res) {
    let uuid = validation.validateUUID(req.headers.uuid);
    logManagement.log(uuid, 'Start: DeviceUtility.listTreatmentFiles', 'debug');
    let response = new ResMessage();
    try {
      let paramRegX = /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/;
      logManagement.log(uuid, '/listTreatmentFiles request received', 'debug');
      let drive = req.body.drive;
      let fileSystem = req.body.fileSystem;
      validation.validateDrive(uuid, drive);
      fileSystem = validation.validateFileSystem(uuid, fileSystem);
      let fileMetaData = [];
      let fPath = fileSystem.treatmentFilePath;
      fPath.folderPath = drive + ((fPath.folderPath.length > 0 && fPath.folderPath[0] !== '/') ? '/' + fPath.folderPath : fPath.folderPath);
      let TreatmentFileList = await deviceSystem.listFiles(uuid, fPath);
      for (let i = 0; i < TreatmentFileList.length; i++) {
        if (path.extname(TreatmentFileList[i]).toLowerCase() === '.xml') {
          try {
            if (this.getFilesizeInBytes(uuid, fPath, TreatmentFileList[i])) {
              let ma = paramRegX.exec(TreatmentFileList[i]);
              let creationDate = ma[1] + '-' + ma[2] + '-' + ma[3] + ' ' + ma[4] + ':' + ma[5];
              let path = new FilePath(fPath.folderPath, TreatmentFileList[i]);
              let fileMtaData = new FileMetaData(path, creationDate);
              fileMetaData.push(fileMtaData);
            } else {
              continue;
            }
          } catch (err) {
            logManagement.log(uuid, err, 'error');
          }
        }
      }
      response.message = 'The list of TreatmentFiles in USB';
      response.status = 'SUCCESS';
      response.data = fileMetaData;
      logManagement.log(uuid, JSON.stringify(response), 'debug');
      res.send(response);
      logManagement.log(uuid, 'End: DeviceUtility.listTreatmentFiles', 'debug');
    } catch (err) {
      logManagement.handleErrorMesssage(uuid, err);
      response.message = 'Error while getting the list of Treatment Files';
      response.status = 'error';
      response.data = err;
      res.send(response);
    }
  }

  /**
   * readTreatmentFile will accepts drive and filesystem as input.
   * It will return FileMetaData object as a response.
   * It will take uuid as a request header.
   *
   * @param {any} req
   * @param {any} res
   * @memberof DeviceUtility
   */
  async readTreatmentFile(req, res) {
    let uuid = validation.validateUUID(req.headers.uuid);
    logManagement.log(uuid, 'Start: DeviceUtility.readTreatmentFile', 'debug');
    try {
      logManagement.log(uuid, '/readTreatmentFile request received', 'debug');
      let drive = req.body.drive;
      let filepath = req.body.filePath;
      validation.validateDrive(uuid, drive);
      filepath = validation.validateFilePath(uuid, filepath);
      let readTreatmentFileRes = await deviceSystem.readFile(uuid, filepath);
      let response = new ResMessage();
      if (readTreatmentFileRes.status === 'error ' || readTreatmentFileRes.status === 'failure') {
        throw readTreatmentFileRes;
      }
      response.message = 'The TreatementFile data from Device Utiltiy';
      response.status = 'SUCCESS';
      response.data = readTreatmentFileRes.data;
      res.send(response);
      logManagement.log(uuid, 'End: DeviceUtility.readTreatmentFile', 'debug');
    } catch (err) {
      logManagement.handleErrorMesssage(uuid, err);
      let response = new ResMessage();
      response.message = 'Error While Reading TreatmentFile';
      response.status = 'error';
      response.data = err;
      res.send(response);
    }
  }

  /**
   * unAssignDrive will accepts drive as request input.
   * It will clear all the files and folders in the USB.
   * It will take uuid as a request header.
   *
   * @param {any} req
   * @param {any} res
   * @memberof DeviceUtility
   */
  async unAssignDrive(req, res) {
    let uuid = validation.validateUUID(req.headers.uuid);
    logManagement.log(uuid, 'Start: DeviceUtility.unAssignDrive', 'debug');
    let response = new ResMessage();
    try {
      logManagement.log(uuid, '/unAssignDrive request received', 'debug');
      let drive = req.body.drive;
      validation.validateDrive(uuid, drive);
      let path = new FilePath(drive, '');
      await this.deleteFiles(uuid, path);
      response.message = 'The Drive is Cleaned';
      response.status = 'SUCCESS';
      response.data = ' ';
      logManagement.log(uuid, JSON.stringify(response), 'debug');
      res.send(response);
      logManagement.log(uuid, 'End: DeviceUtility.unAssignDrive', 'debug');
    } catch (err) {
      logManagement.handleErrorMesssage(uuid, err);
      response.message = 'The unAssign is not done';
      response.status = 'error';
      response.data = ' ';
      res.send(response);
    }
  }

  /**
   * initializeDevice will accepts drive,filesystem as request input parameters.
   * It will create the folders in the USB.
   * IT will rerun ResponseMessage object as response.
   * It will take uuid as a request header.
   *
   * @param {any} req
   * @param {any} res
   * @memberof DeviceUtility
   */
  // async intializeDevice(req, res) {
  //   let uuid = validation.validateUUID(req.headers.uuid);
  //   logManagement.log(uuid, 'Start: DeviceUtility.intializeDevice', 'debug');
  //   let response = new ResMessage();
  //   try {
  //     logManagement.log(uuid, '/intializeDevice request received', 'debug');
  //     let drive = req.body.drive;
  //     let fileSystem = req.body.fileSystem;
  //     validation.validateDrive(uuid, drive);
  //     fileSystem = validation.validateFileSystem(uuid, fileSystem);
  //     let path = new FilePath(drive, '');
  //     // deletes files if exists
  //     let clearDevice = await this.deleteFiles(uuid, path);
  //     await this.createFolderStructure(uuid, drive, fileSystem.folderStructureInDevice);
  //     response.message = 'Device is initialized';
  //     response.status = 'SUCCESS';
  //     response.data = ' ';
  //     logManagement.log(uuid, 'End: DeviceUtility.intializeDevice', 'debug');
  //     res.send(response);
  //   } catch (err) {
  //     logManagement.handleErrorMesssage(uuid, err);
  //     let response = new ResMessage();
  //     response.message = 'Error while reading list removable storage devices';
  //     response.status = 'ERROR';
  //     response.data = ' ';
  //     res.send(response);
  //   }
  // }

  /**
   * createFolderStructure will create the folderStructure in the usb.
   *
   * @param {any} path
   * @param {any} folders
   * @memberof DeviceUtility
   */
  // async createFolderStructure(uuid, path, folders) {
  //   logManagement.log(uuid, 'Start: DeviceUtility.createFolderStructure', 'debug');
  //   for (var i = 0; i < folders.length; i++) {
  //     let childPath = path + '/' + folders[i].name;
  //     let fPath = new FilePath(childPath, '');
  //     await deviceSystem.createFolderInline(uuid, fPath);
  //     if (folders[i].subFolder) {
  //       await this.createFolderStructure(uuid, childPath, folders[i].subFolder);
  //     }
  //   }
  //   logManagement.log(uuid, 'End: DeviceUtility.createFolderStructure', 'debug');
  // }

  /**
   * deleteFiles is used to delete the files in the USB.
   *
   * @param {any} uuid, path
   * @memberof DeviceUtility
   */
  async deleteFiles(uuid, path) {
    logManagement.log(uuid, 'Start: DeviceUtility.deleteFiles', 'debug');
    let childs = await deviceSystem.listFiles(uuid, path);
    let volInfoFolInd = childs.indexOf('System Volume Information');
    if (volInfoFolInd > -1) {
      childs.splice(volInfoFolInd, 1);
    }
    for (let i = 0; i < childs.length; i++) {
      let fPath = new FilePath(path.folderPath, childs[i]);
      let statFile = await deviceSystem.readStat(uuid, fPath);
      let temp = statFile.data.isDirectory();
      if (temp === false) {
        await deviceSystem.deleteFile(uuid, fPath);
      } else {
        let childFPath = new FilePath(path.folderPath + '/' + childs[i], '');
        await this.deleteFiles(uuid, childFPath);
        await deviceSystem.deleteFolder(uuid, fPath);
      }
    }
    logManagement.log(uuid, 'End: DeviceUtility.deleteFiles', 'debug');
  }

  /**
   * registerEvents registers the Events and creates te client object.
   *
   * @param {any} req
   * @param {any} res
   * @memberof DeviceUtility
   */
  registerEvents(req, res) {
    let uuid = validation.validateUUID(req.headers.uuid);
    logManagement.log(uuid, 'Start: DeviceUtility.registerEvents', 'debug');
    try {
      logManagement.log(uuid, '/registerEvents request received', 'debug');
      const client = SSE(req, res, { ping: 2000 });
      this.clients.push(client);
      logManagement.log(uuid, 'End: DeviceUtility.registerEvents', 'debug');
    } catch (err) {
      logManagement.handleErrorMesssage(uuid, err);
      let response = new ResMessage();
      response.message = 'Error while reading list removable storage devices';
      response.status = 'ERROR';
      response.data = ' ';
      res.send(response);
    }
  }

  /**
   *subscribeEvents will subscribe the attac and dettach events when ever event occured.
   *
   * @memberof DeviceUtility
   */
  subscribeEvents(uuid) {
    logManagement.log(uuid, 'Start: DeviceUtility.subscribeEvents', 'debug');
    deviceSystem.on('attach', this.emitEvent.bind(this, 'attach'));
    deviceSystem.on('detach', this.emitEvent.bind(this, 'detach'));
    logManagement.log(uuid, 'End: DeviceUtility.subscribeEvents', 'debug');
  }

  /**
   * emitEvent will emit the devicemetadata object to the
   * unityviewer.
   *
   * @param {any} event
   * @param {any} uuid
   * @param {any} deviceMetaData
   * @memberof DeviceUtility
   */
  emitEvent(event, uuid, deviceMetaData) {
    logManagement.log(uuid, 'Start: DeviceUtility.emitEvent', 'debug');
    try {
      let data = {
        uuid: uuid,
        deviceMetaData: deviceMetaData
      };
      for (var i = 0; i < this.clients.length; i++) {
        this.clients[i].send(data, event);
      }
      logManagement.log(uuid, 'End: DeviceUtility.emitEvent', 'debug');
    } catch (err) {
      logManagement.handleErrorMesssage(uuid, err);
      let response = new ResMessage();
      response.message = 'Error while reading list removable storage devices';
      response.status = 'ERROR';
      response.data = ' ';
      // res.send(response);
    }
  }

  getFilesizeInBytes(uuid, path, filename) {
    logManagement.log(uuid, 'Start: DeviceUtility.getFilesizeInBytes', 'debug');
    let stats = fs.statSync(path.folderPath + '/' + filename);
    let fileSizeInBytes = stats['size'];
    let fileSizeInKilobytes = fileSizeInBytes / 1000;
    logManagement.log(uuid, 'fileSizeInKilobytes:' + fileSizeInKilobytes, 'debug');
    if (fileSizeInKilobytes >= 5) {
      logManagement.log(uuid, 'End: DeviceUtility.getFilesizeInBytes', 'debug');
      return true;
    } else {
      logManagement.log(uuid, 'End: DeviceUtility.getFilesizeInBytes', 'debug');
      return false;
    }
  }
}
module.exports = DeviceUtility;
