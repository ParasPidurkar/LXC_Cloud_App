const os = require("os");
const path = require('path');
const fs = require('fs');
const https = require('https');
const config = require('getconfig');
const { spawn } = require('child_process');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0


function imagesInfo(ip = null) {
    return new Promise((resolve,reject) => {
        console.log(" imagesInfo ip = " + ip)
        var key = fs.readFileSync(path.join(os.homedir(), '.config', 'lxc', 'client.key'));
        var crt  = fs.readFileSync(path.join(os.homedir(), '.config', 'lxc', 'client.crt'))
        var options = {
            host: ip == null ? config.lxdImageServer.ip : ip,
            port: config.lxdImageServer.port,
            path: '/1.0/images',
            method: 'GET',
            key: key,
            cert: crt
        };

        console.log("options  = ")
        console.log(options)
        var images;

        var req = https.request(options, function (res) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            let data = '';

            res.on('data', (chunk) => {
                // console.log(chunk)
                data += chunk;
            });

            res.on('end', () => {
                console.log("ans =>")
                // console.log(typeof(data));
                console.log(JSON.parse(data));
                resolve(JSON.parse(data));

            });
        });

        req.on('error', function (e) {
            console.log('problem with request: ' + e.message);

        });

        req.end();
    })
}





function imagedelete(ip = null, fingerprint) {
    return new Promise((resolve,reject) => {
        console.log(" imagesInfo ip = " + ip)
        var key = fs.readFileSync(path.join(os.homedir(), '.config', 'lxc', 'client.key'));
        var crt  = fs.readFileSync(path.join(os.homedir(), '.config', 'lxc', 'client.crt'))
        var options = {
            host: ip == null ? config.lxdImageServer.ip : ip,
            port: config.lxdImageServer.port,
            path: `/1.0/images/${fingerprint}`,
            method: 'DELETE',
            key: key,
            cert: crt
        };

        console.log("options  = ")
        console.log(options)
        var images;

        var req = https.request(options, function (res) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            let data = '';

            res.on('data', (chunk) => {
                // console.log(chunk)
                data += chunk;
            });

            res.on('end', () => {
                console.log("ans =>")
                // console.log(typeof(data));
                console.log(JSON.parse(data));
                resolve(JSON.parse(data));

            });
        });

        req.on('error', function (e) {
            console.log('problem with request: ' + e.message);

        });

        req.end();
    })
}

imagesInfo("10.221.40.228").then((responce)=>{ console.log(responce)})
//
// imagedelete("10.221.40.228","03fbe15ab4cc561c8057f105e0f506859e2fa2bca5fea16730b90b0cd5d61af1").then((responce)=>{ console.log(responce)})