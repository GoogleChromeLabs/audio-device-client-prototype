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

/**
 * Usage: Type `gulp` in the terminal, and change any source script files. Then
 * it automatically generates the output files in `build/`.
 */

const fs = require('fs');
const {src, dest, watch, series} = require('gulp');
const header = require('gulp-header');
const footer = require('gulp-footer');
const uglify = require('gulp-uglify-es').default;
const rename = require('gulp-rename');
const merge = require('merge-stream');

const sources = [
  {
    src: 'src/infra/events.js',
    footer: '\nexport { Agent, State, Command };',
  },
  {
    src: 'src/infra/free-clock.js',
    footer: '\nexport default FreeClock;',
  },
  {
    src: 'src/infra/free-queue.js',
    footer: '\nexport default FreeQueue;',
  }
];

const licenseText = fs.readFileSync('src/license.js', 'utf8');

function buildAPI() {
  return src(['src/*.js', '!src/license.js'])
      .pipe(uglify())
      .pipe(header(licenseText))
      .pipe(dest('build'));
}

function buildInfraES5() {
  return src('src/infra/*.js')
      .pipe(uglify())
      .pipe(header(licenseText))
      .pipe(dest('build/infra'));
}

function buildInfraES6() {
  const tasks = [];
  sources.map((entry, index) => {
    tasks[index] = src(entry.src)
        .pipe(uglify())
        .pipe(footer(entry.footer))
        .pipe(rename({ extname: '.esm.js' }))
        .pipe(header(licenseText))
        .pipe(dest('build/infra'));
  });

  return merge(...tasks);
}

const buildInfra = series(buildInfraES5, buildInfraES6);

function watchAndBuild() {
  watch('src/*.js', buildAPI);
  watch('src/infra/*.js', buildInfra);
}

exports.buildInfra = buildInfra;
exports.buildAPI = buildAPI;
exports.build = series(buildInfra, buildAPI);
exports.default = watchAndBuild;
