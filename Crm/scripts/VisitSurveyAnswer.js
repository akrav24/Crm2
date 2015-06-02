var visitSurveyAnswerList;
var visitSurveyAnswerItem;

//----------------------------------------
// visit-survey-answer-view
//----------------------------------------

function visitSurveyAnswerInit(e) {
    log("..visitSurveyAnswerInit");
    visitSurveyAnswerObjInit();
}

function visitSurveyAnswerShow(e) {
    log("..visitSurveyAnswerShow navBackCount=" + e.view.params.navBackCount + ", surveyId=" + e.view.params.surveyId);
    visitSurveyAnswerList.navBackCount = e.view.params.navBackCount;
    visitSurveyAnswerList.surveyId = e.view.params.surveyId;
    if (visitSurveyAnswerList.navBackCount < 1) {
        visitSurveyAnswerList.navBackCount = 1;
    }

    renderVisitSurveyAnswer(visit.visitId, visitSurveyAnswerList.surveyId);
}

function visitSurveyAnswerAfterShow(e) {
    var viewTitle = "";
    if (visitSurveyAnswerList.surveyId == 1) {
        viewTitle = "Контроль работы мерчандайзеров агенства";
    } else {
        viewTitle = "Контроль работы промоконсультантов";
    }
    viewTitleSet(app.view(), viewTitle);
}

function renderVisitSurveyAnswer(visitId, surveyId) {
    dbTools.visitSurveyAnswerListGet(visitId, surveyId, renderVisitSurveyAnswerView);
}

function renderVisitSurveyAnswerView(tx, rs) {
    log("..renderVisitSurveyAnswerView");
    //var data = visitSurveyAnswerCalcKpi(dbTools.rsToJson(rs));
    var data = dbTools.rsToJson(rs);
    var dataSource = new kendo.data.DataSource({data: data});
    $("#visit-survey-answer-list").data("kendoMobileListView").setDataSource(dataSource);
    visitSurveyAnswerEnableControls();
    app.scroller().reset();
}

function visitSurveyAnswerCalcKpi(data) {
    var res = data;
    for (var i = 0; i < res.length; i++) {
        var kpi = 0;
        if (res[i].isShowKpi == 1 && res[i].treeLvl == 0) {
            for (var j = 0; j < res.length; j++) {
                if (res[j].treeLvl == 2) {
                    kpi += res[j].kpi > 0 ? res[j].kpi : 0;
                }
            }
            res[i].kpi = kpi;
        } else if (res[i].isShowKpi == 1 && res[i].treeLvl == 1) {
            for (var j = 0; j < res.length; j++) {
                if (res[j].treeLvl == 2 && res[j].parentId == res[i].questionId) {
                    kpi += res[j].kpi > 0 ? res[j].kpi : 0;
                }
            }
            res[i].kpi = kpi;
        }
        
    }
    return res;
}

function visitSurveyAnswerNavBackClick(e) {
    log("..visitSurveyAnswerNavBackClick");
    navigateBack(visitSurveyAnswerList.navBackCount);
}

function visitSurveyAnswerEnableControls() {
    log("..visitSurveyAnswerEnableControls");
    $("#visit-survey-answer-view [data-role=switch]").each(function(index, element) {
        $(element).data("kendoMobileSwitch").enable(!visit.readonly);
    });
}

function visitSurveyAnswerSwitchChange(e) {
    var answer = 0;
    if (e.checked) {
        answer = 1;
    }
    var questionId = this.element.attr("data-question-id");
    dbTools.visitSurveyAnswerUpdate(visit.visitId, questionId, ["answer"], [answer], 
        function() {renderVisitSurveyAnswer(visit.visitId, visitSurveyAnswerList.surveyId);}
    );
}

function visitSurveyAnswerStarClick(e, questionId, answer) {
    if (!visit.readonly) {
        dbTools.visitSurveyAnswerUpdate(visit.visitId, questionId, ["answer"], [answer]);
        $("div").filter("[data-question-id=" + questionId + "]").removeClass("color-selected");
        $(e).addClass("color-selected");
    }
}

function visitSurveyAnswerListClick(e) {
    log("..visitSurveyAnswerListClick");
    visitSurveyAnswerItemObjInit();
    copyObjValues(e.dataItem, visitSurveyAnswerItem);
}

//----------------------------------------
// visit-survey-answer-edit-view
//----------------------------------------

function visitSurveyAnswerEditInit(e) {
    log("..visitSkuPriceEditInit");
}

function visitSurveyAnswerEditShow(e) {
    log("..visitSurveyAnswerEditInit");
    dbTools.visitSurveyAnswerGet(visit.visitId, visitSurveyAnswerItem.questionId, renderVisitSurveyAnswerEditView);
}

function renderVisitSurveyAnswerEditView(tx, rs) {
    log("..renderVisitSurveyAnswerEditView");
    visitSurveyAnswerItem.isEdited = false;
    if (rs.rows.length > 0) {
        copyObjValues(rs.rows.item(0), visitSurveyAnswerItem);
    }
    visitSurveyAnswerEditFillControls();
    visitSurveyAnswerEditEnableControls();
}

function visitSurveyAnswerEditFillControls() {
    log("..visitSurveyAnswerEditFillControls");
    $(".visit-survey-answer-edit-name").text(visitSurveyAnswerItem.name);
    if (visitSurveyAnswerItem.answerType == 1) {
        $("#visit-survey-answer-edit-answer-switch").data("kendoMobileSwitch").check(visitSurveyAnswerItem.answer == 1);
    } else {
        visitSurveyAnswerEditRatingSet(visitSurveyAnswerItem.answer);
    }
    $("#visit-survey-answer-edit-note").val(visitSurveyAnswerItem.note);
}

