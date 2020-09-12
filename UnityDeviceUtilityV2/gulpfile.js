var gulp = require('gulp');
var path = require('path');
var uglifyjs = require('uglify-js');
var composer = require('gulp-uglify/composer');
var pump = require('pump');
let babel = require('gulp-babel');
var minify = composer(uglifyjs, console);
var outputDir = 'dist';

gulp.task('compress - Index file', function (cb) {
  // the same options as described above
  var options = {
    keep_fnames: false
  };
  pump([
    gulp.src(path.join(__dirname, 'index.js')),
    // rename({ suffix: '.min' }),
    babel({
      presets: ['es2015', 'stage-0'],
      plugins: ['babel-plugin-transform-runtime']
    }),
    minify(options),
    gulp.dest(path.join(__dirname, outputDir, 'restricted'))
  ], cb);
});
gulp.task('compress - ServerComponents Folder files', function (cb) {
  // the same options as described above
  var options = {
    keep_fnames: false
  };
  pump([
    gulp.src(path.join(__dirname, 'ServerComponents/*.js')),
    // rename({ suffix: '.min' }),
    babel({
      presets: ['es2015', 'stage-0'],
      plugins: ['babel-plugin-transform-runtime']
    }),
    minify(options),
    gulp.dest(path.join(__dirname, outputDir, 'restricted', 'ServerComponents'))
  ], cb);
});

gulp.task('compress - ServerComponent-DataEntity Folder files', function (cb) {
  // the same options as described above
  var options = {
    keep_fnames: false
  };
  pump([
    gulp.src(path.join(__dirname, 'ServerComponents/DataEntity/*.js')),
    // rename({ suffix: '.min' }),
    babel({
      presets: ['es2015', 'stage-0'],
      plugins: ['babel-plugin-transform-runtime']
    }),
    minify(options),
    gulp.dest(path.join(__dirname, outputDir, 'restricted', 'ServerComponents/DataEntity'))
  ], cb);
});
gulp.task('Copy log/config.json', function (cb) {
  // the same options as described above
  pump([
    gulp.src(path.join(__dirname, 'log/config.json')),
    gulp.dest(path.join(__dirname, outputDir, 'log'))
  ]);
});
gulp.task('Copy ../app.config.json', function (cb) {
  // the same options as described above
  pump([
    gulp.src([
      path.join(__dirname, 'package.json'),
      path.join(__dirname, '../app.config.json')
    ]),
    gulp.dest(path.join(__dirname, outputDir))
  ]);
});
gulp.task('copy script files', function (cb) {
  var options = {
    keep_fnames: false
  };
  pump([
    gulp.src([
      path.join(__dirname, 'windows-service-installer.js'),
      path.join(__dirname, 'stop-service.js')
    ]),
    // rename({ suffix: '.min' }),
    babel({
      presets: ['es2015', 'stage-0'],
      plugins: ['babel-plugin-transform-runtime']
    }),
    minify(options),
    gulp.dest(path.join(__dirname, outputDir))
  ], cb);
});
gulp.task('default', [
  'compress - Index file',
  'compress - ServerComponents Folder files',
  'compress - ServerComponent-DataEntity Folder files',
  'copy script files',
  'Copy log/config.json',
  'Copy ../app.config.json'
]);
