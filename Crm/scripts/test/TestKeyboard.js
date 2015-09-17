var footerVisible = false;

function testKeyboardInit() {
    log("..testKeyboardInit()");
    /*$(".numpad-edit").numpad({
        appendKeypadTo: $("#test-keyboard-view"),
        decimalSeparator: ".",
        hidePlusMinusButton: true,
        positionX: "center",
        positionY: "middle",
        //displayTpl: "",
        buttonNumberTpl: "<button style='height: 4em; width: 4em;'></button>",
        buttonFunctionTpl: "<button style='height: 4em; width: 4em;'></button>"
    });*/
    /*$(".numpad-edit").each(function(index, e) {
        $(e).numpad({
            target: $(e),
            appendKeypadTo: $("#test-keyboard-place"),
            decimalSeparator: ".",
            hidePlusMinusButton: true,
            positionX: "right",
            positionY: "bottom",
            displayTpl: "<input type='number' class='hidden' />",
            buttonNumberTpl: "<button style='height: 4em; width: 4em;'></button>",
            buttonFunctionTpl: "<button style='height: 4em; width: 4em;'></button>",
            onChange: function(event, value) {
log("====onChange(event, " +value + ")");
				//if (target){
				//	if (target.prop("tagName") == 'INPUT'){
				//		target.val(value);
				//	} else {
				//		target.html(value);
				//	}
				//}
//logObjectKeys(event);
            }
        });
    });*/
}

function testKeyboardShow() {
    log("..testKeyboardShow()");
    testKeyboardNumPadShow(false);
}

function testKeyboardValueSetClick() {
    //logObjectKeys($("#testNumKeyboard").data("kendoNumKeyboard"));
    //log("--------------------------------------------");
    $("#testNumKeyboard").data("kendoNumKeyboard").value(128.6);
}

function testKeyboardInputClick(evnt, e) {
    log("..testKeyboardInputClick(evnt, e)");
    if (e.tagName.toLowerCase() == "input") {
        testKeyboardNumPadShow(true);
        //$("#testNumKeyboard").data("kendoNumKeyboard").value($(e).val());
        $("#testNumKeyboard").data("kendoNumKeyboard").value(0);
        $("#testNumKeyboard").data("kendoNumKeyboard").options.change = function (keybObj, value) {
            $(e).val(value);
        }
        //$(e).closest("li").addClass("km-state-active");
        $(e).closest("ul").find("li").removeClass("list-item-selected");
        $(e).closest("li").addClass("list-item-selected");
    } else {
        //log("======" + e.tagName);
        if (e.tagName.toLowerCase() != "footer") {
            testKeyboardNumPadShow(false);
        }
    }
    evnt.stopPropagation();
}

function testKeyboardNumPadShow(visible) {
    log("..testKeyboardNumPadShow(" + visible + ")");
    if (visible) {
        $(app.view().footer).removeClass("hidden");
        //app.scroller().scrollTo(0, -200);
    } else {
        $(app.view().footer).addClass("hidden");
    }
}
