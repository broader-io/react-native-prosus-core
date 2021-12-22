#import "ProsusCore.h"
#include "prosus-methods.hpp"

@implementation ProsusCore

RCT_EXPORT_MODULE();

RCT_REMAP_METHOD(
  callProsus,
  callProsusMethod:(NSString *)method
  arguments:(NSString *)arguments
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
) {
  const std::string methodString = [method UTF8String];
  const std::string argumentsString = [arguments UTF8String];

  // Find the named method:
  for (int i = 0; i < ProsusMethodCount; ++i) {
      if (ProsusMethods[i].name != methodString) continue;

      // Call the method, with error handling:
      try {
          const std::string out = ProsusMethods[i].method(argumentsString);
          resolve([NSString stringWithCString:out.c_str() encoding:NSUTF8StringEncoding]);
      } catch (...) {
          reject(@"Error", @"prosus-core threw an exception", nil);
      }
      return;
  }

  reject(
    @"TypeError",
    [NSString stringWithFormat:@"No prosus-core method %@", method],
    nil
  );
}

@end
