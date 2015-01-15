//
//  LDBCursor.h
//  lowladb-objc
//
//  Created by mark on 7/11/14.
//
//

#import <Foundation/Foundation.h>

@class LDBCollection;
@class LDBObject;

@interface LDBCursor : NSObject
- (id)initWithCollection:(LDBCollection *)coll query:(LDBObject *)query keys:(LDBObject *)keys;
- (BOOL)hasNext;
- (LDBObject *)next;
- (LDBObject *)one;
@end
