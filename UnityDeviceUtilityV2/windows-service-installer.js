var Service = require('node-windows').Service;
let cnf = require('./log/config');

// Create a new service object
var svc = new Service({
  name: 'Device Utility',
  description: 'The nodejs server.',
  script: 'restricted/index.js'
});
console.log(cnf.p);
svc.logOnAs.domain = 'NT AUTHORITY';
svc.logOnAs.account = 'LOCAL SERVICE';
svc.logOnAs.password = cnf.p;

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function () {
  svc.start();
});

svc.on('alreadyinstalled', function () {
  svc.start();
});
svc.directory(__dirname);

svc.install();
