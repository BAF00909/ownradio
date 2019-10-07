document.addEventListener('DOMContentLoaded', function() {
    nvxInitJSFuncs();
}, false);

var token = null;


function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function getCookie(name) {
  var matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

function saveUid(uid){
	var date = new Date;
	date.setTime(date.getTime() + (60*24*60*60*1000));
	document.cookie = 'ownRadioId='+uid+'; expires='+date.toUTCString()+'; path=/';
	localStorage.setItem('ownRadioId', uid);
	sessionStorage.setItem('ownRadioId', uid);
	var deviceName = window.location.host + window.location.pathname + ', ' + browserInfo;
	var apiGetLastTracks = nvxOwnRadioServerUrl + '/devices/' + uid + '/' + deviceName.replace(/([\.$?*|{}\(\)\[\]\\\/\+^$])/g, '.') + '/registerdevice';
		var xhr = new XMLHttpRequest();
		xhr.open('GET', apiGetLastTracks, true);
		xhr.onreadystatechange = function(){
			if (xhr.readyState != 4) return;

			if(xhr.status == 200){
			}
		}
		xhr.send();
}

function loadUid(){
	var cookie = getCookie('ownRadioId'),
		local = localStorage.getItem('ownRadioId'),
		session = sessionStorage.getItem('ownRadioId'),
		uid = cookie || local || session || null;

	if( (!cookie || !local || !session) && uid){
		saveUid(uid);
	}

	return uid;
}

var ownRadioId = loadUid(),
	api = nvxOwnRadioServerUrl;//'https://api.ownradio.ru/v4';

if(!ownRadioId){
	ownRadioId = guid();
	saveUid(ownRadioId);
}

var apiNext = api+'/tracks/'+ownRadioId+'/next';

console.log('deviceId: '+ownRadioId);

function preloaderTrak(){//прелоадер трека
	var strTrackName = document.getElementById('radioName');
	var strTrackGroup = document.getElementById('radioGroup');

	strTrackName.innerHTML = 'Загрузка...';
	strTrackGroup.innerHTML = 'Загрузка...';

  var strTrackTime = document.getElementById('track-time');
  var strCurTime = document.getElementById('current-time');
  let elem = document.getElementById("myBar");
  elem.style.width = "0px";
  strTrackTime.innerHTML = "0:00";
  strCurTime.innerHTML = "0:00";
}


let flag;

function player(){


  if(flag == null){
    flag = true;
  }


	var obj = {
			play:document.querySelector('#radioPlay'),
			next:document.querySelector('#radioNext'),
			audio:document.createElement('audio'),
			name:document.querySelector('#radioName'),
			group:document.querySelector('#radioGroup'),
			time:document.querySelector('#track-time'),
			autoplay: true,
			muted: true
		},
		prm = {
			play:true,//состояние проигрывание/пауза
			nextTrack:null, //трек к проигрыванию
			waitNext:false, //ожидается получение информации о следующем файле
			ended:false, //файл проигрался до конца
			loadTrack:true, //трек только загружен (если да-инициализоровать audio, вывести инфу о треке)
			autoPlay: true,
			
		},
		fnc = {
			play: async function(){
				if(!prm.nextTrack && !prm.waitNext){
					fnc.nextTrack();
				} else if(!prm.nextTrack && prm.waitNext) {
					return;
				}
				if(prm.nextTrack){
				let playBut = document.getElementById('radioPause');
				let pauseBut = document.getElementById('radioPlayB');


				if(prm.loadTrack){
					prm.loadTrack = false;

					if(prm.play){
						prm.play = false;
						obj.audio.pause();
					}

					prm.ended = false;

					obj.name.innerHTML = prm.nextTrack.recname;
					obj.group.innerHTML = prm.nextTrack.artist;

            var strTrackTime = document.getElementById('track-time');
            var strCurTime = document.getElementById('current-time');
            let time;
            let width = 0;
            let curTime = 0;

            //ТАЙМЕР и ЗАГРУЗКА песни
            // obj.audio.addEventListener('seeked', function() {
            obj.audio.onloadedmetadata = function() {

			  time = obj.audio.duration + 5;

			  // Форматирование времени
			  function formatSecondsAsTime(time) {
				var hr  = Math.floor(time / 3600);
				var min = Math.floor((time - (hr * 3600))/60);
				var sec = Math.floor(time - (hr * 3600) -  (min * 60));
			  
				if (min < 10){ 
				  min = "0" + min; 
				}
				if (sec < 10){ 
				  sec  = "0" + sec;
				}
			  
				return min + ':' + sec;
			  }

              // //Изменение прогресса песни кликом
              // obj.audio.oncanplay = function() {
              //   jQuery('#radioProgress').click(function(event) {
              //
              //     let curWidth = document.getElementById('radioProgress').offsetWidth;
              //     let curXposition = document.getElementById('radioProgress').offsetLeft;
              //     let progressPosition = event.clientX;
              //
              //     let newPosition = ((progressPosition - curXposition) / curWidth) * 100;
              //
              //     width = newPosition;
              //     document.getElementById("myBar").style.width = newPosition + "%";
              //
              //     curTime = (time / 100) * newPosition;
              //
              //     trackTime();
              //
              //     obj.audio.currentTime = (time / 100) * newPosition;
              //
              //   });
              // };

              strTrackTime.innerHTML = formatSecondsAsTime(obj.audio.duration);
              strCurTime.innerHTML = "00:00";


              let elem = document.getElementById("myBar");


              let leftTime = time;
              let leng = time/100;
              window.bar_id = setInterval(frame, obj.audio.duration/10);

              function frame() {
                if(prm.play){
					let cTime = obj.audio.currentTime;
					let cDuration = obj.audio.duration;
					elem.style.width = (cTime+0.25)/cDuration*100 +'%';
					trackTime();
                  /*width += 0.01;
                  if(curTime < time) {
                    curTime += (leng/100);
                  }

                  trackTime();

                  if(width < 100) {
                    elem.style.width = width + '%';
                  }*/
                }
              }

            function trackTime() {
                leftTime = (Math.round(time) - Math.round(curTime));

                seconds = curTime % 60;
                minutes = (curTime - seconds)/60;
				strCurTime.innerHTML = formatSecondsAsTime(obj.audio.currentTime);
				//minutes + ":" + ("0" + Math.round(seconds)).slice(-2);//formatSecondsAsTime(obj.audio.currentTime);

                leftSeconds = leftTime % 60;
				leftMinutes = (leftTime - leftSeconds)/60;
				// время в секундах 
				function parseTime(s) {
					var c = s.split(':');
					return parseInt(c[0]) * 60 + parseInt(c[1]);
				 }
				 // Отсчет времени от начала проигрования трека до его конца
				let diffTime = parseTime(formatSecondsAsTime(obj.audio.duration)) - parseTime(formatSecondsAsTime(obj.audio.currentTime));
				strTrackTime.innerHTML = "-" + formatSecondsAsTime(diffTime);
				//"-" + leftMinutes + ":" + ("0" + Math.round(leftSeconds)).slice(-2);//formatSecondsAsTime(obj.audio.duration);
				
              }
            };
			
			obj.audio.src = await getTrack(prm.nextTrack.recid);

			// ОБРЕЗАЕМ ИМЯ ТРЕКА ДЛИННЕЕ 26 СИМВОЛОВ
			var strTrackName = document.getElementById('radioName');
			var cutTrackName = strTrackName.innerText;
			
			var slicedName = cutTrackName.slice(0,35);
			if (slicedName.length < cutTrackName.length) {
				slicedName += '...';
				obj.name.innerHTML = slicedName;
			}

			var strTrackGroup = document.getElementById('radioGroup');
			var cutTrackGroup = strTrackGroup.innerText;
			var slicedGroup = cutTrackGroup.slice(0,35);
			if (slicedGroup.length < cutTrackGroup.length) {
				slicedGroup += '...';
				obj.group.innerHTML = slicedGroup;
			}
			
			console.log('slicedGroup ' + slicedGroup);
			console.log('cutTrackName: ' + slicedName);
			console.log('play');
		}

		


		prm.play = !prm.play;

          if(prm.play){
            if(pauseBut != null && playBut != null) {
              pauseBut.style.display = "block";
              playBut.style.display = "none";
			}
			
			let audioPromise = obj.audio.play();
			// obj.audio.play возвращает promise поэтому без проверки будет ошибка и автовоспроизведения не будет
			audioPromise.then(_=> {
					obj.audio.play();
					obj.play.classList.add('pause');
			})
			.catch(error=>{
					obj.audio.pause();
					obj.play.classList.remove('pause');
					prm.play = false;
			})
			console.log(prm.play);
          }else{
            if(pauseBut != null && playBut != null) {
              pauseBut.style.display = "none";
			  playBut.style.display = "block";
            }
            obj.audio.pause();
            obj.play.classList.remove('pause');
          }

				}
			},
			next:function(){
				obj.audio.pause();// останавливаем воспроизведение, чтобы избежать проигрование текущего трека во время загрузки следующего
				if(!prm.nextTrack){
					prm.waitNext = true;
					fnc.nextTrack();
				}else{
					//если проигрывался трек - отдаем историю его прослушивания
					if(prm.nextTrack){
						var xhr = new XMLHttpRequest(),
							date = new Date,
							dateFormat = date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+date.getDate()+"T"+
										(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
										(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
										(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds()),
							//todo get userid by deviceid
							data =  JSON.stringify({"fields": 
								{"recid": guid(), "trackid": prm.nextTrack.recid, "deviceid": ownRadioId, "userid": ownRadioId, "lastlisten": dateFormat, "islisten": prm.ended?'1':'-1' },
									"method": "savehistory"});
									
						xhr.open("POST", api+'/api/executejs', true);
						xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
						xhr.setRequestHeader('Authorization', 'Bearer ' + getRdevAuthToken());
						preloaderTrak();
						xhr.onreadystatechange = function(){
							if (xhr.readyState != 4) return;
							if(xhr.status == 200){
								console.log('Данные о треке записаны в историю');
							}else{
								console.log('Ошибка отправки данных о треке.');

							}
						}
						xhr.send(data);
					}

					prm.waitNext = false;
					prm.nextTrack = null;
					fnc.play();
				}
			},
			ended:function(){
				prm.ended = true;
				prm.play = false;
				fnc.next();
			},
			nextTrack:function(){
				prm.waitNext = true;
					var xhr = new XMLHttpRequest(),
						data = JSON.stringify({"fields": 
								{"deviceid": ownRadioId, "ratio": 0},
									"method": "nexttrackbyratio"});
					xhr.open('POST', api + '/api/executejs', true);
					
					xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
					xhr.setRequestHeader('Authorization', 'Bearer ' + getRdevAuthToken());
					preloaderTrak();
					xhr.onreadystatechange = async function(){
						if (xhr.readyState != 4) return;

						if(xhr.status == 200){
							var response = JSON.parse(xhr.response);
							if (response != null && response != 'undefined') {
								
								prm.nextTrack = response.result[0];
							// if(!prm.nextTrack){
								//todo
								if (obj.name == null) {
									fnc.init();
								}
								
								if (obj.name != null) {
									obj.name.innerHTML = prm.nextTrack.recname;
									obj.group.innerHTML = prm.nextTrack.artist;
									obj.audio.src = await getTrack(prm.nextTrack.recid);
									console.log('src load');
								}
							prm.waitNext = false;
							
							prm.loadTrack = true;
							
              				clearInterval(window.bar_id);
							fnc.play();
							}
						}else{
							console.log('Ошибка получения данных с сервера.');
							console.log(xhr);
						}
					}
					xhr.send(data);
			},
			init: function() {
				obj = {
					play:document.querySelector('#radioPlay'),
					next:document.querySelector('#radioNext'),
					audio:document.createElement('audio'),
					name:document.querySelector('#radioName'),
					group:document.querySelector('#radioGroup')
				};
				if (obj.play != null) {
					obj.play.addEventListener('click', fnc.play);
					obj.play.addEventListener('click', function(){
						if(ga){
							ga('send', {
								hitType: 'event',
								eventCategory: 'Music',
								eventAction: 'play',
							  });
						}
					});
					obj.next.addEventListener('click', fnc.next);
					obj.audio.onended = fnc.ended;

					obj.name.addEventListener('click', function(){
						var data = prm.nextTrack;
						console.log(data);
					});
				}
				var nvxTxtUserID = document.getElementById('nvxTxtUserID');
				if(nvxTxtUserID != null)
					nvxTxtUserID.value = loadUid();

			}
		}

	fnc.init();
	if(prm.autoPlay){
		fnc.play();
	}

	return fnc;
}

var player = player();

	var usersRating = null,
		usersDevices = null,
		lastTracks = null,
		tracksHistory = null,
		lastDevices = null,
		countUsers = -1,
		countTracks = -1,
		deviceid = null,
		userId = null,
		test = null;


	function nvxInitJSFuncs(){
		// console.log(window.location.search);
		var params = getParam();

		for(var key in params){
			//console.log(key + 's ' + params[key]);
			if(key == 'type' && params[key] == 'listdevice')
					nvxGetLastDevices();

			if(key == 'type' && params[key] == 'listlastusers')
				if(params['limit'] != null){
					nvxGetLastUsers(params['limit']);
				} else{
					nvxGetLastUsers(-1);
				}

			if(key == 'type' && params[key] == 'listusers')
				if(params['userid']!=null){
					nvxGetUserDevices(params['userid']);
				}

			if(key == 'type' && params[key] == 'listtracks')
				if(params['deviceid'] != null){
					nvxGetTracksHistory(params['deviceid'], params['limit']);
				}

			if(key == 'type' && params[key] == 'listtrackswithrating')
				if(params['deviceid'] != null){
					nvxGetTracksHistoryWithRating(params['deviceid'], params['devicename'], params['limit']);
				}

			if(key == 'type' && params[key] == 'listlogs')
				if(params['deviceid'] != null){
					nvxGetLogsByDevice(params['deviceid'], params['devicename']);
				}

			if(key == 'type' && params[key] == 'listusersrating')
				if(params['limit'] != null){
					nvxGetUsersRating(params['limit']);
				} else{
					nvxGetUsersRating(-1);
				}
		}
	}


	function getParam(){
		var tmp = new Array();      // два вспомагательных
		var tmp2 = new Array();     // массива
		var param = new Array();

		var get = window.location.search;  // строка GET запроса
		if(get != '')
		{
			tmp = (get.substr(1)).split('&');   // разделяем переменные
			for(var i=0; i < tmp.length; i++)
			{
				tmp2 = tmp[i].split('=');       // массив param будет содержать
				param[tmp2[0]] = tmp2[1];       // пары ключ(имя переменной)->значение
			}
			var obj = document.getElementById('greq');  // вывод на экран

			return param;
			// for (var key in param)
			// {
				// console.log(key+param[key]);  // здесь мы получаем значение параметра
			// }
		}
	}
	/* Получение токена авторизации */
	function getRdevAuthToken(isAsync = false){
		
		var xhr = new XMLHttpRequest(),
			data = JSON.stringify({login: "admin", password: "2128506"});
		xhr.open("POST", api + '/auth/login', isAsync);
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
				var response = JSON.parse(xhr.response);
				token = response.token;
			}
		}
		xhr.send(data);
		return token;
	}
	
	async function getTrack(recid){
		let myHeaders = new Headers();
		myHeaders.append("Content-Type", "application/json;charset=UTF-8");
		myHeaders.append('Authorization', 'Bearer ' + getRdevAuthToken());
		var data = JSON.stringify({"fields": {"recid": recid}, "method": "gettrack", "resulttype": "filestream"});
		let myRequest = new Request(api + '/api/executejs');
		
		const response = await fetch(myRequest, {
			method: 'POST',
			headers: myHeaders, 
			body: data
		});
		const data1 = await response.blob();
		if (response.ok) {
			let objectURL = URL.createObjectURL(data1);
			return objectURL;
		} else {
			throw new Error('HTTP error, status = ' + response.status);
		}
	}
	
	//функция просмотра рейтинга пользователей по количеству своих треков и количеству полученных за последние сутки треков
	// function nvxGetUsersRating(countUsers) {
	// //	var countUsers = jQuery("#nvxTxtCountRows").val();
	// 	var apiUsersRating = api + '/statistics/usersrating/' + countUsers;
	// 	var xhr = new XMLHttpRequest();
	// 				xhr.open('GET', apiUsersRating, true);
	// 				xhr.onreadystatechange = function(){
	// 					if (xhr.readyState != 4) return;
  //
	// 					if(xhr.status == 200){
	// 						usersRating = JSON.parse(xhr.response);
  //
	// 					document.getElementById('nvxOwnradioSQLGetRequests').innerHTML = '<div id="nvxOwnradioSQLGetRequests"><h3>Рейтинг пользователей по количеству прослушанных треков и по количеству за последние сутки</h3><table id="nvxOwnradioSQLTableUsersRating" class="table table-bordered">    <thead>   <tr>     <th>№</th>       <th>userID</th>        <th>recName</th>        <th>recCreated</th>        <th>recUpdated</th>        <th>lastListenTracks</th>   <th>ownTracks</th>   </tr>    </thead>    <tbody></tbody></table> </div>';
  //
	// 					for(i=0;i<usersRating.length;i++) {
	// 							jQuery('#nvxOwnradioSQLTableUsersRating > tbody:last').append('<tr><td>'+(i+1)+'</td><td><a href="'+window.location.origin+window.location.pathname+ '?type=listusers&userid='+usersRating[i].userid+'">'+ usersRating[i].userid+' <a/> </td><td>'+usersRating[i].recname+'</td><td>'+usersRating[i].reccreated+'</td><td>'+usersRating[i].recupdated+'</td><td>'+usersRating[i].downloadtracks+'</td><td>'+usersRating[i].owntracks+'</td></tr>');
	// 								console.log(xhr);
	// 							}
	// 					}else{
	// 						console.log('Ошибка получения данных с сервера.');
	// 						console.log(xhr);
	// 					}
	// 				}
	// 				xhr.send();
	// }

	// //функция возвращает все устройства пользователя
	// function nvxGetUserDevices(userId) {
	// 	//var userId = jQuery("#nvxTxtUserID").val();
	// 	var apiGetUserDevices = api + '/statistics/' + userId + '/getuserdevices';
	// 	var xhr = new XMLHttpRequest();
	// 	xhr.open('GET', apiGetUserDevices, true);
	// 	xhr.onreadystatechange = function(){
	// 		if (xhr.readyState != 4) return;
  //
	// 		if(xhr.status == 200){
	// 			usersDevices = JSON.parse(xhr.response);//Object.assign({},JSON.parse(xhr.response));
  //
	// 			document.getElementById('nvxOwnradioSQLGetRequests').innerHTML = '<div id="nvxOwnradioSQLGetRequests"><h3>Устройства пользователя</h3><table id="nvxOwnradioSQLTableUserDevices" class="ownRadioTable">    <thead>       <tr>  <th>№</th>      <th>deviceId</th>        <th>recName</th>        <th>recCreated</th>        <th>recUpdated</th>        <th>userId</th>      </tr>    </thead>    <tbody></tbody></table> </div>';
  //
	// 			for(i=0;i<usersDevices.length;i++) {
	// 				var date = new Date();
	// 				var dateCreated, dateUpdated;
	// 				if(usersDevices[i].reccreated != null) {
	// 					date.setTime(usersDevices[i].reccreated);
	// 					dateCreated =  date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+(date.getDate()<10?'0'+date.getDate():date.getDate())+" "+
	// 									(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
	// 									(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
	// 									(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
	// 				} else{
	// 					dateCreated = null;
	// 				}
	// 				if(usersDevices[i].recupdated != null){
	// 					date.setTime(usersDevices[i].recupdated);
	// 					dateUpdated = date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+(date.getDate()<10?'0'+date.getDate():date.getDate())+" "+
	// 									(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
	// 									(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
	// 									(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
	// 				} else{
	// 					dateUpdated = null;
	// 				}
	// 					jQuery('#nvxOwnradioSQLTableUserDevices > tbody:last').append('<tr><td>'+(i+1)+'</td><td><a href="'+window.location.origin+window.location.pathname+ '?type=listtrackswithrating&deviceid='+usersDevices[i].recid+'&devicename='+usersDevices[i].recname+'&limit=100">'+ usersDevices[i].recid+'</td><td>'+usersDevices[i].recname+'</td><td>'+dateCreated+'</td><td>'+dateUpdated+'</td><td>'+usersDevices[i].user.recid+'</td></tr>');
	// 			}
	// 			console.log(xhr);
	// 		}else{
	// 			console.log('Ошибка получения данных с сервера.');
	// 			console.log(xhr);
	// 		}
	// 	}
	// 	xhr.send();
  //
	// }

	//функция просмотра последних выданных устройству треков
	// function nvxGetLastTracks(deviceId, countTracks) {
	// 	if(countTracks == null)
	// 		countTracks = -1;
	// 	var apiGetLastTracks = api + '/statistics/' + deviceId + '/' + countTracks + '/getlasttracks';
	// 	var xhr = new XMLHttpRequest();
	// 	xhr.open('GET', apiGetLastTracks, true);
	// 	xhr.onreadystatechange = function(){
	// 		if (xhr.readyState != 4) return;
  //
	// 		if(xhr.status == 200){
	// 			lastTracks = JSON.parse(xhr.response);//Object.assign({},JSON.parse(xhr.response));
  //
	// 			document.getElementById('nvxOwnradioSQLDevicesLastTracks').innerHTML = '<div id="nvxOwnradioSQLDevicesLastTracks"><h3>Выданные пользователю треки</h3><table id="nvxOwnradioSQLTableLastTracks" class="table table-bordered">    <thead>  <tr>  <th>№</th>          <th>trackID</th>        <th>title</th>  <th>artist</th>      <th>recCreated</th>        <th>recUpdated</th>        <th>methodid</th>     <th>txtrecommendinfo</th>  <th>userrecommend</th>   </tr>    </thead>    <tbody></tbody></table> </div>';
  //
	// 			for(i=0;i<lastTracks.length;i++) {
	// 				var date = new Date();
	// 				var dateCreated, dateUpdated;
	// 				if(lastTracks[i].reccreated != null) {
	// 					date.setTime(lastTracks[i].reccreated);
	// 					dateCreated =  date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+(date.getDate()<10?'0'+date.getDate():date.getDate())+" "+
	// 									(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
	// 									(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
	// 									(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
	// 				} else{
	// 					dateCreated = null;
	// 				}
	// 				if(lastTracks[i].recupdated != null){
	// 					date = date.setTime(lastTracks[i].recupdated);
	// 					dateUpdated = date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+(date.getDate()<10?'0'+date.getDate():date.getDate())+" "+
	// 									(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
	// 									(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
	// 									(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
	// 				} else{
	// 					dateUpdated = null;
	// 				}
	// 					jQuery('#nvxOwnradioSQLTableLastTracks > tbody:last').append('<tr><td>'+(i+1)+'</td><td>'+ lastTracks[i].track.recid +'</td><td>'+ lastTracks[i].track.recname +'</td><td>' + lastTracks[i].track.artist +'</td><td>'+dateCreated+'</td><td>'+dateUpdated+'</td><td>'+lastTracks[i].methodid+'</td><td>'+lastTracks[i].txtrecommendinfo+'</td><td>'+lastTracks[i].userrecommend+'</td></tr>');
	// 			}
	// 			console.log(xhr);
	// 		}else{
	// 			console.log('Ошибка получения данных с сервера.');
	// 			console.log(xhr);
	// 		}
	// 	}
	// 	xhr.send();
	// }

	//функция просмотра последних выданных устройству треков
	// function nvxGetTracksHistory(deviceId, countTracks, deviceName) {
	// 	if(countTracks == null)
	// 		countTracks = -1;
	// 	var apiTracksHistory = api + '/statistics/' + deviceId + '/' + countTracks + '/gettrackshistorybydevice';
	// 	var xhr = new XMLHttpRequest();
	// 	xhr.open('GET', apiTracksHistory, true);
	// 	xhr.onreadystatechange = function(){
	// 		if (xhr.readyState != 4) return;
  //
	// 		if(xhr.status == 200){
	// 			tracksHistory = JSON.parse(xhr.response);//Object.assign({},JSON.parse(xhr.response));
  //
	// 			document.getElementById('nvxOwnradioSQLGetRequests').innerHTML = '<div id="nvxOwnradioSQLGetRequests"><h3>История выданных устройству ' + deviceId + ' треков и их прослушивания</h3><br/><form name="nvxFormaLogs"><input type="button" onclick="return nvxBtnLogs(\''+deviceId+'\',\''+deviceName+'\')"  value="Просмотреть логи устройства"></form><table id="nvxOwnradioSQLTableLastTracks" class="table table-bordered">    <thead>     <tr>   <th>№</th>      <th>trackID</th>        <th>title</th>  <th>artist</th>      <th>recCreated</th>        <th>isListen</th>        <th>methodid</th>     <th>txtrecommendinfo</th>  <th>userrecommend</th>  <th>localdevicepathupload</th> </tr>    </thead>    <tbody></tbody></table> </div>';
  //
	// 			for(i=0;i<tracksHistory.length;i++) {
	// 				var date = new Date();
	// 				var dateCreated, dateUpdated;
	// 				if(tracksHistory[i].downloadTrack.reccreated != null) {
	// 					date.setTime(tracksHistory[i].downloadTrack.reccreated);
	// 					dateCreated =  date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+(date.getDate()<10?'0'+date.getDate():date.getDate())+" "+
	// 									(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
	// 									(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
	// 									(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
	// 				} else{
	// 					dateCreated = null;
	// 				}
	// 				if(tracksHistory[i].downloadTrack.recupdated != null){
	// 					date = date.setTime(tracksHistory[i].downloadTrack.recupdated);
	// 					dateUpdated = date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+(date.getDate()<10?'0'+date.getDate():date.getDate())+" "+
	// 									(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
	// 									(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
	// 									(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
	// 				} else{
	// 					dateUpdated = null;
	// 				}
	// 					jQuery('#nvxOwnradioSQLTableLastTracks > tbody:last').append('<tr><td>'+(i+1)+'</td><td>'+ tracksHistory[i].downloadTrack.track.recid +'</td><td>'+ tracksHistory[i].downloadTrack.track.recname +'</td><td>' + tracksHistory[i].downloadTrack.track.artist +'</td><td>'+dateCreated+'</td><td>'+/*dateUpdated+'</td><td>'+*/(tracksHistory[i].history != null ? tracksHistory[i].history.isListen : null) +'</td><td>'+tracksHistory[i].downloadTrack.methodid+'</td><td>'+tracksHistory[i].downloadTrack.txtrecommendinfo+'</td><td>'+tracksHistory[i].downloadTrack.userrecommend+'</td><td>'+tracksHistory[i].downloadTrack.track.localdevicepathupload+'</td></tr>');
	// 			}
	// 			console.log(xhr);
	// 		}else{
	// 			console.log('Ошибка получения данных с сервера.');
	// 			console.log(xhr);
	// 		}
	// 	}
	// 	xhr.send();
	// }
  //
	// //функция просмотра последних выданных устройству треков
	// function nvxGetTracksHistoryWithRating(deviceId, deviceName, countTracks) {
	// 	if(countTracks == null)
	// 		countTracks = -1;
	// 	var apiTracksHistoryWithRating = api + '/statistics/' + deviceId + '/' + countTracks + '/gettracksratingbydevice';
	// 	var xhr = new XMLHttpRequest();
	// 	xhr.open('GET', apiTracksHistoryWithRating, true);
	// 	xhr.onreadystatechange = function(){
	// 		if (xhr.readyState != 4) return;
  //
	// 		if(xhr.status == 200){
	// 			tracksHistory = JSON.parse(xhr.response);//Object.assign({},JSON.parse(xhr.response));
  //
	// 			document.getElementById('nvxOwnradioSQLGetRequests').innerHTML = '<div id="nvxOwnradioSQLGetRequests"><h3>История выданных устройству '+ decodeURI(deviceName) + " (" + deviceId + ') треков и их прослушивания</h3><br/><form name="nvxFormaLogs"><input type="button" onclick="return nvxBtnLogs(\''+deviceId+'\',\''+deviceName+'\')" value="Просмотреть логи устройства"></form><br/><table id="nvxOwnradioSQLTableLastTracks" class="table table-bordered">    <thead>   <tr>  <th>№</th>         <th>trackID</th>        <th>title</th>  <th>artist</th>      <th>recCreated</th>        <th>rating</th>    <th>lastListen</th>      <th>methodid</th>     <th>txtrecommendinfo</th>  <th>localdevicepathupload</th> <th>userrecommend</th>  </tr>    </thead>    <tbody></tbody></table> </div>';
  //
	// 			for(i=0;i<tracksHistory.length;i++) {
	// 				var date = new Date();
	// 				var dateCreated, dateUpdated, dateLastListen;
	// 				if(tracksHistory[i].downloadTrack.reccreated != null) {
	// 					date.setTime(tracksHistory[i].downloadTrack.reccreated);
	// 					dateCreated =  date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+(date.getDate()<10?'0'+date.getDate():date.getDate())+" "+
	// 									(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
	// 									(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
	// 									(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
	// 				} else{
	// 					dateCreated = null;
	// 				}
	// 				if(tracksHistory[i].downloadTrack.recupdated != null){
	// 					date.setTime(tracksHistory[i].downloadTrack.recupdated);
	// 					dateUpdated = date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+(date.getDate()<10?'0'+date.getDate():date.getDate())+" "+
	// 									(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
	// 									(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
	// 									(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
	// 				} else{
	// 					dateUpdated = null;
	// 				}
	// 				if(tracksHistory[i].rating != null){
	// 					date.setTime(tracksHistory[i].rating.lastlisten);
	// 					dateLastListen = date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+(date.getDate()<10?'0'+date.getDate():date.getDate())+" "+
	// 									(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
	// 									(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
	// 									(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
	// 				}else{
	// 					dateLastListen = null;
	// 				}
  //
	// 					jQuery('#nvxOwnradioSQLTableLastTracks > tbody:last').append('<tr><td>'+(i+1)+'</td><td>'+ tracksHistory[i].downloadTrack.track.recid +'</td><td>'+ tracksHistory[i].downloadTrack.track.recname +'</td><td>' + tracksHistory[i].downloadTrack.track.artist +'</td><td>'+dateCreated+'</td><td>'+/*dateUpdated+'</td><td>'+*/(tracksHistory[i].rating != null ? tracksHistory[i].rating.ratingsum : null) +'</td><td>'+ dateLastListen +'</td><td>'+tracksHistory[i].downloadTrack.methodid+'</td><td>'+tracksHistory[i].downloadTrack.txtrecommendinfo+'</td><td>'+tracksHistory[i].downloadTrack.track.localdevicepathupload+'</td><td>'+tracksHistory[i].downloadTrack.userrecommend+'</td></tr>');
	// 			}
	// 			console.log(xhr);
	// 		}else{
	// 			console.log('Ошибка получения данных с сервера.');
	// 			console.log(xhr);
	// 		}
	// 	}
	// 	xhr.send();
	// }
  //
	// //функция возвращает последние активные устройства
	// function nvxGetLastDevices() {
	// 	var apiGetLastDevices = api + '/statistics/getlastdevices';
	// 	var xhr = new XMLHttpRequest();
	// 	//var params = getParam();
	// 	//window.location.search = '';
	// 	xhr.open('GET', apiGetLastDevices, true);
	// 	xhr.onreadystatechange = function(){
	// 		if (xhr.readyState != 4) return;
  //
	// 		if(xhr.status == 200){
	// 			lastDevices = JSON.parse(xhr.response);//Object.assign({},JSON.parse(xhr.response));
	// 		//	window.location.search = 'type=listdevice';
	// 			document.getElementById('nvxOwnradioSQLGetRequests').innerHTML = '<div id="nvxOwnradioSQLGetRequests"><h3>Последние активные устройства</h3><table id="nvxOwnradioSQLTableLastDevices" class="table table-bordered">    <thead> <tr>        <th>№</th>     <th>deviceId</th>        <th>deviceName</th> <th>recCreated</th> <th>userId</th>   </tr>    </thead>    <tbody></tbody></table> </div>';
  //
	// 			for(i=0;i<lastDevices.length;i++) {
	// 				var date = new Date();
	// 				var dateCreated;
	// 				if(lastDevices[i].reccreated != null) {
	// 					date.setTime(lastDevices[i].reccreated);
	// 					dateCreated =  date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+(date.getDate()<10?'0'+date.getDate():date.getDate())+" "+
	// 									(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
	// 									(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
	// 									(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
	// 				} else{
	// 					dateCreated = null;
	// 				}
  //
  //
	// 				jQuery('#nvxOwnradioSQLTableLastDevices > tbody:last').append('<tr><td>'+(i+1)+'</td><td><a href="'+window.location.origin+window.location.pathname+ '?type=listtrackswithrating&deviceid='+lastDevices[i].recid+'&limit=100">'+  lastDevices[i].recid +'</a></td><td>'+ lastDevices[i].recname +'</td><td>'+ dateCreated +'</td><td><a href="'+window.location.origin+window.location.pathname+ '?type=listusers&userid='+lastDevices[i].user.recid+'"</a>'+lastDevices[i].user.recid+'</td></tr>');
	// 			}
	// 			console.log(xhr);
	// 		}else{
	// 			console.log('Ошибка получения данных с сервера.');
	// 			console.log(xhr);
	// 		}
	// 	}
	// 	xhr.send();
	// }
  //
	// //функция возвращает последниx активных пользователей
	// function nvxGetLastUsers(countTracks) {
	// 	if(countTracks == null)
	// 		countTracks = -1;
	// 	var apiGetLastUsers = api + '/statistics/getlastusers/' + countTracks;
	// 	var xhr = new XMLHttpRequest();
	// 	xhr.open('GET', apiGetLastUsers, true);
	// 	xhr.onreadystatechange = function(){
	// 		if (xhr.readyState != 4) return;
  //
	// 		if(xhr.status == 200){
	// 			lastUsers = JSON.parse(xhr.response);
	// 			document.getElementById('nvxOwnradioSQLGetRequests').innerHTML = '<div id="nvxOwnradioSQLGetRequests"><br/><h3>Последние активные пользователи</h3><table id="nvxOwnradioSQLTableLastDevices" class="table table-bordered">    <thead>      <tr>    <th>№</th>    <th>useridId</th>        <th>userName</th> <th>recCreated</th> <th>lastActive</th>  <th>owntracks</th> <th>downloadtracks</th> </tr>    </thead>    <tbody></tbody></table> </div>';
  //
	// 			for(i=0;i<lastUsers.length;i++) {
	// 				jQuery('#nvxOwnradioSQLTableLastDevices > tbody:last').append('<tr><td>'+(i+1)+'</td><td>'+'<a href="'+window.location.origin+window.location.pathname+ '?type=listtrackswithrating&deviceid='+lastUsers[i].userid+'&devicename='+ decodeURI(lastUsers[i].recname)+' &limit=100">'+lastUsers[i].userid +'</a></td><td>'+ lastUsers[i].recname +'</td><td>'+ lastUsers[i].reccreated +'</td><td>'+ lastUsers[i].lastactive +'</td><td>'+ lastUsers[i].owntracks +'</td><td>'+ lastUsers[i].downloadtracks +'</td></tr>');
	// 			}
	// 			console.log(xhr);
	// 		}else{
	// 			console.log('Ошибка получения данных с сервера.');
	// 			console.log(xhr);
	// 		}
	// 	}
	// 	xhr.send();
	// }
  //
	// //функция возвращает логи устройства
	// function nvxGetLogsByDevice(deviceId, deviceName) {
	// 	var apiGetLogs = api + '/statistics/getlogbydeviceid/' + deviceId;
	// 	var xhr = new XMLHttpRequest();
	// 	xhr.open('GET', apiGetLogs, true);
	// 	xhr.onreadystatechange = function(){
	// 		if (xhr.readyState != 4) return;
  //
	// 		if(xhr.status == 200){
	// 			logs = JSON.parse(xhr.response);
	// 			document.getElementById('nvxOwnradioSQLGetRequests').innerHTML = '<div id="nvxOwnradioSQLGetRequests"><h3> Логи устройства '+decodeURI(deviceName)+'('+deviceId+')</h3><table id="nvxOwnradioSQLTableLastDevices" class="table table-bordered">    <thead>      <tr>    <th>№</th>    <th>logId</th>        <th>logName</th> <th>deviceId</th> <th>recCreated</th> <th>recUpdated</th>   <th>request</th> <th>response</th></tr>    </thead>    <tbody></tbody></table> </div>';
  //
	// 			for(i=0;i<logs.length;i++) {
	// 				var date = new Date();
	// 				var dateCreated, dateUpdated, dateLastListen;
	// 				if(logs[i].reccreated != null) {
	// 					date.setTime(logs[i].reccreated);
	// 					dateCreated =  date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+(date.getDate()<10?'0'+date.getDate():date.getDate())+" "+
	// 									(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
	// 									(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
	// 									(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
	// 				} else{
	// 					dateCreated = null;
	// 				}
	// 				if(logs[i].recupdated != null){
	// 					date.setTime(logs[i].recupdated);
	// 					dateUpdated = date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+(date.getDate()<10?'0'+date.getDate():date.getDate())+" "+
	// 									(date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
	// 									(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
	// 									(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds())+'.'+date.getMilliseconds();
	// 				} else{
	// 					dateUpdated = null;
	// 				}
  //
	// 				jQuery('#nvxOwnradioSQLTableLastDevices > tbody:last').append('<tr><td>'+(i+1)+'</td><td>'+logs[i].recid+'</td><td>'+ logs[i].recname+'</td><td>'+ logs[i].deviceid+'</td><td>'+ dateCreated +'</td><td>'+ dateUpdated +'</td><td>'+ logs[i].logtext +'</td><td>'+ logs[i].response +'</td></tr>');
	// 			}
	// 			console.log(xhr);
	// 		}else{
	// 			console.log('Ошибка получения данных с сервера.');
	// 			console.log(xhr);
	// 		}
	// 	}
	// 	xhr.send();
	// }
  //
	// function nvxBtnLastUsers(){
	// 	window.location.search = "type=listlastusers&limit=200";
	// }
  //
	// function nvxBtnLastDevice(){
	// 	window.location.search = "type=listdevice";
	// }
  //
	// function nvxBtnUsersRating(){
	// 	window.location.search = "type=listusersrating&limit=200";
	// }
  //
	// function nvxBtnLogs(deviceId, deviceName){
	// 	window.location.search = 'type=listlogs&deviceid='+deviceId+'&devicename='+decodeURI(deviceName);
	// }
