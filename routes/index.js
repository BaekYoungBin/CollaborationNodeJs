var express = require('express');
var router = express.Router();
var fs = require('fs');
var Time = require('date-utils');
var ObjectID = require('mongodb').ObjectID;
var multer  = require('multer');
var gcm = require('node-gcm');
var path = require('path');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport();
var util = require('util');
/* GET home page. */

/*First Page*/
router.get('/', function (req, res) {
  fs.readFile('index.html', function (error, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});

router.post('/SignIn',function(req, res) {

  var db = req.db;
  var userName = req.body.loginname;
  var userpassword = req.body.loginpassword;
  var collection = db.get('User');
  collection.findOne({ "User_Email" : userName,
    "User_Pass" : userpassword
  }, function (err,member) {
   if(member == null) {
    //console.log('a');
  } else {
   var collection2 = db.get('Project_Member');
   collection2.find({ "Member.Member_Id" : member._id}, function (err,memo) {
    if(memo == null) {  
    // console.log('nothing');
   } else{
   }
 });
	var dataform = JSON.stringify(member);
	var temp = JSON.parse(dataform);
	   req.session.User_Id = temp._id;
           req.session.User_Email = member.User_Email;
           req.session.User_Name = member.User_Name;
           req.session.User_Pass = userpassword;
           res.redirect("Project");
         }
       });
});


/* Sign Up */
router.post('/SignUp', function(req, res) {
    // Set our internal DB variable
    var db = req.db;
    // Get our form values. These rely on the "name" attributes
    var userName = req.body.username;
    var userEmail = req.body.useremail;
    var userpassword = req.body.userpassword;
    // Set our collection
    var collection = db.get('User');
    // Submit to the DB
    collection.insert({
      "User_Email" : userEmail,
      "User_Name" : userName,
      "User_Pass" : userpassword,
      "Access":'false'
    }, function (err, doc) {
      if (err) {
      }
      else {
//            res.location("/");
res.redirect("/");
}
});
  });
router.get('/Project', function (req, res) {
  fs.readFile('Project.html', function (error, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});
router.get('/showlist',function(req,res){
  //console.log(' list show ------------------------');
  var path=require('path');
  var dir=path.resolve(".")+'/public/files/'+req.session.Project_Id+'/';
 // var dir=__dirname+'/public/files/'+req.session.Project_Id;
  //fs.readdir(dir, function(err, list){
  //  if (err){ 
  //  console.log(err);
  //  }else{
  //      res.json(list);
   // }
//  //res.send(list);
var db = req.db;
var File = db.get('File');
File.find({"Project_Id":ObjectID(req.session.Project_Id)}, function(err, data){
  if( data == null ) {
   //console.log(' no data ' );
 } else {
  // console.log('파일 리스트 보여주기 ');
  //    console.log(data);
 res.send(data);
}
});
});

//router.get('/download:file(*)', function(req,res,next){
  router.get('/download/:id', function(req,res,next){
   //console.log('여기들어오니?');
   var path=require('path');
   var file=req.params.id;
  //var path=path.resolve(".")+'/public/files/'+file;
  var path=path.resolve(".")+'/public/files/'+req.session.Project_Id+'/'+file;
  res.download(path);
});

router.get('/ProjectAppend', function(req, res) {
  var db = req.db;
  var User_Email = req.session.User_Email;
  var User_Pass = req.session.User_Pass;
  var Project_Name = new Array();
  var Project_Id = new Array();
  var Project_DueDate = new Array();
  var Project_Memo = new Array();
  var Project_Progress = new Array();
  var Project_Work_Total_Count = new Array();
  var Work_Finish = new Array();  
  var Project=db.get('Project');
  var collection = db.get('User');
  var collection2 = db.get('Project_Member');
  collection.findOne({ "User_Email" : User_Email,
   "User_Pass" : User_Pass
 }, function (err,member) {
   if(member == null) {
   // console.log('false');
  }  else {
    collection2.find({ "Member.Member_Id" : member._id}, function (err,memo) {
      if(memo == null) {
        //console.log('없음');
      }
      else{	

       for(var i=0;i<memo.length;i++){
        var temp = (memo[i].Project_Dday).split('-');
        var a = new Date(temp[0],Number(temp[1])-1,temp[2]);
        var b = new Date(Date.today().getFullYear(),String(parseInt(Date.today().getMonth())+1),String(parseInt(Date.today().getDay())+1));
        Project_Name[i] = memo[i].Project_Name;
        Project_Id[i] = memo[i].Project_Id;
        Project_DueDate[i] =(a.getTime() - Date.today().getTime())/1000/60/60/24;
        Project_Memo[i] = memo[i].Project_Memo;
      }

      res.send({
        User_Email:req.session.User_Email,
        User_Name:req.session.User_Name,
        length:memo.length,
        Project_Name:Project_Name,
        Project_Id:Project_Id,
        Project_DueDate:Project_DueDate,
        Project_Memo:Project_Memo
      });
    }
  });
           }  //else 끝남
         });
});

/* Project Add */
router.post('/ProjectAdd', function (req,res) {

	var Project_Name = req.body.Project_Name;
	var Project_Dday = req.body.Project_Dday;
	var Project_Memo = req.body.Project_Memo;
	var User_Name =req.session.User_Name;
	var User_Email = req.session.User_Email;
	var db =req.db;
	var User = db.get('User');
	var Point_Item_Table = db.get('Point_Item_Table');
	User.findOne({"User_Name":User_Name,"User_Email":User_Email} , function (err,member){
    if(member == null ){
     //console.log('member error');
   } else {
     var Project = db.get('Project');
     Project.insert({"Project_Name": Project_Name , "Project_Dday":Project_Dday}, function (err,data) {
      if(data == null ) {
       //console.log(' project add error');
     } else {
       var Project_Member = db.get('Project_Member');
       Project_Member.insert({"Project_Id":data._id,"Project_Name":Project_Name,"Project_Dday":Project_Dday,"Project_Memo":Project_Memo,"Member":[{"Member_Id":member._id,"Member_Name":User_Name,"Member_Position":"captin","Member_Access":'false'}]} , function (err, doc){
         if(doc == null ) {
         // console.log('member add error'); 
        } else {
          Point_Item_Table.insert({"Project_Id":data._id,"User_Id":member._id,"Project_Work_Total_Count":'0',
            "Person_Work_Total_Count":'0',"Finish_Work_Count":'0',"Dday_Work_Count":'0',"Comment_Count":'0',
            "UpDown_Total_Count":'0',"UpDown_Person_Count":'0',"Person_Login_Count":'0',"Team_Login_Count":'0'}, function(err,suc){
             if(suc == null){

             } else {
              res.redirect("Project");
            }
          });
        }
      });
     }
   });
}
});
});
router.post('/Select_Project',function (req,res) {
  console.log('선택한프로젝트입니다');
  var User_Email = req.session.User_Email;
  var User_Name = req.session.User_Name;
  var Project_Id = req.body.Project_Id;
  var db =req.db;
  var User = db.get('User');

//console.log(req.body);
//console.log(Project_Id);

  User.findOne({"User_Name":User_Name,"User_Email":User_Email}, function (err,data) {
    if( data == null ) {
      //console.log('find error');
    } else {
      var Project_Member = db.get('Project_Member');
      Project_Member.findOne({"Project_Id":ObjectID(Project_Id)} ,function (err,member) {
        if(member == null){
          //console.log('no member');
        } else {
         req.session.Project_Id = member.Project_Id;
         req.session.Project_Name = member.Project_Name;
         req.session.Project_Dday = member.Project_Dday;
         req.session.User_Name = User_Name;
         req.session.User_Email = User_Email;
         res.send({Next:'Frame'});
       }
     });
    }
  });
});
router.get('/Frame', function (req, res) {
  fs.readFile('Frame.html','utf-8', function (error, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});

/* Task */
router.get('/Task', function (req, res) {
  fs.readFile('Task.html', function (error, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});

/* Task Add*/
router.post('/TaskNewAdd',function (req,res) {
  //console.log('업무추가버튼클릭하고 들어옴');
  var db = req.db;
  var Task_Name = req.body.Name;
  var Task_Sday = req.body.Sday;
  var Task_Dday = req.body.Dday;
  var Task_Person = req.body.Work_Person;
  var Person =JSON.parse(Task_Person);
  var Task_Memo = req.body.Memo;
  var Project_Work = db.get('Project_Work');
var Project_Member=db.get('Project_Member');
var Work_Comment=db.get('Work_Comment');
 //Work_Comment.insert({"Project_Id":ObjectID(req.session.Project_Id),"Work_Comment":{"Comment_User":null,"Comment":null}}); 
  Project_Work.insert({"Project_Id":ObjectID(req.session.Project_Id),"Project_Name":req.session.Project_Name,"Work_Name":Task_Name,"Work_Sday":Task_Sday,"Work_Dday":Task_Dday,"Work_Memo":Task_Memo,"Work_Finish":'false',"Work_Top":'480px',"Work_Left":'30px',"Work_Person" :Person} ,function(err,data){
    if(data  == null){
      //console.log('업무삽입실패')
    } else {
     //console.log('업무삽입되었음');
      Project_Member.col.aggregate({$match : {"Project_Id" :ObjectID(req.session.Project_Id)}} , {$unwind: '$Member'} , {$match : {"Member.Member_AppId": {"$not" : /null/ } } } ,{$group: {"_id" : '$_id'  , "AppId" : {$push: '$Member.Member_AppId'}}},function(err,app){
 // console.log('App length : ' + app.length);
  for(var i = 0; i <= app.length; i++){
  //console.log('ssssssssssssssssssssssssssssssssssssssssssssss몇번출력되니---------------------------------------');

  var message = new gcm.Message({
    collapseKey: 'PhoneGapDemo',
    delayWhileIdle: true,
    timeToLive: 3,
    data: {
      title:'업무가 생성되었습니다',
      message: Task_Name,
      msgcnt: 3
    }
  });
  //console.log('성공?');
  var sender = new gcm.Sender('AIzaSyAfFtt6_xASKM6nJMWO70Uh984TTSJ_BOI'); // 구글 프로젝트에 등록한 GCM 서비스에서 만든 server API key를 입력한다.
  var registrationIds = [];
  registrationIds.push(app[0].AppId[i]); 
  sender.send(message, registrationIds, 4, function (err, result) {
  });
}
       });

	res.send({suc:"suc"});
 //    res.redirect("Task");
   }
 });
});

router.get('/MyDataModify', function (req, res) {
  fs.readFile('MyDataModify.html', function (error, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});
router.get('/GetMyList',function(req,res){
	//console.log('get my list 들어왓어요');
var db = req.db;
var Project_Work = db.get('Project_Work');
Project_Work.col.aggregate({$match:{"Work_Person.User_Id":req.session.User_Id}},{$unwind:'$Work_Person'},{$match:{"Work_Person.User_Id":req.session.User_Id}},{$group:{"_id":'$Project_Name',"Work_Name":{$push:'$Work_Name'}}},function (err,data){
  if(!err){
    //console.log('유저 정보 데이터 보냅니다');	
    res.send(data);;
  }
  else

    console.log('error');
});
});
router.get('/GetUser',function(req,res){
	var db = req.db;
	var User = db.get('User');
	User.findOne({"_id":ObjectID(req.session.User_Id)},function(err,data){
		if(!err){
			res.send(data);
		}
	});
});
router.get('/getUserName',function(req,res){
	//console.log('이름알아가자');
	res.send({name:req.session.User_Name});
});
/*Task Init*/
router.get('/TaskAppend', function(req, res) {
	//console.log('업무 초기화 리로드');
  var db = req.db;
  var Project_Work = db.get('Project_Work');

  Project_Work.find({"Project_Id":ObjectID(req.session.Project_Id)} ,function(err,data){
    if(data  == null){
    // console.log('데이터없음');
   }  else {
     res.send(data);
   }
 });
});
router.get('/GetVote',function(req,res) {
	var db =req.db;
	var Vote = db.get('Vote');
	Vote.find({"Project_Id":ObjectID(req.session.Project_Id)}, function (err,data) {
		if(data == null ) {

		} else {	
			res.send(data);
		}

	});

});

router.post('/VoteDone',function(req,res){
	var id = req.body.id;
	var index = req.body.index;
	var db =req.db;
	var Vote = db.get('Vote');
	//console.log('들어오나요');
	Vote.update({"_id":ObjectID(id),"Vote_Num.opt":index},{ $inc : {"Vote_Num.$.num":1}});
	Vote.update({"_id":ObjectID(id)},{$pull :{"Vote_Member":req.session.User_Name}},{multi:true});
Vote.findOne({"Vote_Num.opt":index},function(err, dataa){
		res.send({ss:'ss'});
        });

});


//투표 추가버튼
router.post('/VoteAdd',function(req,res){
	var Vote_Name = req.body.Vote_Name;
	var Vote_Opt = req.body.Vote_Opt;
	var Vote_Num = req.body.Vote_Num;
	var Vote_Dday = req.body.Vote_Dday;
//	var Vote_Num = new Array();

	var opt =JSON.parse(Vote_Opt);
	var num = JSON.parse(Vote_Num);
	var abc = new Array();
	for (var i =0; i < opt.length; i ++) {
		var aa = new Object();
		aa.opt = opt[i];
		aa.num = num[i];
		abc.push(aa);		
	}
	var db = req.db;
	var Vote = db.get('Vote');
    var Project_Member = db.get('Project_Member');
    //console.log('여기까지만되는거야.');
Project_Member.col.aggregate({$match:{"Project_Id":ObjectID(req.session.Project_Id)}},{$unwind:'$Member'},{$group:{"_id":'$_id',"Member":{$push:'$Member.Member_Name'}}}, function (err, member) {
        if(member == null){
        res.send(member);
                        } else {
	Vote.insert({"Project_Id":ObjectID(req.session.Project_Id),"Vote_Name":Vote_Name,"Vote_Opt":opt,"Vote_Num":abc,"Vote_Dday":Vote_Dday,"Vote_Member":member[0].Member});
	res.send({suc:'suc'});
	}
	});



});
    
/*Task move save */
router.post('/Get_TaskData',function(req,res){
	//console.log('업무 데이터저장 ');
  var Work_Id = req.body.Work_Id;
  var x = req.body.x;
  var y = req.body.y;
  var db = req.db;
  var Project_Work = db.get('Project_Work');

  Project_Work.update({"_id":ObjectID(Work_Id)},{$set:{"Work_Top":y+'px',"Work_Left":x+'px'}});
});

router.post('/Delete_Label',function(req, res){
var Label_Id = req.body.Work_Id;
console.log('qq');
  var db = req.db;
  var Label = db.get('Project_Work_Label');
  Label.remove({"_id":ObjectID(Label_Id)});
console.log('삭제 완료');
res.send('10');
});


router.post('/Delete_TaskData',function(req, res){
  var Work_Id = req.body.Work_Id;
  var db = req.db;
  var Project_Work = db.get('Project_Work');
  console.log(Project_Work);
Project_Work.remove({"_id":ObjectID(Work_Id)});
console.log('삭제 완료');
res.send('10');
});

/*dbclick Task Update */
router.post('/Update_TaskData',function(req,res){
	//console.log(' 메모 업데이트 입니다 ');

  var Work_Id = req.body.Work_Id;
  var Name = req.body.Name;
  var Sday = req.body.Sday;
  var Dday = req.body.Dday;
  var Memo = req.body.Memo;
  var Finish = req.body.Finish;
  var Task_Person = req.body.Work_Person;
  var Person =JSON.parse(Task_Person);
  var db = req.db;
  var Project_Work = db.get('Project_Work');
  var Work_Comment = db.get('Work_Comment');
  console.log(ObjectID(Work_Id));
Project_Work.update({"_id":ObjectID(Work_Id)},{$set:{"Work_Name":Name,"Work_Sday":Sday,
  "Work_Dday":Dday,"Work_Person":Person,"Work_Memo":Memo,"Work_Finish":Finish}});
  Project_Work.findOne({"_id":ObjectID(Work_Id)},function(err,data){
    if(data == null){
      //console.log('no id');
    } else {
     Work_Comment.find({"Project_Work_Id":ObjectID(Work_Id)},function(err,com){
       if(com == null){

       } else {
        res.send(data);
      }
    });
   }
 });
});

/* Label */
router.get('/LabelAppend',function(req,res){
// console.log('라벨초기화');

 var db = req.db;
 var Label_DB = db.get('Project_Work_Label');

 Label_DB.find({"Project_Id":ObjectID(req.session.Project_Id)},function(err,data){
   if(data == null){
   //  console.log('no data');
   } else {
    res.send(data);
  }
});
});
/* Lavel add */
router.post('/LabelNewAdd',function(req,res){
	//console.log('라벨을 추가합시다');
 var db = req.db;
 var Label_Name = req.body.Label_Name;
 var Label = db.get('Project_Work_Label');

 Label.insert({"Project_Id":ObjectID(req.session.Project_Id),"Label_Name":Label_Name,"Label_Top":'440px',"Label_Left":'30px'},function(err,data){
   if(data == null){

   }  else {
	res.send({suc:'suc'});
  }
});
});
/* lavel move save */
router.post('/Get_LabelData',function(req,res){
  //console.log('라벨 위치저장 ');
  var Work_Id = req.body.Work_Id;
  var x = req.body.x;
  var y = req.body.y;
  var db = req.db;
  var Label = db.get('Project_Work_Label');
  Label.update({"_id":ObjectID(Work_Id)},{$set:{"Label_Top":y+'px',"Label_Left":x+'px'}});
});

/*dbclick Label Update */
router.post('/Update_LabelData',function(req,res){
  //console.log('더블클릭햇을때라벨 업로드');
  var Label_Id = req.body.Work_Id;
  var Label_Name =req.body.Label_Name;
  var db = req.db;
  var Label = db.get('Project_Work_Label');
  Label.update({"_id":ObjectID(Label_Id)},{$set : {"Label_Name":Label_Name}});
	res.send({suc:"suc"});
});


router.get('/form_memo', function (req, res) {
  fs.readFile('form_memo.html','utf-8', function (error, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});

router.get('/form_temp', function (req, res) {
  fs.readFile('form_temp.html','utf-8', function (error, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});

router.get('/File_Share',function (req, res) {
  fs.readFile('File_Share.html','utf-8', function (error ,data) {
    res.writeHead(200, { 'Content-Type':'text/html'});
    res.end(data);
  });
});

router.get('/form_fileshare', function (req, res) {
  fs.readFile('form_fileshare.html', function (error, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});
router.get('/Mypage', function (req, res) {
  fs.readFile('Mypage.html', function (error, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});
router.get('/Mindmap', function (req, res) {
  fs.readFile('board.html', function (error, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});
router.post('/MyProfile',function (req, res)  {
 router.use(multer({ dest:'./public/profilephoto/'}));
 //console.log(req.files.file);
 //console.log(req.files);
 //console.log(' 그래도 왔음 ');
 fs.readFile(req.files.file.path, function(err, data){
   var dirname = path.resolve(".")+'/public/profilephoto/';
    var newPath = dirname + req.session.User_Id +'.jpg';
   // console.log('저장될 경로: '+ newPath);
    fs.writeFile(newPath, data, function(err){
      if(err) {
        res.json("사진업로드 실패!");
      } else {
        //res.json("성공적으로 사진이 업로드 되었습니다.");
  res.redirect("Mypage");
      }
    });
  });
});
router.post('/MyEdit',function(req,res) {
	var User_Name = req.body.User_Name;
	var User_Pass = req.body.User_Pass;
	var New_Pass = req.body.New_Pass;
	var db = req.db;
	var User = db.get('User');

	if( User_Pass != req.session.User_Pass){
	 	res.send({suc:false});
	}

else {
		User.update({"User_Email":req.session.User_Email},{$set:{"User_Name":User_Name,"User_Pass":New_Pass}},function(err,data){
		if(data == null) {
			//console.log('수정실패');
		} else {
			res.send({suc:true});
		}
	   });
	}
});
router.get('/up', function (req, res) {
  fs.readFile('up.html', function (error, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});

router.get('/Calendar', function (req, res) {
  fs.readFile('Calendar.html', function (error, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});

router.post('/Cal_Modify', function(req, res){
  //console.log('달력에서 일정 수정하는 부분');
  var Work_Id = req.body.Work_Id;
  var Work_Sday = req.body.Work_Sday;
  var Work_Dday = req.body.Work_Dday;
  var db = req.db;
  var Project_Work = db.get('Project_Work');
  Project_Work.update({"_id":ObjectID(Work_Id)},{$set:{"Work_Sday":Work_Sday,"Work_Dday":Work_Dday}});
  res.send({suc:'next'});
});

router.post('/InitTaskData',function(req,res){
	var db = req.db;
	var Work_Id = req.body.Work_Id;
	var Project_Work = db.get('Project_Work');

	Project_Work.findOne({"_id":ObjectID(Work_Id)}, function(err, data) {
		if(data == null ) {

		} else {
			res.send(data);
		}
	});
});
router.post('/Calendar_Getdata', function(req, res){
  var Project_Id = req.body.Project_Id;
  var db = req.db;
  var Project_Work = db.get('Project_Work');
  //console.log('Project_Work_Db 접근');

  Project_Work.find({"Project_Id":ObjectID(Project_Id)}, function(err, data){
    if(!err){
      //console.log({"data":data.Work_Name, "Work_Finish":data.Work_Finish});
      res.send(data);
    }
  })
});
router.post('/Calendar_Modify', function(req, res){
  var Work_Id = req.body.Work_Id;
  var Work_Sday = req.body.Work_Sday;
  var Work_Dday = req.body.Work_Dday;
  var db = req.db;
  var Project_Work = db.get('Project_Work');
  Project_Work.update({"_id":ObjectID(Work_Id)},{$set:{"Work_Sday":Work_Sday,"Work_Dday":Work_Dday}});
  res.send({suc:'next'});
});




router.get('/Project', function (req, res) {
  fs.readFile('Project.html', function (error, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});

/* Member Add PopUp */
router.get('/MemberPopUp', function (req, res) {
  fs.readFile('MemberPopUp.html','utf-8', function (error, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});
/* Meber PopUp & Find */
router.post('/MemberFind', function (req,res) {
  var db = req.db;
  var User = db.get('User')
  var name;
  User.findOne({"User_Email":req.body.Member_Email} , function (err, data) {
    if( data == null ) {
     name = "";		
   } else {	
     name = data.User_Name;
   }
   res.send({Member_Name:name});
 });
});
  router.use(multer({ dest:'./public/profilephoto/'}));
/* Image upload */
router.post('/up123',function (req, res)  {
  //console.log(req.files.file);
  fs.readFile(req.files.file.path, function(err, data){
   var dirname = path.resolve(".")+'/public/profilesphoto/';
  //console.log(dirname);
 var newPath = dirname + req.files.file.originalname;
 // console.log(newPath);
 fs.writeFile(newPath, data, function(err){
  if(!err) {
  }
  res.send( 'Success upload files' );
});
});
});


/* upload */
router.post('/upload', function(req,res){
  router.use(multer({ dest:'./public/files/'+req.session.Project_Id+'/'}));
  //console.log(path);
  //console.log(req.files.drive);
  fs.readFile(req.files.drive.path, function(err, data){
   var dirname = path.resolve(".")+'/public/files/'+req.session.Project_Id+'/';
 //  var dirname = __dirname +'/images/';
 var newPath = dirname + req.files.drive.originalname;
 //console.log(newPath);
 var db =req.db;
 var File = db.get('File');
  //console.log('======================================');
  //console.log(Date.today().getFullYear());
  //console.log(Date.today().getMonth());
  //console.log(Date.today().getDay());
  //console.log(Date.today().getDate());
  var month = 0 + String(parseInt(Date.today().getMonth())+1);
 var today = Date.today().getFullYear()+'-'+month+'-'+Date.today().getDate();
 File.insert({"Project_Id":ObjectID(req.session.Project_Id),"File_Path":newPath,"File_Name":req.files.drive.originalname,"File_Size":req.files.drive.size,"File_Format":req.files.drive.extension,"File_Uploader":req.session.User_Name,"File_Date":today});
 fs.writeFile(newPath, data, function(err){
  if(err){
    res.json("Failed to upload your file");
  }else
  {
   res.redirect("File_Share");
       // res.json("Successfully uploaded your file");
     }
   });
});
});

router.get('/upload/:file', function(req,res){
  //console.log('여긴언제들어오지');
  var path=require('path');
  file = req.params.file;
  //console.log(file);
  var dirname = path.resolve(".")+'/public/files/'+req.session.Project_Id+'/';
  //  var dirname = __dirname +'/files/abc/';
  var img = fs.readFileSync(dirname + file);
  res.writeHead(200,{'Content-Type':'image/jpg'});
  res.end(img,'binary');
});

/* Member Add */
router.post('/MemberAdd', function (req,res) {
	//console.log('멤버 추가');
	var db = req.db;
	var User = db.get('User')
	User.findOne({"User_Email":req.body.Member_Email} , function (err, data) {
		if( data == null ) {
     // console.log('실패');
    } else {
      var Project = db.get('Project');
      Project.findOne({"Project_Name":req.session.Project_Name,"Project_Dday":req.session.Project_Dday}, function (err, pro) {
       if( pro == null ) {
        // console.log('프로젝트찾기실패');
       } else {
       //  console.log('프로젝트찾음');
         var Project_Member = db.get('Project_Member');
         Project_Member.update({"Project_Id":pro._id},{$push:{"Member":{"Member_Id":data._id,"Member_Name":data.User_Name,"Member_Position":"crew","Member_Access":'false'}}} , function (err,member) {
           if(member == null ) {
          //   console.log('멤버 저장 실패');
           } else {
           // console.log('멤버 저장되었습니다');
            res.send({suc:"true"});
          }
        });
       }
     });
    }
  });
});

/* Project Page to Init Data*/
router.get('/Get_ProjectData',function (req,res) {
  //console.log('get data project');
  res.send({
    User_Name:req.session.User_Name,
    User_Email:req.session.User_Email,
    Project_Id:req.session.Project_Id
  });
});

/* Project Out */
router.post('/ProjectDelete',function (req,res) {
 // console.log('Project Delete');
  var db = req.db;
  var User_Name = req.session.User_Name;
  var User_Email = req.session.User_Email;
  var Project_Id = ObjectID(req.body.Project_Id);
  var User = db.get('User');
  var Project_Work = db.get('Project_Work');
  var Project = db.get('Project');
  var Project_Member = db.get('Project_Member');
  var Work_Comment = db.get('Work_Comment');
  User.findOne({"User_Email":User_Email},function(err,user){
   if(user == null ){

   } else {

     Project_Member.col.aggregate({$match:{"Project_Id":Project_Id}},{$unwind:'$Member'},{$match:{"Member.Member_Id":user._id}},{$group:{"_id":'$_id',"User_Position":{$push:'$Member.Member_Position'}}}, function (err, position) {
       if(position == null ){

       } else {
        if(position[0].User_Position[0] == 'captin'){

          Work_Comment.remove({"Project_Id":Project_Id},function (err, data){

            if(data == null ){
             //console.log('no data');
           } else {
             Project_Work.remove({"Project_Id":Project_Id},function(err,pro){
               if(pro == null) {

               } else {
                Project_Member.remove({"Project_Id":Project_Id},function(err,form){
                 if(form == null ) {

                 } else {
                  Project.remove({"_id":Project_Id},function(err,suc){
                   if(suc == null ){

                   } else {
                    res.send({Next:'project'});
                  }
                });
                }
              });
              }
            });
           }
         });
        }	else {
		 //캡틴이 아닐떄 지우는 부분
		}
	}
});	
}
});
});
   
router.get('/Vote', function (req, res) {
  fs.readFile('Vote.html', function (error, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});
router.get('/GetMemberList',function(req,res){
	var db = req.db;
	var Project_Member = db.get('Project_Member');
Project_Member.col.aggregate({$match:{"Project_Id":ObjectID(req.session.Project_Id)}},{$unwind:'$Member'},{$group:{"_id":'$_id',"Member_Name":{$push:'$Member.Member_Name'},"Member_Id":{$push:'$Member.Member_Id'}}}, function (err, member) {
     //console.log('찾음');
	res.send(member);
   });
});         
router.get('/GetId',function(req,res){

	res.send({name:req.session.User_Id});
});
router.get('/GetCalendarList', function(req,res){
	//console.log('달력정보가져오는데에용');
	var db = req.db;
	var Project_Work = db.get('Project_Work');

	Project_Work.find({"Project_Id":ObjectID(req.session.Project_Id)},function(err,data){
		if(data == null){

		} else {

			res.send(data);
		}
	});

});
router.get('/DownloadProfile/:id', function (req, res) {
//console.log('down load ');
//	console.log(req);
/*	console.log(req.params);
	console.log(req.params.id);
	console.log(req.session.User_Id);*/
   var User_Id = req.params.id;
/*  console.log(path.resolve("."));*/
fs.exists(path.resolve(".")+'/public/profilephoto/'+User_Id+'.jpg',function(exists){
if(exists){
//console.log('존재');
 res.sendFile(path.resolve(".")+'/public/profilephoto/'+User_Id+'.jpg');
} else {
//console.log('없음');
res.sendFile(path.resolve(".")+'/public/profilephoto/default_image.jpg');
}
});
});
router.get('/MyImage', function (req, res) {
//console.log('down load ');
   var User_Id = req.session.User_Id;
  //console.log(path.resolve("."));
fs.exists(path.resolve(".")+'/public/profilephoto/'+User_Id+'.jpg',function(exists){
if(exists){
//console.log('존재');
 res.sendFile(path.resolve(".")+'/public/profilephoto/'+User_Id+'.jpg');
} else {
//console.log('없음');
res.sendFile(path.resolve(".")+'/public/profilephoto/default_image.jpg');
}
});
});
router.get('/Community', function (req, res) {
  fs.readFile('Community.html','utf-8', function (err, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});
router.post('/ClickList',function(req,res){
	 var id = req.body.id;
	req.session.Com = id;
	res.send({suc:'suc'});
});
router.get('/CommunityView',function(req,res){
	
	var db = req.db;
	var Community = db.get('Community');
	Community.findOne({"_id":ObjectID(req.session.Com)},function(err,data){
		if(data == null) {

		} else {
			res.send({suc:data});
		}
	});

});
router.post('/CommunityNewWrite',function(req,res){
	var title = req.body.title;
  title = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	var text = req.body.text;
  text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
	 var month = 0 + String(parseInt(Date.today().getMonth())+1);
	var today = Date.today().getFullYear()+'-'+month+'-'+Date.today().getDate();
	var User_Id =req.session.User_Id;
	var db = req.db;
	var Community = db.get('Community');

	Community.insert({"Title":title,"User_Name":req.session.User_Name,"User_Email":req.session.User_Email,"User_Point":'1',"Day":today,"Text":text});	
	res.redirect("Community");
});
router.get('/CommunityList',function(req,res){
  var db = req.db;
  var Community = db.get('Community');

  Community.find({},function(err,data){
    if(data == null ) {

    } else{

      res.send({suc:data});
    }
  });
});
router.get('/Community_Write', function (req, res) {
  fs.readFile('Community_Write.html','utf-8', function (err, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});
router.get('/Community_View', function (req, res) {
  fs.readFile('Community_View.html','utf-8', function (err, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});
router.get('/FindPassword', function (req, res) {
  fs.readFile('FindPassword.html','utf-8', function (err, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});
router.post("/GetComment", function (req, res) {	
	var Work_Id = req.body.Work_Id;
        var db = req.db;
        var Work_Comment = db.get('Work_Comment');
        Work_Comment.find({"Project_Id":ObjectID(req.session.Project_Id),"Project_Work_Id":ObjectID(Work_Id)},function(err,data){
        res.send(data);
        });
});

router.post("/CommentDelete", function (req, res) {
  var Work_Id = req.body.Work_Id;
  var Comment_Id = req.body.Comment_Id;
  var db = req.db;
  var Work_Comment = db.get('Work_Comment');

  Work_Comment.remove({"_id":ObjectID(Comment_Id)}, function(err,doc){
    if(!err){

	 Work_Comment.find({"Project_Id":ObjectID(req.session.Project_Id),"Project_Work_Id":ObjectID(Work_Id)},function(err,data){
        res.send(data);
        });
    }
  });
});

router.post("/CommentModify", function (req, res) {
  var Work_Id = req.body.Work_Id;
  var Comment_Id = req.body.Comment_Id;
  var text = req.body.text;
  var db = req.db;
  var Work_Comment = db.get('Work_Comment');

  Work_Comment.update({"_id":ObjectID(Comment_Id)},{$set:{"Comment":text}}, function(err,doc){
    if(!err){

         Work_Comment.find({"Project_Id":ObjectID(req.session.Project_Id),"Project_Work_Id":ObjectID(Work_Id)},function(err,data){
        res.send(data);
        });
    }
  });
});
router.post("/CommentAdd", function (req, res) {
        var Work_Id = req.body.Work_Id;
        var text = req.body.text;
        //console.log("Comment field");

        var db = req.db;
        var Work_Comment = db.get('Work_Comment');
        Work_Comment.insert({"Project_Id":ObjectID(req.session.Project_Id),"Project_Work_Id":ObjectID(Work_Id),"Comment_User":req.session.User_Name,"Comment":text},function(err,dataform){
                //console.log('update form');
 
        });
Work_Comment.find({"Project_Id":ObjectID(req.session.Project_Id),"Project_Work_Id":ObjectID(Work_Id)},function(err,data){

        res.send(data);
        });
});

router.post("/Comment", function (req, res) {
	var Work_Id = req.body.Work_Id;
	var text = req.body.text;
	var db = req.db;
	var Work_Comment = db.get('Work_Comment');
	
	Work_Comment.find({"Project_Id":ObjectID(req.session.Project_Id),"Project_Work_Id":ObjectID(Work_Id)},function(err,data){
	//console.log(data);
	res.send(data);
	});
});

router.post('/Email_Confirm', function(req,res){

var User_Email = req.body.User_Email;
var db = req.db;
var User = db.get('User');

User.findOne({"User_Email":User_Email}, function(err,data){
if(data == null){
	//console.log('일치 없다');
  res.send({suc:true});
}
else{
	//console.log(data);
  res.send({suc:false});
}
});
});
router.post('/Find_PW', function(req,res){
  var User_Email = req.body.User_Email;
  var User_Name = req.body.User_Name;
  var db = req.db;
  var User = db.get('User');
  User.findOne({"User_Email":User_Email, "User_Name":User_Name}, function(err, data){
    if(data == null)
    {
      //console.log(err);
      res.send({suc:false});
    }
    else{
     // console.log('비밀번호 찾기 성공');
     
      transporter.sendMail({
        from:"grouping6@gmail.com",
        to: User_Email,
        subject:"Grouping: 비밀번호 찾기 요청입니다.",
        text : "User_Email : "+ data.User_Email +"\nUser_Password : "+ data.User_Pass
      });
      res.send({suc:true});
    }
  });
});

router.get('/FindPassword', function (req, res) {
  fs.readFile('FindPassword.html','utf-8', function (err, data){
    res.writeHead(200, { 'Content-Type':'text/html' });
    res.end(data,'utf8');
  });
});

 
// 소켓 서버의 이벤트를 연결



module.exports = router;