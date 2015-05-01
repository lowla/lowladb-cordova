#import "LDBCordova.h"

#import "LowlaDB/LowlaDB.h"

@interface LDBCordova ()
@property NSMutableDictionary *liveCursors;
@end

@implementation LDBCordova

- (void) pluginInitialize
{
    _liveCursors = [NSMutableDictionary dictionary];
    [LDBClient enableNotifications:YES];
    NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
    [nc addObserver:self selector:@selector(notifyLive:) name:LDBClientDidChangeCollectionNotification object:nil];
}

- (void) client_version:(CDVInvokedUrlCommand *)command
{
	LDBClient *client = [[LDBClient alloc] init];
	NSString *version = [client version];
	
	CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:version];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) lowla_load:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult *pluginResult;
        
        NSString *json = [command argumentAtIndex:0 withDefault:nil andClass:[NSString class]];
        if (json) {
            LDBClient *client = [[LDBClient alloc] init];
            [client loadJson:json];
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
        }
        else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Internal error: missing json"];
        }
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
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

- (void) db_sync:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        NSString *server = [command argumentAtIndex:0 withDefault:nil andClass:[NSString class]];
        if (server) {
            [LDBClient sync:server notify:^(LDBSyncStatus status, NSString *message) {
                CDVPluginResult *pluginResult;
                
                switch (status) {
                    case LDBSyncStatus_PUSH_STARTED:
                        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"pushBegin"];
                        [pluginResult setKeepCallbackAsBool:YES];
                        break;
                    case LDBSyncStatus_PUSH_ENDED:
                        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"pushEnd"];
                        [pluginResult setKeepCallbackAsBool:YES];
                        break;
                    case LDBSyncStatus_PULL_STARTED:
                        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"pullBegin"];
                        [pluginResult setKeepCallbackAsBool:YES];
                        break;
                    case LDBSyncStatus_PULL_ENDED:
                        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"pullEnd"];
                        [pluginResult setKeepCallbackAsBool:YES];
                        break;
                    case LDBSyncStatus_WARNING:
                        // Don't do anything yet
                        break;
                    case LDBSyncStatus_ERROR:
                        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:message];
                        break;
                    case LDBSyncStatus_OK:
                        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
                        break;
                }
                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
            }];
        }
        else {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"No server specified"];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }
    }];
}

- (void) collection_findAndModify:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult *pluginResult;
        
        NSString *dbName = [command argumentAtIndex:0 withDefault:nil andClass:[NSString class]];
        NSString *collName = [command argumentAtIndex:1 withDefault:nil andClass:[NSString class]];
        NSDictionary *querySpec = [command argumentAtIndex:2 withDefault:nil andClass:[NSDictionary class]];
        NSDictionary *opSpec = [command argumentAtIndex:3 withDefault:nil andClass:[NSDictionary class]];
        
        if (dbName && collName && opSpec) {
            @try {
                LDBClient *client = [[LDBClient alloc] init];
                LDBDb *db = [client getDatabase:dbName];
                LDBCollection *coll = [db getCollection:collName];
                LDBObject *query = nil;
                if (querySpec) {
                    query = [LDBObject objectWithDictionary:querySpec];
                }
                LDBObject *ops = [LDBObject objectWithDictionary:opSpec];
                LDBWriteResult *wr = [coll update:query object:ops];
                if (0 < [wr documentCount]) {
                    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:[[wr document:0] asJson]];
                }
                else {
                    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK];
                }
            }
            @catch (NSException *e) {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[e reason]];
            }
        }
        else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Internal error: missing dbName or collName"];
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
            LDBWriteResult *wr;
            @try {
                if ([data isKindOfClass:[NSDictionary class]]) {
                    LDBObject *object = [LDBObject objectWithDictionary:data];
                    wr = [coll insert:object];
                }
                else if ([data isKindOfClass:[NSArray class]]) {
                    NSMutableArray *arr = [NSMutableArray arrayWithCapacity:[(NSArray *)data count]];
                    [data enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
                        if ([obj isKindOfClass:[NSDictionary class]]) {
                            LDBObject *object = [LDBObject objectWithDictionary:obj];
                            [arr addObject:object];
                        }
                    }];
                    wr = [coll insertArray:arr];
                }
                NSMutableArray *docs = [NSMutableArray array];
                for (int i = 0 ; i < [wr documentCount] ; ++i) {
                    [docs addObject:[[wr document:i] asJson]];
                }
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:docs];
            }
            @catch (NSException *e) {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[e reason]];
            }
        }
        else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Internal error: missing dbName or collName"];
        }
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void) collection_remove:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult *pluginResult;
        
        NSString *dbName = [command argumentAtIndex:0 withDefault:nil andClass:[NSString class]];
        NSString *collName = [command argumentAtIndex:1 withDefault:nil andClass:[NSString class]];
        NSDictionary *query = [command argumentAtIndex:2 withDefault:nil andClass:[NSDictionary class]];
        
        if (dbName && collName) {
            LDBClient *client = [[LDBClient alloc] init];
            LDBDb *db = [client getDatabase:dbName];
            LDBCollection *coll = [db getCollection:collName];
            LDBObject *queryObj = nil;
            if (query) {
                queryObj = [LDBObject objectWithDictionary:query];
            }
            LDBWriteResult *wr = [coll remove:queryObj];
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:[wr documentCount]];
        }
        else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Internal error: missing dbName or collName"];
        }
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

