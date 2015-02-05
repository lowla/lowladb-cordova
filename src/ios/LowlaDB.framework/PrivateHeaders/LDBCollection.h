//
//  LDBCollection.h
//  lowladb-objc
//
//  Created by mark on 7/8/14.
//
//

#import <Foundation/Foundation.h>

@class LDBDb;
@class LDBCursor;
@class LDBObject;
@class LDBWriteResult;

@interface LDBCollection : NSObject

@property (weak, readonly) LDBDb *db;
@property (readonly) NSString *name;

- (id)initWithDb:(LDBDb *)db andName:(NSString *)name;

- (LDBCursor *)find;
- (LDBObject *)findOne;
- (LDBCursor *)find:(LDBObject *)query;
- (LDBObject *)findOne:(LDBObject *)query;
- (LDBWriteResult *)insert:(LDBObject *)object;
- (LDBWriteResult *)insertArray:(NSArray *)arr;
- (LDBWriteResult *)save:(LDBObject *)object;
- (LDBWriteResult *)update:(LDBObject *)query object:(LDBObject *)object;
- (LDBWriteResult *)update:(LDBObject *)query object:(LDBObject *)object upsert:(BOOL)upsert multi:(BOOL)multi;
- (LDBWriteResult *)updateMulti:(LDBObject *)query object:(LDBObject *)object;

@end
