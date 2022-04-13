const os = require("os");
const path = require('path');
const fs = require('fs');
const https = require('https');
const config = require('getconfig');
const { spawn } = require('child_process');

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0


function isCertificateValid() {
    return new Promise((resolve, reject) => {
        const cp = spawn("sh", ["-c", `openssl x509 -in /var/lib/lxd/server_.crt      -text   `]);

        cp.stdout.on('data', (data) => {
            console.log(`stdout  ${cp.spawnargs} : ${data}`);
        });
        var info
        cp.stderr.on('data', (data) => {
            console.error(`stderr   ${cp.spawnargs}: ${data}`);
            data = data.toString('utf8');
        
        info = info + data;
        });

        cp.on('close', (code) => {
            console.log(`  ${cp.spawnargs} child process exited with code ${code}`);
            resolve(JSON.parse(info))
        })
    })
}



isCertificateValid().then((responce) => {
    console.log(responce)
    
})