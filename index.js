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
* Helper functions
*/

var getCurrentRoom = function(req)
{
	var room = (req.params.room !== undefined) ? req.params.room : 'main';
	
	return room;
}

/*
* Route handlers
*/

var television = function(req, res) {
	
	// use specified url param as img src
	if (req.query['url'])
	{
		var imgUrl = req.query['url'];
		return res.render('index', { imgUrl: imgUrl, room: getCurrentRoom(req) });
	}
	
	// get random image from giphy
	var endpoint = "http://api.giphy.com/v1/gifs/random?api_key=" + process.env.GIPHY_API_KEY;
	
	// for a given tag
	if (req.query['tag'])
	{
		endpoint +=  "&tag=" + req.query['tag'];
	}
	
	console.log(endpoint);
	
	request(endpoint, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		  var decoded = JSON.parse(body);
		  var imgUrl = decoded.data.image_url;
		  console.log(decoded.data.image_url);
	  	  return res.render('index', {imgUrl: imgUrl, room: getCurrentRoom(req) });
	  }
	});
};

var battle = function (req, res) {
	MongoClient.connect(process.env.MONGO_URL, function(err, db) {
	  assert.equal(null, err);
  
	  var col = db.collection('messages');

	  col.find({"room": getCurrentRoom(req) }).sort({ created_at: -1}).limit(50).toArray(function(err, docs) {
	      assert.equal(null, err);
	      db.close();
		   
		  //console.log(docs);
		  return res.render('battle', { messages: docs.reverse(), room: getCurrentRoom(req) }); 
	  });
	});  
};

var favorites = function (req, res) {
	MongoClient.connect(process.env.MONGO_URL, function(err, db) {
	  assert.equal(null, err);
  
	  var col = db.collection('favorites');

	  col.find({"room": getCurrentRoom(req) }).sort({ created_at: -1}).toArray(function(err, docs) {
	      assert.equal(null, err);
	      db.close();
		   
		  //console.log(docs);
		  return res.render('favorites', { favorites: docs, room: getCurrentRoom(req) }); 
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
		   
		  return res.redirect('/' + getCurrentRoom(req) + '/favorites');
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

// user specified room - unsupported until socket emits change to specify current room
app.get('/:room', television);
app.get('/:room/battle', battle);
app.get('/:room/favorites', favorites);
app.get('/:room/favorites/delete/:id', deleteFavorite);


/*
* Socket.io listeners
*/

io.on('connection', function(socket){
  console.log('a user connected');
  
  socket.on('room', function(room) {
  	socket.join(room);
  	console.log('joined room ' + room);
  });
  
  socket.on('disconnect', function(){
     console.log('user disconnected');
  });
  
  socket.on('reload', function(msg){
	 console.log("reload");
	 io.to(msg.room).emit('reload', { text: msg.text, room: msg.room });
   });
   
   socket.on('getsource', function(msg){
 	 console.log("getsource");
 	 io.to(msg.room).emit('getsource', { text: msg.text, room: msg.room });
    });
	
    socket.on('gotsource', function(msg){
  	 console.log("gotsource");
  	 io.to(msg.room).emit('gotsource', { text: msg.text, room: msg.room });
     });
	 
     socket.on('getfavorite', function(msg){
   	 	console.log("getfavorite");
   	 	io.to(msg.room).emit('getfavorite', { text: msg.text, room: msg.room } );
     });
	 
     socket.on('gotfavorite', function(msg){
   	 	console.log("gotfavorite");
		
		 // save the image url (msg) to the favorites collection if not already there
	   	 MongoClient.connect(process.env.MONGO_URL, function(err, db) {
	   	   assert.equal(null, err);
	   
	   	   db.collection('favorites').update( 
			   { "url" : msg.text, "room": msg.room },
			   { $set: {"url": msg.text, 'created_at': new Date(), "room": msg.room } },
			   { upsert: true },		
	   	      function(err, result) {
	   	        assert.equal(err, null);
	   		    db.close();
	   	   });
	   	 });
		
   	 	io.to(msg.room).emit('gotfavorite', { text: msg.text, room: msg.room } );
     });
   
  socket.on('tag message', function(msg){
     console.log('tag message: ' + msg.text + ' in ' + msg.room);
	 io.to(msg.room).emit('tag message', { "text": msg.text, "room": msg.room } );
	 
	 MongoClient.connect(process.env.MONGO_URL, function(err, db) {
	   assert.equal(null, err);
	   
	   db.collection('messages').insertOne( {   
	      		"message" : msg.text,
		   		"room": msg.room,
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

