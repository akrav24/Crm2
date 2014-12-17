function dateToStr(dt, format) {
    var result = ""
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
        case "YYYY-MM-DD":
            result = result.concat(y, "-", m < 10 ? "0" + m : m, "-", d < 10 ? "0" + d : d);
            break;
        default:
            break;
    }
    return result;
}

function sqlPrepare(sql) {
    return sql.replace("dbo.", "").replace("char(max)", "char(8000)");
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
