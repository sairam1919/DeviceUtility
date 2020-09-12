// module import
var winston = require('winston');
let path = require('path');

let appCfg = require('../../app.config.json');
let logCfg;
try {
  logCfg = require(path.join(appCfg.logFilePath, 'config.json'));
} catch (err) {
  try {
    appCfg.logFilePath = path.join(__dirname, '../log');
    const c = appCfg.logFilePath + '/config.json';
    logCfg = require(c);
  } catch (err) {
    appCfg.logFilePath = path.join(__dirname, '../../log');
    const c = appCfg.logFilePath + '/config.json';
    logCfg = require(c);
  }
}

let logger, validation;

// logger will log the error message with timestamp in deviceUtility.log.
logger = new (winston.Logger)({
  levels: { error: 0, warn: 1, debug: 2 },
  transports: [
    new (winston.transports.Console)({ 'timestamp': true }),
    new (winston.transports.File)({
      filename: path.join(appCfg.logFilePath, '/deviceUtility.log'),
      timestamp: true
    })
  ]
});

/**
 * LogManagement class interacts with all classes for logging.
 * 
 * @class LogManagement
 */
class LogManagement {
  constructor(uuid, validate) {
    validation = validate;
    this.enabled = false;
    this.enableLog();
  }

  /**
   * init will create deviceUtility.log file for first time,
   * if file exits, check the size and append log to that file,
   * if file size exceeds, it will create new deviceUtility log file with version. 
   * 
   * @param {any} uuid 
   * @memberof LogManagement
   */
  init(uuid) {
    try {
      logCfg = validation.validateLogConfig(uuid, logCfg);
    } catch (err) {
      console.log(err);
    }
    logger = new (winston.Logger)({
      transports: [
        new (winston.transports.File)({
          filename: path.join(appCfg.logFilePath, '/deviceUtility.log'),
          timestamp: true,
          maxFiles: logCfg.maxLogFiles,
          maxsize: logCfg.maxInMB + 'm',
          level: 'debug'
        })
      ]
    });
  }

  /**
   * enableLog will set enabled value to true.
   * 
   * @memberof LogManagement
   */
  enableLog() {
    this.enabled = logCfg.enable;
  }

  /**
   * 
   * 
   * @memberof LogManagement
   */
  disableLog() {
    this.enabled = false;
  }
  
  /**
   * handleErrorMessage will log the handled error message in error stack.
   * 
   * @param {any} uuid 
   * @param {any} err 
   * @memberof LogManagement
   */
  handleErrorMesssage(uuid, err) {
    logger.error(uuid + ':' + err.message + ' ' + err.stack);
  }

  /**
   * log will log the message with type of error like debug, error, warn for detailed logs.
   * 
   * @param {any} uuid 
   * @param {any} message 
   * @param {any} type 
   * @memberof LogManagement
   */
  log(uuid, message, type) {
    if (this.enabled) {
      switch (type) {
        case 'debug':
        case 'warn':
        case 'error':
          logger.log(type, uuid + ':' + message);
          break;
        default:
          logger.log('log', uuid + ':' + message);
      }
    }
  }
}

module.exports = LogManagement;
