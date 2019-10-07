# Prototype: Audio Device Client 

This is a proof-of-concept JS library of Audio Device Client built on top of 
[Audio Worklet](https://developers.google.com/web/updates/2017/12/audio-worklet)
, [SharedArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)
, and [Worker](https://developer.mozilla.org/en-US/docs/Web/API/Worker). For
more information on Audio Device Client, visit
[the project repository](https://github.com/WebAudio/web-audio-cg/tree/master/audio-device-client).
Note that this API is currently under active development.

Before using this library, be sure to check if your browser supports Audio
Worklet. ([MDN browser compatibility](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet#Browser_compatibility))


## Usage

Clone this repository, and use `audio-device-client.js` from `/build` directory. For general usage, you don't need to use other files.

```bash
/build
  /infra
    events.esm.js
    events.js
    free-clock.ems.js
    free-clock.js
    free-queue.esm.js
    free-queue.js
  audio-device-client.js <<< the main script file
  audio-sink.js
  client-global-scope.js
```

The library uses ES6 module `import`. Also note that you have to specify the library path with `SET_LIBRARY_PATH()` function prior to the instantiation of an `AudioDeviceClient` object.

```js
import { requestAudioDeviceClient, SET_LIBRARY_PATH }
    from  '../build/audio-device-client.js';

SET_LIBRARY_PATH('../build/');

const constraints = {
  callbackBufferSize: 512,
  channelCount: 2,
};

const client =
    await navigator.mediaDevices.requestAudioDeviceClient(constraints);
await client.addModule('./my-engine.js');
```


## Development and Testing

For the local development and testing, you need to install Node modules first with `npm install`.

- Use `gulp build` command to build the library files locally.
- For testing, launch the local development server and go to `test/`
directory.


## CONTRIBUTING

If you have found an error in this library, please file an issue at: https://github.com/GoogleChromeLabs/web-audio-samples/issues.

Patches are encouraged, and may be submitted by forking this project and submitting a pull request through GitHub. See CONTRIBUTING for more detail.

## LICENSE

Copyright 2019 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.