# LowlaDB Cordova Plugin

The LowlaDB Cordova plugin provides a native implementation of (LowlaDB)[http://www.github.com/lowla/lowladb-json-database] offering greatly improved performance and scalability on mobile devices. It is fully API-compatible with the javascript implementation and, other than necessary changes required by Cordova, web applications will run unchanged.

It is currently under development for iOS and Android.

# License
The LowlaDB Cordova plugin is available under the MIT license.

# Requirements
To develop for iOS, you need a Mac running XCode 6.x or above. The resulting application requires iOS 8.x.
To develop for Android, you need Android Studio 1.1. The plugin has not been tested with the older ADT tooling. The resulting application requires Android 4.0.3 or higher.

## Creating an iOS Project with LowlaDB
### 1. Create a new project
```bash
cordova create LowlaTest
cd LowlaTest
```

### 2. Add iOS support to the project
```bash
cordova platform add ios
```

### 3. Add the plugin to the project
```bash
cordova plugin add io.lowla.lowladb
```

### 4. Update project settings
LowlaDB is packaged as an iOS framework and thus requires iOS 8. To set this, open the project in XCode

```bash
open platforms/ios/HelloCordova.xcodeproj
```
In the _General_ settings for the _HelloCordova_ target, set the Deployment Target to 8.0.
Still in the _General_ tab, scroll down until the _Embedded Binaries_ section is visible. Now expand the project tree in the left pane and expand the _Frameworks_ node. Drag _LowlaDB.framework_ to the _Embedded Binaries_ section.

You should now be able to build the project cleanly.

### 5. Add some test code
Navigate to www/js/index.js in the project tree. Under the line

```javascript
        receivedElement.setAttribute('style', 'display:block;');
```
add the code

```javascript
        var lowla = new LowlaDB();
        var db = lowla.db("mydb");
        db.collectionNames().then(function (names) {
            if (0 == names.length) {
                receivedElement.innerHTML = "LowlaDB is working";
            }
        });
```
Be sure to save the file!

To copy the test code to the iOS project, return to the command line and enter
```bash
cordova prepare ios
```

### 6. Build and run
At this point you should be able to build and run the project, either on the simulator or on a device. If everything is working correctly then you should see the usual Cordova startup screen with the message 'LowlaDB is working' in place of the standard 'Device is ready' message.

## Creating an Android Project with LowlaDB
### 1. Create a new project
```bash
cordova create LowlaTest
cd LowlaTest
```

### 2. Add Android support to the project
```bash
cordova platform add android
```

### 3. Add the plugin to the project
```bash
cordova plugin add io.lowla.lowladb
```

### 4. Import the project into Android Studio
The Android tooling is in the process of migrating from Eclipse to the IntelliJ IDEA-based Android Studio. As such, both Android Studio and Cordova's support for Android are changing rapidly. These instructions apply to Android Studio 1.1.0 and the Cordova commmand line version 4.3.0.

If you try to import the generated android project directly into Android Studio, you will get build errors as the dependency between the application and CordovaLib has not been set up correctly. To fix this, you need to perform a command-line build before importing the project into Android Studio. Specifically:

```bash
cd platforms/android
ANDROID_BUILD=gradle ./cordova/build
```

You can now launch Android Studio and choose File|Import Project and select the LowlaTest/platforms/android folder. Do *not* select the LowlaTest folder - this will import and build but will not use the new, Gradle-based build.

You should now be able to build the project cleanly.

### 5. Add some test code
Navigate to www/js/index.js in the project tree. Under the line
```javascript
        receivedElement.setAttribute('style', 'display:block;');
```
add the code
```javascript
        var lowla = new LowlaDB();
        var db = lowla.db("mydb");
        db.collectionNames().then(function (names) {
            if (0 == names.length) {
                receivedElement.innerHTML = "LowlaDB is working";
            }
        });
```
Be sure to save the file!

To copy the test code to the Android project, return to the command line and enter
```bash
cordova prepare android
```

### 6. Build and run
At this point you should be able to build and run the project, either on the simulator or on a device. If everything is working correctly then you should see the usual Cordova startup screen with the message 'LowlaDB is working' in place of the standard 'Device is ready' message.

# Developing the Plugin
This section is for developers who want to work on the plugin. If you just want to use the plugin in your Cordova application you don't need to know anything anything described below.

## Setting up the Development Environment
The Cordova plugin is built on top of the lowladb-objc and lowladb-android-lib projects which in turn build on liblowladb. Although those libraries publish their artifacts via standard library mechanisms (CocoaPods and Android aar files, respectively) it is hard to consume those formats in Cordova. Instead the necessary files need to to be copied from those projects into the plugin's src directory.

You can collect all the necessary source locally with the following commands.
```bash
mkdir lowla-dev
cd lowla-dev
git clone https://github.com/lowla/liblowladb.git
git clone https://github.com/lowla/lowladb-objc.git
git clone https://github.com/lowla/lowladb-android-lib.git
git clone https://github.com/lowla/lowladb-cordova.git
```

The next step is to create a test project. The plugin contains a test suite as a sub-plugin and any new development should start by adding to the test suite.

```bash
cordova create test
cd test
cordova platform add ios android
cordova plugin add ../lowladb-cordova
cordova plugin add ../lowladb-cordova/tests
```

Note that the test project pulls the lowladb plugin from a local directory rather than the plugin repository.

Finally follow step 4 above which describes how to import your project into XCode or Android Studio and build.

## The Development Workflow
Changes need to flow through from the lowest level (liblowladb) to the highest (lowladb-cordova). So in the most complex case, a new feature will require

- Adding new failing tests to lowladb-cordova/tests/tests.js
- Adding code and tests to liblowladb and verifying that the tests pass on OSX/iOS.
- Adding the necessary wrappers and tests to lowladb-objc and lowladb-android-lib.
- Rebuilding the lowladb-objc framework and copying it over to lowladb-cordova/src/ios/LowlaDB.framework
- Adding any new wrappers to lowladb-cordova/src/ios/LDBCordova.m
- Rebuilding the lowladb-android-lib project and copying the .so and .java files to lowladb-cordova/src/android/lowladb-android
- [Optional: If the above step created any new .java files, they need to be added to lowladb-cordova/plugin.xml]
- Adding any new wrappers to lowladb-cordova/src/anddroid/LDBCordova.java
- Adding any new public APIs/fixes to lowladb-cordova/www/LowlaDB-Cordova.js

Once those changes have been made, you need to redeploy the plugins

```bash
cordova plugin remove io.lowla.lowladb
cordova plugin remove io.lowla.lowladb.tests
cordova plugin add ../lowladb-cordova
cordova plugin add ../lowladb-cordova/tests
```

On iOS, this seems to break some of the project configuration and you may have to re-add LowlaDB.framework to the embedded binaries and re-assign LDBCordova.m to the application target.
