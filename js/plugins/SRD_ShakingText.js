/*:
 * @plugindesc ※---※震动文本显示插件※---※
 * @author SumRndmDde 汉化:硕明云书
 *
 * @param Reset Shaking per Box
 * @text 重置震动
 * @desc If this is set to 'true', then all shaking effects will be reset every time the Message Window is cleared.
 * @default true
 *
 * @param Default Shaking Power
 * @text 默认振动值
 * @desc 在没有任何参数的情况下使用\Shake时使用的震动
 * @default $.randomNum(0.2, 0.5)
 *
 * @param Default Shaking Max
 * @text 默认振动最大值
 * @desc The Shaking Max used when using \Shake without any parameters.
 * @default 1
 *
 * @param Default Wave Power
 * @text 默认波功
 * @desc 在没有任何参数的情况下使用\Wave时使用的波功
 * @default 0.5
 *
 * @param Default Wave Max
 * @text 默认波形最大值
 * @desc 在不带任何参数的情况下使用\Wave时使用的Wave Max。
 * @default 4
 *
 * @param Default Slide Power
 * @text 默认幻灯片
 * @desc 在没有任何参数的情况下使用\Slide时使用的幻灯片
 * @default 0.5
 *
 * @param Default Slide Max
 * @text 默认幻灯片最大值
 * @desc 在不带任何参数的情况下使用\Slide时使用的Slide Max。
 * @default 4
 *
 * @param Copy Outline
 * @text 默认无需修改
 * @desc If 'true', the outline function will be copied.
 * @default true
 *
 * @help
 * ==========================================================================
 *  ※ 震动文字
 *  ※ 版本1.12SumRndmDde
 *  ※ 汉化：硕明云书
 * ==========================================================================
 *  ※ 此插件允许您将动画文本效果添加到显示文本中
 *
 *  ※ 震动和波浪效果
 *
 * ==========================================================================
 *  ※ 文本指令
 * ==========================================================================
 *
 *  ※ 在任何显示文本事件中使用以下:
 *
 *     \Shake                         -  将文本设置为默认值
 *     \Shake<power>                  -  从简单数字创建震动效果
 *     \Shake<xSpd, ySpd>             -  从不同的x和y速度创建震动
 *     \Shake<xSpd, ySpd, xMax, yMax> -  供对震动的绝对控制影响；可以控制x/y速度，以及
 *                                       字符可以到达的最大距离
 *
 * -------------------------------------------------------------------------
 *
 *     \Wave                          -  波浪
 *     \Wave<speed, max>              -  根据速度和速度设置波浪效果/最大距离
 *
 * -------------------------------------------------------------------------
 *
 *     \Slide                         -  摆动                                  
 *     \Slide<speed, max>             -  摆动速度和距离
 *
 * -------------------------------------------------------------------------
 *
 *     \Circle                         -  波动摇晃
 *
 * -------------------------------------------------------------------------
 *
 *     \ResetShake                    -  重置所有震动
 *
 *
 * ==========================================================================
 *  ※ 帮助文件
 * ==========================================================================
 *  ※ 欢迎来到帮助文件
 *  ※ 感谢阅读！
 *  ※ https://www.youtube.com/c/SumRndmDde
 *  ※ 这些插件可以在免费和商业游戏中使用。
 *  ※ 必须注明“ SumRndmDde ”或“ SRDude ”，并且必须链接此http://sumrndm.site/
 */

var SRD = SRD || {};
SRD.ShakingText = SRD.ShakingText || {};

var Imported = Imported || {};
Imported["SumRndmDde Shaking Text"] = 1.12;

