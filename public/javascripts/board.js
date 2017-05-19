var ctx;  // getContext 객체를 전역으로 선언
var socket;  // socket.io 전역 변수
$(document).ready(function(){
 ctx = $('#cv').get(0).getContext('2d');
 socket = io.connect('http://' + window.location.host);  // 객체 생성
 // window.location 객체에 url 정보 많음
 
 // 이벤트 핸들러 등록
 $('#cv').bind('mousedown', draw.start);
 $('#cv').bind('mousemove', draw.move);
 $('#cv').bind('mouseup', draw.end);
 $('#clear').bind('click', draw.clear);
 $('select').bind('change', shape.change);
 
 // 기본 모양 색상 설정
 shape.setShape();
 
 // 색상 선택 select box 설정
 for(var key in color_map){
  $('#pen_color').append('<option value="' + color_map[key].value + '">' + color_map[key].name + '</option>');
 }
 // 분필 굵기 설정
 for(var i = 1 ; i < 16 ; ++i ){
  $('#pen_width').append('<option value="' + i + '">' + i + '</option>');
 }
 
 // canvas data received
 socket.on('linesend_toclient', function (data) {
  draw.drawfromServer(data);
 });
});

// 라인의 색상, 굵기를 설정
var shape = {
  color : 'white' ,
  
  width : 3 ,
  
  change :function(){
   var color = $('#pen_color option:selected').val();
   var width = $('#pen_width option:selected').val();
   shape.setShape(color, width);
  } ,
  
  setShape : function(color, width) {
   // 파라미터가 있다면
   if(color != null){
    this.color = color;
   }
   if(width != null){
    this.width = width;
   }
   ctx.strokeStyle = this.color;
   ctx.lineWidth = this.width;
   
   // 펜 모양 부분
   ctx.clearRect(703, 0, 860, 90);
   ctx.beginPath();
   ctx.moveTo(320, 35);
   ctx.lineTo(360, 35);
   ctx.stroke();
  }
};
// 그리기부분 설정
var draw = {
  drawing : null ,
  
  start : function(e) {
   ctx.beginPath();
   ctx.moveTo(e.pageX, e.pageY);
   this.drawing = true;
   
   msg.line.send('start', e.pageX, e.pageY);
  } ,
  
  move : function(e) {
   if(this.drawing){
    ctx.lineTo(e.pageX, e.pageY);
    ctx.stroke();
    
    msg.line.send('move', e.pageX, e.pageY);
   }
  } ,
  
  end : function(e) {
   this.drawing = false;
   
   msg.line.send('end');
  } ,
  
  clear : function(){
   // 전체 지우기
   ctx.clearRect(0, 0, cv.width, cv.height);
   
   msg.line.send('clear');
  } ,
  
  drawfromServer : function(data) {
   if(data.type == 'start'){
    ctx.beginPath();
    ctx.moveTo(data.x, data.y);
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.width;
   }
   if(data.type == 'move'){
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
   }
   if(data.type == 'end'){}
   if(data.type == 'clear'){
    ctx.clearRect(0, 0, cv.width, cv.height);
    shape.setShape();
   }
  }
};
// 색상 배열
var color_map = [
                  {'value' : 'black' , 'name' : '검정색'} ,               
                 {'value' : 'red' , 'name' : '빨간색'} ,
                 {'value' : 'orange' , 'name' : '주황색'} ,
                 {'value' : 'yellow' , 'name' : '노란색'} ,
                 {'value' : 'blue' , 'name' : '파랑색'} ,
                {'value' : 'white' , 'name' : '지우개'}
                 ];

// 데이터 스키마: {'type':type , 'x':x, 'y':y, 'color':color, 'width':width}. type은 그리기 시작/중/종료. 나머지 속성은 그리기 시작/중 에만 필요하다
var msg = {
  line : {
   send : function(type, x, y) {
    socket.emit('linesend', {'type':type , 'x':x, 'y':y, 'color':shape.color, 'width':shape.width});1
   }
  }
}