var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name: 'Device Utility',
  description: 'The nodejs server.',
  script: 'restricted/index.js'
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall', function () {
  console.log('Uninstall complete.');
  console.log('The service exists: ', svc.exists);
});

svc.directory(__dirname);
// Uninstall the service.
svc.uninstall();
