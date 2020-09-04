import fs from 'fs';
import path from 'path';
import express from 'express';
import { promisify } from 'util';
import _ from 'underscore';

const 
    readdir = promisify(fs.readdir),
    lstat = promisify(fs.lstat),
    exists = promisify(fs.exists),
    app = express()
;

class Library {
    constructor(library) {
        if(_.isString(library))
            this.library_path = library;
        else if('path' in library)
            this.library_path = library.path;
        else throw 'No library path supplied.';
        this.directory = path.dirname(this.library_path);
        this.file = path.basename(this.library_path);
        let parser = null;
        if(this.file.endsWith('.min.js')) {
            this.is_minified = true;
            parser = /^(?<name>[\w-\.]+[a-zA-Z])(?:-(?<version>\d[\d\.]*\d))?\.min\.(?<extension>\w+)$/;
        } else {
            this.is_minified = false;
            parser = /^(?<name>[\w-\.]+[a-zA-Z])(?:-(?<version>\d[\d\.]*\d))?\.(?<extension>\w+)$/;
        }
        var match = this.file.match(parser);
        if(match == null) {
            throw 'Incorrect library naming format:' + this.library_path;
        }
        for(let key in match.groups) {
            this[key] = match.groups[key];
        }
        this.is_minified = Boolean(this.is_minified);
    }
    get path() {
        return this.library_path;
    }
}

class LibraryGroup {
    constructor(library) {
        if(_.isString(library)) {
            library = new Library(library);
        } else if(!(library instanceof Library)) {
            throw 'No library path supplied.';
        }
        this.name = library.name;
        this.version = library.version;
        this.extension = library.extension;
        this.include(library);
    }
    include(library) { 
        if(library.is_minified)
            this.minlib = library;
        else 
            this.maxlib = library;
    }
    select(is_minified) {
        let library = is_minified ? this.minlib : this.maxlib;
        if(library == null)
            library = is_minified ? this.maxlib : this.minlib;
        return library;
    }
}

class LibraryPack {
    constructor(libraries) {
        this.lookup = {};
        for(let library of libraries) {
            let libgroup = this.lookup[library.name];
            if(libgroup == null)
                this.lookup[library.name] = new LibraryGroup(library);
            else
                libgroup.include(library);
        }
        this.libraries = libraries;
        this.is_minified = false;
    }

    minify() {
        this.is_minified = true;
        return this;
    }
    maxify() {
        this.is_minified = false;
        return this;
    }
    *[Symbol.iterator]() { 
        for(let libgroup of Object.values(this.lookup)) {
            let library = libgroup.select(this.is_minified);
            yield library.path;
        }
    }
}

class LibraryBuilder {
    static class_initializer() {
        if(this.initialized)
            return;
        this.initialized = true;
        this.static_root = process.env.STATIC_ROOT;
    }

    static async static_libraries(root, extension) {
        this.class_initializer();
        let files = [];
        if (!await exists(root)){
            return files;
        }
    
        let entries = await readdir(root);
        for(let i = 0; i < entries.length; i++){
            let entry = path.join(root, entries[i]);
            let stat = await lstat(entry);
            if (stat.isDirectory()){
                let subfiles = await this.static_libraries(entry, extension);
                files = files.concat(subfiles);
            }
            else if (path.extname(entry) == extension) {
                let relative = path.relative(this.static_root, entry);
                let uri = '/' + relative.split(path.sep).join(path.posix.sep);
                files.push(uri);
            }
        }
        return files;
    }
    
    static async scripts() {
        this.class_initializer();
        let root = path.join(this.static_root, 'js', 'modules');
        let files = await this.static_libraries(root, '.js');
        let libraries = files.map(f => new Library(f));
        let pack = new LibraryPack(libraries);
        let paths = [];
        for(let path of pack)
            paths.push(path);
        return paths;
    }
    
    static async styles() {
        this.class_initializer();
        let root = path.join(this.static_root, 'public', 'styles');
        let files = await this.static_libraries(root, '.css');
        let libraries = files.map(f => new Library(f));
        let pack = new LibraryPack(libraries);
        let paths = [];
        for(let path of pack)
            paths.push(path);
        return paths;
    }
}

export default {
    scripts: LibraryBuilder.scripts.bind(LibraryBuilder),
    styles: LibraryBuilder.styles.bind(LibraryBuilder)
};