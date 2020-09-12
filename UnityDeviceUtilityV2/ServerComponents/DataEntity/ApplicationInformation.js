/**
 * Creates an instance of ApplicationInformation.
 * 
 * @class ApplicationInformation
 */
class ApplicationInformation {
  /**
   * Creates an instance of ApplicationInformation.
   * @param {string} appName 
   * @param {string} version 
   * @param {DeviceMetaData[]} deviceMetaData 
   * 
   * @memberOf ApplicationInformation
   */
  constructor(appName, version, deviceMetaData) {
    this.appName = appName;
    this.version = version;
    this.deviceMetaData = deviceMetaData;
  }
}

module.exports = ApplicationInformation;
