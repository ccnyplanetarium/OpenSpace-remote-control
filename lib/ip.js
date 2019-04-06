/**
* Acquiring the ip addresses of the computer
* @constructor ip
* @property {array-number} addresses The ip address(es) of the computer
* @property {array-string} interfaces The interfaces of ip addresses (ex: Wifi)
*/

class ip {

  constructor() {
    this.os = require('os');

    // https://stackoverflow.com/questions/10750303/how-can-i-get-the-local-ip-address-in-node-js
    var interfaces = this.os.networkInterfaces();
    this.addresses = [];
    this.interfaces = [];
    for (var k in interfaces) {
      for (var k2 in interfaces[k]) {
        var address = interfaces[k][k2];
        if (address.family === 'IPv4' && !address.internal) {
          this.addresses.push(address.address);
          this.interfaces.push(k);
        }
      }
    }


  }

}

module.exports = new ip();
