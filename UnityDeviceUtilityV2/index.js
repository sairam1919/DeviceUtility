// module require
var http = require('http');
let uuidv5 = require('uuid/v5');
const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

let uuid = uuidv5('Device Utility Application', MY_NAMESPACE);
// service import
var Server = require('./ServerComponents/Server');

var server = new Server(uuid);

const LogManagement = require('./ServerComponents/LogManagement');

const Validation = require('./ServerComponents/Validation');

let validation, loggerService;
/**
 * run is the initial point for DeviceUitlity Application.
 * It will print the on which port Device Utility is running.
 */
async function run() {
  try {
    validation = new Validation(uuid);
    loggerService = new LogManagement(uuid, validation);
    validation.setLogger(loggerService);
    loggerService.init(uuid);
  } catch (err) {
    loggerService.log(uuid, err, 'error');
  }
  loggerService.log(uuid, 'Start: Index.run()', 'debug');
  await server.intialize(uuid);
  var port = 3009;
  const clientServer = http.createServer(server.app);
  clientServer.listen(port, () => console.log(`API running on localhost:::::::::::::::::::::${port}`));
  loggerService.log(uuid, 'End: Index.run()', 'debug');
}

run();
