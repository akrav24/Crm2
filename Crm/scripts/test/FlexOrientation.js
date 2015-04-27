function flexOrientationInit(e) {
    log("..flexOrientationInit");
    window.addEventListener("orientationchange", 
        function() {
            log("==window.orientation: " + window.orientation);
        }, 
        false
    );        
}

function flexOrientationShow(e) {
    log("..flexOrientationShow");
    log("==window.orientation: " + window.orientation);
}

