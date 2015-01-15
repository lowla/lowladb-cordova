#import "LDBCordova.h"

#import "LowlaDB/LowlaDB.h"

@implementation LDBCordova

- (void) client_version:(CDVInvokedUrlCommand *)command
{
	LDBClient *client = [[LDBClient alloc] init];
	NSString *version = [client version];
	
	CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:version];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) db_collectionNames:(CDVInvokedUrlCommand *)command
{
    CDVPluginResult *pluginResult;
    
    NSString *dbName = [command argumentAtIndex:0 withDefault:nil andClass:[NSString class]];
    if (dbName) {
        LDBClient *client = [[LDBClient alloc] init];
        LDBDb *db = [client getDatabase:dbName];
        NSArray *names = [db collectionNames];
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:names];
    }
    else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Internal error: missing dbName"];
    }
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) collection_insert:(CDVInvokedUrlCommand *)command
{
    CDVPluginResult *pluginResult;
  
    NSString *dbName = [command argumentAtIndex:0 withDefault:nil andClass:[NSString class]];
    NSString *collName = [command argumentAtIndex:1 withDefault:nil andClass:[NSString class]];
  
    if (dbName && collName) {
        LDBClient *client = [[LDBClient alloc] init];
        LDBDb *db = [client getDatabase:dbName];
        LDBCollection *coll = [db getCollection:collName];
        LDBObject *object = [[[LDBObjectBuilder builder] appendString:@"mystring" forField:@"myfield"] finish];
        [coll insert:object];
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
    }
    else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Internal error: missing dbName or collName"];
    }
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}
@end