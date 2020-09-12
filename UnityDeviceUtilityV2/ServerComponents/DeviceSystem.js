// modules require
const drivelist = require('drivelist');
const fs = require('fs');
const Promise = require('promise');
const usb = require('usb');
const EventEmitter = require('events').EventEmitter;

let uuidv5 = require('uuid/v5');
const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

// Data Entity Require
const DeviceMetaData = require('./DataEntity/DeviceMetaData');
const ResMessage = require('./DataEntity/ResMessage');

let logManagement;

/**
 * DeviceSystem class interacts with the usb and passes the data to the DeviceUtility class.
 * 
 * @class DeviceSystem
 * @extends {EventEmitter}
 */
class DeviceSystem extends EventEmitter {
  constructor(uuid, log) {
    super();
    logManagement = log;
  }
  async intialize(uuid) {
    this.deviceMetaData = [];
    this.devicesAttached = [];
    this.unknownDevicesAttached = [];
    this.unknownDevices = [];

    this.registerEvents(uuid);
    await this.findUnknownDevices(uuid);
  }
  /**
   * This function is called on load of the application to get the List of connected devices
   * before starting the device utility application
   * 
   * @returns DeviceMetaData
   * @memberof DeviceSystem
   */
  async findUnknownDevices(uuid) {
    logManagement.log(uuid, 'Start: the Devicesystem.findUnknownDevices function', 'debug');
    this.unknownDevices = [];
    try {
      let drives = await this.listDrives(uuid);
      // let unknownDevices = [];
      for (var i = 0; i < drives.length; i++) {
        if (drives[i].system === false) {
          let mountPointPath = drives[i].mountpoints[0].path;
          let deviceName = drives[i].description;
          let deviceInfo = new DeviceMetaData();
          this.unknownDevicesAttached.push(mountPointPath);
          deviceInfo.path = mountPointPath;
          deviceInfo.deviceName = deviceName;
          deviceInfo.productID = '';
          deviceInfo.vendorID = '';
          this.unknownDevices.push(deviceInfo);
        }
      }
    } catch (err) {
      logManagement.log(uuid, err, 'error');
    }
    logManagement.log(uuid, JSON.stringify(this.unknownDevices), 'debug');
    logManagement.log(uuid, 'End: from the DeviceSystem.findUnknownDevices function', 'debug');
    return this.unknownDevices;
  }

  /**
   * listDrives will uses drivelist module to list the connected usb devices.
   * 
   * @returns driveList
   * @memberof DeviceSystem
   */
  async listDrives(uuid) {
    logManagement.log(uuid, 'Start: DeviceSystem.listDrives', 'debug');
    var promise = new Promise(function promiseListFile(resolve, reject) {
      drivelist.list(listDrivesInline.bind(this, resolve, reject));
    });
    return promise;
    function listDrivesInline(resolve, reject, error, drives) {
      if (error) {
        let response = new ResMessage();
        response.message = uuid + 'Error while getting the Connected Devices';
        response.status = 'error';
        logManagement.handleErrorMesssage(uuid, response);
        reject(response);
      } else {
        logManagement.log(uuid, 'End: DeviceSystem.listDrives', 'debug');
        resolve(drives);
      }
    }
  }

  /**
   * listUnknownDevices will return the removable storage devices.
   * 
   * @param {any} uuid 
   * @returns DeviceMetadata
   * @memberof DeviceSystem
   */
  listRemovableStorageDrives(uuid) {
    logManagement.log(uuid, 'Start: DeviceSystem.listRemovableStorageDevices', 'debug');
    logManagement.log(uuid, 'End: DeviceSystem.listRemovableStorageDevices', 'debug');
    return this.deviceMetaData;
  }

  /**
   * listUnknownDevices will return the removable storage devices
   * connected to the systme before starting device utility.
   * 
   * @param {any} uuid 
   * @returns DeviceMetadata[]
   * @memberof DeviceSystem
   */
  listUnknownDevices(uuid) {
    logManagement.log(uuid, 'Start: DeviceSystem.listUnknownDevices', 'debug');
    logManagement.log(uuid, 'End: DeviceSystem.listUnknownDevices', 'debug');
    return this.unknownDevices;
  }

