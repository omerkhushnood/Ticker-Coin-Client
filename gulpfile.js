'use strict';

var gulp = require('gulp'),
    config = require('./gulp.config')(),
    $ = require('gulp-load-plugins')({lazy: true}),
    del = require('del'),
    browserSync = require('browser-sync'),
    fs = require('fs')
;

//
// Starts browser-sync.
gulp.task('start-browser-sync', function(cb){

    browserSync({
        
        reloadDelay: 50,
        proxy: 'localhost:' + config.server.dev.port,
        port: 80,
        injectChanges: true
    });

    cb();
});

//
// Reloads browser.
gulp.task('reload-browser', function(cb){

    browserSync.reload();
    cb();
});

//
// Deletes build and temp folder.
gulp.task('clear', function(){

    return del([config.directories.build, config.directories.temp]);
});

//
// Compiles SASS files.
gulp.task('compile-sass', function(){

    return gulp.src(config.files.sass)
        .pipe($.wait(500))
        .pipe($.sass({outputStyle: 'compressed'}).on('error', $.sass.logError))
        .pipe($.autoprefixer({

            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest(config.directories.styles))
    ;
});

//
// Watches SASS files for changes.
gulp.task('watch-sass', ['compile-sass'], function(){

    gulp.watch(config.files.sass, ['compile-sass']);
});

//
// Injects script files in "index.html".
gulp.task('inject-scripts', function(){
    
    var scripts = gulp.src(config.files.scripts, {read: false});

    return gulp.src(config.files.indexHTML)
        .pipe($.inject(scripts, {relative: true}))
        .pipe(gulp.dest(config.directories.src))
    ;
});

//
// Injects css files in "index.html".
gulp.task('inject-styles', ['compile-sass'], function(){
    
    var styles = gulp.src(config.files.styles, {read: false});

    return gulp.src(config.files.indexHTML)
        .pipe($.inject(styles, {relative: true}))
        .pipe(gulp.dest(config.directories.src))
    ;
});

//
// Injects custom code files in "index.html".
gulp.task('inject-app-files', ['compile-sass', 'inject-styles', 'inject-scripts']);

//
// Watches custom script files for changes.
gulp.task('watch-app-scripts', ['start-browser-sync'], function(){

    var allScripts = config.files.scripts;
    gulp.watch(allScripts, ['inject-scripts']);
});

//
// Watches custom css files for changes.
gulp.task('watch-app-styles', ['start-browser-sync', 'compile-sass'], function(){

    gulp.watch(config.files.styles, ['reload-browser']);
});

//
// Watches index.html for changes.
gulp.task('watch-index-html', ['start-browser-sync', 'inject-app-files'], function(){

    gulp.watch(config.files.indexHTML, ['reload-browser']);
});

//
// Watches whole app for changes.
gulp.task('watch-app', [
    
    'start-browser-sync',
    'inject-app-files',
    'watch-app-scripts',
    'watch-app-styles',
    'watch-index-html'
]);

//
// Compiles app scripts, styles and library scripts, styles to build directory.
gulp.task('compile-app', ['clear', 'inject-app-files'], function(){

    // pixel codes.
    var googleSiteVerification = '',
        googleTagsManager = '',
        facebookPixelCode = '',
        googleTagsManagerNoscriptBody = '',
        googleAnalytics = '',
        hotjarTrackingCode = ''
    ;

    try{ googleSiteVerification = fs.readFileSync('./pixels/google-site-verification.html'); }
    catch(e){ googleSiteVerification = ''; }
    try{ googleTagsManager = fs.readFileSync('./pixels/google-tags-manager.html'); }
    catch(e){ googleTagsManager = ''; }
    try{ facebookPixelCode = fs.readFileSync('./pixels/facebook-pixel-code.html'); }
    catch(e){ facebookPixelCode = ''; }
    try{ googleTagsManagerNoscriptBody = fs.readFileSync('./pixels/google-tags-manager-noscript-body.html'); }
    catch(e){ googleTagsManagerNoscriptBody = ''; }
    try{ googleAnalytics = fs.readFileSync('./pixels/google-analytics.html'); }
    catch(e){ googleAnalytics = ''; }
    try{ hotjarTrackingCode = fs.readFileSync('./pixels/hotjar-tracking-code.html'); }
    catch(e){ hotjarTrackingCode = ''; }

    return gulp.src(config.files.indexHTML)
        .pipe($.injectString.replace('<!-- pixelCode:google-site-verification-code-meta -->', googleSiteVerification || ''))
        .pipe($.injectString.replace('<!-- pixelCode:google-tags-manager -->', googleTagsManager || ''))
        .pipe($.injectString.replace('<!-- pixelCode:facebook-pixel-code -->', facebookPixelCode || ''))
        .pipe($.injectString.replace('<!-- pixelCode:google-tags-manager-noscript-body -->', googleTagsManagerNoscriptBody || ''))
        .pipe($.injectString.replace('<!-- pixelCode:google-analytics -->', googleAnalytics || ''))
        .pipe($.injectString.replace('<!-- pixelCode:hotjar-tracking-code -->', hotjarTrackingCode || ''))
        .pipe($.useref({searchPath: config.directories.src}))
        .pipe($.if('*.js', $.uglify().on('error', (e)=>console.log(e))))
        .pipe($.if('*.css', $.csso()))
        .pipe($.if('*.js', $.rev()))
        .pipe($.if('*.css', $.rev()))
        .pipe($.revReplace())
        .pipe($.if('*.html', $.minifyHtml({empty: true})))
        .pipe(gulp.dest(config.directories.build))
    ;
});

//
// Copies images to build directory.
gulp.task('copy-images', ['clear'], function(){

    return gulp.src(config.files.images, {base: 'src'})
        .pipe(gulp.dest(config.directories.build))
    ;
});

//
// Copies fonts to build directory.
gulp.task('copy-fonts', ['clear'], function(){
    
    return gulp.src(config.files.fonts, {base: 'src'})
        .pipe(gulp.dest(config.directories.build))
    ;
});

//
// Creates new application build.
gulp.task('build', ['clear', 'compile-sass', 'inject-app-files', 'compile-app', 'copy-images', 'copy-fonts'], function(){

    return del(config.directories.temp);
});

//
// Initiates watchers and starts the development server.
gulp.task('serve-dev', ['watch-sass', 'inject-app-files', 'watch-app'], function(){

    $.connect.server(config.server.dev);
});

//
// Creates application build in build directory and starts a production server.
gulp.task('serve-build', ['build'], function(){

    $.connect.server(config.server.build);
});

//
// By default serve development server
gulp.task('default', ['serve-dev']);