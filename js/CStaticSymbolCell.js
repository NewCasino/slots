function CStaticSymbolCell(iRow,iCol,iXPos,iYPos){
    
    var _iRow;
    var _iCol;
    var _iCurSpriteAnimating = -1;
    var _iLastAnimFrame;
    var _aSprites;
    var _oContainer;
    
    this._init = function(iRow,iCol,iXPos,iYPos){
        _iRow = iRow;
        _iCol = iCol;
        
        _oContainer = new createjs.Container();
        _oContainer.visible = false;
        
        var oParent= this;
        _aSprites = new Array();
        for(var i=0;i<NUM_SYMBOLS;i++){
            var oSprite = createSprite(s_aSymbolAnims[i], "static",0,0,SYMBOL_SIZE,SYMBOL_SIZE);
            oSprite.stop();
            oSprite.x = iXPos;
            oSprite.y = iYPos;
            oSprite.on("animationend", oParent._onAnimEnded, null, false, {index:i});
            _oContainer.addChild(oSprite);
            
            _aSprites[i] = oSprite;
            _aSprites[i].visible = false;
        }
        
        s_oAttachSection.addChild(_oContainer);
    };
    
    this.unload = function(){
        s_oAttachSection.removeChild(_oContainer);
    };
    
    this.hide = function(){
         if(_iCurSpriteAnimating > -1){
            _aSprites[_iCurSpriteAnimating].gotoAndPlay("static");
            _oContainer.visible = false;
        }
    };
    
    this.show = function(iValue){
        _aSprites[iValue-1].visible = true;
        _aSprites[iValue-1].gotoAndPlay("anim");
        _iCurSpriteAnimating = iValue-1;
        _iLastAnimFrame = _aSprites[iValue-1].spriteSheet.getNumFrames();
        
        _oContainer.visible = true;
    };
    
    this._onAnimEnded = function(evt,oData){
        if(_aSprites[oData.index].currentFrame === _iLastAnimFrame){
            return;
        }
        _aSprites[oData.index].stop();
        setTimeout(function(){_aSprites[oData.index].gotoAndPlay(1);},100);
    };
    
    this.stopAnim = function(){
       _aSprites[_iCurSpriteAnimating].gotoAndStop("static");
       _aSprites[_iCurSpriteAnimating].visible = false;
    };
    
    this._init(iRow,iCol,iXPos,iYPos);
}