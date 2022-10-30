"use strict";

import fonter from "gulp-fonter";
import converter from "gulp-ttf2woff2";

export const convertOTF = () => {
    return app.gulp.src(`${app.path.srcFolder}/fonts/**/*.otf`)
           .pipe(fonter({ formats: [ "ttf" ] }))
           .pipe(app.gulp.dest(`${app.path.srcFolder}/fonts/`)); 
};

export const covertTTF = () => {
    return app.gulp.src(`${app.path.srcFolder}/fonts/**/*.ttf`)
    .pipe(fonter({ formats: [ "woff" ] }))
    .pipe(app.gulp.src(`${app.path.srcFolder}/fonts/**/*.ttf`))
    .pipe(converter())
    .pipe(app.gulp.dest(`${app.path.srcFolder}/fonts/`))
};

export const buildFonts = () => {
    return app.gulp.src([`${app.path.srcFolder}/fonts/**/*.{ttf,woff,woff2}`])
    .pipe(app.gulp.dest(`${app.path.buildFolder}/fonts/`));
}