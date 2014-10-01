var exec = require('cordova/exec');

var _db = function(dbName) {this.dbName = dbName;};

exports.db = function(dbName) {return new _db(dbName)};
exports.version = function(callback) {
    successCallback = function(val) {callback(null, val);};
    failureCallback = function() {callback("ERROR", null);};
    exec(successCallback, failureCallback, 'LowlaDB', 'client_version', {});
}

