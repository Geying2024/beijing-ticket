//=============================================================================
// PY_WindowMessage.js
//=============================================================================

/*:
 * @plugindesc (v1.0)窗口显示信息
 * @author 破夜沙狼
 * @help
可以将文本信息在显示在地图界面的窗口内。
文本信息显示类型：文字、数字、图标、变量等。
=============================================================================
使用方法：
赋值某个变量= 脚本(该脚本内容推荐全部用字符串的形式来写)
例如：赋值 8号变量 = “文本内容”
文本内容设置：
\\C[x]            更改颜色,x为对应数值颜色
\\V[x]            显示x号变量，变量值会在窗口中同步刷新
\\I[x]            绘制第x号图标
\\{文本内容\\}    增大字体 
\\}文本内容\\{    减小字体 
\n               换行
例如：赋值 8号变量 = “任务：\n捕捉\\C[18]宠物\\C[0]3只”
解释：第一行显示任务，第二行显示捕捉宠物3只，其中宠物两个字为红色。
=============================================================================
插件指令：
PY_MessageShow   //显示窗口
PY_MessageHide   //隐藏窗口

使用条款：本插件可免费用于非商业及商业用途。
请在游戏结尾名单中署名：破夜沙狼
=============================================================================
更新日志：
v1.0 完成初始插件
=============================================================================

 * @param 初始显示窗口
 * @desc 是否在初始显示窗口
 * @type boolean
 * @on 开启
 * @off 关闭
 * @default false

 * @param 窗口位置x
 * @desc 设置窗口的x位置
 * @type number
 * @min 0
 * @max 10000
 * @default 0

 * @param 窗口位置y
 * @desc 设置窗口的y位置
 * @type number
 * @min 0
 * @max 10000
 * @default 0

 * @param 窗口宽度
 * @desc 设置窗口宽度
 * @type number
 * @min 1
 * @max 10000
 * @default 500

 * @param 窗口高度
 * @desc 设置窗口的高度
 * @type number
 * @min 1
 * @max 10000
 * @default 300

 * @param 显示的变量
 * @desc 将变量的内容显示在窗口中
 * @type number
 * @min 0
 * @max 100000
 * @default 0

 * @param 窗口边框透明度
 * @desc 窗口边框的透明度(0-255),为0时隐藏边框
 * @type number
 * @min 0
 * @max 100000
 * @default 255
*/
(() => {
    var parameters = PluginManager.parameters('PY_WindowMessage');
    var PY_MessagShowStart = String(parameters['初始显示窗口']);
    var PY_WindowMessage_X = Number(parameters['窗口位置x']);
    var PY_WindowMessage_Y = Number(parameters['窗口位置y']);
    var PY_WindowMessage_WidthInput = Number(parameters['窗口宽度']);
    var PY_WindowMessage_HeightInput = Number(parameters['窗口高度']);
    var PY_WindowMessage_Vb = Number(parameters['显示的变量']);
    var PY_WindowMessage_Opacity = Number(parameters['窗口边框透明度']);

    if(PY_MessagShowStart === "true" ){
        PY_Message_Show = true;
    }else{
        PY_Message_Show = false;
    }
    var _PY_WindowMessage_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _PY_WindowMessage_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'PY_MessageShow') {
            PY_Message_Show = true;
        }
        if (command === 'PY_MessageHide') {
            PY_Message_Show = false;
        }
 
    };
//=============================================================================
//==============================窗口绘制=======================================
//=============================================================================
    //初始化
    function Window_PY_WindowMessage() {
        this.initialize.apply(this,arguments)
    }
    Window_PY_WindowMessage.prototype = Object.create(Window_Base.prototype);
    Window_PY_WindowMessage.prototype.constructor = Window_PY_WindowMessage;
    Window_PY_WindowMessage.prototype.initialize = function (x, y, width, height) {
        Window_Base.prototype.initialize.call(this, x, y, width, height);
            this._message = '';
            this.refresh();
    };
    //刷新
    Window_PY_WindowMessage.prototype.refresh = function() {
        this.contents.clear();
        this.drawMessage();
        //this.contents.fillRect(0, 0, this.contentsWidth(), this.contentsHeight(), '#ff0000');
    };
    // 是否需要刷新窗口
    Window_PY_WindowMessage.prototype.needsRefresh = function() {
        return this._message !== $gameVariables.value(PY_WindowMessage_Vb);
    };
    //更新
    Window_PY_WindowMessage.prototype.update = function() {
        Window_Base.prototype.update.call(this);
        if(PY_Message_Show){
            if($gameMessage.isBusy()){
                this.opacity = 0;
                this.contentsOpacity = 0;
            }else{
                this.opacity = PY_WindowMessage_Opacity;
                this.contentsOpacity = 255;
            }
        }else{
            this.opacity = 0;
            this.contentsOpacity = 0;
        }
        this.refresh();

    }
    Window_PY_WindowMessage.prototype.drawMessage = function() {
        this._message = $gameVariables.value(PY_WindowMessage_Vb);
        var x = 0;
        var y = 0;
        this.drawTextEx(this._message, x, y);
    };
//=============================================================================
//==============================显示窗口=======================================
//=============================================================================
    //显示窗口
    let PY_Hud_createWindowMessage = Scene_Map.prototype.start;
    Scene_Map.prototype.start = function () {
        PY_Hud_createWindowMessage.call(this);
        this.createWindowMessage();
    };
    Scene_Map.prototype.createWindowMessage = function () {
        var PY_WindowMessage_x = PY_WindowMessage_X;
        var PY_WindowMessage_y = PY_WindowMessage_Y;
        var PY_WindowMessage_Width = PY_WindowMessage_WidthInput;
        var PY_WindowMessage_Height = PY_WindowMessage_HeightInput;
        var PY_text = String($gameVariables.value(PY_WindowMessage_Vb)); 
        var scene = SceneManager._scene;
        scene._WindowMessage = new Window_PY_WindowMessage(PY_WindowMessage_x, PY_WindowMessage_y, PY_WindowMessage_Width, PY_WindowMessage_Height);
        var x = 0;
        var y = 0;
        scene._WindowMessage.drawTextEx(PY_text, x, y);
        scene._WindowMessage.scale.set(1); // 窗口比例
        scene.addChildAt(scene._WindowMessage, 2); // 窗口添加
        
    };
//=============================================================================
//==============================存档和加载=====================================
//=============================================================================
  const _PY_WindowMessage_DataManager_makeSaveContents = DataManager.makeSaveContents;
  DataManager.makeSaveContents = function() {
    var contents = _PY_WindowMessage_DataManager_makeSaveContents.call(this);
    contents.PY_Message_Show = PY_Message_Show;
    return contents;
  };

  const _PY_WindowMessage_DataManager_extractSaveContents = DataManager.extractSaveContents;
  DataManager.extractSaveContents = function(contents) {
    _PY_WindowMessage_DataManager_extractSaveContents.call(this, contents);
    PY_Message_Show = contents.PY_Message_Show;
  };

})();