static LDBObject *convertSortSpec(id sortSpec) {
    if ([sortSpec isKindOfClass:[NSString class]]) {
        return [[[LDBObjectBuilder builder] appendInt:1 forField:sortSpec] finish];
    }
    else if ([sortSpec isKindOfClass:[NSArray class]]) {
        LDBObjectBuilder *builder = [LDBObjectBuilder builder];
        __block BOOL foundOne = NO;
        [(NSArray *)sortSpec enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
            if ([obj isKindOfClass:[NSString class]]) {
                [builder appendInt:1 forField:obj];
                foundOne = YES;
            }
            else if ([obj isKindOfClass:[NSArray class]]) {
                NSArray *arr = (NSArray *)obj;
                if (1 <= [arr count]) {
                    id name = [arr objectAtIndex:0];
                    if ([name isKindOfClass:[NSString class]]) {
                        int asc = 1;
                        if (2 <= [arr count]) {
                            id order = [arr objectAtIndex:1];
                            if ([order isKindOfClass:[NSNumber class]]) {
                                asc = 0 < [(NSNumber *)order intValue] ? 1 : -1;
                            }
                        }
                        [builder appendInt:asc forField:name];
                        foundOne = YES;
                    }
                }
            }
        }];
        if (foundOne) {
            return [builder finish];
        }
        else {
            return nil;
        }
    }
    else {
        return nil;
    }
}

static LDBCursor *convertCursorSpec(NSDictionary *cursorSpec) {
    if (!cursorSpec) {
        return nil;
    }
    NSDictionary *coll = (NSDictionary *)[cursorSpec objectForKey:@"_collection"];
    NSString *dbName = (NSString *)[coll objectForKey:@"dbName"];
    NSString *collName = (NSString *)[coll objectForKey:@"collectionName"];
    if (dbName && collName) {
        LDBClient *client = [[LDBClient alloc] init];
        LDBDb *db = [client getDatabase:dbName];
        LDBCollection *coll = [db getCollection:collName];
        NSDictionary *filterDict = (NSDictionary *)[cursorSpec objectForKey:@"_filter"];
        LDBObject *filter = nil;
        if (filterDict) {
            filter = [LDBObject objectWithDictionary:filterDict];
        }
        LDBCursor *cursor = [[LDBCursor alloc] initWithCollection:coll query:filter keys:nil];
        NSDictionary *options = (NSDictionary *)[cursorSpec objectForKey:@"_options"];
        if (options) {
            id sortSpec = [options objectForKey:@"sort"];
            if (sortSpec) {
                LDBObject *sort = convertSortSpec(sortSpec);
                if (sort) {
                    cursor = [cursor sort:sort];
                }
            }
            id limitSpec = [options objectForKey:@"limit"];
            if (limitSpec && [limitSpec isKindOfClass:[NSNumber class]]) {
                int limit = [limitSpec intValue];
                if (0 < limit) {
                    cursor = [cursor limit:limit];
                }
            }
            id showPendingSpec = [options objectForKey:@"showPending"];
            if (showPendingSpec && [showPendingSpec isKindOfClass:[NSNumber class]]) {
                BOOL showPending = [showPendingSpec boolValue];
                if (showPending) {
                    cursor = [cursor showPending];
                }
            }
        }
        return cursor;
    }
    return nil;
}

- (void) cursor_count:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult *pluginResult;
        
        NSDictionary *cursorSpec = [command argumentAtIndex:0 withDefault:nil andClass:[NSDictionary class]];
        LDBCursor *cursor = convertCursorSpec(cursorSpec);
        if (cursor) {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsInt:(int)[cursor count]];
        }
        else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Internal error: cursor has invalid structure"];
        }
        
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void) cursor_each:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        CDVPluginResult *pluginResult;
        NSDictionary *cursorSpec = [command argumentAtIndex:0 withDefault:nil andClass:[NSDictionary class]];
        LDBCursor *cursor = convertCursorSpec(cursorSpec);
        if (cursor) {
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
        
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}

- (void) addLiveCursor:(NSString *)ns withCallback:(NSString *)callbackId
{
    NSMutableArray *arr = [self.liveCursors objectForKey:ns];
    if (nil == arr) {
        arr = [NSMutableArray array];
        [self.liveCursors setObject:arr forKey:ns];
    }
    [arr addObject:callbackId];
}

- (void) notifyLive:(NSNotification *)notification
{
    NSString *ns = [[notification userInfo] objectForKey:@"ns"];
    
    NSMutableArray *arr = [self.liveCursors objectForKey:ns];
    if (nil != arr) {
        [arr enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
            CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"notify"];
            [pluginResult setKeepCallbackAsBool:YES];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:obj];
        }];
    }
}

- (void) cursor_on:(CDVInvokedUrlCommand *)command
{
    [self.commandDelegate runInBackground:^{
        NSDictionary *cursorSpec = [command argumentAtIndex:0 withDefault:nil andClass:[NSDictionary class]];
        NSDictionary *coll = (NSDictionary *)[cursorSpec objectForKey:@"_collection"];
        NSString *dbName = (NSString *)[coll objectForKey:@"dbName"];
        NSString *collName = (NSString *)[coll objectForKey:@"collectionName"];
        
        CDVPluginResult *pluginResult;
        if (dbName && collName) {
            [self addLiveCursor:[NSString stringWithFormat:@"%@.%@", dbName, collName] withCallback:command.callbackId];
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"started"];
            [pluginResult setKeepCallbackAsBool:YES];
        }
        else {
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Internal error: cursor has invalid structure"];
        }
        
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    }];
}
@end
