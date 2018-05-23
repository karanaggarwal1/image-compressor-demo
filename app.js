const app = require("express")();
const bodyParser= require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const upload = multer({ dest: 'upload/'});
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');


app.use(bodyParser.urlencoded({'extended':'true'}));

app.set("view engine", "ejs");

app.get("/", function(req,res){
    console.log("App Started");
    res.render("landing");
});

app.post('/upload', upload.single('file'), function (req, res) {
    var tempPath = req.file.path,
    targetPath = path.resolve('./upload/image.jpg');
    if (path.extname(req.file.originalname).toLowerCase() === '.jpg') {
        fs.rename(tempPath, targetPath, function(err) {
            if (err) throw err;
            console.log("Upload completed!");
        });
    } else {
        fs.unlink(tempPath, function () {
            if (err) throw err;
            console.error("Only .jpg files are allowed!");
        });
    }
    // var file = req.files.file;

    // console.log(file);

(async () => {
    await imagemin(['upload/*.jpg'], 'build/images', {
        use: [
            imageminMozjpeg()
        ]
    });

    console.log('Images optimized');
})();
console.log('Hello!');
});

app.listen(3030, function() {
    console.log("Server Started");
});