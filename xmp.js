var fs = require('fs');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

exports.read = function(filename, cb){
    fs.readFile(filename, "utf8", function(openError, data){
        if (openError){
            cb("Could not read file: " + openError);
        } else {
            var doc = new dom().parseFromString(data);
            var xmlns = {
                "x": "adobe:ns:meta",
                "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
                "dc": "http://purl.org/dc/elements/1.1/",
                "xmp": "http://ns.adobe.com/xap/1.0/",
                "xapMM": "http://ns.adobe.com/xap/1.0/mm/",
                "darktable": "http://darktable.sf.net/",
                "lr": "http://ns.adobe.com/lightroom/1.0/"
            }
            var select = xpath.useNamespaces(xmlns);
            //var nodes = select("//rdf:RDF", doc);
            var nodes = select("//rdf:RDF/rdf:Description/dc:subject/rdf:Seq/rdf:li/text()", doc);
            debugger;
            var metadata = {};
            metadata['tags'] = [];
            nodes.forEach(function(node){
                metadata.tags.push(node.data);
            });
            cb(null, metadata);
        }
    });
};

/*exports.read('/media/dirk/7A9E98509E9806B3/dc/Nikon D3200/Flickr Uploads/VSA 2013/1-New York/DSC_0170.JPG.xmp', function(error, metadata){
    if (error){
        console.log("Could not read metadata: " + error);
    }
    else {
        console.log(metadata);
        console.log(metadata.tags);
    }
});*/
