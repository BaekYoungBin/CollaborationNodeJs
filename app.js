var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session'),
	RedisStore = require('connect-redis')(session);
var index = require('./routes/index');
var app = express();
var http = require('http').Server(app);
var users = require('./routes/users');


var fs = require('fs');
var io = require('socket.io')(http);
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/mango');
var ObjectID = require('mongodb').ObjectID;
//image
var multer  = require('multer');
var memcount = 0;
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
var MemoryStore = session.MemoryStore,
    sessionStore = new MemoryStore();
app.use(cookieParser());
app.use(session({
  key:'sid', // 세션키
  secret: 'secret', // 비밀키
  cookie: {
  }
}));
app.use(express.static(path.join(__dirname, 'public')));
var sss;
app.use(function(req,res,next){
 sss = req.session;
//	console.log(sss);
  req.db = db;
  next();
});
app.use(multer({ dest:'/public/',rename: function(fieldname,filename){
 return filename;
}}));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

function Sockets(){
    this.sockets={};
};

Sockets.prototype.set = function(id, data) {
    this.sockets[id] = data;
};
Sockets.prototype.get = function(id, callback) {
    if (this.sockets[id] !== undefined) {
        callback(true,this.sockets[id]);
    } else {
        callback(false,this.sockets[id]);
    }
};


//console.log('connect?');
// socket network setting
io.on('connection', function(socket) {
//console.log('연결 되었습니다 !!!^^');
    var Project_Member = db.get('Project_Member');
    var Project_Message = db.get('Project_Message');
    var sockets = new Sockets();
   // console.log('app user connected');
    var User_Name = '';
  //console.log('조인이안데나?');
   socket.on('join', function (data) {
//console.log('조인됫다');
    memcount = memcount+1;
        var objectId = new ObjectID(data.Project_Id);
        User_Name = data.User_Name;
    console.log(User_Name);
        Project_Member.update({"Project_Id": objectId, "Member.Member_Name":User_Name},{$set :{ "Member.$.Member_Access": 'true'}});


      // 접속 유저 정보 보이기
        socket.join(objectId);
        sockets.set('room', objectId);
        sockets.get('room', function (err, room) {
		//console.log(room);
////////////////////////////////////////////////////////////
////////////////////////접속상태////////////////////////////

        Project_Member.col.aggregate({$match:{"Project_Id":objectId}},{$unwind:'$Member'},{$match:{"Member.Member_Access":'true'}},{$group:{"_id":'$_id',"Access_Member":{$push:'$Member.Member_Name'}}}, function (err, member) {
		//console.log('접속해있는사람명단');
		//console.log(member);
  

	                io.sockets.in(room).emit('Connect_Member', member);
                  io.sockets.in(room).emit('mem_count', memcount);
            });

Project_Member.findOne({"Project_Id":objectId,"Member.Member_Access":'false'},function(err,mem){
	//console.log('접속안한사람 멤버찾기');
	//console.log(mem);
	if(mem == null ) {
	//console.log('null 이어서 들어왓습니다');
	                io.sockets.in(room).emit('Disconnect_Member', mem);
 	} else {
	//console.log(mem);
           Project_Member.col.aggregate({$match:{"Project_Id":objectId}},{$unwind:'$Member'},{$match:{"Member.Member_Access":'false'}},{$group:{"_id":'$_id',"Access_Member":{$push:'$Member.Member_Name'}}}, function (err, member) {
	if(member == null ) {
	} else {
	//console.log('ddddd');
	//console.log(member);
	                io.sockets.in(room).emit('Disconnect_Member', member);
	}
            });
	}
  });


	Project_Message.find({"Project_Id": objectId}, function(err, data){
                if(err){
                   // console.log('이전메시지 출력실패');
                }  else {
                    for(var i = 0; i<data.length; i++){
                        io.sockets.in(room).emit('premessage',{NewJoin:User_Name, Member:data[i].Chat.Member, message:data[i].Chat.Message,Time:data[i].Chat.Time});
                    }
                   // console.log('이전 메시지 출력 성공');
                }
            });
        });
        //console.log('join success');
    });


    socket.on('getgreet', function (data) {
        sockets.get('room', function (err, room) {
	//console.log('접속자 출력하는부분');
	//console.log(data);
	//console.log(room);
	
            io.sockets.in(room).emit('putgreet', data);
        });
    });
socket.on('linesend', function(data){
  console.log(data);
  // 메시지를 liensend_toclient 메시지로 브로드캐스트
  socket.broadcast.emit('linesend_toclient', data);
 });
    socket.on('getmessage', function (msg) {
        sockets.get('room', function (err, room) {
		//console.log('message??');
		//console.log(msg);
	       Project_Message.insert({"Project_Id":room, "Chat": {"Member":msg.User_Name, "Message":msg.message,"Time":msg.Time}}, function(err, data){
                if(err){
                    conole.log('메시지 저장 에러');
                }
                else
                {	
                }
            });
            io.sockets.in(room).emit('putmessage', msg);
        });
    });

   socket.on('disconnect', function () {
		//console.log('disconnect 유저입니다');
        sockets.get('room', function (err, room) {
		//console.log('access값 false완료 ');
    memcount = memcount-1;
    io.sockets.in(room).emit('mem_count', memcount);
           Project_Member.update({"Project_Id": room, "Member.Member_Name":User_Name},{$set:{ "Member.$.Member_Access": 'false'}});
            Project_Member.col.aggregate({$match:{"Project_Id":room}},{$unwind:'$Member'},{$match:{"Member.Member_Access":'true'}},{$group:{"_id":'$_id',"Access_Member":{$push:'$Member.Member_Name'}}}, function (err, member) {
                io.sockets.in(room).emit('Connect_Member', member);
                //console.log('Connect_Member멤버보내기완료');
            });
            Project_Member.col.aggregate({$match:{"Project_Id":room}},{$unwind:'$Member'},{$match:{"Member.Member_Access":'false'}},{$group:{"_id":'$_id',"Access_Member":{$push:'$Member.Member_Name'}}}, function (err, member) {
	//console.log('?????????????????????????????????????');
	//console.log(member);
	if(member == null ){
	//console.log('a');
                io.sockets.in(room).emit('Disconnect_Member', member);
	} else {
	//console.log('b');
                io.sockets.in(room).emit('Disconnect_Member', member);
}
                //console.log('Disconnect_Member멤버보내기완료');
            });
        });
    });
});


app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});
http.listen(7070,function() {
  console.log('server 7070');
});

module.exports = app;
