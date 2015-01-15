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
        coll = lowla.collection('dbName', 'collectionOne');
        collTwo = lowla.collection('dbName', 'collectionTwo');
        return Promise.all([coll.insert({a: 1}), collTwo.insert({b: 2})]);
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
};
