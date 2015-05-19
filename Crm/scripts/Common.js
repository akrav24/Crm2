inArray = Array.prototype.indexOf ?
    function (arr, val) {
        return arr.indexOf(val) != -1
    } :
    function (arr, val) {
        var i = arr.length
        while (i--) {
            if (arr[i] === val) return true
        }
        return false
    }

function dateToStr(dt, format) {
   var result = ""
    if (dt != undefined) {
        var y = dt.getFullYear();
        var m = dt.getMonth() + 1;
        var d = dt.getDate();
        var h = dt.getHours();
        var n = dt.getMinutes();
        var s = dt.getSeconds();
        var z = dt.getMilliseconds();
        switch (format.toUpperCase()) {
            case "YYYYMMDD HH:NN:SS:ZZZ":
                result = result.concat(y, m < 10 ? "0" + m : m, d < 10 ? "0" + d : d, " ", h < 10 ? "0" + h : h, ":", n < 10 ? "0" + n : n, ":", s < 10 ? "0" + s : s, ":", z < 10 ? "00" + z : (z < 100 ? "0" + z : z));
                break;
            case "YYYY_MM_DD_HH_NN_SS_ZZZ":
                result = result.concat(y, "_", m < 10 ? "0" + m : m, "_", d < 10 ? "0" + d : d, "_", h < 10 ? "0" + h : h, "_", n < 10 ? "0" + n : n, "_", s < 10 ? "0" + s : s, "_", z < 10 ? "00" + z : (z < 100 ? "0" + z : z));
                break;
            case "DD.MM.YYYY HH:NN":
                result = result.concat(d < 10 ? "0" + d : d, ".", m < 10 ? "0" + m : m, ".", y, " ", h < 10 ? "0" + h : h, ":", n < 10 ? "0" + n : n);
                break;
            case "YYYY-MM-DD":
                result = result.concat(y, "-", m < 10 ? "0" + m : m, "-", d < 10 ? "0" + d : d);
                break;
            case "DD/MM/YYYY":
                result = result.concat(d < 10 ? "0" + d : d, "/", m < 10 ? "0" + m : m, "/", y);
                break;
            case "HH:NN:SS:ZZZ":
                result = result.concat(h < 10 ? "0" + h : h, ":", n < 10 ? "0" + n : n, ":", s < 10 ? "0" + s : s, ":", z < 10 ? "00" + z : (z < 100 ? "0" + z : z));
                break;
            case "HH:NN":
                result = result.concat(h < 10 ? "0" + h : h, ":", n < 10 ? "0" + n : n);
                break;
            default:
                break;
        }
    }
    return result;
}

function periodToStr(timeBgn, timeEnd) {
    var timeStr = "";
    if (timeBgn != undefined) {
        timeStr = dateToStr(timeBgn, "DD.MM.YYYY HH:NN");
        if (timeEnd != undefined) {
            timeStr += " - " + dateToStr(timeEnd, "HH:NN");
        }
    }
    return timeStr;
}

function viewParamToHref(value) {
    return value.replace(/\[!\]/g, "?").replace(/\[\^\]/g, "&").replace(/\[~\]/g, "=").replace(/\[\|\]/g, "#");
}

