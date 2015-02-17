var visitPlanItemId;

function visitInit(e) {
    log("..visitInit");
    dbTools.objectListItemSet("visit", true);
}

function visitShow(e) {
    log("..visitShow visitPlanItemId=" + e.view.params.visitPlanItemId);
    visitPlanItemId = e.view.params.visitPlanItemId;
}
