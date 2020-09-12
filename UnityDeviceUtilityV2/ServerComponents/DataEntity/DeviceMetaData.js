/**
 * Creates an instance of DeviceMetaData.
 * 
 * @class DeviceMetaData
 */
class DeviceMetaData {
  constructor(path, deviceName, productID, vendorID) {
    this.path = path;
    this.deviceName = deviceName;
    this.productID = productID;
    this.vendorID = vendorID;
  }
}

module.exports = DeviceMetaData;
