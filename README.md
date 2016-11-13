# giphy-battle
Broadcast Giphy images to listeners using Socket.IO. This is just a prototype written during morning coffee to demonstrate
playing with Socket.IO and the Giphy API. To understand Socket.IO, the 'chat app' example provided on their web site is very
helpful and similar to what is being done here.

This is useful at the office if you have a television mounted on the wall and would like different people to be able
to remotely trigger changes of the Giphy displayed on the tv in realtime, without having to access the keyboard connected 
to the television. 

This is using Express.js as the web framework with EJS for templating. Data is persisted with mongodb.

# To install:
1. Clone the repo
2. npm install
3. Install mongodb locally 
4. node index.js

By default, the app listens on port 3000. Change if you'd like. 
You can use something like 'forever' if you'd like to keep it running.

# How to use:
There are a few routes:
* /
* /?tag=cats
* /?url=http://www.url.to/giphy.gif
* /battle

When the / route is loaded it initially displays a random image from Giphy and sizes it to take up the entire window. If
a tag parameter is provided, it will display a random image that has that tag. The page reloads every ten minutes with a
new random image from the set of all or the specified tag. If a url parameter is specified, that url will be loaded as the
image src.

The /battle route will accept user input of a tag value. On receiving a broadcast message via
Socket.IO, anyone viewing '/' will reload the window for the specified tag, thereby receiving
a different random image. To test this, you can load http://localhost:3000/ and http://localhost:3000/battle and use the battle
route to immediately change the image seen in the / route. You can also send a url to an image instead of a tag, and that will be 
loaded as the img src via the url param. Hitting ENTER will reload the current tag. A /s command will show you the current img src.
Rudimentary voting is implemented with /up and /down commands which increase or decrease the # of total votes show on the bottom right of the image. 
A score < -2 within a 10 minute period will reload a random image at /.

# Future features, bugs, etc:
* Have been moved to [Issues](https://github.com/mmccaff/giphy-battle/issues) Issues and [Project](https://github.com/mmccaff/giphy-battle/projects) in Github
