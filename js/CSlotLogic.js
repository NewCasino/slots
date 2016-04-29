var s_aSession = new Array();

var _aFinalSymbols = new Array();
var _betablePaylineCombo = new Array();
_betablePaylineCombo = _initBetablePaylines();
var _aSymbolWin = new Array();
_aSymbolWin = _initSymbolWin();
var _iNumSymbolFreeSpin = 0;

s_aSession["iTotFreeSpin"] = 0;
s_aSession["iFreeSpinCredits"] = 0;

s_aSession["bBonus"] = 0;
s_aSession["iBonusCredits"] = 0;
    
function _initSettings(){
    s_aSession["iMoney"] = TOTAL_MONEY;
    s_aSession["bonus_prize"] =  BONUS_PRIZE;
    s_aSession["coin_bet"] = COIN_BET;
}

function checkLogin(){

    //STARTING MONEY
    _initSettings();
    _setMinWin();
    return _tryToCheckLogin();
}

function _tryToCheckLogin(){
    //THIS FUNCTION PASS USER MONEY AND BONUS PRIZES FOR THE WHEEL
    var aTmp = new Array();
    for(var i=0;i< _aSymbolWin.length;i++){
        aTmp[i] = _aSymbolWin[i].join(",");
    }
    
    return "res=true&login=true&money="+s_aSession["iMoney"]+"&bonus_prize="+s_aSession["bonus_prize"].join("#")+"&paytable="+
                                                            aTmp.join("#")+"&coin_bet="+s_aSession["coin_bet"].join("#");
}
    
function _setMinWin(){
    //FIND MIN WIN
    s_aSession["min_win"] = _aSymbolWin[0][_aSymbolWin[0].length-1];
    for(var i=0;i<_aSymbolWin.length;i++){
        var aTmp = _aSymbolWin[i];
        for(var j=0;j<aTmp.length;j++){
            if(aTmp[j] !== 0 && aTmp[j] < s_aSession["min_win"]){
                s_aSession["min_win"] = aTmp[j];
            }
        }
    }
}

