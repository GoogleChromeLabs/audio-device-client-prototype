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

/* global performance:false */
const performance = {
  now: () => { return currentTime; },
};

/**
 * A data collection helper class.
 */
class Tracer {
  constructor() {
    this.reset();
  }

  reset() {
    this._records = {};
  }

  /**
   * @param {string} recordKey
   * @param {Array<*>} entry
   */
  _pushEntry(recordKey, entry) {
    entry.unshift(recordKey);
    // The fastest: https://jsperf.com/hasownproperty-vs-in-vs-undefined/12
    (this._records[recordKey] !== undefined)
        ? this._records[recordKey].push(entry)
        : this._records[recordKey] = [entry];
  }

  /**
   * Collects a value for |recordKey| at instantaneous time.
   *
   * @param {!string} recordKey
   * @param {!number} value
   */
  trace1(recordKey, value) {
    this._pushEntry(recordKey, [value, performance.now()]);
  }

  /**
   * Collects a value for |recordKey| for a period of time. The end time will be
   * captured at call.
   *
   * @param {!string} recordKey
   * @param {!number} value
   * @param {!number} startTime
   */
  trace2(recordKey, value, startTime) {
    this._pushEntry(recordKey, [value, startTime, performance.now()]);
  }

  /**
   * @return {object}
   */
  getAllRecords() {
    return this._records;
  }

  /**
   * @param {string} recordKey
   * @return {Array}
   */
  getRecord(recordKey) {
    return (recordKey in this._records) ? this._records[recordKey] : [];
  }

  /**
   * Merges records from other tracer into this one. The data under the same
   * record key will be consolidated. Other unique record key will be simply
   * transferred. After the operation, the |otherRecords| will be emptied.
   *
   * @param {object} otherRecords
   */
  mergeRecords(otherRecords) {
    for (const recordKey in otherRecords) {
      if (this._records[recordKey] !== undefined) {
        this._records[recordKey].push.apply(otherRecords[recordKey]);
      } else {
        this._records[recordKey] = otherRecords[recordKey];
      }
    }
    otherRecords = {};
  }

  /**
   * Calculates mean and standard deviation for an 1D number series.
   *
   * @param {Array<Array<*>>} data
   * @param {number} targetIndex
   * @return {object} results
   * @return {number} results.mean
   * @return {number} results.standardDeviation
   */
  static getStat(data, targetIndex) {
    let sum = 0;
    data.forEach((entry) => sum += entry[targetIndex]);
    const mean = sum / data.length;
    const deviations = [];
    data.forEach((entry) =>
      deviations.push(Math.pow(entry[targetIndex] - mean, 2)));
    const deviationSum = deviations.reduce((acc, val) => acc + val);
    const standardDeviation = Math.sqrt(deviationSum / deviations.length);

    return {mean, standardDeviation};
  }
}

export default Tracer;
