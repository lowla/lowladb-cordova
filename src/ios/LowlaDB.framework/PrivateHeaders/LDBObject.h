//
//  LDBObject.h
//  lowladb-objc
//
//  Created by mark on 7/8/14.
//
//

#import <Foundation/Foundation.h>

@class LDBObjectId;

@interface LDBObject : NSObject
+ (id)objectWithDictionary:(NSDictionary *)dict;

- (id)initWithData:(NSData *)data;

- (BOOL)containsField:(NSString *)field;
- (double)doubleForField:(NSString *)field;
- (NSString *)stringForField:(NSString *)field;
- (LDBObject *)objectForField:(NSString *)field;
- (LDBObjectId *)objectIdForField:(NSString *)field;
- (BOOL)boolForField:(NSString *)field;
- (NSDate *)dateForField:(NSString *)field;
- (int)intForField:(NSString *)field;
- (int64_t)longForField:(NSString *)field;

- (const char *)asBson;
- (NSString *)asJson;
@end