function _onCallSpin(iCoin, iCurBet, iNumBettingLines){
    //CHECK IF iCurBet IS < DI iMoney OR THERE IS AN INVALID BET
    if(iCurBet > s_aSession["iMoney"]){
        _dieError("INVALID BET: "+iCurBet+",money:"+s_aSession["iMoney"]);
        return;
    }
    s_aSession["bBonus"] = 0;
    //Create JSON data containing wager and paylines for request
    var paylines = [];
    for (var i = 0; i < iNumBettingLines; i++) {
        paylines.push(_betablePaylineCombo[i]);
    }
    var wage = parseFloat(iCurBet).toFixed(2).toString();
    var economy = betable.demoMode ? 'sandbox' : 'real';

    if(s_aSession["iTotFreeSpin"] > 0) {
        //Make a betable credit bet
        betable.betCredits(GAME_ID, GAME_ID, {
            wager: wage
            ,paylines: paylines
            ,currency: 'GBP'
            ,economy: economy
        }, function success(data){
            console.log("Freespin Spin:");
            console.log(data);

            var slotWindow = data.window;
            var slotPayouts = data.payout;
            var slotOutcome = data.outcomes;

            var walletResults;
            var game = [GAME_ID,BONUS_ID];
            betable.wallet(game, function(data){
                walletResults = betable.demoMode ? data.sandbox : data.real;
                s_aSession["iFreeSpinCredits"] = walletResults.credits[GAME_ID];
                s_aSession["iBonusCredits"] = walletResults.credits[BONUS_ID];
                s_aSession["iMoney"] = walletResults.balance;

                var aScatterCellList = new Array();
                //Determine symbols to display in final results
                for (var i = 0; i < slotWindow.length; i++) {
                    _aFinalSymbols[i] = new Array();
                    var slotRowResults = slotWindow[i];
                    for (var j = 0; j < slotRowResults.length; j++) {
                        if(slotRowResults[j] == "bonus"){
                            _aFinalSymbols[i][j] = "9";
                        }
                        else if(slotRowResults[j] == "scatter"){
                            _aFinalSymbols[i][j] = "10";
                            aScatterCellList.push({row:i,col:j,value:"10"});
                        }
                        else if(slotRowResults[j] == "wild"){
                            _aFinalSymbols[i][j] = "11";
                        }
                        else{
                            _aFinalSymbols[i][j] = slotRowResults[j].substring(6);
                        }
                    };
                };
                var _aWinningLine = new Array();
                var win = false;
                
                //Find each line that has a win outcome
                for(var i = 0; i < slotOutcome.length; i++){
                    var outcomeObject = slotOutcome[i];
                    if (outcomeObject.outcome == "win") {
                        win = true;
                        if(i == (slotOutcome.length-1)){
                            _aWinningLine.push({line:slotOutcome.length,list:aScatterCellList});
                        }
                        else{
                            var aCellList = new Array();
                            var payline = new Array();
                            payline = outcomeObject.payline;
                            var symbols = new Array();
                            symbols = outcomeObject.symbols;
                            for(var k = 0; k < payline.length; k++){
                                if(symbols[k] == "bonus"){
                                    aCellList.push({row:payline[k],col:k,value:"9"});
                                }
                                else if(symbols[k] == "scatter"){
                                    aCellList.push({row:payline[k],col:k,value:"10"});
                                }
                                else if(symbols[k] == "wild"){
                                    aCellList.push({row:payline[k],col:k,value:"11"});
                                }
                                else{
                                    aCellList.push({row:payline[k],col:k,value:symbols[k].substring(6)});
                                }
                            }
                            _aWinningLine.push({line:i+1,list:aCellList});
                        }
                    };
                };
                if(s_aSession["iFreeSpinCredits"] > 0){
                    s_aSession["iTotFreeSpin"] = s_aSession["iFreeSpinCredits"] / parseFloat(iCurBet);
                }
                else{
                    s_aSession["iTotFreeSpin"] = 0;
                }
                
                var iPrizeReceived = -1;
                //Find a bonus spin outcome
                if(s_aSession["iBonusCredits"] > 0){
                    win = true;
                    var wage = parseFloat(s_aSession["iBonusCredits"]).toFixed(2).toString();
                    var economy = betable.demoMode ? 'sandbox' : 'real';
                    // Make a bonus bet
                    betable.betCredits(GAME_ID, BONUS_ID, {
                        wager: wage
                        ,currency: 'GBP'
                        ,economy: economy
                    }, function success(data){
                        console.log("Freespin Bonus Spin:");
                        console.log(data);
                        iPrizeReceived = parseFloat(data.payout).toFixed(2);
                        s_aSession["bBonus"] = 1;
                        var walletResults;
                        var game = [GAME_ID,BONUS_ID];
                        betable.wallet(game, function(data){
                            console.log(data.sandbox);
                            walletResults = betable.demoMode ? data.sandbox : data.real;
                            s_aSession["iMoney"] = walletResults.balance;
                            var oData = "res=true&win=true&pattern="+JSON.stringify(_aFinalSymbols)+"&win_lines="+JSON.stringify(_aWinningLine)+"&money="+s_aSession["iMoney"]+"&tot_win="+slotPayouts+"&freespin="+s_aSession["iTotFreeSpin"]+"&bonus="+s_aSession["bBonus"]+"&bonus_prize="+iPrizeReceived;
                            //Display outcome in the game
                            var oRetData = getUrlVars(oData);
                            if ( oRetData.res === "true" ){
                                s_oGame.onSpinReceived(oRetData);
                            }else{
                                s_oMsgBox.show(oRetData.desc);
                            }
                        }, function(data){
                            alert("Error: " +data.description);
                        });
                    }, function error(data){
                        alert("The following error has occured while making a bet: " +data.description);
                    });
                }
                else{
                    var walletResults;
                    var game = [GAME_ID,BONUS_ID];
                    betable.wallet(game, function(data){
                        console.log(data.sandbox);
                        walletResults = betable.demoMode ? data.sandbox : data.real;
                        s_aSession["iMoney"] = walletResults.balance;
                        var oData;
                        //Win outcome
                        if (win) {
                            oData = "res=true&win=true&pattern="+JSON.stringify(_aFinalSymbols)+"&win_lines="+JSON.stringify(_aWinningLine)+"&money="+s_aSession["iMoney"]+"&tot_win="+slotPayouts+"&freespin="+s_aSession["iTotFreeSpin"]+"&bonus="+s_aSession["bBonus"]+"&bonus_prize="+iPrizeReceived;
                        }
                        //Lose outcome
                        else{
                            oData = "res=true&win=false&pattern="+JSON.stringify(_aFinalSymbols)+"&money="+s_aSession["iMoney"]+"&freespin="+s_aSession["iTotFreeSpin"];
                        }
                        //Display outcome in the game
                        var oRetData = getUrlVars(oData);
                        if ( oRetData.res === "true" ){
                            s_oGame.onSpinReceived(oRetData);
                        }else{
                            s_oMsgBox.show(oRetData.desc);
                        }
                    }, function(data){
                        alert("Error: " +data.description);
                    });
                }
            }, function(data){
                alert("Error: " +data.description);
            });
        }, function error(data){
            alert("The following error has occured while making a credit bet: " +data.description);
        });
    }
    else{
        //Make a betable bet on the game
        betable.bet(GAME_ID, {
            wager: wage
            ,paylines: paylines
            ,currency: 'GBP'
            ,economy: economy
        }, function success(data){
            var slotWindow = data.window;
            var slotPayouts = data.payout;
            var slotOutcome = data.outcomes;

            var walletResults;
            var game = [GAME_ID,BONUS_ID];
            betable.wallet(game, function(data){
                walletResults = betable.demoMode ? data.sandbox : data.real;
                s_aSession["iFreeSpinCredits"] = walletResults.credits[GAME_ID];
                s_aSession["iBonusCredits"] = walletResults.credits[BONUS_ID];
                s_aSession["iMoney"] = walletResults.balance;

                var aScatterCellList = new Array();
                //Determine symbols to display in final results
                for (var i = 0; i < slotWindow.length; i++) {
                    _aFinalSymbols[i] = new Array();
                    var slotRowResults = slotWindow[i];
                    for (var j = 0; j < slotRowResults.length; j++) {
                        if(slotRowResults[j] == "bonus"){
                            _aFinalSymbols[i][j] = "9";
                        }
                        else if(slotRowResults[j] == "scatter"){
                            _aFinalSymbols[i][j] = "10";
                            aScatterCellList.push({row:i,col:j,value:"10"});
                        }
                        else if(slotRowResults[j] == "wild"){
                            _aFinalSymbols[i][j] = "11";
                        }
                        else{
                            _aFinalSymbols[i][j] = slotRowResults[j].substring(6);
                        }
                    };
                };
                var _aWinningLine = new Array();
                var win = false;
                
                //Find each line that has a win outcome
                for(var i = 0; i < slotOutcome.length; i++){
                    var outcomeObject = slotOutcome[i];
                    if (outcomeObject.outcome == "win") {
                        win = true;
                        if(i == (slotOutcome.length-1)){
                            _aWinningLine.push({line:slotOutcome.length,list:aScatterCellList});
                        }
                        else{
                            var aCellList = new Array();
                            var payline = new Array();
                            payline = outcomeObject.payline;
                            var symbols = new Array();
                            symbols = outcomeObject.symbols;
                            for(var k = 0; k < payline.length; k++){
                                if(symbols[k] == "bonus"){
                                    aCellList.push({row:payline[k],col:k,value:"9"});
                                }
                                else if(symbols[k] == "scatter"){
                                    aCellList.push({row:payline[k],col:k,value:"10"});
                                }
                                else if(symbols[k] == "wild"){
                                    aCellList.push({row:payline[k],col:k,value:"11"});
                                }
                                else{
                                    aCellList.push({row:payline[k],col:k,value:symbols[k].substring(6)});
                                }
                            }
                            _aWinningLine.push({line:i+1,list:aCellList});
                        }
                    };
                };
                if(s_aSession["iFreeSpinCredits"] > 0){
                    s_aSession["iTotFreeSpin"] = s_aSession["iFreeSpinCredits"] / parseFloat(iCurBet);
                }
                else{
                    s_aSession["iTotFreeSpin"] = 0;
                }
                
                var iPrizeReceived = -1;
                //Find a bonus spin outcome
                if(s_aSession["iBonusCredits"] > 0){
                    win = true;
                    var wage = parseFloat(s_aSession["iBonusCredits"]).toFixed(2).toString();
                    var economy = betable.demoMode ? 'sandbox' : 'real';
                    // Make a bonus bet
                    betable.betCredits(GAME_ID, BONUS_ID, {
                        wager: wage
                        ,currency: 'GBP'
                        ,economy: economy
                    }, function success(data){
                        iPrizeReceived = parseFloat(data.payout).toFixed(2);
                        s_aSession["bBonus"] = 1;
                        var walletResults;
                        var game = [GAME_ID,BONUS_ID];
                        betable.wallet(game, function(data){
                            walletResults = betable.demoMode ? data.sandbox : data.real;
                            s_aSession["iMoney"] = walletResults.balance;
                            var oData = "res=true&win=true&pattern="+JSON.stringify(_aFinalSymbols)+"&win_lines="+JSON.stringify(_aWinningLine)+"&money="+s_aSession["iMoney"]+"&tot_win="+slotPayouts+"&freespin="+s_aSession["iTotFreeSpin"]+"&bonus="+s_aSession["bBonus"]+"&bonus_prize="+iPrizeReceived;
                            //Display outcome in the game
                            var oRetData = getUrlVars(oData);
                            if ( oRetData.res === "true" ){
                                s_oGame.onSpinReceived(oRetData);
                            }else{
                                s_oMsgBox.show(oRetData.desc);
                            }
                        }, function(data){
                            alert("Error: " +data.description);
                        });
                    }, function error(data){
                        alert("The following error has occured while making a bet: " +data.description);
                    });
                }
                else{
                    var walletResults;
                    var game = [GAME_ID,BONUS_ID];
                    betable.wallet(game, function(data){
                        console.log(data.sandbox);
                        walletResults = betable.demoMode ? data.sandbox : data.real;
                        s_aSession["iMoney"] = walletResults.balance;
                        var oData;
                        //Win outcome
                        if (win) {
                            oData = "res=true&win=true&pattern="+JSON.stringify(_aFinalSymbols)+"&win_lines="+JSON.stringify(_aWinningLine)+"&money="+s_aSession["iMoney"]+"&tot_win="+slotPayouts+"&freespin="+s_aSession["iTotFreeSpin"]+"&bonus="+s_aSession["bBonus"]+"&bonus_prize="+iPrizeReceived;
                        }
                        //Lose outcome
                        else{
                            oData = "res=true&win=false&pattern="+JSON.stringify(_aFinalSymbols)+"&money="+s_aSession["iMoney"]+"&freespin="+s_aSession["iTotFreeSpin"];
                        }
                        //Display outcome in the game
                        var oRetData = getUrlVars(oData);
                        if ( oRetData.res === "true" ){
                            s_oGame.onSpinReceived(oRetData);
                        }else{
                            s_oMsgBox.show(oRetData.desc);
                        }
                    }, function(data){
                        alert("Error: " +data.description);
                    });
                }
            }, function(data){
                alert("Error: " +data.description);
            });
        }, function error(data){
            alert("The following error has occured while making a bet: " +data.description)
        });
    }
};

