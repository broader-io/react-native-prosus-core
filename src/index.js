import { NativeModules } from 'react-native'

const native = NativeModules.ProsusCore

export function callProsus(method, jsonArguments) {
  return native.callProsus(method, jsonArguments)
}
