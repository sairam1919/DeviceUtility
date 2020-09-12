/**
 * Creates an instance of DeviceFileSystem.
 * 
 * @class DeviceFileSystem
 */
class DeviceFileSystem {
  constructor(programFilePath, treatmentFilePath, folderStructureInDevice) {
    this.programFilePath = programFilePath;
    this.treatmentFilePath = treatmentFilePath;
    this.folderStructureInDevice = folderStructureInDevice;
  }
}

module.exports = DeviceFileSystem;
