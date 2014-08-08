var glob = require('glob');
var fs = require('fs');
var Q = require('q');
var fup = require('./fup.js');

var xmp = function(filename, cb){
    fs.open(filename + ".xmp", "r", function(err, fd){
        if (err){
            cb(null)
        } else {
            console.log(fd);
            fs.read(fd, function(err, bytesRead, buffer){
                if (err) {
                    cb(null);
                }
                cb(data.toString().split('\n'));
            });
        }
    });
};

var ifUploaded = function(filename, thenCallback, elseCallback){
    fs.open(filename + ".up", "r", function(err, fd){
        if (err){
            elseCallback();
        }
        else {
            fs.close(fd);
            thenCallback();
        }
    });
}

var markUploaded = function(filename, callback){
    fs.open(filename + ".up", "a", function(err, fd){
        if (err){
            console.error('Could not create file ' + filename + '.up');
            callback(err);
        }
        else {
            var now = new Date();
            var buffer = new Buffer(now.toUTCString());
            fs.write(fd, buffer, 0, buffer.length, null, function(err, written, buffer){
                if (err){
                    console.error('Could not write to file ' + filename + '.up');
                    callback(err);
                }
                else {
                    callback(null, now);
                }
                fs.close(fd);
            });
        }
    });
}


var picRoot = "/media/dirk/7A9E98509E9806B3/dc/Nikon D3200/Flickr Uploads/"
glob(picRoot + "**/*.JPG", {}, function(er, files){
    var funcs = [];
    files.forEach(function(filename){
    //for (var i=0; i<files.length; ++i){
        funcs.push(function(){
            var deferred = Q.defer();
            ifUploaded(filename, function(){
                console.log(filename + ' already uploaded');
                deferred.resolve({});
            },
            function() {
                var photoset = filename.replace(picRoot, '').split('/').slice(0,-1).join(' - ');
                console.log('Uploading ' + filename + ' and adding to ' + photoset);
                fup.uploadToFlickr(filename, photoset, function (err, resp){
                    if (err){
                        deferred.reject(err);
                    }
                    else {
                        markUploaded(filename, function(err, result){
                            if (err){
                                deferred.reject(err);
                            }
                            else {
                                deferred.resolve({});
                            }
                        });
                    }
                }); 
            });
            return deferred.promise;
        });
    });

    var trigger = Q.defer();
    var result = Q(function(){return trigger.promise;});
    funcs.forEach(function (f) {
            result = result.then(f);
    });
    result.then(function(res){
        console.log('Done with all');
    });
    trigger.resolve('Go');
});
