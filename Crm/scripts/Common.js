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
        case "YYYY_MM_DD_HH_NN_SS_ZZZ":
            result = result.concat(y, "_", m < 10 ? "0" + m : m, "_", d < 10 ? "0" + d : d, "_", h < 10 ? "0" + h : h, "_", n < 10 ? "0" + n : n, "_", s < 10 ? "0" + s : s, "_", z < 10 ? "00" + z : (z < 100 ? "0" + z : z));
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
        default:
            break;
    }
    return result;
}

function sqlDateToDate(sqlDate) {
    var y = sqlDate.substring(0, 4);
    var m = sqlDate.substring(4, 6);
    var d = sqlDate.substring(6, 8);
    return new Date(y, m - 1, d);
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
