function CWheelBonus(iX, iY,oParentContainer){
    
    var _aText;
    var _aColors;
    var _aPrize;
    
    var _oWheel;
    var _oBg;
    var _oTextContainer;
    var _oSpinSound;
    var _oParentContainer;
    
    this._init = function(iX, iY){    
        
        _aText = new Array();
        _aColors = new Array();
        
        _aPrize = new Array();
        for(var i=0; i<WHEEL_SETTINGS.length; i++){
            _aPrize[i] = WHEEL_SETTINGS[i];
        }

        this._initColors();
        
        var oSprite = s_oSpriteLibrary.getSprite('bg_bonus');

        _oBg = new createjs.Container();
        _oBg.x = iX;
        _oBg.y = iY;
        _oParentContainer.addChild(_oBg);

        _oTextContainer = new createjs.Container();
        _oTextContainer.x = iX;
        _oTextContainer.y = iY;
        _oParentContainer.addChild(_oTextContainer);

        _oWheel = createBitmap(oSprite);
        _oWheel.regX = 690;
        _oWheel.regY = 320;

        _oBg.addChild(_oWheel);

        this.setText(1);

    };
 
    this.unload = function(){
        _oParentContainer.removeChild(_oBg); 
        _oParentContainer.removeChild(_oTextContainer);
    };
    
    this._initColors = function(){
        for(var i=0; i<=360; i++){
            _aColors[i] = "white";
        }
    };
    
    this.setText = function(iMultiply){
        var oStartTextPos = {x: -210, y: 3};
        var vVect = new CVector2(oStartTextPos.x, oStartTextPos.y);
        var iLocalRot = SEGMENT_ROT;
        var iRotation =  (Math.PI*SEGMENT_ROT)/180;        
        
        for(var i=0; i<_aPrize.length; i++ ){ 
            
            _aText[i] = new CFormatText(vVect.getX(), vVect.getY(), TEXT_CURRENCY + _aPrize[i]*iMultiply, _oTextContainer);
            _aText[i].rotateText(-iLocalRot*i);
            
            rotateVector2D(iRotation,vVect);           
        }
    };
    
    this.clearText = function(){
        for(var i=0; i<_aPrize.length; i++ ){ 
            
            _aText[i].unload();
           
        }
    };
    
    this.spin = function(iValue,iTimeMult){
        if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){
           playSound("start_reel_bonus",1,0);
           _oSpinSound = playSound("reel_bonus",1,-1);
        }
		
        createjs.Tween.get(_oTextContainer).to({rotation:_oTextContainer.rotation + iValue}, WHEEL_SPIN_TIMESPEED*iTimeMult, createjs.Ease.quartOut)//cubicOut
                .call(function(){_oTextContainer.rotation %= 360; s_oBonusPanel.wheelArrived(); if(DISABLE_SOUND_MOBILE === false || s_bMobile === false){_oSpinSound.stop();}});
    };
    
    this.getDegree = function(){
        return _oTextContainer.rotation;
    };
    
    this.getColor = function(){
        var iDeg = Math.round(_oTextContainer.rotation);
        return _aColors[iDeg];
    };
    
    _oParentContainer = oParentContainer;
    
    this._init(iX, iY);
    
}