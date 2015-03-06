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

extern NSString * LDBClientDidChangeCollectionNotification;

@interface LDBClient : NSObject

@property (readonly) NSString *version;

+ (void)enableNotifications:(BOOL)enable;

- (void)dropDatabase:(NSString *)dbName;
- (LDBDb *)getDatabase:(NSString *)dbName;
- (NSArray *)getDatabaseNames;
- (void)loadJson:(NSString *)json;

@end
