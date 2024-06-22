//=============================================================================
// DestinationWindow.js
// ----------------------------------------------------------------------------
// Copyright (c) 2015-2017 Triacontane
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 1.2.1 2017/05/22 専用ウィンドウスキンを指定した状態でセーブ＆ロードした際にテキスト色が黒くなる問題を修正
// 1.2.0 2017/05/03 アイコン表示機能、横幅自動調整機能を追加、別の目標を指定したときに重なって表示される問題を修正
// 1.1.0 2017/05/02 メニュー画面にも表示できる機能を追加
// 1.0.0 2017/05/02 初版
// ----------------------------------------------------------------------------
// [Blog]   : http://triacontane.blogspot.jp/
// [Twitter]: https://twitter.com/triacontane/
// [GitHub] : https://github.com/triacontane/
//=============================================================================


/*:* @plugindesc 行动目标窗口插件
 * @author トリアコンタン 翻译xuhao1996
 *
 * @param 目标窗口开关ID
 * @desc 是行动目标窗口显示的开关ID
 * @default 1
 *
 * @param 事件中关闭
 * @desc 在执行事件的时候关闭窗口。
 * @default ON
 *
 * @param 窗口X坐标
 * @desc 窗口X坐标
 * @default 24
 *
 * @param 窗口Y坐标
 * @desc 窗口Y坐标
 * @default 24
 *
 * @param 窗口宽度
 * @desc 窗口的宽度。
 * @default 320
 *
 * @param 窗口透明度
 * @desc 窗口的透明度。
 * @default 255
 *
 * @param 窗口皮肤
 * @desc 窗口皮肤文件名(img/system)
 * @default
 * @require 1
 * @dir img/system/
 * @type file
 *
 * @param 渐隐时间
 * @desc 窗口的淡入/淡出时间（帧数）。
 * @default 8
 *
 * @param 字体大小
 * @desc 窗口的字体大小。
 * @default 22
 *
 * @param 菜单画面显示
 * @desc 在菜单画面上也显示行动目标窗口。但是坐标和尺寸会自动调整。ON\OFF
 * @default OFF
 *
 * @param 自动调整
 * @desc 如果指定的字符串不适合窗口，则自动调整。 但是，某些控制字符不能使用。ON\OFF
 * @default ON
 *
 * @help 在地图上显示行动目标窗口。
 *因为它可以显示包括控制字符在内的任何字符串，所以可以用于各种目的。
 *要显示的内容是插件命令，是否显示它们由开关控制。
 *
 *启用自动调整后，如果文本不适合窗口，则将自动调整文本。
 *但是，以下控制字符无效。
 * \i[n]、\c[n]、\{、\}
 *
 *插件命令详细信息
 *从事件命令“插入命令”执行。
 *（参数之间用空格分隔）
 *
 * DW_目标设定 aaa                    # 设置行动目标为 aaa
 * DW_SET_DESTINATION aaa             # 同上
 * DW_图标_目标设定 1 aaa      # 设置带有图标的目标要求 aaa   1=图标ID
 * DW_SET_DESTINATION_WITH_ICON 1 aaa # 同上
 *
 * 利用規約：
 *  作者に無断で改変、再配布が可能で、利用形態（商用、18禁利用等）
 *  についても制限はありません。
 *  このプラグインはもうあなたのものです。
 */

