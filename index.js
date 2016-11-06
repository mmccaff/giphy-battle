var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');

app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');

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
	 res.render('battle');
});

io.on('connection', function(socket){
  console.log('a user connected');
  
  socket.on('disconnect', function(){
     console.log('user disconnected');
  });
   
  socket.on('tag message', function(msg){
     console.log('tag message: ' + msg);
	 io.emit('tag message', msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
