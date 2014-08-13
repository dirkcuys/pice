var glob = require('glob');
var fs = require('fs');
var Q = require('q');
var fup = require('./fup.js');
var xmp = require('./xmp.js');


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


var syncToFlickr = function(filename){
    var deferred = Q.defer();
    ifUploaded(filename, function(){
        console.log(filename + ' already uploaded');
        deferred.resolve({});
    },
    function() {
        var photoset = filename.replace(picRoot, '').split('/').slice(0,-1).join(' - ');
        console.log('Uploading ' + filename + ' and adding to ' + photoset);
        fup.uploadToFlickr(filename, function (err, resp){
            if (err) {
                deferred.reject(err);
            }
            else {
                fup.addToPhotoset(resp.photoId, photoset, function(err, result){
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
            }
        }); 
    });
    return deferred.promise;

}

//var picRoot = "/media/dirk/7A9E98509E9806B3/dc/Nikon D3200/Flickr Uploads/"
var picRoot = "/home/dirk/workspace/pice/test-data/";
glob(picRoot + "**/*.JPG", {}, function(er, files){
    var funcs = [];
    files.forEach(function(filename, index){
        funcs.push(function(){
            console.log('' + (1+index) + '/' + files.length);
            return syncToFlickr(filename);
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