  /**
   * listFiles is used to listFiles in the usb device.
   * 
   * @param {any} uuid 
   * @param {any} path 
   * @returns ResponseMessage
   * @memberof DeviceSystem
   */
  async listFiles(uuid, path) {
    logManagement.log(uuid, 'Start: DeviceSystem.listFilesInline', 'debug');
    var fp = path.folderPath;
    let response = new ResMessage();
    var promise = new Promise(function promiseListFile(resolve, reject) {
      fs.readdir(fp, listFilesInline.bind(this, resolve, reject));
    });
    return promise;
    function listFilesInline(resolve, reject, err, result) {
      if (err) {
        response.message = uuid + 'Error while Reading Files in the device';
        response.status = 'error';
        response.data = err;
        logManagement.handleErrorMesssage(uuid, err);
        reject(response);
      } else {
        logManagement.log(uuid, 'End: DeviceSystem.listFiles', 'debug');
        resolve(result);
      }
    }
  }

  /**
   * readStat is used to get the stats of a file
   * and to validae a selected one is file/folder whilte delete operation.
   * 
   * @param {any} uuid 
   * @param {any} path 
   * @returns ResponseMessage/stats
   * @memberof DeviceSystem
   */
  async readStat(uuid, path) {
    logManagement.log(uuid, 'Start: DeviceSystem.readStat', 'debug');
    let fp = path.folderPath + '/' + path.fileName;
    let response = new ResMessage();
    let promise = new Promise(function promiseWriteFile(resolve, reject) {
      fs.stat(fp, stats.bind(this, resolve, reject));
    });
    return promise;
    function stats(resolve, reject, err, stats) {
      if (err) {
        response.message = uuid + 'Error while getting the stats of a file';
        response.status = 'error';
        response.data = err;
        logManagement.handleErrorMesssage(uuid, response);
        reject(response);
      } else {
        response.message = uuid + 'Data from the readStat';
        response.status = 'success';
        response.data = stats;
        logManagement.log(uuid, 'End: DeviceSystem.readStat', 'debug');
        resolve(response);
      }
      return stats;
    }
  }

  /**
   * readFile will reads the file data from the given path.
   * 
   * @param {any} uuid 
   * @param {any} path 
   * @returns string
   * @memberof DeviceSystem
   */
  async readFile(uuid, path) {
    logManagement.log(uuid, 'Start: DeviceSystem.readFile', 'debug');
    let data = '';
    let fpath = path.folderPath + '/' + path.fileName;
    let response = new ResMessage();
    try {
      var readStream = fs.createReadStream(fpath, 'utf8');
      var promise = new Promise(function promiseReadFile(resolve, reject) {
        readStream.on('data', function (chunk) {
          data += chunk;
        }).on('end', function () {
          response.message = 'The File Data from Device Utility';
          response.status = 'SUCCESS';
          let encodedData = Buffer.from(data).toString('base64');
          response.data = encodedData;
          readStream.destroy();
          logManagement.log(uuid, 'End: DeviceSystem.readFile', 'debug');
          resolve(response);
        }).on('error', function readError(err) {
          if (err.errno === -4058) {
            response.message = 'file not found';
            response.status = 'failure';
            response.data = '';
            readStream.destroy();
            logManagement.log(uuid, 'End: DeviceSystem.readFile', 'debug');
            resolve(response);
          } else {
            response.message = 'Error while reading data from file path: ' + fpath;
            response.status = 'error';
            response.data = err.errno;
            readStream.destroy();
            logManagement.log(uuid, 'End: DeviceSystem.readFile', 'debug');
            resolve(response);
          }
        });
      });
      return promise;
    } catch (err) {
      response.message = 'Error occured while reading  File';
      response.status = 'error';
      response.data = err.errno;
      logManagement.log(uuid, JSON.stringify(response), 'debug');
      return response;
    }
  }

