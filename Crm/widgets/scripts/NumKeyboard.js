(function($) {
    
    var kendo = window.kendo,
        ui = kendo.ui,
        Widget = ui.Widget;
    
    var NumKeyboard = Widget.extend({
       
        init: function(element, options) {
            this._log("NumKeyboard.init()");
            
            var that = this;
            
            Widget.fn.init.call(that, element, options);
            
            that._render();
        },
        
        options: {
            // properties
            name: "NumKeyboard",
            clearMode: 1,        // 0 - value = "", 1 - value = "0"
            enable: true,
            value: 0,
            // events
            change: undefined
        },
        
        
        clearMode: function(value) {
            this._log("NumKeyboard.clearMode(" + value + ")");
            
            var that = this;
            
            if (value != undefined) {
                that.options.clearMode = value;
            }
            
            return that.options.clearMode;
        },
        
        enable: function(enable) {
            this._log("NumKeyboard.enable("  + enable + ")");
            
            var that = this;
            
            if (enable != undefined) {
                if (that.options.enable != enable) {
                    that.options.enable = enable;
                    that.element.find("button").each(function(index, e) {
                        $(e).data("kendoMobileButton").enable(that.options.enable);
                    });
                }
            }
            
            return that.options.enable;
        },
        
        refresh: function() {
            this._log("NumKeyboard.refresh()");
            
            var that = this;
            
            that._inputElement.val(that.options.value);
        },
        
        value: function(value) {
            this._log("NumKeyboard.value(" + value + ")");
            
            var that = this;
            
            if (value != undefined) {
                that.options.value = value;
                that.refresh();
            }
            
            return that.options.value;
        },
        
        _render: function() {
            this._log("NumKeyboard._render()");
            
            var that = this,
                grid;
            
            that._inputElement = undefined;
            
            grid = $(
                '<table class="num-keyboard-grid">'
                + '    <tbody>'
                + '        <tr>'
                + '            <td colspan="3"><input type="text" class="num-keyboard-value" value="0" hidden></td>'
                + '        </tr>'
                + '        <tr>'
                + '            <td><button class="num-keyboard-button num-keyboard-button-digit" data-role="button" data-symbol="7">7</button></td>'
                + '            <td><button class="num-keyboard-button num-keyboard-button-digit" data-role="button" data-symbol="8">8</button></td>'
                + '            <td><button class="num-keyboard-button num-keyboard-button-digit" data-role="button" data-symbol="9">9</button></td>'
                + '        </tr>'
                + '        <tr>'
                + '            <td><button class="num-keyboard-button num-keyboard-button-digit" data-role="button" data-symbol="4">4</button></td>'
                + '            <td><button class="num-keyboard-button num-keyboard-button-digit" data-role="button" data-symbol="5">5</button></td>'
                + '            <td><button class="num-keyboard-button num-keyboard-button-digit" data-role="button" data-symbol="6">6</button></td>'
                + '        </tr>'
                + '        <tr>'
                + '            <td><button class="num-keyboard-button num-keyboard-button-digit" data-role="button" data-symbol="1">1</button></td>'
                + '            <td><button class="num-keyboard-button num-keyboard-button-digit" data-role="button" data-symbol="2">2</button></td>'
                + '            <td><button class="num-keyboard-button num-keyboard-button-digit" data-role="button" data-symbol="3">3</button></td>'
                + '        </tr>'
                + '        <tr>'
                + '            <td><button class="num-keyboard-button num-keyboard-button-dot" data-role="button" data-symbol=".">.</button></td>'
                + '            <td><button class="num-keyboard-button num-keyboard-button-digit" data-role="button" data-symbol="0">0</button></td>'
                + '            <td><button class="num-keyboard-button num-keyboard-button-clear" data-role="button">C</button></td>'
                + '        </tr>'
                + '    </tbody>'
                + '</table>'
            );
            kendo.init(that.element.append(grid), kendo.mobile.ui);
            
            that._inputElement = that.element.find(".num-keyboard-value").first();
            that._inputElement.val(that.options.value);
            
            that.element.find(".num-keyboard-grid .num-keyboard-button-digit, .num-keyboard-button-dot").each(function(index, element) {
                var btn = $(element).data("kendoMobileButton");
                btn.bind("click", function(e) {
                    that._digitClick(e, that);
                });
            });
            that.element.find(".num-keyboard-grid .num-keyboard-button-clear").each(function(index, element) {
                var btn = $(element).data("kendoMobileButton");
                btn.bind("click", function(e) {
                    that._clearClick(e, that);
                });
            });
            
        },
        
        _digitClick: function(e, that) {
            that._log("NumKeyboard._digitClick()");
            
            var symbol;
            symbol = e.button.data("symbol");
            var val = that.options.value.toString();
            if (val == "0" && symbol != ".") {
                val = "";
            }
            if (symbol == ".") {
                if (val.search(/\./) == -1) {
                    that.value(val + symbol);
                    if (that.options.change) {
                        that.options.change(that, that.value());
                    }
                }
            } else {
                that.value(val + symbol);
                if (that.options.change) {
                    that.options.change(that, that.value());
                }
            }
        },
        
        _clearClick: function(e, that) {
            that._log("NumKeyboard._clearClick()");
            
            that.value(that.options.clearMode == 1 ? "0" : "");
            if (that.options.change) {
                that.options.change(that, that.value());
            }
        },
        
        _log: function(msg) {
            console.log(msg);
        }
    });
    
    ui.plugin(NumKeyboard);
    
})(jQuery);
