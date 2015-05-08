var exec = require('cordova/exec');

(function (module) {
  module.exports = LowlaDB;

  LowlaDB.prototype.close = close;
  LowlaDB.prototype.collection = collection;
  LowlaDB.prototype.db = db;
  LowlaDB.prototype.emit = emit;
  LowlaDB.prototype.load = load;
  LowlaDB.prototype.on = on;
  LowlaDB.prototype.off = off;
  LowlaDB.prototype.sync = sync;

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
  
  function load(urlOrObj, callback) {
    return Promise.resolve()
      .then(function () {
        if (typeof(urlOrObj) === 'string') {
          return LowlaDB.utils.getJSON(urlOrObj).
            then(function (payload) {
              return payload;
            });
        }
        else {
          return JSON.stringify(urlOrObj);
        }
      })
      .then(function (json) {
        return new Promise(function (resolve, reject) {
          var successCallback = function () {resolve();};
          var failureCallback = function (err) {reject(err);};
          exec(successCallback, failureCallback, 'LowlaDB', 'lowla_load', [json]);
        })
      })
      .then(function () {
        if (callback) {
          callback(null);
        }
      })
      .catch(function (e) {
        if (callback) {
          callback(e);
        }
        throw e;
      });
  }
  
  function on(eventName, callback) {
    /* jshint validthis: true */
    var lowlaEvents = this.events;
    if (lowlaEvents[eventName]) {
      lowlaEvents[eventName].push(callback);
    }
    else {
      lowlaEvents[eventName] = [callback];
    }
  }

  function off(eventName, callback) {
    /* jshint validthis: true */
    var lowlaEvents = this.events;
    if (!callback) {
      if (!eventName) {
        this.events = {};
      }
      else {
        delete lowlaEvents[eventName];
      }
    }
    else if (lowlaEvents[eventName]) {
      var index = lowlaEvents[eventName].indexOf(callback);
      if (-1 !== index) {
        lowlaEvents[eventName].splice(index, 1);
      }
    }
  }
  
  function emit() {
    /* jshint validthis: true */
    var args = Array.prototype.slice.call(arguments);
    var eventName = args.shift();
    var lowlaEvents = this.events;
    if (lowlaEvents[eventName]) {
      lowlaEvents[eventName].forEach(function (listener) {
        listener.apply(listener, args);
      });
    }
  }
  
  function sync(serverUrl, options) {
    /* jshint validthis: true */
    var lowla = this;
    options = options || {};
    if (options && -1 === options.pollFrequency) {
      return;
    }

    var socketIo = (options.io || window.io) && (options.socket || options.socket === undefined);
    if (socketIo && !options.pollFrequency) {
      var theIo = (options.io || window.io);
      var pushPullFn = LowlaDB.utils.debounce(pushPull, 250);
      var socket = theIo.connect(serverUrl);
      socket.on('changes', function () {
        pushPullFn();
      });
      socket.on('reconnect', function () {
        pushPullFn();
      });
      lowla.on('_pending', function () {
        pushPullFn();
      });
    }

    function pushPull() {
      if (lowla._syncing) {
        lowla._pendingSync = true;
        return;
      }

      lowla._syncing = true;
      lowla.emit('syncBegin');
      return new Promise(function (resolve, reject) {
        var successCallback = function (message) {
          if (message) {
            lowla.emit(message);
          }
          else {
            resolve();
          }
        };
        var failureCallback = function (err) {reject(err);};
        exec(successCallback, failureCallback, 'LowlaDB', 'db_sync', [serverUrl]);
      })
        .then(function () {
          lowla._syncing = false;
          lowla.emit('syncEnd');
          if (lowla._pendingSync) {
            lowla._pendingSync = false;
            return pushPull();
          }
        }, function (err) {
          lowla._syncing = lowla._pendingSync = false;
          lowla.emit('syncEnd');
          throw err;
        });
    }

    return pushPull().then(function () {
      if (options.pollFrequency) {
        var pollFunc = function () {
          pushPull().then(function () {
            setTimeout(pollFunc, options.pollFrequency * 1000);
          });
        };

        setTimeout(pollFunc, options.pollFrequency * 1000);
      }
    }, function (err) {
      throw err;
    });
  }
  
})(module);

