var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var sourcemaps = require('gulp-sourcemaps');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var cssnano = require('gulp-cssnano');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');
var concat = require('gulp-concat');
var zip = require('gulp-zip'); //打包
var archiver = require('gulp-archiver'); //归档
var moment = require('moment'); //时间格式化

//postcss
var postcss = require('gulp-postcss');
var px2rem = require('postcss-px2rem');
var processors = [px2rem({ remUnit: 75 })]; //转换rem插件，默认设计稿750px
var autoprefixer = require('autoprefixer'); //浏览器前缀

//compass
var compass = require('gulp-compass');

// 启动本地服务器
gulp.task('browserSync', function() {
    browserSync({
        server: {
            baseDir: 'src'
        }
    });
});

//对wap文件夹操作
gulp.task('wapsass', function() {
    return gulp.src('src/sass/wap.scss')
        .pipe(compass({
            config_file: 'config.rb',
            css: 'src/css',
            sass: 'src/sass'
        }))
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss(processors)) //rem
        .pipe(gulp.dest('src/css'))
        .pipe(browserSync.reload({
            stream: true
        }));
});

//对web文件夹操作
gulp.task('websass', function() {
    return gulp.src('src/sass/web.scss')
        .pipe(compass({
            config_file: 'config.rb',
            css: 'src/css',
            sass: 'src/sass'
        }))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('src/css'))
        .pipe(browserSync.reload({
            stream: true
        }));
});


// 监听
gulp.task('watch', function() {
    gulp.watch('src/sass/*.scss', ['wapsass', 'websass']);
    gulp.watch('src/*.html', browserSync.reload);
    gulp.watch('src/js/**/*', browserSync.reload);
});

// 优化任务

//合并压缩css
gulp.task('css', function() {
    return gulp.src('src/css/*.css')
        .pipe(postcss([autoprefixer()]))
        .pipe(cssnano())
        .pipe(gulp.dest('dist/css'));
});


// 合并压缩html文件中的css、js
gulp.task('useref', function() {
    return gulp.src('src/*.html')
        .pipe(useref())
        .pipe(gulpIf('*.js', uglify()))
        .pipe(gulpIf('*.css', postcss([autoprefixer()])))
        .pipe(gulpIf('*.css', cssnano()))
        .pipe(gulp.dest('dist'));
});

// 复制images文件夹
gulp.task('images', function() {
    return gulp.src('src/images/*.+(png|jpg|jpeg|gif|svg)')
        .pipe(gulp.dest('dist/images'));
});

// 复制js文件夹 
gulp.task('copyjs', function() {
    return gulp.src('src/js/**/*')
        .pipe(gulp.dest('dist/js'));
});

// 复制lib文件夹 
gulp.task('copylib', function() {
    return gulp.src('src/lib/**/*')
        .pipe(gulp.dest('dist/lib'));
});

// 每次build清除dist文件夹 
gulp.task('clean', function() {
    return del.sync('dist').then(function(cb) {
        return cache.clearAll(cb);
    });
});

gulp.task('clean:dist', function() {
    return del.sync(['dist/**/*', '!dist/images', '!dist/images/**/*']);
});

// 构建队列---------------

gulp.task('default', function(callback) {
    runSequence(['wapsass', 'websass', 'browserSync'], 'watch',
        callback
    )
});

//编译
gulp.task('build', function(callback) {
    runSequence(
        'clean:dist',
        'wapsass', 'websass', ['useref', 'images', 'copyjs', 'copylib', 'css'],
        callback
    )
});

//打包任务
gulp.task('zip', function() {
    gulp.src('dist/**/*')
        .pipe(zip('html.zip'))
        .pipe(gulp.dest('dist'));
});

//归档任务
gulp.task('archiver', function() {
    return gulp.src('src/**')
        .pipe(archiver(moment().format("YYYY-M-D") + '.zip'))
        .pipe(gulp.dest('archiver'));
});