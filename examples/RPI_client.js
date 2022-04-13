const { create } = require('domain')
const config = require('getconfig')
const fs = require('fs');
const { spawn } = require('child_process');
const io = require('socket.io-client')

let socketURL
if (config.server.secure) {
    socketURL = `https://${config.server.ip}:${config.server.port}`
} else {
    socketURL = `http://${config.server.ip}:${config.server.port}`
}

console.log(`socketURL => ${socketURL}`);

var client = io.connect(socketURL, { secure: true, "rejectUnauthorized": false });

client.on('connect', () => {
    console.log("Device connected ")
        // client.emit('register', config.myDeviceName, null)
    client.emit('joinFacenetDevice', {});
    client.emit('joinFacenetDeviceEnroll', {});

    // getStatusOfAllContainer();
})

client.on('Face-Enroll', function(msg1) {
    //console.log("NOTE\n\n")
    console.log("Log for Images  " + JSON.stringify(msg1))
    var firstName = JSON.stringify(msg1.data1);
    var lastName = JSON.stringify(msg1.data2);
    var img = JSON.stringify(msg1.data3);
    console.log("IMAGE" + img)
    if (img.toString() != "null") {
        console.log(img.toString())
        img = img.slice(1);
        img = img.slice(0, -1);
        firstName = firstName.slice(1);
        firstName = firstName.slice(0, -1);

        var data = img.replace(/^data:image\/\w+;base64,/, "");
        var buf = new Buffer.from(data, 'base64');
        var newpath = "/var/ai/enroll/" + firstName + ".jpg"

        // fs.writeFile('./public/images/ai/log/face/face.jpg', buf, err => {
        fs.writeFile(newpath, buf, err => {
            if (err) throw err;
            //console.log('Saved!');
        });
    }

})

client.on('updateImg', function(msg) {
    fs.writeFile('/var/ai/enroll/enroll.txt', '', function() { console.log('done') })
})


//TO-DO compare the images and send back the response
client.on('Face-Register', function(msg) {
    // console.log(" Facenet Register = " + JSON.stringify(msg.data));
    var img = JSON.stringify(msg.data);
    var pass = JSON.stringify(msg.data1)
    console.log("PassWord is " + pass)

    img = img.slice(1);
    img = img.slice(0, -1)
        //console.log("\n\n\nstoring this image URL"+img)
    var data = img.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer.from(data, 'base64');
    if (fs.existsSync('/var/log/face/face.jpg')) {
        fs.unlink('/var/log/face/face.jpg', (err) => {
            if (err) {
                throw err;
            }

            console.log("File is deleted.")
        });
    }

    fs.writeFile('/var/log/face/face.jpg', buf, err => {
        if (err)
            console.log(err);


        const match = spawn('./../../face_match/run.sh', []);
        match.stdout.on('data', (data) => {
            console.log(`match op:  ${data}`)
            console.log("USERID " + data)
            console.log("PASSWORD" + pass)
            client.emit('FaceIddata', { data: data, data1: pass, req: msg.req, res: msg.res })
        });
        //here need to do the face compare
        match.on('close', (data) => {

        });

    });

});


const pyth = spawn('./../../face_match/run-facedetect', []);

pyth.stdout.on('data', (data) => {
    console.log(`pyth stdout: ${data}`);


});

pyth.stderr.on('data', (data) => {
    console.error(`pyth stderr: ${data}`);

});
pyth.on('close', (code) => {

});



client.on('remove', message => {
    console.log(`removed : ${JSON.stringify(message)}`)
})

client.on('joined', message => {
    console.log(`joined : ${JSON.stringify(message)}`)
})

//TAg
client.on('faceMatching', message => {
    console.log(`face matching  :${JSON.stringify(message)}`)
})