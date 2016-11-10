var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/picroost';
var path = require('path');

app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', function(req, res){

	// use specified url param as img src
	if (req.param('url'))
	{
		var imgUrl = req.param('url');
		return res.render('index', {imgUrl: imgUrl});
	}
	
	// get random image from giphy
	var endpoint = "http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC";
	
	// for a given tag
	if (req.param('tag'))
	{
		endpoint +=  "&tag=" + req.param('tag');
	}
	
	console.log(endpoint);
	
	request(endpoint, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		  var decoded = JSON.parse(body);
		  var imgUrl = decoded.data.image_url;
		  console.log(decoded.data.image_url);
	  	  return res.render('index', {imgUrl: imgUrl});
	  }
	});
});

// route to emit messages and battle
app.get('/battle', function(req, res) {
	
	MongoClient.connect(url, function(err, db) {
	  assert.equal(null, err);
  
	  var col = db.collection('messages');

	  col.find({}).sort({ created_at: -1}).limit(50).toArray(function(err, docs) {
	      assert.equal(null, err);
	      db.close();
		   
		  //console.log(docs);
		  return res.render('battle', { messages: docs.reverse()}); 
	  });
	});  
	
});

io.on('connection', function(socket){
  console.log('a user connected');
  
  socket.on('disconnect', function(){
     console.log('user disconnected');
  });
  
  socket.on('reload', function(msg){
	 console.log("reload");
	 io.emit('reload', msg);
   });
   
   socket.on('getsource', function(msg){
 	 console.log("getsource");
 	 io.emit('getsource', msg);
    });
	
    socket.on('gotsource', function(msg){
  	 console.log("gotsource");
  	 io.emit('gotsource', msg);
     });
   
  socket.on('tag message', function(msg){
     console.log('tag message: ' + msg);
	 io.emit('tag message', msg);
	 
	 MongoClient.connect(url, function(err, db) {
	   assert.equal(null, err);
	   
	   db.collection('messages').insertOne( {   
	      		"message" : msg,
	   			"created_at" : new Date()
	      }, function(err, result) {
	        assert.equal(err, null);
		    db.close();
	   });
	  
	 });
	 
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
