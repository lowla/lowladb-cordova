var exec = require('cordova/exec');

(function (module) {
  module.exports = LowlaDB;

  LowlaDB.prototype.close = close;
  LowlaDB.prototype.collection = collection;
  LowlaDB.prototype.db = db;

  // Private API
  LowlaDB._defaultOptions = {};

  function LowlaDB(options) {
    if (!(this instanceof LowlaDB)) {
      return new LowlaDB(options);
    }
  
    var config = this.config = {};
    LowlaDB.utils.keys(LowlaDB._defaultOptions).forEach(function (key) {
      config[key] = LowlaDB._defaultOptions[key];
    });
    LowlaDB.utils.keys(options).forEach(function (key) {
      config[key] = options[key];
    });

    this.events = {};
    this.liveCursors = {};  
  }

  function db(dbName) {
    return new LowlaDB.DB(this, dbName);
  }

  function collection(dbName, collectionName) {
    /* jshint validthis: true */
    return new LowlaDB.Collection(this, dbName, collectionName);
  }

  function close() {
  }
})(module);

// DB
(function (LowlaDB) {
  LowlaDB.DB = DB;
  DB.prototype.collection = collection;
  DB.prototype.collectionNames = collectionNames;

  function DB(lowla, dbName) {
    this.name = dbName;
  }

  function collection(collectionName) {
    return new LowlaDB.Collection(this.name, collectionName);
  }

  function collectionNames() {
    var db = this;
  
    var collection, options, callback;
    var args = Array.prototype.slice.call(arguments, 0);
    while (args.length > 0) {
      var arg = args.pop();
      if (arg instanceof Function) {
        callback = arg;
      }
      else if (typeof(arg) === 'string') {
        collection = arg;
      }
      else if (typeof(arg) === 'object') {
        options = arg;
      }
    }
  
    options = options || {namesOnly:false};
    collection = collection || '';
  
    return new Promise(fetchNames)
      .then(applyOptions)
      .then(okCallback, errCallback);
    /////////////////////////////////
    
    function fetchNames(resolve, reject) {
      var successCallback = function (val) {resolve(val);};
      var failureCallback = function (err) {reject(err);};
      exec(successCallback, failureCallback, 'LowlaDB', 'db_collectionNames', [db.name]);
    }
  
    function applyOptions(data) {
      var answer = [];
      for (var i = 0 ; i < data.length ; ++i) {
        var dbCollName = data[i];
        if (!collection || dbCollName.indexOf(collection) === 0) {
          dbCollName = db.name + "." + dbCollName;
          if (options.namesOnly) {
            answer.push(dbCollName);
          }
          else {
            answer.push({name:dbCollName});
          }
        }
      }
      return answer;
    }
  
    function okCallback(answer) {
      if (callback) {
        callback(undefined, answer);
      }
      return answer;
    }
  
    function errCallback(err) {
      if (callback) {
        callback(err);
      }
      throw err;
    }
  }
})(module.exports);

// Collection
(function(LowlaDB) {
  LowlaDB.Collection = Collection;

  Collection.prototype.insert = insert;
  
  function Collection(lowla, dbName, collectionName) {
    this.dbName = dbName;
    this.collectionName = collectionName;
    this.lowla = lowla;
  }
  
  function insert(arg, callback) {
    /*jshint validthis:true */
    var coll = this;
    return new Promise(function(resolve, reject) {
      var successCallback = function () {resolve();};
      var failureCallback = function (err) {reject(err);};
      exec(successCallback, failureCallback, 'LowlaDB', 'collection_insert', [coll.dbName, coll.collectionName, arg]);
    })
      .then(function() {
        var savedDoc; // Do we need this?
        if (callback) {
          callback(null, savedDoc);
        }
        return savedDoc;
      })
      .catch(function(e) {
        if (callback) {
          callback(e);
        }
        throw e;
      });
  }
  
})(module.exports);

// Utils
(function (LowlaDB) {
  LowlaDB.utils = {};
  LowlaDB.utils.keys = function(obj) {
    if (!obj) {
      return [];
    }

    if (Object.keys) {
      return Object.keys(obj);
    }

    var answer = [];
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        answer.push(i);
      }
    }

    return answer;
  };
})(module.exports);
