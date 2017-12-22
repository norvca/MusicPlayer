// 底部导航条渲染
var Footer = {
	// 初始化
	init: function(){
		this.footer = document.querySelector('footer');
		this.carousel = document.querySelector('footer .carousel');
		this.ulBox = document.querySelector('footer .carousel ul');
		this.leftBtn = document.querySelector('footer .icon-fanhui');
		this.rightBtn = document.querySelector('footer .icon-gengduo');
		this.bind();
		this.render();
		this.count = 0;
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
	},
	render: function(){
		var _this = this;
		// ajax 获取歌曲封面数据
		var xhr = new XMLHttpRequest();
		xhr.open('GET', '//api.jirengu.com/fm/getChannels.php', true);
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
			html += '<li>';
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
		if(this.carousel.offsetWidth * (this.count + 1) < this.ulBox.offsetWidth){
			this.count++;
			this.ulBox.style.left = -this.count * liCount * this.channelWidth + 'px';
		}
	}
};

Footer.init();