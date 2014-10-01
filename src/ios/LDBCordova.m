#import "LDBCordova.h"

#import "LowlaDB/LowlaDB.h"

@implementation LDBCordova

- (void) client_version:(CDVInvokedUrlCommand *)command
{
	LDBClient *client = [[LDBClient alloc] init];
	NSString *version = [client version];
	
	CDVPluginResult *pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:version];
	[self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

@end