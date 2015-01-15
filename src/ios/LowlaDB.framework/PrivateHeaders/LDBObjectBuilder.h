//
//  LDBObjectBuilder.h
//  lowladb-objc
//
//  Created by mark on 7/15/14.
//
//

#import <Foundation/Foundation.h>

@class LDBObject;
@class LDBObjectId;

@interface LDBObjectBuilder : NSObject

+ (LDBObjectBuilder *)builder;
- (LDBObjectBuilder *)appendDouble:(double)value forField:(NSString *)field;
- (LDBObjectBuilder *)appendString:(NSString *)value forField:(NSString *)field;
- (LDBObjectBuilder *)appendObject:(LDBObject *)value forField:(NSString *)field;
- (LDBObjectBuilder *)appendObjectId:(LDBObjectId *)value forField:(NSString *)field;
- (LDBObjectBuilder *)appendBool:(BOOL)value forField:(NSString *)field;
- (LDBObjectBuilder *)appendDate:(NSDate *)value forField:(NSString *)field;
- (LDBObjectBuilder *)appendInt:(int)value forField:(NSString *)field;
- (LDBObjectBuilder *)appendLong:(int64_t)value forField:(NSString *)field;

- (LDBObject *)finish;
@end