// DB
(function (LowlaDB) {
  LowlaDB.DB = DB;
  DB.prototype.collection = collection;
  DB.prototype.collectionNames = collectionNames;
  DB.prototype.dropDatabase = dropDatabase;

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
  
  function dropDatabase(callback) {
     var db = this;
     return new Promise(function(resolve, reject) {
       var successCallback = function () {resolve();};
       var failureCallback = function (err) {reject(err);};
       exec(successCallback, failureCallback, 'LowlaDB', 'db_dropDatabase', [db.name]);
     })
      .then(function () {
        if (callback) {
          callback(null);
        }
     })
      .catch(function (e) {
        if (callback) {
          callback(e);
        }
        throw e;
       });
  }
})(module.exports);

// Collection
(function(LowlaDB) {
  LowlaDB.Collection = Collection;

  Collection.prototype.count = count;
  Collection.prototype.find = find;
  Collection.prototype.findAndModify = findAndModify;
  Collection.prototype.findOne = findOne;
  Collection.prototype.insert = insert;
  Collection.prototype.remove = remove;
  
  function Collection(lowla, dbName, collectionName) {
    this.dbName = dbName;
    this.collectionName = collectionName;
    this.lowla = lowla;
  }
  
  function find(filter) {
    /*jshint validthis:true */
    return LowlaDB.Cursor(this, filter);
  }
 
  function findOne(filter, callback) {
    /*jshint validthis:true */
    var coll = this;
    return this.find(filter).limit(1).toArray()
      .then(function (arr) {
        var obj = (arr && arr.length > 0) ? arr[0] : undefined;
        if (callback) {
          callback(null, obj);
        }
        return obj;
      }, function (err) {
        if (callback) {
          callback(err);
        }
        throw err;
      });
  }
 
  function findAndModify(filter, operations, callback) {
    var coll = this;
    return new Promise(function (resolve, reject) {
      var successCallback = function (doc) {resolve(doc);};
      var failureCallback = function (err) {reject(err);};
      exec(successCallback, failureCallback, 'LowlaDB', 'collection_findAndModify', [coll.dbName, coll.collectionName, filter, operations]);
    })
      .then(function (doc) {
        if (doc === 'OK') {
          doc = undefined;
        }
        else {
          doc = JSON.parse(doc);
        }
        if (doc) {
          coll.lowla.emit('_pending');
        }
        if (callback) {
          callback(null, doc);
        }
        return doc;
      })
      .catch(function (e) {
        if (callback) {
          callback(e);
        }
        throw e;
      });
  }
  
  function insert(arg, callback) {
    /*jshint validthis:true */
    var coll = this;
    return new Promise(function (resolve, reject) {
      var successCallback = function (docs) {resolve(docs);};
      var failureCallback = function (err) {reject(err);};
      exec(successCallback, failureCallback, 'LowlaDB', 'collection_insert', [coll.dbName, coll.collectionName, arg]);
    })
      .then(function (docs) {
        docs = docs.map(JSON.parse);
        if (0 != docs.length) {
          coll.lowla.emit('_pending');
        }
        if (!LowlaDB.utils.isArray(arg)) {
          docs = docs.length ? docs[0] : null;
        }
        if (callback) {
          callback(null, docs);
        }
        return docs;
      })
      .catch(function(e) {
        if (callback) {
          callback(e);
        }
        throw e;
      });
  }
  
  function count(query, callback) {
    /*jshint validthis:true */
    if (typeof(query) === 'function') {
      callback = query;
      query = {};
    }

    return this.find(query).count(callback);
  }
  
  function remove(filter, callback) {
    /*jshint validthis:true */
    var coll = this;

    if (typeof(filter) === 'function') {
      callback = filter;
      filter = {};
    }

    return new Promise(function(resolve, reject) {
      var successCallback = function (count) {resolve(count);};
      var failureCallback = function (err) {reject(err);};
      exec(successCallback, failureCallback, 'LowlaDB', 'collection_remove', [coll.dbName, coll.collectionName, filter]);
    })
      .then(function (count) {
        if (0 != count) {
          coll.lowla.emit('_pending');
        }
        if (callback) {
          callback(null, count);
        }
        return count;
      })
      .catch(function (e) {
        if (callback) {
          callback(e);
        }
        throw e;
      });
  }
  
})(module.exports);

