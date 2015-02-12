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
    [self.commandDelegate runInBackground:^{
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
    }];
}

- (void) db_dropDatabase:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult *pluginResult;
        
        NSString *dbName = [command argumentAtIndex:0 withDefault:nil andClass:[NSString class]];
        if (dbName) {
            LDBClient *client = [[LDBClient alloc] init];
            [client dropDatabase:dbName];
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        }
        else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Internal error: missing dbName"];
        }
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void) collection_insert:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult *pluginResult;
        
        NSString *dbName = [command argumentAtIndex:0 withDefault:nil andClass:[NSString class]];
        NSString *collName = [command argumentAtIndex:1 withDefault:nil andClass:[NSString class]];
        id data = [command argumentAtIndex:2];
        
        if (dbName && collName) {
            LDBClient *client = [[LDBClient alloc] init];
            LDBDb *db = [client getDatabase:dbName];
            LDBCollection *coll = [db getCollection:collName];
            if ([data isKindOfClass:[NSDictionary class]]) {
                LDBObject *object = [LDBObject objectWithDictionary:data];
                [coll insert:object];
            }
            else if ([data isKindOfClass:[NSArray class]]) {
                NSMutableArray *arr = [NSMutableArray arrayWithCapacity:[(NSArray *)data count]];
                [data enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
                    if ([obj isKindOfClass:[NSDictionary class]]) {
                        LDBObject *object = [LDBObject objectWithDictionary:obj];
                        [arr addObject:object];
                    }
                }];
                [coll insertArray:arr];
            }
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        }
        else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Internal error: missing dbName or collName"];
        }
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void) cursor_count:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult *pluginResult;
        
        NSDictionary *cursor = [command argumentAtIndex:0 withDefault:nil andClass:[NSDictionary class]];
        if (cursor) {
            NSDictionary *coll = (NSDictionary *)[cursor objectForKey:@"_collection"];
            NSString *dbName = (NSString *)[coll objectForKey:@"dbName"];
            NSString *collName = (NSString *)[coll objectForKey:@"collectionName"];
            if (dbName && collName) {
                LDBClient *client = [[LDBClient alloc] init];
                LDBDb *db = [client getDatabase:dbName];
                LDBCollection *coll = [db getCollection:collName];
                NSDictionary *filterDict = (NSDictionary *)[cursor objectForKey:@"_filter"];
                LDBObject *filter = nil;
                if (filterDict) {
                    filter = [LDBObject objectWithDictionary:filterDict];
                }
                LDBCursor *cursor = [[LDBCursor alloc] initWithCollection:coll query:filter keys:nil];
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:(int)[cursor count]];
            }
            else {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Internal error: cursor has invalid structure"];
            }
        }
        else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Internal error: missing cursor"];
        }
        
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void) cursor_each:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult *pluginResult;
        NSDictionary *cursor = [command argumentAtIndex:0 withDefault:nil andClass:[NSDictionary class]];
        if (cursor) {
            NSDictionary *coll = (NSDictionary *)[cursor objectForKey:@"_collection"];
            NSString *dbName = (NSString *)[coll objectForKey:@"dbName"];
            NSString *collName = (NSString *)[coll objectForKey:@"collectionName"];
            if (dbName && collName) {
                LDBClient *client = [[LDBClient alloc] init];
                LDBDb *db = [client getDatabase:dbName];
                LDBCollection *coll = [db getCollection:collName];
                NSDictionary *filterDict = (NSDictionary *)[cursor objectForKey:@"_filter"];
                LDBObject *filter = nil;
                if (filterDict) {
                    filter = [LDBObject objectWithDictionary:filterDict];
                }
                LDBCursor *cursor = [[LDBCursor alloc] initWithCollection:coll query:filter keys:nil];
                while ([cursor hasNext]) {
                    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:[[cursor next] asJson]];
                    [pluginResult setKeepCallbackAsBool:YES];
                    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
                }
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:NO];
                [pluginResult setKeepCallbackAsBool:NO];
            }
            else {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Internal error: cursor has invalid structure"];
            }
        }
        else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Internal error: missing cursor"];
        }
        
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

@end