function _initBetablePaylines(){
    //STORE ALL INFO ABOUT BETABLE PAYLINES
    //[1,1,1,1,1] is a horizontal line through the second row
    //[0,1,2,3,4] is a diagonal line from top left to bottom right

    _betablePaylineCombo[0] = [1,1,1,1,1];
    _betablePaylineCombo[1] = [0,0,0,0,0];
    _betablePaylineCombo[2] = [2,2,2,2,2];
    _betablePaylineCombo[3] = [0,1,2,1,0];
    _betablePaylineCombo[4] = [2,1,0,1,2];
    _betablePaylineCombo[5] = [1,0,0,0,1];
    _betablePaylineCombo[6] = [1,2,2,2,1];
    _betablePaylineCombo[7] = [0,0,1,2,2];
    _betablePaylineCombo[8] = [2,2,1,0,0];
    _betablePaylineCombo[9] = [1,0,1,2,1];
    _betablePaylineCombo[10] = [1,2,1,0,1];
    _betablePaylineCombo[11] = [0,1,1,1,0];
    _betablePaylineCombo[12] = [2,1,1,1,2];
    _betablePaylineCombo[13] = [0,1,0,1,0];
    _betablePaylineCombo[14] = [2,1,2,1,2];
    _betablePaylineCombo[15] = [1,1,0,1,1];
    _betablePaylineCombo[16] = [1,1,2,1,1];
    _betablePaylineCombo[17] = [0,0,1,0,0];
    _betablePaylineCombo[18] = [2,2,1,2,2];
    _betablePaylineCombo[19] = [1,2,1,2,1];

    return _betablePaylineCombo;
};
	
