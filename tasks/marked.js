'use strict';

module.exports = function (grunt) {
    const { marked } = require('marked');
    const async = require('async');
    const fs = require('fs');
    const os = require('os');
    const util = require('util');

    grunt.registerMultiTask("marked", "Runs marked plugin to render markdown files", function () {
        const done = this.async();
        const options = this.options({
            gfm: true,
            tables: true,
            breaks: false,
            pedantic: false,
            sanitize: true,
            smartLists: true,
            smartypants: false,
            highlight: true
        });
        const files = this.files;

        const { Renderer } = require('marked');
        if (!options.renderer) {
            options.renderer = new Renderer();
        }

        if (options.highlight) {
            const hljs = require('highlight.js');
            options.highlight = (code, language) => {
                const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
                return hljs.highlight(code, { language: validLanguage }).value;
            };
        }

        marked.setOptions(options);

        async.each(files, function (file, next) {
            const destination = file.dest;
            const sources = file.src.filter(path => {
                if (!fs.existsSync(path)) {
                    grunt.log.warn(util.format('Source file "%s" is not found', path));
                    return false;
                }
                return true;
            });

            async.map(sources, fs.readFile, function (err, contents) {
                if (err) {
                    grunt.log.error(util.format('Could not read files "%s"', sources.join(', ')));
                    return next(err);
                }

                grunt.file.write(destination, marked(contents.join(os.EOL)));
                grunt.verbose.writeln(util.format('Successfully rendered markdown to "%s"', destination));
                next();
            });

        }, function () {
            grunt.log.ok(files.length + ' ' + grunt.util.pluralize(files.length, 'file/files') + ' created.');
            done();
        });
    });
};