function hrefToViewParam(value) {
    return value.replace(/\?/g, "[!]").replace(/&/g, "[^]").replace(/=/g, "[~]").replace(/#/g, "[|]");
}

function navigateBack(backCount) {
    log("..navigateBack(" + backCount + ")");
    var delay;
    if (!settings.simulator) {
        delay = 51;
    } else {
        delay = 50;
    }
    var delayedBack = function(backCount, i, delay) {
        if (i < backCount) {
            setTimeout(
                function() {
                    //log("....navigateBack view: '" + app.view().id + "'");
                    app.navigate("#:back");
                    delayedBack(backCount, ++i);
                }, 
                delay
            );
        }
    }
    if (backCount > 0) {
        //log("....navigateBack view: '" + app.view().id + "'");
        app.navigate("#:back");
        setTimeout(function() {delayedBack(backCount, 1, delay);}, delay)
    }
}

function navigateBackTo(viewId) {
    log("..navigateBackTo(" + viewId + ")");
    var maxStayCount = 10;
    var initialViewId = "views/Login.html";
    var srcViewId = app.view().id;
    var delay;
    if (!settings.simulator) {
        delay = 51;
    } else {
        delay = 50;
    }
    var delayedBack = function(viewId, curViewId, delay, stayCount) {
        if (app.view().id != initialViewId && app.view().id != viewId) {
            if (app.view().id != curViewId) {
                curViewId = app.view().id;
                stayCount = 0;
                app.navigate("#:back");
            } else {
                stayCount++;
            }
            if (stayCount < maxStayCount) {
                setTimeout(function() {delayedBack(viewId, curViewId, delay, stayCount);}, delay);
            } else {
                app.navigate(initialViewId);
            }
        }
    }
    if (srcViewId != initialViewId && srcViewId != viewId) {
        app.navigate("#:back");
        setTimeout(function() {delayedBack(viewId, srcViewId, delay, 0);}, delay)
    }
}

function sqlDateToDate(sqlDate) {
    //log("..sqlDateToDate(" + sqlDate + ")");
    var dt = null;
    if (sqlDate != undefined) {
        var y = sqlDate.substring(0, 4);
        var m = sqlDate.substring(4, 6);
        var d = sqlDate.substring(6, 8);
        var h = sqlDate.substring(9, 11);
        var n = sqlDate.substring(12, 14);
        var s = sqlDate.substring(15, 17);
        var z = sqlDate.substring(18, 21);
        dt = new Date(y, m - 1, d, h, n, s, z);
    }
    //log("....dt=" + dt);
    return dt;
}

function dateToSqlDate(dt) {
    //log("..dateToSqlDate(" + dt + ")");
    var sqlDate = null;
    if (dt != undefined) {
        sqlDate = dateToStr(dt, "YYYYMMDD HH:NN:SS:ZZZ");
    }
    //log("....sqlDate=" + sqlDate);
    return sqlDate;
}

function inputDateToDate(inputDt) {
    //log("..inputDateToDate(" + inputDt + ")");
    var dt = null;
    if (inputDt != undefined) {
        if (inputDt.length === 10 && inputDt.substring(4, 5) == "-" && inputDt.substring(7, 8) == "-") {
            var y = inputDt.substring(0, 4);
            var m = inputDt.substring(5, 7);
            var d = inputDt.substring(8, 10);
            dt = new Date(y, m - 1, d);
        }
    }
    return dt;
}

function dateToInputDate(dt) {
    //log("..dateToInputDate(" + dt + ")");
    var inputDate = null;
    if (dt != undefined) {
        inputDate = dateToStr(dt, "YYYY-MM-DD");
    }
    //log("....inputDate=" + inputDate);
    return inputDate;
}

function sqlPrepare(sql) {
    return sql.replace(/dbo\./g, "").replace(/char\(max\)/g, "char(8000)");
}

/*function listNextItem(header, tail, separator) {
    var i = tail.indexOf(separator);
    if (i >= 0) {
        header = tail.substring(0, i);
        tail = tail.substring(i + 1);
    } else {
        header = tail;
        tail = "";
    }
}
*/

function renderListView(rs, viewSelector) {
    var data = dbTools.rsToJson(rs);
    var dataSource = new kendo.data.DataSource({data: data});
    $(viewSelector).data("kendoMobileListView").setDataSource(dataSource);
    app.scroller().reset();
}

function showControl(controlSelector, visible) {
    if (visible) {
        $(controlSelector).removeClass("hidden");
    } else {
        $(controlSelector).addClass("hidden");
    }
}

function viewTitleSet(view, title) {
    view.header.find(".km-navbar").data("kendoMobileNavBar").title(title);
}

function windowOrientation() {
    log("....window.orientation=" + window.orientation);
    return inArray([0, 180], window.orientation);
}

function translit(str, v) {
    log("..translit('" + str + "', " + v + ")");
    str=str.toLowerCase().replace(/ /g,'-');
    v = v || 0;
    var tr='a b v g d e ["zh","j"] z i y k l m n o p r s t u f h c ch sh ["shh","shch"] ~ y ~ e yu ya ~ ["jo","e"] ~ g e ~ i ji'.split(' ');
    var ww=''; 
    for(i=0; i<str.length; ++i) {
        var cc=str.charCodeAt(i); 
        var ch=(cc>=1072?tr[cc-1072]:str[i]);
        if(ch.length<3) ww+=ch; else ww+=eval(ch)[v];
    }
    return(ww.replace(/~/g,''));
}