//THIS FUNCTION INIT WIN FOR EACH SYMBOL COMBO
//EXAMPLE: _aSymbolWin[0] = array(0,0,20,25,30) MEANS THAT
//CHERRY SYMBOL GIVES THE FOLLOWING PRIZE FOR:
//COMBO 1 : 0$
//COMBO 2 : 0$
//COMBO 3 : 20$
//COMBO 4 : 25$
//COMBO 5 : 30$
function _initSymbolWin(){
    _aSymbolWin[0] = [0,0,90,150,200];
    _aSymbolWin[1] = [0,0,80,110,160];
    _aSymbolWin[2] = [0,0,70,100,150];
    _aSymbolWin[3] = [0,0,50,80,110];
    _aSymbolWin[4] = [0,0,40,60,80];
    _aSymbolWin[5] = [0,0,30,50,70];
    _aSymbolWin[6] = [0,0,20,30,50];
    _aSymbolWin[7] = [0,0,0,0,0,50];
    _aSymbolWin[8] = [0,0,0,0,0,50];
    _aSymbolWin[9] = [0,0,0,0,0,50];

    return _aSymbolWin;
};

function shuffle(aArray){
    for(var j, x, i = aArray.length; i; j = Math.floor(Math.random() * i), x = aArray[--i], aArray[i] = aArray[j], aArray[j] = x);
    return aArray;
}

function _dieError( szReason){
    return "res=false&desc="+szReason;
}   