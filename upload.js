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
        
        Q.fcall(function(){
            var tagDefer = Q.defer();
            xmp.read(filename + '.xmp', function(error, result){
                if (error){
                    deferred.notify('No tags for ' + filename);
                    tagDefer.resolve({'tags': null});
                }
                else {
                    deferred.notify('Tags loaded for ' + filename + ' ' + result.tags);
                    tagDefer.resolve(result);
                }
            });
            return tagDefer.promise;
        })
        .then(function(result){
            if (result.tags){
                return Q.nfapply(fup.uploadToFlickr, [filename, result.tags.join(',')]);
            }
            else {
                return Q.nfapply(fup.uploadToFlickr, [filename, null]);
            }
        })
        .then(function(result){
            deferred.notify('Uploaded ' + filename);
            return Q.nfapply(fup.addToPhotoset, [result.photoId, photoset]);
        })
        .then(function(result){
            deferred.notify('Added ' + filename + ' to photoset ' + photoset);
            return Q.nfapply(markUploaded, [filename]);
        })
        .then(function(result){
            deferred.resolve(result);
        })
        .catch(function(error){
            deferred.reject(error);
        })
        .done(); 
    });
    return deferred.promise;
}


var picRoot = "/media/dirk/7A9E98509E9806B3/dc/Nikon D3200/Flickr Uploads/"
//var picRoot = "/home/dirk/workspace/pice/test-data/";
glob(picRoot + "**/*.JPG", {}, function(er, files){
    var funcs = [];
    files.forEach(function(filename, index){
        funcs.push(function(){
            console.log('' + (1+index) + '/' + files.length);
            return syncToFlickr(filename);
            /*var def = Q.defer();
            def.resolve({});
            return def.promise;*/
        });
    });

    var trigger = Q.defer();
    var result = trigger.promise;
    funcs.forEach(function (f) {
        result = result.then(f);
    });
    result.then(function(res){
        console.log('Done with all');
    });
    result.progress(function(progress){
        console.log('Progress ' + progress);
    });
    trigger.resolve('Go');
});
