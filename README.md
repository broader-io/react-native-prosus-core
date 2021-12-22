# react-native-prosus-core

This library packages the [prosus-core-cpp](https://github.com/prosus/prosus-core-cpp) library for use on React Native.

It exposes a single method, `callProsus`, which accepts and returns JSON strings for now:

```js
import { callProsus } from 'react-native-prosus-core'

const jsonResult = await callProsus('is_subaddress', JSON.stringify(args))
const result = JSON.parse(jsonResult)
```

In a future version, we would like to provide a nicer Javascript API to this library.

## External source code

This library relies on a large amount of native C++ code from other repos. To integrate this code, you must run the following script before publishing this library to NPM:

```sh
npm run update-sources
```

This script does the following tasks:

- Download third-party source code.
- Set up the Android build system:
  - Determine which C++ headers are actually necessary.
  - Copy the necessary sources into `android/src/main/cpp`.
  - Assemble `CMakeLists.txt`.
- Compile an iOS universal static library.

The `update-sources` script is also the place to make edits when upgrading any of the third-party dependencies. The react-native-prosus-core repo doesn't include these third-party C++ sources, since they are enormous.
