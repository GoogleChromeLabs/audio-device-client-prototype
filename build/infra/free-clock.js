/**
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
class FreeClock{constructor(t,i){this._interval=t,this._callback=i,this._nextClock=null}_invokeCallback(){const t=performance.now();this._nextClock+=this._interval,this._timerId=setTimeout(this._invokeCallback.bind(this),this._nextClock-t),this._callback(t)}start(){this._nextClock=performance.now()+this._interval,this._timerId=setTimeout(this._invokeCallback.bind(this),this._interval)}stop(){clearTimeout(this._timerId)}}