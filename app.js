const app = require("express")();
const bodyParser= require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const upload = multer({ dest: 'upload/'});
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminGuetzli = require('imagemin-guetzli');
const imageminWebP = require('imagemin-webp');
const ex = require("exiv2");

var fileName = "";

app.use(bodyParser.urlencoded({'extended':'true'}));

app.set("view engine", "ejs");

app.get("/", function(req,res){
    console.log("App Started");
    res.render("landing");
});

function displaySize(fileName) {
    var stats = fs.statSync(fileName);
    console.log("File size:" + stats.size);
}

function removeMetadata(){
    return new Promise((resolve, reject) => {
        ex.getImageTags(fileName, function(err, data) {
            if (err) {
                console.log(err, err.stack);
                reject(err);
            } else {
                console.log("************************");
                console.log("Size with Metadata");
                displaySize(fileName);
                console.log("************************");
                var keys = Object.keys(data);
                var i = 0;
                var tags = {};
                keys.forEach(function(key) {
                    i++;
                    if (key.substring("Exif") != -1 || key.substring("Xmp") != -1) {
                        tags.key = "";
                    }
                });
                //tags contains all the metadata keys with data removed
                ex.setImageTags(fileName, tags, function(err) {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        //metadata removed;
                        console.log("*******************");
                        console.log("Size without Metadata");
                        displaySize(fileName);
                        console.log("*******************");
                        resolve();
                    }
                });
            }
        });
    });
}

app.post('/upload', upload.single('file'), function (req, res) {
    (async () => {
        uploadAction(req,"mozjpeg").then(function(){
            imagemin(['upload/mozjpeg/*.jpg'], 'build/images/mozjpeg', {
                use: [
                    imageminMozjpeg()
                ]
            })
            console.log('Images optimized');
        }, function(err){
            console.log(err, err.stack);
        });
        
    })();
});

app.post("/uploadG", upload.single('file'), function(req,res){
    (async () => {
        uploadAction(req,"guetzli").then(function(){
            imagemin(['upload/guetzli/*.{png,jpg}'], 'build/images/guetzli', {
                use: [
                    imageminGuetzli({quality: 84})
                ]
            })
            console.log('Images optimized');
        }, function(err){

        });
            
    })();
});

app.post("/uploadW", upload.single('file'), function(req,res){
    (async () => {
        uploadAction(req,"webp").then(function(){
            imagemin(['upload/webp/*.webp'], 'build/images/webp', {
                use:[
                    imageminWebP({quality:80})
                ]
            })
            console.log('Images optimized');
        }, function(err){
            console.log(err, err.stack);
        });
            
    })();
});

function uploadAction(req,pathname){
    return new Promise((resolve, reject) => {
        var tempPath = req.file.path;
        var extension = req.file.originalname.split(".");
        extension = extension[extension.length - 1];
        var path_val = "./upload/" + pathname + "/" + req.file.filename + "." + extension;
        fileName = path_val;
        targetPath = path.resolve(path_val);
        if (path.extname(req.file.originalname).toLowerCase() === '.jpg' || 
            path.extname(req.file.originalname).toLowerCase() === '.webp'){
            fs.rename(tempPath, targetPath, function(err) {
                if (err) {
                    console.log(err, err.stack);
                    reject(err);
                } else {
                    console.log("Upload completed!");
                    removeMetadata().then(function(){
                        resolve();
                    }, function(err){
                        reject(err);
                    });    
                }
            });
        } else {
            fs.unlink(tempPath, function () {
                if (err) {
                    console.log("Only .jpg  and .webp files are allowed!");
                    reject(err);
                }
            });
        }
    });
    
}

app.listen(3030, function(){
    console.log("Server Started");
});
