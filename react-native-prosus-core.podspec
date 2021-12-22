require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = package['name']
  s.version      = package['version']
  s.summary      = package['description']
  s.homepage     = package['homepage']
  s.license      = package['license']
  s.authors      = package['author']

  s.platform     = :ios, "9.0"
  s.requires_arc = true
  s.source = {
    :git => "https://github.com/EdgeApp/react-native-prosus-core.git",
    :tag => "v#{s.version}"
  }
  s.source_files =
    "ios/ProsusCore.h",
    "ios/ProsusCore.mm",
    "src/prosus-wrapper/prosus-methods.hpp"
  s.vendored_libraries = "ios/Libraries/prosus-core.a"

  s.dependency "React"
end
