//
//  LDBDb.h
//  lowladb-objc
//
//  Created by mark on 7/3/14.
//
//

#import <Foundation/Foundation.h>

@class LDBCollection;

@interface LDBDb : NSObject
@property (readonly) NSString *name;

- (id)initWithName:(NSString *)name;
- (LDBCollection *)getCollection:(NSString *)name;
- (NSArray *)collectionNames;
@end
