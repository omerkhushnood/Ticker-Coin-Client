'use strict';

module.exports = function(){

    var directories = {

        base: 'src/',
        build: 'build/',
        src: 'src/',
        temp: 'temp/',
        styles: 'src/assets/css/',
        sass: 'src/assets/scss/'
    };

    // Configurations START
    return {

        directories: directories,
        files: {

            scripts: ['src/assets/js/**/*.js'],
            styles: 'src/assets/css/**/*.css',
            sass: 'src/assets/scss/**/*.scss',
            images: 'src/assets/images/**/*',
            fonts: 'src/assets/fonts/**/*',
            indexHTML: 'src/index.html'
        },
        server: {

            dev: {
                
                name: 'Dev app',
                root: directories.src,
                port: 8080
            },
            build: {
                
                name: 'App build',
                root: directories.build,
                port: 3000
            }
        }
    };
    // Configurations END
};