  /**
   * writeFileInline will write the data to usb in the given path.
   * 
   * @param {any} uuid 
   * @param {any} path 
   * @param {any} data 
   * @returns ResponseMessage
   * @memberof DeviceSystem
   */
  async writeFile(uuid, path, data) {
    logManagement.log(uuid, 'Start: DeviceSystem.writeFile', 'debug');
    var fp = path.folderPath + '/' + path.fileName;
    var tempFile = fs.createWriteStream(fp);
    var promise = new Promise(function promiseWriteFile(resolve, reject) {
      try {
        tempFile.on('error', function (e) {
          var response = new ResMessage();
          response.message = uuid + ': Error while writing the File to device';
          response.status = 'error';
          response.data = e;
          logManagement.handleErrorMesssage(uuid, e);
          tempFile.destroy();
          reject(response);
        });
        let decodedData = Buffer.from(data, 'base64');
        tempFile.write(decodedData, writeFileInline.bind(this, resolve, reject));
      } catch (err) {
        this.logManagement.log(uuid, err, 'error');
      }
    });
    return promise;
    function writeFileInline(resolve, reject) {
      let response = new ResMessage();
      response.message = uuid + ': The File written to device successfully';
      response.status = 'SUCCESS';
      response.data = ' ';
      logManagement.log(uuid, JSON.stringify(response), 'debug');
      tempFile.destroy();
      logManagement.log(uuid, 'End: DeviceSystem.writeFile', 'debug');
      resolve(response);
    }
  }

  /**
   * deleteFileInline is used to delete the file.
   * 
   * @param {any} uuid 
   * @param {any} path 
   * @returns ResponseMessage
   * @memberof DeviceSystem
   */
  async deleteFile(uuid, path) {
    logManagement.log(uuid, 'Start: deleteFile', 'debug');
    let fp = path.folderPath + '/' + path.fileName;
    let response = new ResMessage();
    logManagement.log(uuid, 'Deleted File Path:' + fp, 'debug');
    var promise = new Promise(function promiseDeleteFile(resolve, reject) {
      fs.unlink(fp, deleteFileInline.bind(this, resolve, reject));
    });
    return promise;
    function deleteFileInline(resolve, reject, err, result) {
      if (err) {
        response.message = uuid + 'Error while deleting the File from device';
        response.status = 'error';
        logManagement.handleErrorMesssage(uuid, err);
        reject(response);
      } else {
        response.message = uuid + 'The File deleted from device successfully';
        response.status = 'SUCCESS';
        logManagement.log(uuid, response, 'debug');
        logManagement.log(uuid, 'End: deleteFile', 'debug');
        resolve(response);
      }
    }
  }

  /**
   * createFolderInline is used to create the folder.
   * 
   * @param {any} uuid 
   * @param {any} path 
   * @returns ResponseMessage
   * @memberof DeviceSystem
   */
  // async createFolderInline(uuid, path) {
  //   logManagement.log(uuid, 'Start: createFolder', 'debug');
  //   let response = new ResMessage();
  //   if (!fs.existsSync(path.folderPath)) {
  //     var promise = new Promise(function promiseCreateFolder(resolve, reject) {
  //       fs.mkdir(path.folderPath, createFldr.bind(this, resolve, reject));
  //     });
  //     return promise;
  //     function createFldr(resolve, reject, err, result) {
  //       if (err) {
  //         response.message = uuid + 'Error while creating the Folder in device';
  //         response.status = 'error';
  //         logManagement.handleErrorMesssage(uuid, err);
  //         logManagement.log(uuid, 'End: createFolder', 'debug');
  //         reject(response);
  //       } else {
  //         response.message = uuid + 'The Folder created in device successfully';
  //         response.status = 'SUCCESS';
  //         response.data = '';
  //         logManagement.log(uuid, response, 'debug');
  //         logManagement.log(uuid, 'End: createFolder', 'debug');
  //         resolve(response);
  //       }
  //     }
  //   }
  // }

  /**
   * deleteFolderInline is used to delete the folder
   * 
   * @param {any} uuid 
   * @param {any} path 
   * @returns ResponseMessage
   * @memberof DeviceSystem
   */
  async deleteFolder(uuid, path) {
    logManagement.log(uuid, 'Start: deleteFolder', 'debug');
    let response = new ResMessage();
    let fp = path.folderPath + '/' + path.fileName;
    logManagement.log(uuid, 'Deleted Folder Path:' + fp, 'debug');
    var promise = new Promise(function promiseDeleteFile(resolve, reject) {
      fs.rmdir(fp, deleteFolderInline.bind(this, resolve, reject));
    });
    return promise;
    function deleteFolderInline(resolve, reject, err, result) {
      if (err) {
        response.message = uuid + 'Error while deleting the Folder from device';
        response.status = 'error';
        logManagement.handleErrorMesssage(uuid, err);
        reject(response);
      } else {
        response.message = uuid + 'The Folder deleted from device successfully';
        response.status = 'SUCCESS';
        response.data = '';
        logManagement.log(uuid, JSON.stringify(response), 'debug');
        logManagement.log(uuid, 'End: deleteFolder', 'debug');
        resolve(response);
      }
    }
  }

