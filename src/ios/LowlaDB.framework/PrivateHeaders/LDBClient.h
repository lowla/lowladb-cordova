//
//  LDBClient.h
//  lowladb-objc
//
//  Created by mark on 7/3/14.
//
//

#import <Foundation/Foundation.h>
@class LDBDb;
@class LDBClient;

extern NSString *LDBClientDidChangeCollectionNotification;

extern NSString *LDBClientSequenceProperty;

typedef enum {
    LDBSyncStatus_PUSH_STARTED = 0,
    LDBSyncStatus_PUSH_ENDED,
    LDBSyncStatus_PULL_STARTED,
    LDBSyncStatus_PULL_ENDED,
    LDBSyncStatus_WARNING,
    LDBSyncStatus_ERROR,
    LDBSyncStatus_OK
} LDBSyncStatus;

typedef void (^SyncNotifier)(LDBSyncStatus status, NSString *message);

@interface LDBClient : NSObject

@property (readonly) NSString *version;

+ (void)enableNotifications:(BOOL)enable;
+ (void)sync:(NSString *)server notify:(SyncNotifier)notify;

- (void)dropDatabase:(NSString *)dbName;
- (LDBDb *)getDatabase:(NSString *)dbName;
- (NSArray *)getDatabaseNames;
- (void)loadJson:(NSString *)json;

@end
