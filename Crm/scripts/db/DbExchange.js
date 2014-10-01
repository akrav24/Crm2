dbTools.exchangeBlockIdGet = function(nodeId) {
    var blockId = 0;
    var url = dbTools.serverUrl(serverName, port) + "Api/ExchangeStart/?nodeId=" + nodeId;
    $.ajax({
        async: false,
        type: "GET",
        url: url,
        dataType: "json",
        success: function(data) {
            if (data.length !== 0) {
                blockId = data[0].blockId;
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            dbTools.exchangeError("Внутренняя ошибка: jqXHR.responseText='" + jqXHR.responseText + "', textStatus='" + textStatus + "', errorThrown='" + errorThrown + "'");
            //dbTools.exchangeError("Ajax Get Error: " + url);
        }
    });
    return blockId;
}

dbTools.exchangeDataGet = function(blockId) {
    var res = [];
    var url = dbTools.serverUrl(serverName, port) + "Api/Exchange/?blockId=" + blockId;
    $.ajax({
        async: false,
        type: "GET",
        url: url,
        dataType: "json",
        success: function(data) {
            res = data;
        },
        error: function (jqXHR, textStatus, errorThrown) {
            dbTools.exchangeError("Внутренняя ошибка: jqXHR.responseText='" + jqXHR.responseText + "', textStatus='" + textStatus + "', errorThrown='" + errorThrown + "'");
            //dbTools.exchangeError("Ajax Get Error: " + url);
        }
    });
    return res;
}

dbTools.exchangeDataPost = function(blockId, data) {
    var url = dbTools.serverUrl(serverName, port) + "Api/Exchange/?blockId=" + blockId;
    $.ajax({
        type: "POST",
        url: url,
        contentType: "application/json",
        data: JSON.stringify(data),
        error: function (jqXHR, textStatus, errorThrown) {
            dbTools.exchangeError("Внутренняя ошибка: jqXHR.responseText='" + jqXHR.responseText + "', textStatus='" + textStatus + "', errorThrown='" + errorThrown + "'");
            //dbTools.exchangeError("Ajax Post Error: " + url);
        }
    }).done(function() {log("Data sent:"); log(JSON.stringify(data));});
}

dbTools.exchangeError = function(errorMsg) {
    log(errorMsg);
}

dbTools.exchange = function(nodeId) {
    var blockId = dbTools.exchangeBlockIdGet(nodeId);
    log("blockId: " + blockId);
    
    var dataIn = dbTools.exchangeDataGet(blockId);
    log("insert into MailBlockDataIn begin");
    dbTools.db.transaction(function(tx) {
        $.each(dataIn, function(i, item) {
            tx.executeSql("INSERT INTO MailBlockDataIn (blockId, irow, data) VALUES(?, ?, ?)", [item.blockId, item.irow, item.data]
                , function(tx, result) {if (i == dataIn.length - 1) {log("insert into MailBlockDataIn done: " + dataIn.length)}}
            );
        });
    }, dbTools.onTransError);
    /*dbTools.db.transaction(function(tx) {
        tx.executeSql("SELECT data FROM MailBlockDataIn WHERE blockId = ? ORDER BY blockId, irow", [blockId], function(tx, rs) {
            var stage = 0;
            for (var i = 0; i < rs.rows.length; i++) {
                var data = rs.rows.item(i)["data"];
                if (data.charAt(0) == "@") {
                    
                } else {
                    
                }
            }
        });
    });
    */
    //dbTools.exchangeDataPost(blockId, dataOut);
}




//-------------------------------------------------
// test exhcange
//-------------------------------------------------

function testGetBlockId() {
    var blockId = dbTools.exchangeBlockIdGet(nodeId);
    log("blockId: " + blockId);
}

function testGetData() {
    var data = dbTools.exchangeDataGet(130);
    log("Row count: " + data.length);
}

function testPostData() {
    var data = [{"blockId":130,"irow":1,"data":"@ExchParm:nodeId, exchDate","EntityKey":null},{"blockId":130,"irow":2,"data":"11,'20141001 13:00:00'","EntityKey":null}];
    dbTools.exchangeDataPost(130, data);
}

function testExchange() {
    dbTools.exchange(nodeId);
    log("exchange");
}

