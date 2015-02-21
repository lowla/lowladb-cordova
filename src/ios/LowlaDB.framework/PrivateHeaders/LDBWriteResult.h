//
//  LDBWriteResult.h
//  lowladb-objc
//
//  Created by mark on 7/8/14.
//
//

#import <Foundation/Foundation.h>

@class LDBObject;

@interface LDBWriteResult : NSObject
@property (readonly) int documentCount;

-(LDBObject *)document:(int) n;

@end