(function(_) {

	var params = PluginManager.parameters('SRD_ShakingText');

	_.resetShaking = String(params['Reset Shaking per Box']).trim().toLowerCase() === 'true';

	_.defaultShakePower = String(params['Default Shaking Power']);
	_.defaultShakeMax = String(params['Default Shaking Max']);
	_.defaultWavePower = String(params['Default Wave Power']);
	_.defaultWaveMax = String(params['Default Wave Max']);

	_.outline = String(params['Copy Outline']).trim().toLowerCase() === 'true';

	var $ = {};
	$.randomNum = function(min, max) {
		var temp = (max - min) * 100;
		var temp2 = min * 100;
		if(temp <= 0) alert("When using the 'randomNum' function, the minimum number was greater than the maximum.");
		return Number(Math.floor(Math.randomInt(temp) + temp2) / 100);
	}

	//-----------------------------------------------------------------------------
	// Window_Message
	//-----------------------------------------------------------------------------

	var _Window_Message_initialize = Window_Message.prototype.initialize;
	Window_Message.prototype.initialize = function(x, y, width, height) {
		_Window_Message_initialize.call(this, x, y, width, height);
		this._textShaking = [0, 0, 0, 0];
		this._shakingSprites = [];
		this._fastShakeInterval = 0;
	};

	var _Window_Message_processNormalCharacter = Window_Message.prototype.processNormalCharacter;
	Window_Message.prototype.processNormalCharacter = function(textState) {
		if(this.isShakingActive() && !this._checkWordWrapMode) {
			if(Imported.YEP_MessageCore && this.checkWordWrap(textState)) {
				return this.processNewLine(textState);
			}
			var c = textState.text[textState.index++];
			var w = this.textWidth(c);
			var h = textState.height;
			this.createShakingCharacter(textState, c, w, h);
			textState.x += w;
		} else {
			_Window_Message_processNormalCharacter.call(this, textState);
		}
	};

	var _Window_Message_obtainEscapeCode = Window_Message.prototype.obtainEscapeCode;
	Window_Message.prototype.obtainEscapeCode = function(textState) {
		var shake = (Imported.YEP_MessageCore) ? !this._checkWordWrapMode : true;
		textState.index++;
		if(textState.text.slice(textState.index, textState.index+5).match(/shake/i)) {
			textState.index += 5;
			return (shake) ? "SHAKE" : "";
		} else if(textState.text.slice(textState.index, textState.index+4).match(/wave/i)) {
			textState.index += 4;
			return (shake) ? "WAVE" : "";
		} else if(textState.text.slice(textState.index, textState.index+5).match(/slide/i)) {
			textState.index += 5;
			return (shake) ? "SLIDE" : "";
		} else if(textState.text.slice(textState.index, textState.index+6).match(/circle/i)) {
			textState.index += 6;
			return (shake) ? "CIRCLE" : "";
		} else if(textState.text.slice(textState.index, textState.index+10).match(/resetshake/i)) {
			textState.index += 10;
			return (shake) ? "RESETSHAKE" : "";
		} else {
			textState.index--;
			return _Window_Message_obtainEscapeCode.call(this, textState);
		}
	};

	Window_Message.prototype.isShakingActive = function() {
		return (this._textShaking[0] > 0 || this._textShaking[0] === 'circle') || 
			this._textShaking[1] > 0 || this._textShaking[2] > 0 || this._textShaking[3] > 0;
	};

	Window_Message.prototype.createShakingCharacter = function(textState, c, w, h) {
		if(this._textShaking[0] === 'circle') {
			var sprite = new Sprite_Shake(new Bitmap(w, h), 'circle', 0, 0, 0);
		} else {
			var sprite = new Sprite_Shake(new Bitmap(w, h), eval(this._textShaking[0]), eval(this._textShaking[1]), 
				eval(this._textShaking[2]), eval(this._textShaking[3]));
		}
		sprite.bitmap.textColor = this.contents.textColor;
		sprite.bitmap.paintOpacity = this.contents.paintOpacity;
		sprite.bitmap.fontSize = this.contents.fontSize;
		sprite.bitmap.fontFace = this.contents.fontFace;
		if(_.outline) sprite.bitmap._drawTextOutline = this.contents._drawTextOutline;
		sprite.bitmap.drawText(c, 0, 0, w, h);
		sprite.x = textState.x + this.standardPadding();
		sprite.y = textState.y + this.standardPadding();
		sprite._xBase = sprite.x;
		sprite._yBase = sprite.y;
		this.addChild(sprite);
		this._shakingSprites.push(sprite);
		if(this._showFast || this._lineShowFast) {
			for(var i = 0; i < this._fastShakeInterval; i++) {
				sprite.update();
			}
			this._fastShakeInterval += 2;
		} else {
			this._fastShakeInterval = 0;
		}
	};

	var _Window_Message_processEscapeCharacter = Window_Message.prototype.processEscapeCharacter;
	Window_Message.prototype.processEscapeCharacter = function(code, textState) {
		switch (code) {
		case 'SHAKE':
			var params = this.obtainShakingTextParams(textState);
			var info = String(params).match(/(.+)\s*,\s*(.+)\s*,\s*(.*)\s*,\s*(.*)/);
			var info2 = String(params).match(/(.+)\s*,\s*(.+)/);
			var info3 = String(params).match(/(.+)/);
			if(info) {
				this._textShaking[0] = String(info[1]);
				this._textShaking[1] = String(info[2]);
				this._textShaking[2] = String(info[3]);
				this._textShaking[3] = String(info[4]);
			} else if(info2) {
				this._textShaking[0] = String(info2[1]);
				this._textShaking[1] = String(info2[2]);
				this._textShaking[2] = _.defaultShakeMax;
				this._textShaking[3] = _.defaultShakeMax;
			} else if(info3) {
				var spd = "Math.random() + " + String(Math.floor((Number(info3[1]) / 10) * 100) / 100);
				this._textShaking[0] = spd;
				this._textShaking[1] = spd;
				this._textShaking[2] = _.defaultShakeMax;
				this._textShaking[3] = _.defaultShakeMax;
			} else {
				this._textShaking[0] = _.defaultShakePower;
				this._textShaking[1] = _.defaultShakePower;
				this._textShaking[2] = _.defaultShakeMax;
				this._textShaking[3] = _.defaultShakeMax;
			}
			break;
		case 'WAVE':
			var info = String(this.obtainShakingTextParams(textState)).match(/(.+)\s*,\s*(.+)/);
			this._textShaking[0] = "0";
			this._textShaking[2] = "0";
			if(info) {
				this._textShaking[1] = String(info[1]);
				this._textShaking[3] = String(info[2]);
			} else {
				this._textShaking[1] = _.defaultWavePower;
				this._textShaking[3] = _.defaultWaveMax;
			}
			break;
		case 'SLIDE':
			var info = String(this.obtainShakingTextParams(textState)).match(/(.+)\s*,\s*(.+)/);
			this._textShaking[1] = "0";
			this._textShaking[3] = "0";
			if(info) {
				this._textShaking[0] = String(info[1]);
				this._textShaking[2] = String(info[2]);
			} else {
				this._textShaking[0] = _.defaultWavePower;
				this._textShaking[2] = _.defaultWaveMax;
			}
			break;
		case 'CIRCLE':
			this._textShaking[0] = "circle";
			this._textShaking[1] = 0;
			this._textShaking[2] = 0;
			this._textShaking[3] = 0;
			break;
		case 'RESETSHAKE':
			this.resetShaking();
			break;
		default:
			_Window_Message_processEscapeCharacter.call(this, code, textState);
			break;
		}
	};

	Window_Message.prototype.obtainShakingTextParams = function(textState) {
		var arr = /^\<.+\>/.exec(textState.text.slice(textState.index));
		if (arr) {
			textState.index += arr[0].length;
			return String(arr[0].slice(1, arr[0].length-1));
		} else {
			return '';
		}
	};

	var _Window_Message_open = Window_Message.prototype.open;
	Window_Message.prototype.open = function() {
		_Window_Message_open.call(this);
		for(var i = 0; i < this._shakingSprites.length; i++) {
			this._shakingSprites[i].opacity = 255;
		}
	};

	var _Window_Message_close = Window_Message.prototype.close;
	Window_Message.prototype.close = function() {
		_Window_Message_close.call(this);
		for(var i = 0; i < this._shakingSprites.length; i++) {
			this._shakingSprites[i].opacity = 0;
		}
	};

	Window_Message.prototype.removeShakingSprites = function() {
		for(var i = 0; i < this._shakingSprites.length; i++) {
			this.removeChild(this._shakingSprites[i]);
		}
	};

	Window_Message.prototype.resetShaking = function() {
		for(var i = 0; i < this._textShaking.length; i++) {
			this._textShaking[i] = 0;
		}
	};

	var _Window_Message_newPage = Window_Message.prototype.newPage;
	Window_Message.prototype.newPage = function(textState) {
		_Window_Message_newPage.call(this, textState);
		this.removeShakingSprites();
		if(_.resetShaking) this.resetShaking();
	};

	//-----------------------------------------------------------------------------
	// Sprite_Shake
	//-----------------------------------------------------------------------------

	function Sprite_Shake() {
		this.initialize.apply(this, arguments);
	}

	Sprite_Shake.prototype = Object.create(Sprite.prototype);
	Sprite_Shake.prototype.constructor = Sprite_Shake;

	Sprite_Shake.prototype.initialize = function(bitmap, xSpd, ySpd, xMax, yMax) {
		Sprite.prototype.initialize.call(this, bitmap);
		if(xSpd === 'circle') {
			this._xSpd = 'circle';
			this._aniCouter = 0;
			this._xBase = this.x;
			this._yBase = this.y;
		} else {
			this._xSpd = xSpd;
			this._ySpd = ySpd;
			this._xMax = xMax;
			this._yMax = yMax;
			this._xBase = this.x;
			this._yBase = this.y;
		}
	};

	Sprite_Shake.prototype.update = function() {
		Sprite.prototype.update.call(this);
		if(this._xSpd === 'circle') {
			this._aniCouter -= (Math.PI * 0.06);
			if(this._aniCouter > (Math.PI * 2)) this._aniCouter -= (Math.PI * 2);
			this._xAniOff = Math.cos(this._aniCouter) * 3;
			this._yAniOff = Math.sin(this._aniCouter) * 3;
			this.x = this._xBase + this._xAniOff;
			this.y = this._yBase + this._yAniOff;
		} else {
			this.x += this._xSpd;
			this.y += this._ySpd;
			if(Math.abs(this.x - this._xBase) > this._xMax) this._xSpd *= (-1);
			if(Math.abs(this.y - this._yBase) > this._yMax) this._ySpd *= (-1);
		}
	};

})(SRD.ShakingText);