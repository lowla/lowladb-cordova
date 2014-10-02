# LowlaDB Cordova Plugin

The LowlaDB Cordova plugin is available for iOS only and requires iOS 8. Support for other platforms is on the roadmap, starting with Android.

## Creating a Project with LowlaDB
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
        cordova.plugins.LowlaDB.version(function(error, version) {
                                        receivedElement.innerHTML = version;
                                        });
```
Be sure to save the file!

To copy the test code to the iOS project, return to the command line and enter
```bash
cordova prepare ios
```

### 6. Build and run
At this point you should be able to build and run the project, either on the simulator or on a device. If everything is working correctly then you should see the usual Cordova startup screen with the LowlaDB version in place of the standard 'Device is ready' message.