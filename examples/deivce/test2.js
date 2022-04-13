
const { spawn } = require('child_process');

var cmd = `lxc launch images:alpine/3.14 alp `
console.log(cmd)
var cp = spawn("sh", ["-c", cmd]);
// const cp = spawn(`lxc`, ["launch", `${config.lxdImageServer.name}:${message.formData.device}`, `${message.formData.containerName}`]);
console.log("Creating container")
cp.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
    console.log(`lxd_containerCreate_c stdout: ${data}`);
});

cp.stderr.on('data', (data) => {
    console.error(`lxd_containerCreate_c stderr: ${data}`);
});

cp.on('close', (code) => {
    console.log(`lxd_containerCreate_c child process exited with code ${code}`);

    
});