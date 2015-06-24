var visitTaskList;
var visitTaskItem;

//----------------------------------------
// visit-task-list-view
//----------------------------------------

function visitTaskInit(e) {
    log("..visitTaskInit");
    visitTaskObjInit();
}
 
function visitTaskShow(e) {
    log("..visitTaskShow navBackCount=" + e.view.params.navBackCount);
    visitTaskList.navBackCount = e.view.params.navBackCount;
    if (visitTaskList.navBackCount < 1) {
        visitTaskList.navBackCount = 1;
    }

    renderVisitTask(visit.dateBgn, visit.custId, settings.skuCatId);
}

function renderVisitTask(dateBgn, custId, skuCatId) {
    dbTools.visitTaskListGet(dateBgn, custId, skuCatId, renderVisitTaskView);
}

function renderVisitTaskView(tx, rs) {
    log("..renderVisitTaskView");
    var data = dbTools.rsToJson(rs);
    var dataSource = new kendo.data.DataSource({data: data});
    $("#visit-task-list").data("kendoMobileListView").setDataSource(dataSource);
    $(".checkbox").on("ifChecked", visitTaskEditOnCheck);
    $(".checkbox").on("ifUnchecked", visitTaskEditOnUncheck);
    $(".checkbox").iCheck({
        checkboxClass: "icheckbox_flat-green",
        radioClass: "iradio_flat-green",
        increaseArea: "100%" // optional
    });
    visitTaskEnableControls();
    app.scroller().reset();
}

function visitTaskEnableControls() {
    log("..visitTaskEnableControls");
    if (visit.readonly) {
        $(".checkbox").iCheck("disable");
    }
}

function visitTaskNavBackClick(e) {
    log("..visitTaskNavBackClick");
    navigateBack(visitTaskList.navBackCount);
}

function visitTaskEditOnCheck() {
    dbTools.visitTaskDoneUpdate(visit.visitId, settings.skuCatId, $(this).attr("data-task-id"), 1, undefined, dbTools.onSqlError);
    dbTools.objectListItemSet("visit-list", true);
}

function visitTaskEditOnUncheck() {
    dbTools.visitTaskDoneUpdate(visit.visitId, settings.skuCatId, $(this).attr("data-task-id"), 0, undefined, dbTools.onSqlError);
    dbTools.objectListItemSet("visit-list", true);
}

//----------------------------------------
// visit-task-edit-view
//----------------------------------------

function visitTaskEditInit(e) {
    log("..visitTaskEditInit");
}

function visitTaskEditShow(e) {
    log("..visitTaskEditShow taskId=" + e.view.params.taskId);
    visitTaskItem.taskId = e.view.params.taskId;
    dbTools.visitTaskGet(visit.visitId, settings.skuCatId, visitTaskItem.taskId, renderVisitTaskEditView);
}

function renderVisitTaskEditView(tx, rs) {
    log("..renderVisitTaskEditView");
    visitTaskItem.isEdited = false;
    if (rs.rows.length > 0) {
        visitTaskItem.taskId = rs.rows.item(0).taskId;
        visitTaskItem.descr = rs.rows.item(0).descr;
        visitTaskItem.done = rs.rows.item(0).done;
        visitTaskItem.note = rs.rows.item(0).note;
    }
    visitTaskEditFillControls();
    visitTaskEditEnableControls();
    //app.scroller().reset();
}

function visitTaskEditFillControls() {
    log("..visitTaskEditFillControls");
    $("#visit-task-edit-descr").text(visitTaskItem.descr);
    $("#visit-task-edit-done").prop("checked", !!visitTaskItem.done);
    $("#visit-task-edit-note").val(visitTaskItem.note);
}

function visitTaskEditEnableControls() {
    log("..visitTaskEditEnableControls");
    if (!visit.readonly) {
        if (visitTaskItem.isEdited) {
            $("#visit-task-edit-save-button").removeClass("hidden");
            $("#visit-task-edit-del-button").addClass("hidden");
        } else {
            if (visitTaskItem.done == null) {
                $("#visit-task-edit-save-button").removeClass("hidden");
                $("#visit-task-edit-del-button").addClass("hidden");
            } else {
                $("#visit-task-edit-save-button").addClass("hidden");
                $("#visit-task-edit-del-button").removeClass("hidden");
            }
        }
    } else {
        $("#visit-task-edit-save-button").addClass("hidden");
        $("#visit-task-edit-del-button").addClass("hidden");
    }
    $(".editable").prop("readonly", visit.readonly);
    $("#visit-task-edit-done").prop("disabled", visit.readonly);
}

function visitTaskEditNavBackClick(e) {
    log("..visitTaskEditNavBackClick");
    navigateBack(1);
}

function visitTaskEditSaveClick(e) {
    log("..visitTaskEditSaveClick");
    visitTaskEditSave(function() {navigateBackTo("views/VisitTask.html");});
}

function visitTaskEditDelClick(e) {
    log("..visitTaskEditDelClick");
    visitTaskEditDel(function() {navigateBackTo("views/VisitTask.html");});
}

function visitTaskEditSave(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    dbTools.visitTaskUpdate(visit.visitId, settings.skuCatId, visitTaskItem.taskId, visitTaskItem.done, visitTaskItem.note, 
        function(visitId, skuCatId, taskId) {if (onSuccess != undefined) {onSuccess(visitId, skuCatId, taskId);}}, 
        dbTools.onSqlError
    );
}

function visitTaskEditDel(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    dbTools.visitTaskUpdate(visit.visitId, settings.skuCatId, visitTaskItem.taskId, null, null, 
        function(visitId, skuCatId, taskId) {if (onSuccess != undefined) {onSuccess(visitId, skuCatId, taskId);}}, 
        dbTools.onSqlError
    );
}

function visitTaskEditControlChange(id, value) {
    log("..visitTaskEditControlChange('" + id + "', '" + value + "')");
    var val = value != "" ? value : null;
    visitTaskItem.isEdited = true;
    switch (id) {
        case "visit-task-edit-done":
            visitTaskItem.done = val ? 1 : 0;
            break;
        case "visit-task-edit-note":
            visitTaskItem.note = val;
            break;
    }
    visitTaskEditEnableControls();
}

//----------------------------------------
// common
//----------------------------------------

function visitTaskObjInit() {
    visitTaskList = {};
    visitTaskList.navBackCount = 1;
    visitTaskItem = {};
    visitTaskItem.isEdited = false;
    visitTaskItem.taskId = 0;
    visitTaskItem.descr = null;
    visitTaskItem.done = null;
    visitTaskItem.note = null;
}

