// module require
let uuidv5 = require('uuid/v5');
const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

// Data Entity
const FilePath = require('./DataEntity/FilePath');
const Folder = require('./DataEntity/Folder');
const DeviceFileSystem = require('./DataEntity/DeviceFileSystem');
const ApplicationInformation = require('./DataEntity/ApplicationInformation');
const ResponseMessage = require('./DataEntity/ResMessage');

let logger, deviceSystem;

/**
 * Validation class will validate the data.
 * 
 * @class Validation
 */
class Validation {
  constructor(uuid) {
    this.errMessage = [
      'Drive path is invalid',
      'Device not connected',
      'Device file system structure is invalid',
      'Device folder structure is invalid',
      'Device folder path is invalid',
      'Device File path is invalid'
    ];
  }

  /**
   * setLogger will set log value to logger.
   * 
   * @param {any} log 
   * @memberof Validation
   */
  setLogger(log) {
    logger = log;
  }

  /**
   * setDeviceSystem will set device value to deviceStstem.
   * 
   * @param {any} device 
   * @memberof Validation
   */
  setDeviceSystem(device) {
    deviceSystem = device;
  }

  /**
   * validateFilePath will check whether path, folderPath and fileName is defined and returns FilePath.
   * if not it will throw error.
   * 
   * @param {any} path 
   * @returns FilePath
   * @memberof Validation
   */
  validateFilePath(uuid, path) {
    logger.log(uuid, 'Start: Validation.validateFilePath', 'debug');
    if (path === undefined || path._folderPath === undefined || path._fileName === undefined) {
      logger.log(uuid, this.errMessage[5], 'error');
      logger.log(uuid, 'End: Validation.validateFilePath', 'debug');
      throw new Error(this.errMessage[5]);
    }
    logger.log(uuid, 'End: Validation.validateFilePath', 'debug');
    return new FilePath(path._folderPath, path._fileName);
  }

  /**
   * validateDrive will check whether drive, drive length and type of drive is defined.
   * if not it will throw error.
   * 
   * @param {any} drive 
   * @memberof Validation
   */
  validateDrive(uuid, drive) {
    logger.log(uuid, 'Start: Validation.validateDrive', 'debug');
    if (drive === undefined || drive.length === 0 || typeof drive !== 'string') {
      logger.log(uuid, this.errMessage[0], 'error');
      logger.log(uuid, 'End: Validation.validateDrive', 'debug');
      throw new Error(this.errMessage[0]);
    }
    if (deviceSystem.devicesAttached.indexOf(drive) === -1) {
      logger.log(uuid, this.errMessage[1], 'error');
      logger.log(uuid, 'End: Validation.validateDrive', 'debug');
      throw new Error(this.errMessage[1]);
    }
    logger.log(uuid, 'End: Validation.validateDrive', 'debug');
  }

  /** 
   * validateFileSystem will validate folderStructure and subFolders is defined and returns FolderStructure.
   * if not it will throw error.
   * 
   * @param {any} fldStr 
   * @returns FolderStructure
   * @memberof Validation
   */
  validateFileSystem(uuid, fldStr) {
    logger.log(uuid, 'Start: Validation.validateFilesystem', 'debug');
    if (fldStr === undefined) {
      throw new Error(this.errMessage[2]);
    }
    const prgFP = this.validateFilePath(uuid, fldStr._programFilePath);
    const trtFP = this.validateFilePath(uuid, fldStr._treatmentFilePath);
    const fldSt = validateFldrStrc.call(this, fldStr._folderStructureInDevice);
    let fileSystem = new DeviceFileSystem(prgFP, trtFP, fldSt);
    return fileSystem;

    /**
     * validateFldStrc will validate sub folder is defined and returns.
     * @param {any} folders 
     * @returns 
     */
    function validateFldrStrc(folders) {
      const dFldrs = [];
      let dFldr, sFldr;
      for (let i = 0, len = folders.length; i < len; i++) {
        sFldr = folders[i];
        if (sFldr === undefined || sFldr._name === undefined) {
          logger.log(uuid, this.errMessage[3], 'error');
          logger.log(uuid, 'End: Validation.validateFilesystem', 'debug');
          throw new Error(this.errMessage[3]);
        }
        if (sFldr._subFolder) {
          dFldr = new Folder(sFldr._name, validateFldrStrc.call(this, sFldr._subFolder));
          dFldrs.push(dFldr);
        } else {
          dFldr = new Folder(sFldr._name, undefined);
          dFldrs.push(dFldr);
        }
      }
      logger.log(uuid, 'End: Validation.validateFilesystem', 'debug');
      return dFldrs;
    }
  }

  /**
   * validateAppInfo will check whether packageJSON  is defined and
   * name,version is not null return ApplicationInformation .
   * if not it will throw error.
   * 
   * @param {any} uuid 
   * @param {any} packageJSON 
   * @returns ApplicationInformation
   * @memberof Validation
   */
  validateAppInfo(uuid, packageJSON) {
    logger.log(uuid, 'Start: Validation.validateAppInfo', 'debug');
    let name, version;
    if (!packageJSON) {
      name = '';
      version = '';
    } else if (!packageJSON.name) {
      name = '';
    } else if (!packageJSON.version) {
      version = '';
    }
    if (name === '' || version === '') {
      logger.log(uuid, 'Update name and version information into Package.json', 'warn');
      return new ResponseMessage('Update name and version information into Package.json', 'error', undefined);
    } else {
      name = packageJSON.name;
      version = packageJSON.version;
    }
    logger.log(uuid, 'End: Validation.validateAppInfo', 'debug');
    return new ApplicationInformation(name, version, undefined);
  }

  /**
   * validateUUID will check whether uuid is defined and returns uuid.
   * if not it will throw error.
   * 
   * @param {any} uuid 
   * @returns UUID
   * @memberof Validation
   */
  validateUUID(uuid) {
    logger.log(uuid, 'Start: Validation.validateUUID', 'debug');
    if (!uuid) {
      uuid = uuidv5('Device Utility Application', MY_NAMESPACE);
      logger.log(uuid, 'uuid from Browser is not received. Hence using this uuid: ' + uuid, 'warn');
    }
    logger.log(uuid, 'End: Validation.validateUUID', 'debug');
    return uuid;
  }

  /**
   * validateLogConfig will check whether config is defined and returns config.
   * if not it will throw error.
   * 
   * @param {any} uuid 
   * @param {any} config 
   * @returns Config
   * @memberof Validation
   */
  validateLogConfig(uuid, config) {
    logger.log(uuid, 'Start: Validate.validateLogConfig', 'debug');
    if (!config) {
      logger.log(uuid, 'config.json is not available in log folder', 'warn');
      config = {};
    }
    if (!config.maxInMB || config.maxInMB < 1) {
      logger.log(uuid, 'max file size is not configured in log/config.json.', 'warn');
      config.maxInMB = 1;
    }
    if (!config.maxLogFiles) {
      logger.log(uuid, 'max no of files is not configured in log/config.json.', 'warn');
      config.maxLogFiles = 5;
    }
    logger.log(uuid, 'End: Validate.validateLogConfig', 'debug');
    return config;
  }
}
module.exports = Validation;
