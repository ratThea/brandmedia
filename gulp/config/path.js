import * as nodePath from "path";

const rootFolder  = nodePath.basename(nodePath.resolve()),
      srcFolder   = "./src",
      buildFolder = "./dist";

export const path = {
    build: {
        html: `${buildFolder}/`,
        css: `${buildFolder}/css/`,
        js: `${buildFolder}/js/`,
        images: `${buildFolder}/images/`,
        fonts: `${buildFolder}/fonts/`,
    },
    src: {
        html: `${srcFolder}/*.pug`,
        scss: `${srcFolder}/scss/style.scss`,
        js: `${srcFolder}/js/main.js`,
        images: `${srcFolder}/images/**/*.{jpg,jpeg,png,gif,webp,ico}`,
        svg: `${srcFolder}/images/**/*.svg`,
    },
    watch: {
        html: `${srcFolder}/**/*.pug`,
        scss: `${srcFolder}/scss/**/*.scss`,
        js: `${srcFolder}/js/**/*.js`,
        images: `${srcFolder}/images/**/*.{jpg,jpeg,png,gif,webp,ico,svg}`,
    },
    clean: buildFolder,
    buildFolder: buildFolder,
    srcFolder: srcFolder,
    rootFolder: rootFolder,
};