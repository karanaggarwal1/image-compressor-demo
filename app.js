const app = require("express")();
const bodyParser= require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const upload = multer({ dest: 'upload/'});
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminGuetzli = require('imagemin-guetzli');


app.use(bodyParser.urlencoded({'extended':'true'}));

app.set("view engine", "ejs");

app.get("/", function(req,res){
    console.log("App Started");
    res.render("landing");
});

app.post('/upload', upload.single('file'), function (req, res) {
    
    // var file = req.files.file;

    // console.log(file);

(async () => {

    uploadAction(req,"mozjpeg");

    await imagemin(['upload/mozjpeg/*.jpg'], 'build/images/mozjpeg', {
        use: [
            imageminMozjpeg()
        ]
    });

        console.log('Images optimized');
    })();
});


app.post("/uploadG", upload.single('file'), function(req,res){
    (async () => {

    uploadAction(req,"guetzli");

   imagemin(['upload/guetzli/*.{png,jpg}'], 'build/images/guetzli', {
    use: [
        imageminGuetzli({quality: 84})
    ]
    });

        console.log('Images optimized');
    })();
});




function uploadAction(req,pathname){
    var tempPath = req.file.path;
    console.log(req.file);
    targetPath = path.resolve("./upload/"+pathname+"/image"+req.file.filename+".jpg");
    if (path.extname(req.file.originalname).toLowerCase() === '.jpg' || 
        path.extname(req.file.originalname).toLowerCase() === '.png') {
        fs.rename(tempPath, targetPath, function(err) {
            if (err) throw err;
            console.log("Upload completed!");
        });
    } else {
        fs.unlink(tempPath, function () {
            if (err) throw err;
            console.error("Only .jpg  and .png files are allowed!");
        });
    }
}

app.listen(3030, function() {
    console.log("Server Started");
});