(function() {
    'use strict';
    var pluginName    = 'DestinationWindow';
    var metaTagPrefix = 'DW_';

    //=============================================================================
    // ローカル関数
    //  プラグインパラメータやプラグインコマンドパラメータの整形やチェックをします
    //=============================================================================
    var getParamString = function(paramNames) {
        if (!Array.isArray(paramNames)) paramNames = [paramNames];
        for (var i = 0; i < paramNames.length; i++) {
            var name = PluginManager.parameters(pluginName)[paramNames[i]];
            if (name) return name;
        }
        return '';
    };

    var getParamNumber = function(paramNames, min, max) {
        var value = getParamString(paramNames);
        if (arguments.length < 2) min = -Infinity;
        if (arguments.length < 3) max = Infinity;
        return (parseInt(value) || 0).clamp(min, max);
    };

    var getParamBoolean = function(paramNames) {
        var value = getParamString(paramNames);
        return value.toUpperCase() === 'ON';
    };

    var getArgNumber = function(arg, min, max) {
        if (arguments.length < 2) min = -Infinity;
        if (arguments.length < 3) max = Infinity;
        return (parseInt(arg) || 0).clamp(min, max);
    };

    var concatAllArguments = function(args) {
        return args.reduce(function(prevValue, arg) {
            return prevValue + ' ' + arg;
        }, '');
    };

    var setPluginCommand = function(commandName, methodName) {
        pluginCommandMap.set(metaTagPrefix + commandName, methodName);
    };

    //=============================================================================
    // パラメータの取得と整形
    //=============================================================================
    var param               = {};
    param.showingSwitchId   = getParamNumber(['ShowingSwitchId', '目标窗口开关ID'], 0);
    param.windowX           = getParamNumber(['WindowX', '窗口X坐标']);
    param.windowY           = getParamNumber(['WindowY', '窗口Y坐标']);
    param.windowWidth       = getParamNumber(['WindowWidth', '窗口宽度'], 1);
    param.windowSkin        = getParamString(['WindowSkin', '窗口皮肤']);
    param.windowOpacity     = getParamNumber(['WindowOpacity', '窗口透明度']);
    param.fadeFrame         = getParamNumber(['FadeFrame', '渐隐时间'], 1);
    param.fontSize          = getParamNumber(['FontSize', '字体大小'], 12);
    param.closeEventRunning = getParamBoolean(['CloseEventRunning', '事件中关闭']);
    param.showingInMenu     = getParamBoolean(['ShowingInMenu', '菜单画面显示']);
    param.autoAdjust        = getParamBoolean(['AutoAdjust', '自动调整']);

    var pluginCommandMap = new Map();
    setPluginCommand('目标设定', 'execSetDestination');
    setPluginCommand('SET_DESTINATION', 'execSetDestination');
    setPluginCommand('图标_目标设定', 'execSetDestinationWithIcon');
    setPluginCommand('SET_DESTINATION_WITH_ICON', 'execSetDestinationWithIcon');

    //=============================================================================
    // Game_Interpreter
    //  プラグインコマンドを追加定義します。
    //=============================================================================
    var _Game_Interpreter_pluginCommand      = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.apply(this, arguments);
        var pluginCommandMethod = pluginCommandMap.get(command.toUpperCase());
        if (pluginCommandMethod) {
            this[pluginCommandMethod](args);
        }
    };

    Game_Interpreter.prototype.execSetDestination = function(args) {
        $gameSystem.setDestinationIcon(null);
        $gameSystem.setDestination(concatAllArguments(args));
    };

    Game_Interpreter.prototype.execSetDestinationWithIcon = function(args) {
        var icon = args.shift();
        $gameSystem.setDestinationIcon(icon);
        $gameSystem.setDestination(concatAllArguments(args));
    };

    //=============================================================================
    // Game_System
    //  目標テキストを追加定義します。
    //=============================================================================
    Game_System.prototype.setDestination = function(value) {
        this._destinationText = value;
    };

    Game_System.prototype.getDestination = function() {
        return this._destinationText || '';
    };

    Game_System.prototype.setDestinationIcon = function(value) {
        this._destinationIconIndex = value;
    };

    Game_System.prototype.getDestinationIcon = function() {
        return this._destinationIconIndex || '';
    };

    //=============================================================================
    // Scene_Map
    //  行動目標ウィンドウを生成します。
    //=============================================================================
    var _Scene_Map_createMapNameWindow      = Scene_Map.prototype.createMapNameWindow;
    Scene_Map.prototype.createMapNameWindow = function() {
        this.createDestinationWindow();
        _Scene_Map_createMapNameWindow.apply(this, arguments);
    };

    Scene_Map.prototype.createDestinationWindow = function() {
        this._destinationWindow = new Window_Destination(param.windowX, param.windowY, param.windowWidth);
        this.addChild(this._destinationWindow);
    };

    //=============================================================================
    // Scene_Menu
    //  メニュー画面にも表示できるようにします。
    //=============================================================================
    var _Scene_Menu_create      = Scene_Menu.prototype.create;
    Scene_Menu.prototype.create = function() {
        _Scene_Menu_create.apply(this, arguments);
        if (param.showingInMenu) {
            this.createDestinationWindow();
        }
    };

    Scene_Menu.prototype.createDestinationWindow = function() {
        var y, width, height;
        if (this._commandWindow.maxCols() === 1) {
            y      = this._commandWindow.y + this._commandWindow.height;
            width  = this._commandWindow.width;
            height = null;
        } else {
            y      = this._goldWindow.y;
            width  = param.windowWidth;
            height = this._goldWindow.height;
        }
        this._destinationWindow = new Window_Destination(0, y, width, height);
        this.addWindow(this._destinationWindow);
    };

    //=============================================================================
    // Window_Destination
    //  行動目標ウィンドウです。
    //=============================================================================
    function Window_Destination() {
        this.initialize.apply(this, arguments);
    }

    Window_Destination.prototype             = Object.create(Window_Base.prototype);
    Window_Destination.prototype.constructor = Window_Destination;

    Window_Destination.prototype.initialize = function(x, y, width, height) {
        Window_Base.prototype.initialize.call(this, x, y, width, height || this.fittingHeight(1));
        this._text      = '';
        this._iconIndex = 0;
        this.update();
        this.opacity = this.isVisible() ? 255 : 0;
    };

    Window_Destination.prototype.loadWindowskin = function() {
        if (param.windowSkin) {
            this.windowskin = ImageManager.loadSystem(param.windowSkin);
        } else {
            Window_Base.prototype.loadWindowskin.call(this);
        }
    };

    Window_Destination.prototype.lineHeight = function() {
        return Math.max(this.standardFontSize() + 8, Window_Base._iconHeight);
    };

    Window_Destination.prototype.standardFontSize = function() {
        return param.fontSize || Window_Base.prototype.standardFontSize.call(this);
    };

    Window_Destination.prototype.standardBackOpacity = function() {
        return param.windowOpacity || Window_Base.prototype.standardBackOpacity.call(this);
    };

    Window_Destination.prototype.standardPadding = function() {
        return 12;
    };

    Window_Destination.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        if (!this.windowskin.isReady()) return;
        this.updateText();
        this.updateOpacity();
    };

    Window_Destination.prototype.updateOpacity = function() {
        if (this.isVisible()) {
            this.setOpacity(this.opacity + this.getFadeValue());
        } else {
            this.setOpacity(this.opacity - this.getFadeValue());
        }
        this.visible = (this.opacity > 0);
    };

    Window_Destination.prototype.updateText = function() {
        var text      = this.convertEscapeCharacters($gameSystem.getDestination());
        var iconIndex = getArgNumber(this.convertEscapeCharacters($gameSystem.getDestinationIcon()), 0);
        if (this._text === text && this._iconIndex === iconIndex) return;
        this._text      = text;
        this._iconIndex = iconIndex;
        this.drawDestination();
    };

    Window_Destination.prototype.drawDestination = function() {
        this.contents.clear();
        var x = 0;
        var y = this.contentsHeight() / 2 - this.contents.fontSize / 2 - 4;
        if (this._iconIndex > 0) {
            this.drawIcon(this._iconIndex, x, y);
            x += Window_Base._iconWidth;
        }
        if (param.autoAdjust) {
            this.resetTextColor();
            this.drawText(this._text, x, y, this.contentsWidth() - x);
        } else {
            this.drawTextEx(this._text, x, y);
        }
    };

    Window_Destination.prototype.setOpacity = function(value) {
        this.opacity         = value;
        this.contentsOpacity = value;
    };

    Window_Destination.prototype.getFadeValue = function() {
        return 255 / param.fadeFrame
    };

    Window_Destination.prototype.isVisible = function() {
        return $gameSwitches.value(param.showingSwitchId) && !this.isEventRunning() && (!!this._text || !!this._iconIndex);
    };

    Window_Destination.prototype.isEventRunning = function() {
        return $gameMap.isEventRunning() && param.closeEventRunning;
    };
})();
