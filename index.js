var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');

app.engine('ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.get('/', function(req, res){

	var endpoint = "http://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC";
	
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
	  	  res.render('index', {imgUrl: imgUrl});
	  }
	});
});

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
