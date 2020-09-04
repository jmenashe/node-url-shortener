import path from 'path';
import http from 'http';
import https from 'https';
import child_process from 'child_process';
import { parse as url_parse } from 'url';
import { promisify } from 'util';

import { tmpdir } from 'os';
import fs from 'fs-extra';
import UUID from 'pure-uuid';
import os from 'os';

async function make_tempfiles() {
  let paths = [];
  const directory = await make_tempdir();
  for(let i = 0; i < arguments.length; i++) {
    let filename = arguments[i];
    let p = path.join(directory, filename);
    paths.push(p);
  }
  return paths;
}

async function make_tempdir() {
  const id = new UUID(4).format();
  const directory = path.join(os.tmpdir(), id);
  await fs.mkdirs(directory);
  return directory;
}

function protoget(url, callback) {
    let urlinfo = url_parse(url);
    let get_handler = urlinfo.protocol == 'http:' ? http.get : https.get;
    let port = urlinfo.protocol == 'http:' ? 80 : 443;
    let options = {
        method: 'GET',
        host: urlinfo.hostname,
        port: urlinfo.port || port,
        path: `${urlinfo.pathname}${urlinfo.search || ''}`,
        protocol: urlinfo.protocol,
        json: true
    };
    return get_handler(options, callback);
}

function jsrequest(url) {
    return new Promise((resolve, reject) => {
        const req = protoget(url, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            var body = [];
            res.on('data', function(chunk) {
                body.push(chunk);
            });
            res.on('end', function() {
                try {
                    body = JSON.parse(Buffer.concat(body).toString());
                } catch(e) {
                    reject(e);
                }
                resolve(body);
            });
        });
        req.on('error', (e) => {
            reject(e.message);
        });
        // send the request
        req.end();
    });
}

function download_file(url,file_path) {
    return new Promise((resolve, reject) => {
        const file_handle = fs.createWriteStream(file_path);
        let urlinfo = url_parse(url);
        let get_handler = urlinfo.protocol == 'http:' ? http.get : https.get;
        const req = get_handler(url, (res) => {
            res.pipe(file_handle);
            file_handle.on('finish', function() {
                file_handle.close(resolve);  // close() is async, call cb after close completes.
            });
        });
        req.on('error', function(err) { // Handle errors
            fs.unlink(file_handle); // Delete the file async. (But we don't check the result)
            reject(err);
        });
        req.end();
    });
}


async function download_video(post_url) {
    await download_file('https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.js', `${process.env.HOME}/jquery_test_dl.js`);
    const tempfiles = await make_tempfiles('source_video.mp4', 'source_audio.mp4', 'merged.mp4');
    const data_url = post_url + '.json';

    const page_data = await jsrequest(data_url);
    const op_data = page_data[0].data.children[0].data;
    //const video_title = op_data.title;
    const video_url = op_data.media.reddit_video.fallback_url;
    const audio_url = video_url.replace(/DASH_\d+\.mp4/, 'DASH_audio.mp4');

    await download_file(video_url, tempfiles[0]);
    await download_file(audio_url, tempfiles[1]);
    
    const ffmpeg_command = `ffmpeg -y -i ${tempfiles[0]} -i ${tempfiles[1]} -c:v copy -c:a aac -strict experimental ${tempfiles[2]}`;
    child_process.exec(ffmpeg_command);
    console.log(`merged file at ${tempfiles[2]}`);
}
let post_url = 'https://www.reddit.com/r/WatchPeopleDieInside/comments/ij92ux/watch_the_little_innocent_hero_die_inside/';
download_video(post_url);
