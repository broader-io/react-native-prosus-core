#!/usr/bin/env node -r sucrase/register
//
// Run this script as `./scripts/update-sources.ts`
//
// It will:
// - Download third-party source code.
// - Set up the Android build system:
//    - Determine which C++ headers are actually necessary.
//    - Copy the necessary sources into `android/src/main/cpp`.
//    - Assemble `CMakeLists.txt`.
// - Assemble an iOS universal static library.
//
// This library only uses about 1500 of the 13000 boost headers files,
// so we ask the C compiler which headers are actually useful.

import { execSync } from 'child_process'
import { existsSync, mkdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { makeNodeDisklet } from 'disklet'

const disklet = makeNodeDisklet(join(__dirname, '../'))
const tmp = join(__dirname, '../tmp')

async function main(): Promise<void> {
  if (!existsSync(tmp)) mkdirSync(tmp)
  await downloadSources()
  await generateAndroidBuild()
  await generateIosLibrary()
}

async function downloadSources(): Promise<void> {
  getZip(
    'boost_1_76_0.zip',
    'https://boostorg.jfrog.io/artifactory/main/release/1.76.0/source/boost_1_76_0.zip'
  )
  getProsusCore(
    'prosus-core',
    'git@github.com:broader-io/prosus-core.git',
    'cb326e6b7aa0eeb70a049fc8eae3cc86e3a450a5'
  )
  await copyFiles('src/', 'tmp/', [
    'prosus-wrapper/prosus-methods.cpp',
    'prosus-wrapper/prosus-methods.hpp'
  ])
}

// Preprocessor definitions:
const defines: string[] = [
  'BOOST_ERROR_CODE_HEADER_ONLY',
  'BOOST_SYSTEM_NO_DEPRECATED'
]


const includePaths: string[] = [
  'boost_1_76_0/',
  'prosus-core/core/contrib/prosus-money/cli/include',
  'prosus-core/core/contrib/prosus-money/cli/src',
  'prosus-core/core/src/custom',
  'prosus-core/core/contrib/epee/include',

  'prosus-core/core/bridge/include',

]

const sources: string[] = [
  'boost_1_76_0/libs/thread/src/pthread/once.cpp',
  'boost_1_76_0/libs/thread/src/pthread/thread.cpp',
  'prosus-core/core/bridge/src/node_rpc_proxy.cpp',
  'prosus-core/core/bridge/src/serial_bridge_index.cpp',
  'prosus-core/core/bridge/src/tools__ret_vals.cpp',
  'prosus-core/core/bridge/src/serial_bridge_utils.cpp',
  'prosus-core/core/bridge/src/node_rpc_proxy.cpp',

  'prosus-core/core/contrib/prosus-money/cli/src/Common/Base58.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Common/ConsoleTools.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Common/JsonValue.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Common/MemoryInputStream.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Common/StreamTools.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Common/StringOutputStream.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Common/StringTools.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Common/StringView.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Common/VectorOutputStream.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Common/StdInputStream.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Common/StdOutputStream.cpp',

  'prosus-core/core/contrib/prosus-money/cli/src/crypto/blake256.c',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/chacha8.c',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/crypto.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/crypto-ops.c',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/crypto-ops-data.c',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/groestl.c',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/hash.c',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/hash-extra-blake.c',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/hash-extra-groestl.c',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/hash-extra-jh.c',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/hash-extra-skein.c',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/jh.c',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/keccak.c',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/oaes_lib.c',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/random.c',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/skein.c',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/slow-hash.c',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/slow-hash.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/crypto/tree-hash.c',

  'prosus-core/core/contrib/prosus-money/cli/src/CryptoNoteCore/Account.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/CryptoNoteCore/Blockchain.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/CryptoNoteCore/CryptoNoteBasic.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/CryptoNoteCore/CryptoNoteBasicImpl.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/CryptoNoteCore/CryptoNoteFormatUtils.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/CryptoNoteCore/CryptoNoteSerialization.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/CryptoNoteCore/CryptoNoteTools.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/CryptoNoteCore/Currency.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/CryptoNoteCore/Difficulty.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/CryptoNoteCore/TransactionExtra.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/CryptoNoteCore/TransactionPrefixImpl.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/CryptoNoteCore/TransactionUtils.cpp',

  'prosus-core/core/contrib/prosus-money/cli/src/Logging/CommonLogger.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Logging/ConsoleLogger.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Logging/FileLogger.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Logging/ILogger.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Logging/LoggerGroup.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Logging/LoggerManager.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Logging/LoggerMessage.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Logging/LoggerRef.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Logging/StreamLogger.cpp',

  'prosus-core/core/contrib/prosus-money/cli/src/mnemonics/electrum-words.cpp',

  'prosus-core/core/contrib/prosus-money/cli/src/Serialization/BinaryInputStreamSerializer.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Serialization/BinaryOutputStreamSerializer.cpp',
  'prosus-core/core/contrib/prosus-money/cli/src/Serialization/BinaryInputStreamSerializer.cpp',
  //'prosus-core/core/contrib/prosus-money/cli/src/Serialization/ISerializer.h',
  'prosus-core/core/contrib/prosus-money/cli/src/Serialization/SerializationOverloads.cpp',

  'prosus-core/core/contrib/prosus-money/cli/src/Wallet/WalletErrors.cpp',

  'prosus-core/core/contrib/epee/src/hex.cpp',
  'prosus-core/core/contrib/epee/src/memwipe.c',
  'prosus-core/core/contrib/epee/src/wipeable_string.cpp',
  'prosus-wrapper/prosus-methods.cpp'
]

// Phones and simulators we need to support:
const iosPlatforms: { [arch: string]: string } = {
  arm64: 'iphoneos',
  armv7: 'iphoneos',
  armv7s: 'iphoneos',
  x86_64: 'iphonesimulator'
}

/**
 * Set up the Android build system.
 */
async function generateAndroidBuild() {
  // Clean existing stuff:
  const src = 'android/src/main/cpp/'
  await disklet.delete(src + 'boost_1_76_0')
  await disklet.delete(src + 'prosus-core')
  await disklet.delete(src + 'prosus-wrapper')

  // Figure out which files we need:
  const headers = inferHeaders()
  const extraFiles: string[] = [
    // Preserve licenses:
    'boost_1_76_0/LICENSE_1_0.txt',

    // Platform-specific files our header inference might not catch:
    //'boost_1_76_0/boost/atomic/detail/ops_extending_cas_based.hpp',
    'boost_1_76_0/boost/config/platform/linux.hpp',
    'boost_1_76_0/boost/detail/fenv.hpp',
    //'boost_1_76_0/boost/uuid/detail/uuid_generic.hpp'
  ]
  for (const extra of extraFiles) {
    if (headers.indexOf(extra) >= 0) {
      console.log(`Warning: ${extra} isn't needed in extraFiles`)
    }
  }
  await copyFiles('tmp/', src, [...sources, ...headers, ...extraFiles])

  // Assemble our CMakeLists.txt:
  const sourceList = ['jni.cpp', ...sources].join(' ')
  const cmakeLines = [
    '# Auto-generated by the update-sources script',
    'cmake_minimum_required(VERSION 3.4.1)',
    'add_compile_options(-fvisibility=hidden -w)',
    ...defines.map(name => `add_definitions("-D${name}")`),
    ...includePaths.map(path => `include_directories("${path}")`),
    `add_library(prosus-jni SHARED ${sourceList})`
  ]
  await disklet.setText(src + 'CMakeLists.txt', cmakeLines.join('\n'))
}

/**
 * Uses the C compiler to figure out exactly which headers we need.
 * Boost includes about 13,000 header files, which is insane.
 * This reduces the number of headers to about 1500, which much better,
 * but still slightly insane.
 */
function inferHeaders(): string[] {
  const cflags = [
    ...defines.map(name => `-D${name}`),
    ...includePaths.map(path => `-I${join(tmp, path)}`)
  ]
  const cxxflags = [...cflags, '-std=c++11']

  const out: { [path: string]: true } = {}
  for (const source of sources) {
    console.log(`Finding headers in ${source}...`)

    const useCxx = /\.cpp$|\.cc$/.test(source)
    const report = quietExec([
      'clang++',
      '-M',
      ...(useCxx ? cxxflags : cflags),
      join(tmp, source)
    ])

    // Skip the first 2 lines & trim trailing back-slashes:
    const headers = report
      .split('\n')
      .slice(2)
      .map(line => line.replace(/ |\\$/g, ''))

    // We only care about headers located in our tmp/ location:
    for (const header of headers) {
      if (header.indexOf(tmp) === 0) {
        out[header.slice(tmp.length + 1)] = true
      }
    }
  }

  return Object.keys(out)
}

/**
 * Compiles the sources into an iOS static library.
 */
async function generateIosLibrary(): Promise<void> {
  const cflags = [
    ...defines.map(name => `-D${name}`),
    ...includePaths.map(path => `-I${join(tmp, path)}`),
    '-miphoneos-version-min=9.0',
    '-O2', '-maes'
    //'-std=c11 -maes -fno-strict-aliasing -march=native -D_GNU_SOURCE -Wall -Wextra -Wpointer-arith -Wno-error=unused-parameter -Wno-unused-parameter -Wno-error=undef -Wno-error=unused-variable -Wno-reorder-ctor -Wno-unused-lambda-capture -Wno-unused-private-field -Wno-comment -Wno-reorder -Wno-missing-field-initializers -Wno-unused-variable -Wno-return-std-move -Wno-unused-function -Wno-uninitialized -Wno-range-loop-construct -Wno-delete-non-abstract-non-virtual-dtor -Wno-sign-compare -Wno-deprecated-copy -isysroot /Library/Developer/CommandLineTools/SDKs/MacOSX11.3.sdk'
  ]
  const cxxflags = [...cflags, '-std=c++11']

  // Generate a library for each platform:
  const libraries: string[] = []
  for (const arch of Object.keys(iosPlatforms)) {
    const working = join(tmp, `ios-${arch}`)
    if (!existsSync(working)) mkdirSync(working)

    // Find platform tools:
    const xcrun = ['xcrun', '--sdk', iosPlatforms[arch]]
    const ar = quietExec([...xcrun, '--find', 'ar'])
    const cc = quietExec([...xcrun, '--find', 'cc'])
    const cxx = quietExec([...xcrun, '--find', 'c++'])
    const sdkFlags = [
      `-arch ${arch}`,
      `-isysroot ${quietExec([...xcrun, '--show-sdk-path'])}`
    ]

    // Compile sources:
    const objects: string[] = []
    for (const source of sources) {
      console.log(`Compiling ${source} for ${arch}...`)

      // Figure out the object file name:
      const object = join(
        working,
        source.replace(/^.*\//, '').replace(/\.c$|\.cc$|\.cpp$/, '.o')
      )
      objects.push(object)

      const useCxx = /\.cpp$|\.cc$/.test(source)
      quietExec([
        useCxx ? cxx : cc,
        '-c',
        ...(useCxx ? cxxflags : cflags),
        ...sdkFlags,
        `-o ${object}`,
        join(tmp, source)
      ])
    }

    // Generate a static library:
    const library = join(working, `libprosus-core.a`)
    if (existsSync(library)) unlinkSync(library)
    libraries.push(library)
    quietExec([ar, 'rcs', library, ...objects])
  }

  // Merge the platforms into a fat library:
  quietExec([
    'lipo',
    '-create',
    '-output',
    join(__dirname, '../ios/Libraries/libprosus-core.a'),
    ...libraries
  ])
}

/**
 * Clones a git repo and checks our a hash.
 */
function getProsusCore(name: string, uri: string, hash: string): void {
  const path = join(tmp, name)

  // Clone (if needed):
  if (!existsSync(path)) {
    console.log(`Cloning ${name}...`)
    loudExec(['git', 'clone', uri, name])
    process.chdir( 'prosus-core' )
    loudExec(['git', 'submodule', 'update', '--init', 'core/contrib/prosus-money'])
    process.chdir( '..' )
  }

  // Checkout:
  console.log(`Checking out ${name}...`)
  execSync(`git checkout -f ${hash}`, {
    cwd: path,
    stdio: 'inherit',
    encoding: 'utf8'
  })
}

/**
 * Downloads & unpacks a zip file.
 */
function getZip(name: string, uri: string): void {
  const path = join(tmp, name)

  if (!existsSync(path)) {
    console.log(`Getting ${name}...`)
    loudExec(['curl', '-L', '-o', path, uri])
  }

  // Unzip:
  loudExec(['unzip', '-u', path])
}

/**
 * Copies just the files we need from one folder to another.
 */
async function copyFiles(
  from: string,
  to: string,
  files: string[]
): Promise<void> {
  for (const file of files) {
    await disklet.setText(to + file, await disklet.getText(from + file))
  }
}

/**
 * Runs a command and returns its results.
 */
function quietExec(argv: string[]): string {
  return execSync(argv.join(' '), {
    cwd: tmp,
    encoding: 'utf8'
  }).replace(/\n$/, '')
}

/**
 * Runs a command and displays its results.
 */
function loudExec(argv: string[]): void {
  execSync(argv.join(' '), {
    cwd: tmp,
    stdio: 'inherit',
    encoding: 'utf8'
  })
}

main().catch(error => console.log(error))
