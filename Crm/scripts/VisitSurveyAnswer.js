var visitSurveyAnswer;

//----------------------------------------
// visit-survey-answer-view
//----------------------------------------

function visitSurveyAnswerInit(e) {
    log("..visitSurveyAnswerInit");
    visitSurveyAnswer = {};
    visitSurveyAnswer.navBackCount = 1;
    visitSurveyAnswer.surveyId = 1;
    /*visitAnalysisResult = {};
    visitAnalysisResultClear(true);*/
}

function visitSurveyAnswerShow(e) {
    log("..visitSurveyAnswerShow navBackCount=" + e.view.params.navBackCount + ", surveyId=" + e.view.params.surveyId);
    visitSurveyAnswer.navBackCount = e.view.params.navBackCount;
    visitSurveyAnswer.surveyId = e.view.params.surveyId;
    if (visitSurveyAnswer.navBackCount < 1) {
        visitSurveyAnswer.navBackCount = 1;
    }
    var title = "";
    if (visitSurveyAnswer.surveyId == 1) {
        title = "Контроль работы мерчандайзеров агенства";
    } else {
        title = "Контроль работы промоконсультантов";
    }
    app.view().header.find(".km-navbar").data("kendoMobileNavBar").title(title);
    renderVisitSurveyAnswer(visit.visitId, visitSurveyAnswer.surveyId);
}

function renderVisitSurveyAnswer(visitId, surveyId) {
    dbTools.visitSurveyAnswerListGet(visitId, surveyId, renderVisitSurveyAnswerView);
}

function renderVisitSurveyAnswerView(tx, rs) {
    log("..renderVisitSurveyAnswerView");
    var data = dbTools.rsToJson(rs);
    var dataSource = new kendo.data.DataSource({data: data});
    $("#visit-survey-answer-list").data("kendoMobileListView").setDataSource(dataSource);
    visitSurveyAnswerEnableControls();
    app.scroller().reset();
}

function visitSurveyAnswerNavBackClick(e) {
    log("..visitSurveyAnswerNavBackClick");
    navigateBack(visitSurveyAnswer.navBackCount);
}

function visitSurveyAnswerEnableControls() {
    log("..visitSurveyAnswerEnableControls");
    $("[data-role=switch]").each(function(index, element) {
        $(element).data("kendoMobileSwitch").enable(!visit.readonly);
    });
}
function visitSurveyAnswerSwitchChange(e) {
    var answer = 0;
    if (e.checked) {
        answer = 1;
    }
    var questionId = this.element.attr("data-question-id");
    dbTools.visitSurveyAnswerUpdate(visit.visitId, questionId, answer);
}

function visitSurveyAnswerStarClick(e, questionId, answer) {
    if (!visit.readonly) {
        dbTools.visitSurveyAnswerUpdate(visit.visitId, questionId, answer);
        $("div").filter("[data-question-id=" + questionId + "]").removeClass("color-selected").addClass("color-unselected");
        $(e).removeClass("color-unselected").addClass("color-selected");
    }
}
