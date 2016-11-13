var dotenv = require('dotenv').config();
var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var path = require('path');

app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.use(express.static('public'));

/*
* Route handlers
*/

var television = function(req, res) {
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
};

var battle = function (req, res) {
	MongoClient.connect(process.env.MONGO_URL, function(err, db) {
	  assert.equal(null, err);
  
	  var col = db.collection('messages');

	  col.find({}).sort({ created_at: -1}).limit(50).toArray(function(err, docs) {
	      assert.equal(null, err);
	      db.close();
		   
		  //console.log(docs);
		  return res.render('battle', { messages: docs.reverse()}); 
	  });
	});  
};

var favorites = function (req, res) {
	MongoClient.connect(process.env.MONGO_URL, function(err, db) {
	  assert.equal(null, err);
  
	  var col = db.collection('favorites');

	  col.find({}).sort({ created_at: -1}).toArray(function(err, docs) {
	      assert.equal(null, err);
	      db.close();
		   
		  //console.log(docs);
		  return res.render('favorites', { favorites: docs }); 
	  });
	}); 
};

var deleteFavorite = function (req, res) {
	MongoClient.connect(process.env.MONGO_URL, function(err, db) {
	  assert.equal(null, err);
  
	  var col = db.collection('favorites');

	  col.remove({_id: ObjectId(req.params.id) }, function(err, docs) {
	      assert.equal(null, err);
	      db.close();
		   
		  return res.redirect('/favorites');
	  });
	});  
};

/*
* Routes
*/

// implied main channel
app.get('/battle', battle);
app.get('/favorites', favorites);
app.get('/favorites/delete/:id', deleteFavorite);
app.get('/', television);

// user specified channel - unsupported until socket emits change to specify current channel
app.get('/:channel', television);
app.get('/:channel/battle', battle);
app.get('/:channel/favorites', favorites);
app.get('/:channel/favorites/delete/:id', deleteFavorite);


/*
* Socket.io listeners
*/

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
	 
     socket.on('getfavorite', function(msg){
   	 	console.log("getfavorite");
   	 	io.emit('getfavorite', msg);
     });
	 
     socket.on('gotfavorite', function(msg){
   	 	console.log("gotfavorite");
		
	 // save the image url (msg) to the favorites collection if not already there
   	 MongoClient.connect(process.env.MONGO_URL, function(err, db) {
   	   assert.equal(null, err);
	   
   	   db.collection('favorites').update( 
		   { "url" : msg },
		   { $set: {"url": msg, 'created_at': new Date()} },
		   { upsert: true },		
   	      function(err, result) {
   	        assert.equal(err, null);
   		    db.close();
   	   });
   	 });
		
   	 	io.emit('gotfavorite', msg);
     });
   
  socket.on('tag message', function(msg){
     console.log('tag message: ' + msg);
	 io.emit('tag message', msg);
	 
	 MongoClient.connect(process.env.MONGO_URL, function(err, db) {
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

/*
* Http server
*/

http.listen(process.env.HTTP_PORT, function(){
  console.log('listening on *:' + process.env.HTTP_PORT);
});
