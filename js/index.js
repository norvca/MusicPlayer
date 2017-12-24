// 设置自定义事件
var EventCenter = {
	on: function(type, handler){
		document.addEventListener(type ,handler);
	},
	fire: function(type, data){
		return document.dispatchEvent(new CustomEvent(type, {
			detail: data
		}));
	}
};

// 底部导航条渲染
var Footer = {
	// 初始化
	init: function(){
		this.footer = document.querySelector('footer');
		this.carousel = document.querySelector('footer .carousel');
		this.ulBox = document.querySelector('footer .carousel ul');
		this.leftBtn = document.querySelector('footer .icon-fanhui');
		this.rightBtn = document.querySelector('footer .icon-gengduo');
		this.count = 0;
		this.bind();
		this.render();
	},
	bind: function(){
		var _this = this;
		window.addEventListener('resize', function(){
			_this.setStyle();
		});
		// 底部导航滑动
		this.leftBtn.addEventListener('click', function(){
			_this.slideLeft();
		});
		this.rightBtn.addEventListener('click', function(){
			_this.slideRight();
		});

		// 底部滑动区事件代理,原生方法多次尝试失败，先引入 jQ 解决。
		$('.carousel ul').on('click','li',function(){
			$(this).addClass('active').siblings().removeClass('active');
			// 点击向 Main 区域发送 channel_id
			EventCenter.fire('select-albumn', {
				channelId: this.getAttribute('channel_id'),
				channelName: this.getAttribute('channel_name')
			});
		});
	},
	render: function(){
		var _this = this;
		// ajax 获取歌曲封面数据
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'http://api.jirengu.com/fm/getChannels.php', true);
		xhr.onload = function(){
			if((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304){
				var ret = JSON.parse(xhr.responseText);
				_this.renderFooter(ret.channels);
			}else{
				alert('服务器异常！Ajax请求失败');
			}
		};
		xhr.onerror = function(){
			alert('网络错误！Ajax请求失败');
		};
		xhr.send();
	},
	// 底部渲染
	renderFooter: function(channels){
		var html = '';
		channels.forEach(function(element){
			html += '<li channel_id='+ element.channel_id + ' channel_name='+ element.name + '>';
			html += '<div class="cover" style="background-image:url('+ element.cover_small +')"></div>';
			html += '<h3>'+ element.name +'</h3>';
			html += '</li>';
			return html;
		});
		// 用 innerHTML 好像有风险，需要更好的解决办法。
		this.ulBox.innerHTML = html;
		this.setStyle();
	},
	// 让底部获取的封面变成一排显示。
	setStyle: function(){
		// 得到获取封面的个数
		var channelCount = document.querySelectorAll('.carousel ul li').length;
		var oneChannel = document.querySelector('.carousel ul li');
		// 获取单个封面宽度包括外 margin。
		var channelWidth = oneChannel.offsetWidth;
		channelWidth += parseFloat(window.getComputedStyle(oneChannel).getPropertyValue('margin-left'));
		channelWidth += parseFloat(window.getComputedStyle(oneChannel).getPropertyValue('margin-right'));
		// 设置 ul 宽度满足所有的 li
		this.channelWidth = channelWidth;
		this.ulBox.style.width = channelCount * channelWidth + 'px';
	},
	// 底部滑动效果实现
	slideLeft: function(){
		//显示器能容下几个li
		var carouselWidth = this.carousel.offsetWidth;
		var liCount = Math.floor(carouselWidth / this.channelWidth);
		if(this.count > 0) {
			this.count--;
			this.ulBox.style.left = -this.count * liCount * this.channelWidth + 'px';
		}
	},
	slideRight: function(){
		var carouselWidth = this.carousel.offsetWidth;
		var liCount = Math.floor(carouselWidth / this.channelWidth);
		// Caution! 往右滑动最终定位不准确，待修复！
		if(this.carousel.offsetWidth * (this.count+1) < this.ulBox.offsetWidth){
			this.count++;
			this.ulBox.style.left = -this.count * liCount * this.channelWidth + 'px';
		}
	}
};