function visitSurveyAnswerEditRatingSet(answer) {
    log("..visitSurveyAnswerEditRatingSet("+ answer + ")");
    $("#visit-survey-answer-edit-view .rating-symbol").removeClass("color-selected");
    if (answer > 0) {
        $("#visit-survey-answer-edit-view .rating-symbol[data-answer-id = " + answer + "]").addClass("color-selected");
    }
}

function visitSurveyAnswerEditRatingGet() {
    var answer = 0;
    
    if ($("#visit-survey-answer-edit-view .rating-symbol.color-selected").data("answer-id") > 0) {
        answer = $("#visit-survey-answer-edit-view .rating-symbol.color-selected").data("answer-id");
    }
    
    return answer;
}

function visitSurveyAnswerEditEnableControls() {
    log("..visitSurveyAnswerEditEnableControls");
    if (!visit.readonly) {
        if (visitSurveyAnswerItem.isEdited) {
            $("#visit-survey-answer-edit-view .edit-save-button").removeClass("hidden");
            $("#visit-survey-answer-edit-view .edit-delete-button").addClass("hidden");
        } else {
            if (visitSurveyAnswerItem.answer == null && visitSurveyAnswerItem.note == null) {
                $("#visit-survey-answer-edit-view .edit-save-button").removeClass("hidden");
                $("#visit-survey-answer-edit-view .edit-delete-button").addClass("hidden");
            } else {
                $("#visit-survey-answer-edit-view .edit-save-button").addClass("hidden");
                $("#visit-survey-answer-edit-view .edit-delete-button").removeClass("hidden");
            }
        }
    } else {
        $("#visit-survey-answer-edit-view .edit-save-button").addClass("hidden");
        $("#visit-survey-answer-edit-view .edit-delete-button").addClass("hidden");
    }
    
    $("#visit-survey-answer-edit-view [data-answer-type = " + visitSurveyAnswerItem.answerType +"]").removeAttr("style");
    $("#visit-survey-answer-edit-view [data-answer-type]").not("[data-answer-type = " + visitSurveyAnswerItem.answerType +"]").attr("style", "display: none;");
    
    $("#visit-survey-answer-edit-view .editable").prop("readonly", visit.readonly);
    $("#visit-survey-answer-edit-view [data-role=switch]").each(function(index, element) {
        $(element).data("kendoMobileSwitch").enable(!visit.readonly);
    });
}

function visitSurveyAnswerEditControlChange(id, value) {
    log("..visitSurveyAnswerEditControlChange('" + id + "', '" + value + "')");
    var val = value != "" ? value : null;
    visitSurveyAnswerItem.isEdited = true;
    switch (id) {
        case "visit-survey-answer-edit-note":
            visitSurveyAnswerItem.note = val;
            break;
    }
    visitSurveyAnswerEditEnableControls();
}

function visitSurveyAnswerEditSwitchChange(e) {
    var answer = 0;
    if (e.checked) {
        answer = 1;
    }
    visitSurveyAnswerItem.isEdited = true;
    visitSurveyAnswerItem.answer = answer;
    visitSurveyAnswerEditEnableControls();
}

function visitSurveyAnswerEditStarClick(e, answer) {
    if (!visit.readonly) {
        visitSurveyAnswerItem.isEdited = true;
        visitSurveyAnswerItem.answer = answer;
        visitSurveyAnswerEditRatingSet(answer);
        visitSurveyAnswerEditEnableControls();
    }
}

function visitSurveyAnswerEditNavBackClick(e) {
    log("..visitSurveyAnswerEditNavBackClick");
    navigateBackTo("views/VisitSurveyAnswer.html");
}

function visitSurveyAnswerEditSaveClick(e) {
    log("..visitSurveyAnswerEditSaveClick");
    visitSurveyAnswerEditSave(function() {navigateBackTo("views/VisitSurveyAnswer.html");});
}

function visitSurveyAnswerEditDelClick(e) {
    log("..visitSurveyAnswerEditDelClick");
    visitSurveyAnswerEditDel(function() {navigateBackTo("views/VisitSurveyAnswer.html");});
}

function visitSurveyAnswerEditSave(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    dbTools.visitSurveyAnswerUpdate(visit.visitId, visitSurveyAnswerItem.questionId, 
        ["answer", "note"], [visitSurveyAnswerItem.answer, visitSurveyAnswerItem.note], 
        function(visitId, questionId) {if (!!onSuccess) {onSuccess(visitId, questionId);}}, 
        dbTools.onSqlError
    );
}

function visitSurveyAnswerEditDel(onSuccess) {
    dbTools.objectListItemSet("visit-list", true);
    dbTools.visitSurveyAnswerUpdate(visit.visitId, visitSurveyAnswerItem.questionId, 
        ["answer", "note"], [null, null], 
        function(visitId, questionId) {if (!!onSuccess) {onSuccess(visitId, questionId);}}, 
        dbTools.onSqlError
    );
}

//----------------------------------------
// common
//----------------------------------------

function visitSurveyAnswerObjInit() {
    visitSurveyAnswerList = {};
    visitSurveyAnswerList.navBackCount = 1;
    visitSurveyAnswerList.surveyId = 1;
    
    visitSurveyAnswerItemObjInit();
}
 
function visitSurveyAnswerItemObjInit() {
    visitSurveyAnswerItem = {};
    visitSurveyAnswerItem.isEdited = false;
    visitSurveyAnswerItem.questionId = null;
    visitSurveyAnswerItem.name = null;
    visitSurveyAnswerItem.answerType = null;
    visitSurveyAnswerItem.answer = null;
    visitSurveyAnswerItem.note = null;
}

