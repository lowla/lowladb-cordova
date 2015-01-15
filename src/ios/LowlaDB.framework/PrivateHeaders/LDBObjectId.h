//
//  LDBObjectId.h
//  lowladb-objc
//
//  Created by mark on 7/8/14.
//
//

#import <Foundation/Foundation.h>

@interface LDBObjectId : NSObject

+ (LDBObjectId *)generate;
- (id)initWithBytes:(const char *)bytes;
- (const void *)bytes;
@end
