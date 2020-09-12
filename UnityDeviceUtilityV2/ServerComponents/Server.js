// module import
const express = require('express');
const bodyParser = require('body-parser');

// services require
const DeviceUtility = require('./DeviceUtility');
const LogManagement = require('./LogManagement');
const Validation = require('./Validation');

let validation, loggerService, deviceUtility;

/**
 * Server class interacts with the DeviceUtility, LogManagement, Validation classes.
 * 
 * @class Server
 */
class Server {
  constructor(uuid) {
    try {
      validation = new Validation(uuid);
      loggerService = new LogManagement(uuid, validation);
      validation.setLogger(loggerService);
      loggerService.init(uuid);
      deviceUtility = new DeviceUtility(uuid, validation, loggerService);
    } catch (err) {
      loggerService.log(uuid, err, 'error');
    }
  }

  /**
   * initialize will check for allowCrossOriginRequest, registerMiddleware and registerRestEndPoint,
   * when ever interaction needs with RestEndPoints.
   * 
   * @param {any} uuid 
   * @memberof Server
   */
  async intialize(uuid) {
    await deviceUtility.intialize(uuid, validation, loggerService);
    loggerService.log(uuid, 'intialize start', 'debug');
    this.app = express();
    this.allowCrossOriginRequest(uuid);
    this.registerMiddleware(uuid);
    this.registerRestEndPoints(uuid);
    loggerService.log(uuid, 'intialize device utility completed', 'debug');
  }
  /**
   * allowCrossOriginRequest is to set the response headers,
   * which is usefull for cross origin access
   * 
   * @memberof Server
   */
  allowCrossOriginRequest(uuid) {
    loggerService.log(uuid, 'Start: Cross Origin Route registration', 'debug');
    this.app.options('*', function (req, res) {
      var headers = {};
      // IE8 does not allow domains to be specified, just the *
      // headers['Access-Control-Allow-Origin'] = req.headers.origin;
      headers['Access-Control-Allow-Origin'] = '*';
      headers['Access-Control-Allow-Methods'] = 'POST, GET, PUT, DELETE, OPTIONS';
      headers['Access-Control-Allow-Headers'] = 'content-type, uuid, accept';
      res.writeHead(200, headers);
      res.end();
    });
    this.app.use(function (req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'content-type, uuid, accept');
      res.header('Access-Control-Allow-Methods', 'POST,GET,PUT,DELETE,OPTIONS');
      next();
    });
    loggerService.log(uuid, 'End: Cross Origin Route registration ', 'debug');
  }

  /**
   * registerMiddleware is used to register the middleware.
   * @memberof Server
   */
  registerMiddleware(uuid) {
    loggerService.log(uuid, 'Start: Middleware registration ', 'debug');
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
    loggerService.log(uuid, 'End: Middleware registration ', 'debug');
  }

  /**
   * registerRestEndPoints is used to register the restEndpoints,
   * which will be accessed by unity Viewer.
   * 
   * @memberof Server
   */
  registerRestEndPoints(uuid) {
    loggerService.log(uuid, 'Start: RestEnd point registration ', 'debug');
    this.app.use(function (req, res, next) {
      loggerService.log(uuid, 'Request Received for path: ' + req.path, 'debug');
      next();
    });
    this.app.get('/deviceutility/services/IsRunning', deviceUtility.isRunning.bind(deviceUtility));
    this.app.get('/deviceutility/services/RegisterEvents', deviceUtility.registerEvents.bind(deviceUtility));
    this.app.get('/deviceutility/services/ListRemovableStorageDevices', deviceUtility.listRemovableStorageDrives.bind(deviceUtility));
    this.app.post('/deviceutility/services/ReadProgram', deviceUtility.readProgramFile.bind(deviceUtility));
    this.app.post('/deviceutility/services/WriteProgram', deviceUtility.writePrescriptionFile.bind(deviceUtility));
    this.app.post('/deviceutility/services/ListTreatmentFiles', deviceUtility.listTreatmentFiles.bind(deviceUtility));
    this.app.post('/deviceutility/services/ReadTreatmentFile', deviceUtility.readTreatmentFile.bind(deviceUtility));
    this.app.post('/deviceutility/services/UnAssignDrive', deviceUtility.unAssignDrive.bind(deviceUtility));
    // this.app.post('/deviceutility/services/intializeDevice', deviceUtility.intializeDevice.bind(deviceUtility));
    loggerService.log(uuid, 'End: RestEnd point registration ', 'debug');
  }
}

module.exports = Server;
