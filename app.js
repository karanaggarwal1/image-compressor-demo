const app = require("express")();
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const upload = multer({
    dest: 'upload/'
});
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminGuetzli = require('imagemin-guetzli');
const imageminWebP = require('imagemin-webp');
const ex = require("exiv2");
const CWebp = require('cwebp').CWebp;
const easyimg = require("easyimage");

var fileName = "";

app.use(bodyParser.urlencoded({
    'extended': 'true'
}));

app.set("view engine", "ejs");

app.get("/", function(req, res) {
    console.log("App Started");
    res.render("landing");
});

function displaySize(fileName) {
    console.log(fileName);
    var stats = fs.statSync(fileName);
    console.log("File size:" + stats.size);
}

function removeMetadata() {
    return new Promise((resolve, reject) => {
        ex.getImageTags(fileName, function(err, data) {
            if (err) {
                console.error(err, err.stack);
                reject(err);
            } else {
                if (data != null) {
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
                } else {
                    console.log(fileName, "Doesn't contain metadata to be removed!");
                    resolve();
                }

            }
        });
    });
}

// app.post("/uploadG", upload.single('file'), function(req,res){
//     (async () => {
//         uploadAction(req,"guetzli").then(function(){
//             imagemin(['upload/guetzli/*.{png,jpg}'], 'build/images/guetzli', {
//                 use: [
//                     imageminGuetzli({quality: 84})
//                 ]
//             })
//             console.log('Images optimized');
//         }, function(err){
//             console.log(err, err.stack);
//         });

//     })();
// });

function compressImage(req){
    return new Promise((resolve, reject) => {
        (async () => {
            var extension = req.file.originalname.split('.');
            extension = extension[extension.length - 1];
            if (extension != "jpg") {
                if (validExtensions.includes(extension)) {
                    uploadAction(req, "webp").then(function() {
                        console.log("Compression log!");
                        console.log(fileName);
                        imagemin(['upload/webp/*.webp'], 'build/images/webp', {
                            use: [
                                imageminWebP({
                                    quality: 80
                                })
                            ]
                        })
                        // console.log('Images optimized');
                        resolve();
                    }, function(err) {
                        console.error(err, err.stack);
                        reject(err);
                    });
                } else if (rawFormats.includes(extension)) {
                    uploadAction(req, "webp").then(function(deletePath, newPath) {
                        fs.unlink(deletePath, function(err) {
                            if (err) {
                                console.error(err);
                                reject(err);
                            } else {
                                //file is placed in new path
                                //in webp format
                                console.log("Compression log!");
                                console.log(fileName);
                                imagemin(['upload/webp/*.webp'], 'build/images/webp', {
                                    use: [
                                        imageminWebP({
                                            quality: 80
                                        })
                                    ]
                                });
                                // console.log('Images optimized');
                                resolve();
                            }
                        });
                    }, function(err) {
                        console.error(err);
                        reject(err);
                    })
                }

            } else if (extension == "jpg") {
                uploadAction(req, "mozjpeg").then(function() {
                    imagemin(['upload/mozjpeg/*.jpg'], 'build/images/mozjpeg', {
                        use: [
                            imageminMozjpeg()
                        ]
                    })
                    // console.log('Images optimized');
                    resolve();
                }, function(err) {
                    console.error(err, err.stack);
                    reject(err);
                });
            }
        })();
    });
}

app.post("/upload", upload.single('file'), function(req, res) {
    compressImage(req).then(function(){
        console.log("Images Optimized");
        res.send("Images Optimized");
    }, function(err){
        console.log(err);
        res.send(err.stack);
    });
});

const validExtensions = ["jpg", "exif", "tiff", "gif", "bmp", "png", "webp"];

