var flickr = require('flickr-with-uploads');
var config = require('config');
var fs = require('fs');

var get_api = function(){
    return flickr(
        config.get('FLICKR_API_KEY'), // consumer_key
        config.get('FLICKR_API_SECRET'), // consumer_secret
        config.get('FLICKR_ACCESS_TOKEN'), // oauth_token
        config.get('FLICKR_ACCESS_TOKEN_SECRET') // oauth_token_secret
    );
}


// Will create the photoset if it doesn't exist
exports.addToPhotoset = function(photoId, photosetTitle, callback) {
    var api = get_api();
    api({method: 'flickr.photosets.getList'}, function(err, response) {
        if (err){
            console.error(err);
            callback(err);
        } else {
            //console.log(response.photosets[0].photoset);
            var photosets = response.photosets[0].photoset;
            for (var i=0; i<photosets.length; ++i){
                //console.log(photosets[i].title);
                if (photosets[i].title == photosetTitle){
                    var photosetId = photosets[i]['$']['id'];
                    api({method: 'flickr.photosets.addPhoto', photoset_id: photosetId, photo_id: photoId}, function(err, response) {
                        if (err) {
                            callback(err);
                        }
                        else {
                            console.log('Added photo to photoset:' + photosetTitle);
                            callback(null, response);
                        }
                    });
                    return;
                }
            }

            api({method: 'flickr.photosets.create', title: photosetTitle, primary_photo_id: photoId}, function(err, response){
                if (err) {
                    callback(err);
                }
                else {
                    console.log('Created new photoset: ' + photosetTitle);
                    callback(null, response);
                }
            });
        }
    });
}

exports.uploadToFlickr = function(filePath, uploadCallback){

    var api = get_api();

    api({
        method: 'upload',
        //title: '',
        //description: '',
        is_public: 0,
        is_friend: 1,
        is_family: 1,
        content_type: 1,
        hidden: 2,
        photo: fs.createReadStream(filePath)
    }, function(err, response) {
        if (err) {
            console.error('Could not upload photo:', err);
            uploadCallback(err);
        }
        else {
            console.log('Uploaded photo ' + filePath);
            var newPhotoId = response['photoid'];
            uploadCallback(null, {'photoId': newPhotoId});
            //addToPhotoset(newPhotoId, uploadCallback);
        }
    });
};