// 主要区域
var Main = {
	init: function(){
		this.audio = new Audio();
		this.audio.autoplay = true;
		this.btnReturn = document.querySelector('.btn-return');
		this.btn = document.querySelector('.btn-play');
		this.next = document.querySelector('.btn-next');
		this.download = document.querySelector('.icon-xiazai');
		this.lyric = document.querySelector('.progress p');
		this.progressBar = document.querySelector('.progress-bar');
		this.innerProgressBar = document.querySelector('.progress-bar-inner');
		this.bind();
	},
	bind: function(){
		var _this = this;
		EventCenter.on('select-albumn', function(object){
			_this.channelId = object.detail.channelId;
			_this.channelName = object.detail.channelName;
			_this.loadMusic();
		});
		// 循环播放功能
		this.btnReturn.addEventListener('click', function(){
			if( _this.audio.loop === false){
				_this.audio.loop = true;
				_this.btnReturn.classList.add('loop-active');
			}else {
				_this.audio.loop = false;
				_this.btnReturn.classList.remove('loop-active');
			}
		});
		// 播放暂停功能
		this.btn.addEventListener('click', function(){
			// icon-bofangqi-zanting
			if( this.classList.contains('icon-bofangqi-bofang') ){
				_this.audio.play();
				this.classList.remove('icon-bofangqi-bofang');
				this.classList.add('icon-bofangqi-zanting');
			}else {
				_this.audio.pause();
				this.classList.remove('icon-bofangqi-zanting');
				this.classList.add('icon-bofangqi-bofang');
			}
		});
		// 下一首功能
		this.next.addEventListener('click', function(){
			_this.loadMusic();
		});
		// 下载歌曲
		this.download.addEventListener('click', function(){
			window.location.assign(_this.audio.src);
		});
		// 监听歌曲的播放暂停
		this.audio.addEventListener('play', function(){
			// 本想用 setTimeout 模拟循环，但不知道如何清除，先用 setInterval，待解决！
			clearInterval(_this.songPlayed);
			_this.songPlayed = setInterval(function(){
				_this.updateSongStatus();
			}, 1000);
		});
		this.audio.addEventListener('pause', function(){
			clearInterval(_this.songPlayed);
		});
		// 音乐结束时播放下一首
		this.audio.addEventListener('ended', function(){
			_this.loadMusic();
		});
		// 点击进度条滑动
		this.progressBar.addEventListener('click', function(e){
			_this.audio.currentTime = (e.offsetX / this.offsetWidth) * _this.audio.duration;
		});
	},
	loadMusic: function(){
		var _this = this;
		// Ajax 获取歌曲内容
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'http://api.jirengu.com/fm/getSong.php?channel='+ _this.channelId, true);
		xhr.onload = function(){
			if((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304){
				var ret = JSON.parse(xhr.responseText);
				_this.song = ret.song[0];
				_this.setMusic();
				_this.loadLyric();
			}else{
				alert('服务器异常！Ajax请求失败');
			}
		};
		xhr.onerror = function(){
			alert('网络错误！Ajax请求失败');
		};
		xhr.send();
	},
	loadLyric: function(){
		var _this = this;
		// Ajax 获取歌词内容
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'http://jirenguapi.applinzi.com/fm/getLyric.php?&sid='+ _this.song.sid, true);
		xhr.onload = function(){
			if((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304){
				var ret = JSON.parse(xhr.responseText);
				var lyricObj = {};
				// 歌词拆解
				ret.lyric.split('\n').forEach(function(line){
					var time = line.match(/\d{2}:\d{2}/);
					var lyric = line.replace(/\[.+\]/, '');
					if(Array.isArray(time)){
						time.forEach(function(time){
							lyricObj[time] = lyric;
						});
					}
				});
				_this.lyricObj = lyricObj;
			}else{
				alert('服务器异常！歌词获取失败');
			}
		};
		xhr.onerror = function(){
			alert('网络错误！歌词获取失败');
		};
		xhr.send();
	},
	setMusic: function(){
		this.btn.classList.remove('icon-bofangqi-bofang');
		this.btn.classList.add('icon-bofangqi-zanting');
		this.audio.src = this.song.url;
		document.querySelector('.tag span').innerText = this.channelName;
		document.querySelector('.detail h1').innerText = this.song.title;
		document.querySelector('.author').innerText = this.song.artist;
		document.querySelector('figure').style.backgroundImage = 'URL('+ this.song.picture +')';
		document.querySelector('.bg').style.backgroundImage = 'URL('+ this.song.picture +')';
	},
	// 歌曲播放时要做的事，如进度条、歌曲时间跟着改变。
	updateSongStatus: function(){
		var min = Math.floor(this.audio.currentTime / 60) ;
		var sec = Math.floor(this.audio.currentTime % 60) + '';
		sec = (sec.length == 2 ? sec : '0'+sec);
		this.lyric.innerText = min + ':' + sec;
		this.innerProgressBar.style.width = (this.audio.currentTime / this.audio.duration)*100 + '%';
		// 歌词设置
		var hasLyric = this.lyricObj['0'+min+':'+sec];
		if(hasLyric){
			document.querySelector('.lyric').innerText = hasLyric;
		}
		// console.log(this.lyricObj["0"+min+":"+sec]);
	}
};

Footer.init();
Main.init();