const rawFormats = [".3fr", ".ari", ".arw", ".bay", ".crw", ".cr2", ".cr3", ".cap", ".data",
    ".dcs", ".dcr", ".dng", ".drf", ".eip", ".erf", ".fff", ".gpr", ".iiq", ".k25", ".kdc", ".mdc", ".mef", ".mos", ".mrw", ".nef", ".nrw", ".obm", ".orf", ".pef", ".ptx",
    ".pxn", ".r3d", ".raf", ".raw", ".rwl", ".rw2", ".rwz", ".sr2", ".srf", ".srw",
    ".tif", ".x3f"
];

function simpleUpload(req, tempPath, pathname, extension) {
    return new Promise((resolve, reject) => {
        var path_val = "./upload/" + pathname + "/" + req.file.filename + "." + extension;
        fileName = path_val;
        var targetPath = path.resolve(path_val);

        fs.rename(tempPath, targetPath, function(err) {
            if (err) {
                console.log(err, err.stack);
                reject(err);
            } else {
                displaySize(targetPath);
                console.log("Upload completed!");
                removeMetadata().then(function() {
                    resolve();
                }, function(err) {
                    reject(err);
                });
            }
        });
    });
}

const preferredExtensions = ["webp", "jpg"];

function changeFormat(filePath) {
    return new Promise((resolve, reject) => {
        var encoder = new CWebp(filePath);
        console.log(filePath);
        fileName = filePath.split(".")
        fileName.pop();
        fileName = fileName.join(".");
        fileName = fileName.split("/");
        fileName = fileName[0] + "/webp/" + fileName[1];
        fileName = "./" + fileName + ".webp";
        console.log(fileName);
        encoder.quality(100);
        encoder.write(fileName, function(err) {
            if (err) {
                console.err(err, err.stack);
                reject();
            } else {
                console.log("File uploaded successfully!");
                fs.unlink(filePath, function(err) {
                    if (err) {
                        console.error(err);
                    } else {
                        resolve();
                    }
                })
            }
        });
    })

}

function changeName(path, extension) {
    return new Promise((resolve, reject) => {
        var new_name = path + "." + extension;
        fs.rename(path, new_name, function(err) {
            if (err) {
                console.error(err, err.stack);
                reject(err);
            } else {
                //file has been renamed, that is, made suitable for conversion
                changeFormat(new_name).then(function() {
                    resolve();
                }, function(err) {
                    reject(err);
                });
            }
        });
    });
}


function uploadAction(req, pathname) {
    return new Promise((resolve, reject) => {
        var tempPath = req.file.path;
        var extension = req.file.originalname.split(".");
        extension = extension[extension.length - 1];
        extension = extension.toLowerCase();
        if (validExtensions.includes(extension)) {
            if (preferredExtensions.includes(extension)) {
                console.log(req.file);
                simpleUpload(req, tempPath, pathname, extension).then(function() {
                    resolve();
                }, function(err) {
                    reject(err);
                });
            } else {
                //change format to webp
                changeName(tempPath, extension).then(function() {
                    removeMetadata().then(function() {
                        resolve();
                    }, function(err) {
                        reject(err);
                    });
                }, function(err) {
                    reject();
                });
            }
        } else {
            if (rawFormats.includes(extension)) {
                //raw image
                var rawName = "./" + req.file.path + "." + extension;
                var webpName = "./upload/webp/" + req.file.path.split("/")[1] + ".webp";
                easyimg.convert({
                        src: "./" + req.file.path,
                        dst: webpName,
                        quality: 100
                    },
                    function(err, stdout) {
                        if (err) {
                            console.error(err);
                            reject(err);
                        } else {
                            console.log("Conversion log!!");
                            console.log(stdout);
                            flag = true;
                            console.log("Image Converted!");
                            resolve("./" + req.file.path, webpName);
                        }
                    }
                );
            } else {
                //unsupported format file
                console.error("File format not supported!");
                reject("UnsupportedFormat");
            }


        }

    });

}

app.listen(3030, function() {
    console.log("Server Started");
});