// Cursor
(function (LowlaDB) {
  'use strict';

  // Public API
  LowlaDB.Cursor = Cursor;

  Cursor.prototype.count = count;
  Cursor.prototype.each = each;
  Cursor.prototype.limit = limit;
  Cursor.prototype.sort = sort;
  Cursor.prototype.showPending = showPending;
  Cursor.prototype.toArray = toArray;

  Cursor.prototype.on = on;
  Cursor.prototype.cloneWithOptions = cloneWithOptions;

  ///////////////

  function Cursor(collection, filter, options) {
    if (!(this instanceof Cursor)) {
      return new Cursor(collection, filter, options);
    }

    this._lowla = collection.lowla;
    this._collection = collection;
    this._filter = filter;
    this._options = {
      sort: null,
      limit: 0,
      showPending: false
    };

    for (var i in options) {
      if (options.hasOwnProperty(i)) {
        this._options[i] = options[i];
      }
    }
  }

  function on(callback) {
    /* jshint validthis:true */
    var cursor = this;
    
    var successCallback = function (status) {
      if (status === "started") {
        callback(null, cursor);
      }
      else if (status === "notify") {
        callback(null, cursor);
      }
    };
    var failureCallback = function (err) {callback(err);};
    var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
    exec(successCallback, failureCallback, 'LowlaDB', 'cursor_on', [cursor, guid]);
 
    return function () {
       return new Promise(function (resolve, reject) {
          var successCallback = function () {resolve();};
          var failureCallback = function () {reject();};
          exec(successCallback, failureCallback, 'LowlaDB', 'cursor_off', [guid]);
       });
    }
 
  }

  function cloneWithOptions(options) {
    /* jshint validthis:true */
    var answer = new Cursor(this._collection, this._filter);
    answer._options = this._options;
    for (var i in options) {
      if (options.hasOwnProperty(i)) {
        answer._options[i] = options[i];
      }
    }

    return answer;
  }

  function limit(amount) {
    /* jshint validthis:true */
    return this.cloneWithOptions({limit: amount});
  }

  function sort(keyOrList) {
    /* jshint validthis:true */
    return this.cloneWithOptions({sort: keyOrList});
  }

  function showPending() {
    /* jshint validthis:true */
    return this.cloneWithOptions({showPending: true});
  }

  function each(callback) {
    /* jshint validthis:true */
    var cursor = this;
 
    if (!callback) {
      return;
    }
 
    return new Promise(function(resolve, reject) {
      var successCallback = function (doc) {
        if (doc) {
          callback(null, JSON.parse(doc));
        }
        else {
          resolve();
        }
      };
      var failureCallback = function (err) {reject(err);};
      exec(successCallback, failureCallback, 'LowlaDB', 'cursor_each', [cursor]);
    })
      .catch(function (err) {
        callback(err);
      });
  }
               
  function toArray(callback) {
    /* jshint validthis:true */
    var cursor = this;
              
    var answer = [];
    return this.each(function (err, doc) {
      if (err) {
        if (callback) {
          callback(err);
        }
        throw err;
      }
      answer.push(doc);
    })
      .then(function () {
        if (callback) {
          callback(null, answer);
        }
        return answer;
      });
  }

  function count(applySkipLimit, callback) {
    /* jshint validthis:true */
    if (typeof(applySkipLimit) === 'function') {
      callback = applySkipLimit;
      applySkipLimit = false;
    }

    var cursor = this;
    if (!applySkipLimit) {
      cursor = this.cloneWithOptions({skip: 0, limit: 0});
    }

    return new Promise(function(resolve, reject) {
      var successCallback = function (count) {resolve(count);};
      var failureCallback = function (err) {reject(err);};
      exec(successCallback, failureCallback, 'LowlaDB', 'cursor_count', [cursor]);
    })
      .then(function(count) {
        if (callback) {
          callback(null, count);
        }
        return count;
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
  
  function createXHR() {
    /* global ActiveXObject */
    /* global alert */
    var xhr;
    if (window.ActiveXObject) {
      try {
        xhr = new ActiveXObject('Microsoft.XMLHTTP');
      }
      catch (e) {
        alert(e.message);
        xhr = null;
      }
    }
    else {
      xhr = new XMLHttpRequest();
    }

    return xhr;
  }

  LowlaDB.utils.getJSON = function (url, payload) {
    var xhr = createXHR();
    return new Promise(function (resolve, reject) {
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(xhr.responseText);
          }
          else {
            reject(xhr.statusText);
          }
        }
      };

      if (payload) {
        var json = JSON.stringify(payload);
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.send(json);
      }
      else {
        xhr.open('GET', url, true);
        xhr.send();
      }
    });
  };
  
  LowlaDB.utils.isArray = function (obj) {
    return (obj instanceof Array);
  };
  
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
  
  LowlaDB.utils.debounce = function (func, wait, immediate) {
    var timeout;
    return function () {
      var context = this;
      var args = arguments;
      var later = function () {
        timeout = null;
        if (!immediate) {
          func.apply(context, args);
        }
      };

      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) {
        func.apply(context, args);
      }
    };
  };
  
})(module.exports);