  /**
   * attachDevice will push the drive to deviceMetaData array when drive is connected.
   * 
   * @param {any} device 
   * @memberof DeviceSystem
   */
  async attachDevice(device) {
    let uuid = uuidv5('Device Utility Application', MY_NAMESPACE);
    logManagement.log(uuid, 'Start: attachDevice', 'debug');
    let drives = await this.listDrives(uuid);
    // loop to get all the Connected USB Devices in to an array
    for (var i = 0; i < drives.length; i++) {
      if (drives[i].system === false) {
        var mountPointPath = drives[i].mountpoints[0].path;
        var deviceName = drives[i].description;
        var productID = device.deviceDescriptor.idVendor;
        var vendorID = device.deviceDescriptor.idProduct;
        if (this.devicesAttached.indexOf(mountPointPath) === -1 && this.unknownDevicesAttached.indexOf(mountPointPath) === -1) {
          let deviceInfo = new DeviceMetaData();
          deviceInfo.path = mountPointPath;
          deviceInfo.deviceName = deviceName;
          deviceInfo.productID = JSON.stringify(productID);
          deviceInfo.vendorID = JSON.stringify(vendorID);
          this.deviceMetaData.push(deviceInfo);
          this.devicesAttached.push(mountPointPath);
          logManagement.log(uuid, mountPointPath + ' attached', 'debug');
          this.emit('attach', uuid, deviceInfo);
        }
      }
    }
    logManagement.log(uuid, 'End: attachDevice', 'debug');
  }

  /**
   * detachDevice will remove the drive from deviceMetaData array when drive is disconnected.
   * 
   * @param {any} device 
   * @memberof DeviceSystem
   */
  async detachDevice(device) {
    let uuid = uuidv5('Device Utility Application', MY_NAMESPACE);
    logManagement.log(uuid, 'Start: detachDevice', 'debug');
    let drives = await this.listDrives(uuid);
    var drivespath = [];
    // loop to get all the Connected USB Devices in to an array
    for (let i = 0; i < drives.length; i++) {
      if (drives[i].system === false) {
        drivespath.push(drives[i].mountpoints[0].path);
      }
    }
    this.devicesAttached = this.devicesAttached.filter((o, i) => {
      if (drivespath.indexOf(o) === -1) {
        logManagement.log(uuid, o + ' detached', 'debug');
        this.emit('detach', uuid, this.deviceMetaData[i]);
        this.deviceMetaData.splice(i, 1);
        logManagement.log(uuid, 'End: detachDevice', 'debug');
        return false;
      }
      logManagement.log(uuid, 'End: detachDevice', 'debug');
      return true;
    });
    this.unknownDevicesAttached = this.unknownDevicesAttached.filter((o, i) => {
      if (drivespath.indexOf(o) === -1) {
        this.emit('detach', uuid, this.unknownDevices[i]);
        logManagement.log(uuid, o + ' detached', 'debug');
        this.unknownDevices.splice(i, 1);
        logManagement.log(uuid, 'End: detachDevice', 'debug');
        return false;
      }
      logManagement.log(uuid, 'End: detachDevice', 'debug');
      return true;
    });
  }

  /**
   * registerEvents will register attach and detach events of USB.
   * 
   * @memberof DeviceSystem
   */
  registerEvents(uuid) {
    logManagement.log(uuid, 'Start: registerEvents', 'debug');
    usb.on('attach', this.attachDevice.bind(this));
    usb.on('detach', this.detachDevice.bind(this));
    logManagement.log(uuid, 'End: registerEvents', 'debug');
  }
}
module.exports = DeviceSystem;
