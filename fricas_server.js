// fricas_server.js (simple FriCAS REPL server using "express")
// Version 29-SEP-2020 (buffered)

// ===================
// User config section 
// ===================

const appname = 'fricas';
const args = '-nosman'
const serverport = 3010;
const client_html = '/fricas_client.html';
const app_prompt = ') -> ';
const regex_replace = /\(\d+\)\s\-\>\s/;
const node_modules_folder = 'node_modules';
const node_modules_url = '/static';
const welcome_message = 'Welcome to FriCAS';
const server_listen_msg = 'FriCAS Server listening on port ';

// Language specific init strings 
// If you want more, add further below.
// Do not forget '\n' at the end!
const initstr1 = '';
const initstr2 = '';
const initstr3 = '';




// -------------------------------------------
// Be careful when editing after this point !
// -------------------------------------------

const emit_output = 'jaxmate_output';
const socket_eval = 'jaxmate_eval';

// Spawning App
const { spawn } = require('child_process');
const repl = spawn(appname, [args]);


// Server
var port = serverport;
var clientHTML = client_html;
var dataID = '';

var http = require('http');
var express = require('express');
var app = express();

var server = http.createServer(app);

// Passing the http.Server instance to the listen method
var io = require('socket.io').listen(server);

var input = process.stdin.pipe(repl.stdin);

// Input init/end handling
// Input init/end handling
input.on(')quit', () => {console.log('Goodbye\n'); process.exit() });
input.write(')set output length 120\n'); 


// Initial writings (add more if necessary)
input.write(initstr1); 
input.write(initstr2);
input.write(initstr3);

// REPL on data event (response from interpreter)
// rtrim prompt
// buffering
var buf = '';
repl.stdout.on('data', (data) => {
  answer=data.toString();
  if (answer.endsWith(app_prompt)){
    answer = answer.replace(regex_replace, ''); 
    answer = buf.concat(answer); buf = '';
  } else {console.log(`** begin buffering:\n${answer}`); 
          console.log('** end buffering');
          buf = buf.concat(answer); answer = '';
  };
  console.log(`Out[${dataID}]:\n${answer}`);
  io.emit(emit_output, {id:dataID, data:answer});
});


// The server starts listening
server.listen(port);
console.log (welcome_message);
console.log(server_listen_msg + port.toString());

// Registering the route of your app that returns the HTML start file
app.get('/', function (req, res) {
    console.log("Registering app root.");
    res.sendFile(__dirname + clientHTML);
});

// Expose the node_modules folder as static resources 
// (to access socket.io.js in the browser)
// maybe path.join(__dirname, 'directory')
app.use(node_modules_url, express.static(node_modules_folder));


// Handling the connection
io.on('connection', function (socket) {
    //console.log(socket.handshake);  
    // a lot of data without .handshake
    console.log("Client X connected @");
	// on eval
    socket.on(socket_eval, function (data) {
        console.log('In['+data.id+']: ' + data.data);
        // send to repl process
        input.write(data.data+'\n'); 
        // push id
        dataID=data.id; 
        // --> client debug: data.id/data.data
        // socket.emit('pure_output',
		// {id:data.id, data:'pure_input:'+data.data});
});
    
    socket.on('disconnect', function(){console.log('Client disconnecting');});
});

