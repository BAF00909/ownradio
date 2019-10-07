(function() {

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

    console.log('deviceId: '+ ownRadioId );

    //создание экземпляра плеера.
    var AudioPlayer = ya.music.Audio;

    var dom = {
        player: document.querySelector(".ownRadioPlayer-min"),

        play: document.querySelector(".ownRadioPlayer-play"),

        nextTrack: document.querySelector(".ownRadioPlayer-nextButton"),

        progress: {
            bar: document.querySelector(".ownProgress-bar"),
            loaded: document.querySelector(".progress_loaded"),
            current: document.querySelector(".progress_current")
        },

        /*volume: {
            bar: document.querySelector(".volume"),
            value: document.querySelector(".volume_bar")
        },*/

        overlay: document.querySelector(".overlay"),

        trackName: document.querySelector('#radioName'),
        trackAuthor: document.querySelector('#radioGroup')
    };

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
        api = nvxOwnRadioServerUrl,//'https://api.ownradio.ru/v4';
        api5 = 'https://api.ownradio.ru/v5';

    if(!ownRadioId){
        ownRadioId = guid();
        saveUid(ownRadioId);
    }

    var apiNext = api+'/tracks/'+ownRadioId+'/next';

    // Предоставим плееру самому решать, какой тип реализации использовать.
    var audioPlayer = new AudioPlayer(null, dom.overlay);

    audioPlayer.initPromise().then(function() {
        // Скрываем оверлей, кнопки управления становятся доступными.
        dom.overlay.classList.add("overlay_hidden");
    }, function(err) {
        // Показываем ошибку инициализации в оверлее.
        dom.overlay.innerHTML = err.message;
        dom.overlay.classList.add("overlay_error");
    });

    // отображение статуса плеера.

    audioPlayer.on(ya.music.Audio.EVENT_STATE, function(state) {
        if (state === ya.music.Audio.STATE_PLAYING) {
            dom.player.classList.add("player_playing");
        } else {
            dom.player.classList.remove("player_playing");
        }
    });

    /*  шкала загрузки и шкала текущей позиции воспроизведения. */

    audioPlayer.on(ya.music.Audio.EVENT_PROGRESS, function(timings) {
        dom.progress.loaded.style.width = (timings.loaded / timings.duration * 100).toFixed(2) + "%";
        dom.progress.current.style.width = (timings.position / timings.duration * 100).toFixed(2) + "%";
    });

    /*шкала громкости*/
    /*var updateVolume = function(volume) {
        dom.volume.value.style.height = (volume * 100).toFixed(2) + "%";
    };
    audioPlayer.on(ya.music.Audio.EVENT_VOLUME, updateVolume);*/

    // Отображаем начальную громкость
   /* audioPlayer.initPromise().then(function() {
        updateVolume(audioPlayer.getVolume());
    });*/

    /* основные методы проигрователя */

    var preloaderTrack = function(){
        dom.trackName.innerHTML = 'Загрузка ...';
        dom.trackAuthor.innerHTML = 'Загрузка ...';
    }

    var currentTrack = null,
        trackPath = null,
        trackTimeexecute = null;



    var loadNewTrack = function() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', apiNext, true);
        preloaderTrack();
        xhr.onreadystatechange = function() {
            if (xhr.readyState != 4) return;
            if (xhr.status == 200) {
                var playNextTrack = JSON.parse(xhr.response);
                trackUrls[0] = api5 + '/tracks/' + playNextTrack.id ;
                dom.trackName.innerHTML = playNextTrack.name;
                dom.trackAuthor.innerHTML = playNextTrack.artist;
                currentTrack = playNextTrack;
                trackPath = playNextTrack.pathupload;
                trackTimeexecute = playNextTrack.timeexecute;
                console.log('upload path: ' + trackPath);
                console.log('time execute: ' + trackTimeexecute);
                startPlay();
                dom.play.classList.add('pause');
            }else{
                console.log(xhr.status);
            }
        }
        xhr.send();
    };



    var trackUrls = [];
    var status = null;

    loadNewTrack();


    var trackIndex = 0;

    var startPlay = function() {
        var track = trackUrls[trackIndex];

        if (audioPlayer.isPreloaded(track)) {
            audioPlayer.playPreloaded(track);
        } else {
            audioPlayer.play(track);
        }
    };

    dom.play.addEventListener("click", function() {
        var state = audioPlayer.getState();
        switch (state) {
            case ya.music.Audio.STATE_PLAYING:
                audioPlayer.pause();
                dom.play.classList.remove('pause');
                break;

            case ya.music.Audio.STATE_PAUSED:
                audioPlayer.resume();
                dom.play.classList.add('pause');
                break;

            default:
                startPlay();
                dom.play.classList.add('pause');
                break;
        }
    });
    dom.nextTrack.addEventListener('click',function(){
        status = false;
        saveHistory(status);
        audioPlayer.stop();
        loadNewTrack();
        audioPlayer.setPosition(0);
        audioPlayer.play();
    });

    function saveHistory(status){
        var xhr = new XMLHttpRequest(),
            date = new Date,
            dateFormat = date.getFullYear()+'-'+(date.getMonth()<9?'0'+(date.getMonth()+1):date.getMonth()+1)+'-'+date.getDate()+"T"+
                (date.getHours()<10?'0'+date.getHours():date.getHours())+':'+
                (date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+
                (date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds()),
            data = new FormData();
        data.append('islisten',(status?'1':'-1'));
        data.append('lastlisten',dateFormat);
        xhr.open("POST", api+'/histories/'+ownRadioId+'/'+currentTrack.id, true);
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

    /*автозагрузка следующего трека*/
    audioPlayer.on(ya.music.Audio.EVENT_ENDED, function() {
        status = true;
        saveHistory(status);
        loadNewTrack();
        if (trackIndex < trackUrls.length) {
            startPlay();
        }
    });

   /* audioPlayer.on(ya.music.Audio.EVENT_LOADED, function() {
        if (trackIndex + 1 < trackUrls.length) {
            audioPlayer.preload(trackUrls[trackIndex + 1]);
        }
    });
*/

    /* навигаци по треку и регулирование громкости: */

    var offsetLeft = function(node) {
        var offset = node.offsetLeft;
        if (node.offsetParent) {
            offset += offsetLeft(node.offsetParent);
        }
        return offset;
    };

    var offsetTop = function(node) {
        var offset = node.offsetTop;
        if (node.offsetParent) {
            offset += offsetTop(node.offsetParent);
        }
        return offset;
    };

    dom.progress.bar.addEventListener("click", function(evt) {
        var fullWidth = dom.progress.bar.offsetWidth;
        var offset = offsetLeft(dom.progress.bar);

        var relativePosition = Math.max(0, Math.min(1, ((evt.pageX || evt.screenX) - offset) / fullWidth));
        var duration = audioPlayer.getDuration();

        audioPlayer.setPosition(duration * relativePosition);
    });

    /*dom.volume.bar.addEventListener("click", function(evt) {
        var fullHeight = dom.volume.bar.offsetHeight;
        var offset = offsetTop(dom.volume.bar);


        // тут мы делаем "1 -" т.к. громость принято отмерять снизу, а не сверху
        var volume = 1 - Math.max(0, Math.min(1, ((evt.pageY || evt.screenY) - offset) / fullHeight));
        audioPlayer.setVolume(volume);
    });*/
})();
