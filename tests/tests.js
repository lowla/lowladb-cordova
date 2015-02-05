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
              should.not.exist(err);
              count.should.equal(3);
            });
          });
      });
    });
  });  
};
