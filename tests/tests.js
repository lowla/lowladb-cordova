exports.defineAutoTests = function() {
  describe('LowlaDB DB (Cordova)', function (done) {
    var spec = new JasmineThen.Spec(this);

    spec.beforeEach(function () {
      window.lowla = new LowlaDB();
    });
    
    spec.afterEach(function () {
      lowla.close();
    });
    
    spec.it('should create DB objects', function () {
      var theDB = lowla.db('dbName');
      expect(theDB).toBeDefined();
    });

    spec.it('can create collections', function () {
      var theDB = lowla.db('dbName');
      var theColl = theDB.collection('TestCollection');
      expect(theColl).toBeDefined();
    });

    describe('.collectionNames', function (done) {
      var spec = new JasmineThen.Spec(this);
      
      var theDB, coll, collTwo;
      spec.beforeEach(function () {
        theDB = lowla.db('dbName');
        return theDB.dropDatabase()
          .then(function () {
            coll = lowla.collection('dbName', 'collectionOne');
            collTwo = lowla.collection('dbName', 'collectionTwo');
            return Promise.all([coll.insert({a: 1}), collTwo.insert({b: 2})]);
          });
      });

      spec.it('can retrieve all collection names', function () {
        return theDB.collectionNames().then(function (names) {
          expect(names.length).toEqual(2);
          names.sort(function (a, b) { return a.name.localeCompare(b.name); });
          expect(names[0].name).toEqual('dbName.collectionOne');
          expect(names[1].name).toEqual('dbName.collectionTwo');
        });
      });

      spec.it('can retrieve a specific collection name', function () {
        return theDB.collectionNames('collectionOne').then(function (names) {
          expect(names.length).toEqual(1);
          expect(names[0].name).toEqual('dbName.collectionOne');
        });
      });

      spec.it('can return only the collection names', function () {
        return theDB.collectionNames({namesOnly: true}).then(function (names) {
          expect(names.length).toEqual(2);
          expect(names[0]).toEqual('dbName.collectionOne');
          expect(names[1]).toEqual('dbName.collectionTwo');
        });
      });

      spec.it('can return names via callback', function () {
        return theDB.collectionNames(function (err, names) {
          expect(err).toBeUndefined();
          expect(names.length).toEqual(2);
        });
      });
    });
  });
  
  describe('LowlaDB Collection (Cordova)', function (done) {
    var spec = new JasmineThen.Spec(this);

    spec.beforeEach(function () {
      window.lowla = new LowlaDB();
      theDB = lowla.db('dbName');
      return theDB.dropDatabase();
    });
    
    spec.afterEach(function () {
      lowla.close();
    });

    describe('count()', function () {
      var spec = new JasmineThen.Spec(this);
      
      spec.it('can count the documents in a collection', function () {
        var coll = lowla.collection('dbName', 'TestColl');
        return coll
          .insert([{a: 1}, {a: 2}, {a: 3}])
          .then(function () {
            return coll.count();
          })
          .then(function (count) {
            expect(count).toEqual(3);
            return coll.count({a: 2});
          })
          .then(function (count) {
            expect(count).toEqual(1);
            return coll.count({});
          })
          .then(function (count) {
            expect(count).toEqual(3);
            return coll.count({z: 5});
          })
          .then(function (count) {
            expect(count).toEqual(0);
          })
          .then(function () {
            coll.count(function (err, count) {
              expect(err).toBeNull();
              expect(count).toEqual(3);
            });
          });
      });
    });
    
    describe('find()', function (done) {
      var spec = new JasmineThen.Spec(this);
      
      spec.it('with no documents in datastore works without error', function () {
        var coll = lowla.collection('dbName', 'CollName');
        return coll.find({}).toArray()
          .then(function (docs) {
            expect(docs).not.toBeNull();
            expect(docs.length).toEqual(0);
          })
          .then(function () {
            coll.find({}).toArray(function (err, docs) {
              expect(err).toBeNull();
              expect(docs).not.toBeNull();
              expect(docs.length).toEqual(0);
            });
         });
      });

      spec.it('with no matching documents works without error', function () {
        var coll = lowla.collection('dbName', 'CollName');
          return coll.insert([{a: 1}, {b: 2}])
          .then(function () {
            return coll.find({a: 2}).toArray();
          })
          .then(function (docs) {
            expect(docs).not.toBeNull();
            expect(docs.length).toEqual(0);
          })
          .then(function () {
            coll.find({a: 2}).toArray(function (err, docs) {
              expect(err).toBeNull();
              expect(docs).not.toBeNull();
              expect(docs.length).toEqual(0);
            });
          });
      });
      
      spec.it('finds multiple documents', function () {
        var coll = lowla.collection('dbName', 'CollName');
        return coll.insert([{a: 1}, {b: 2}, {c: 3}, {d: 4}])
          .then(function () {
            return coll.find().toArray();
          })
          .then(function (docs) {
            expect(docs.length).toEqual(4);
            expect(docs[0].a).toEqual(1);
            expect(docs[1].b).toEqual(2);
            expect(docs[2].c).toEqual(3);
            expect(docs[3].d).toEqual(4);
          })
      });
             
      spec.it('finds a single document among many', function () {
        var coll = lowla.collection('dbName', 'CollName');
        return coll.insert([{a: 1}, {b: 2}, {c: 3}, {d: 4}])
          .then(function () {
            return coll.find({c: 3}).toArray();
          })
          .then(function (docs) {
            expect(docs.length).toEqual(1);
            expect(docs[0].c).toEqual(3);
          })
          .then(function () {
            coll.find({d: 4}).toArray(function (err, docs) {
              expect(err).toBeNull();
              expect(docs).not.toBeNull();
              expect(docs.length).toEqual(1);
              expect(docs[0].d).toEqual(4);
            });
          });
      });

      spec.it('only retrieves documents from the given collection', function () {
        var coll = lowla.collection('dbName', 'One');
        var collTwo = lowla.collection('dbName', 'Two');
        return coll.insert({a: 1})
          .then(function () {
            return collTwo.insert({a: 2});
          })
          .then(function () {
            return coll.find().toArray();
          })
          .then(function (arr) {
            expect(arr).not.toBeNull();
            expect(arr.length).toEqual(1);
            expect(arr[0].a).toEqual(1);
          });
      });
    });

    describe('findOne()', function (done) {
      var spec = new JasmineThen.Spec(this);
      
      var coll;
      spec.beforeEach(function () {
        coll = lowla.collection('dbName', 'CollName');
      });

      spec.it('finds nothing without error', function () {
        return coll.findOne({a: 1})
          .then(function (doc) {
            expect(doc).toBeUndefined();
          })
          .then(function () {
            coll.findOne({a: 2}, function (err, doc) {
              expect(err).toBeNull();
              expect(doc).toBeUndefined();
            });
          })
      });

      spec.it('finds a single document', function () {
        return coll.insert({a: 1})
          .then(function () {
            return coll.findOne({a: 1});
          })
          .then(function (doc) {
            expect(doc).not.toBeNull();
            expect(doc.a).toEqual(1);
          })
          .then(function () {
            coll.findOne({a: 1}, function (err, doc) {
              expect(err).toBeNull();
              expect(doc.a).toEqual(1);
            });
          })
      });

      spec.it('finds a single document when many match', function (done) {
        return coll.insert([{a: 1, b: 2}, {a: 1, b: 3}, {a: 1, b: 4}])
          .then(function () {
            return coll.findOne({a: 1});
          })
          .then(function (doc) {
            expect(doc).not.toBeNull();
            expect(doc.a).toEqual(1);
          })
          .then(function () {
            coll.findOne({a: 1}, function (err, doc) {
              expect(err).toBeNull();
              expect(doc.a).toEqual(1);
              expect(doc.b).not.toBeNull();
            });
          })
      });
    });
  });
};
