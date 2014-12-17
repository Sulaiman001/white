var tmpid = 42;

function random(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

var p = function(str) {
    "use strict"
    console.log(str);
};

var removeTitle = function() {
    return "Remove item";
}

var strikeTitle = function() {
    return "Strike out item";
}

var saveText = function(id, text) {
    "use strict"
    $.getJSON("ajax.php?a=save&id=" + id + "&text=" 
            + encodeURIComponent(text), function(json) {
        if (id === null) {
            $("#wt-list-item-0").after("<div id=\"wt-list-item-" + json.id 
                    + "\" class=\"wt-list-item\" data-id=\"" + json.id 
                    + "\"><p class=\"wt-list-item-text\"><input type=\"checkbox\" data-id=\"" 
                    + json.id + "\" class=\"wt-list-item-chk-done btn-tooltip\" id=\"wt-list-item-chk-done-" + json.id 
                    + "\" title=\"" + removeTitle() + "\" /> <input type=\"checkbox\" data-id=\"" + json.id 
                    + "\" class=\"wt-list-item-chk-strike btn-tooltip\" id=\"wt-list-item-chk-strike-" + json.id 
                    + "\" title=\"" + strikeTitle() + "\" /> <span id=\"wt-text-" + json.id + "\" class=\"wt-text\" data-id=\"" + json.id 
                    + "\">" + text + "</span></p></div>");
            applyEditItem(json.id);
            applyRemoveItem(json.id);
            applyStrikeItem(json.id);
            applySaveTextOfItem(json.id);
            applySaveOnEnter(json.id);
            applyTooltip();
        }
    });
};

var applyEditItem = function(id) {
    $("#wt-text-" + id).on("click", function() {
        var id = $(this).data("id");
        var clickedText = $("#wt-text-" + id).text();
        $("#wt-list-item-" + id)
                .html("<input class=\"wt-list-item-input\" type=\"text\" id=\"wt-list-item-input-" 
                    + id + "\" data-id=\"" + id + "\" placeholder=\"Enter new item here\" value=\"" 
                    + clickedText + "\"/>");
        $("#wt-list-item-input-" + id).focus();
        applySaveTextOfItem(id);
        applySaveOnEnter(id);
        applyTooltip();
    });
};

var applyRemoveItem = function(id) {
    // Remove an item
    $("#wt-list-item-chk-done-" + id).on("click", function() {
        var id = $(this).data("id");
        $.getJSON("ajax.php?a=delete&id=" + id, function(json) {
            $("#wt-list-item-" + id).remove();
        });
    });
};

var applyStrikeItem = function(id) {
    // Strike out an item
    $("#wt-list-item-chk-strike-" + id).on("click", function() {
        var id = $(this).data("id");
        var text = $("#wt-text-" + id);
        var strike = false;
        if (!text.hasClass("wt-strike")) {
            strike = true;
        }
        $.getJSON("ajax.php?a=strike&id=" + id + "&strike=" + strike, function(json) {
            if (strike) {
                text.addClass("wt-strike");
            } else {
                text.removeClass("wt-strike");
            }
        });
    });
};

var applySaveTextOfItem = function(id) {
    // Save text of item
    prevtime = parseInt(new Date().getTime());
    curval = "";
    t = null;
    $(document).on("keyup", "#wt-list-item-input-" + id, function() {
        var id = $(this).data("id");
        if (id === 0) {
            // Don't auto-save the first item.
            return;
        }
        curtime = parseInt(new Date().getTime());
        next = prevtime + 500;
        prevtime = curtime;
        if (curtime < next) {
            clearTimeout(t);
            var text = $("#wt-list-item-input-" + id).val();
            text = text.replace(/'/, "\\'");
            t = setTimeout("saveText('" + id + "', '" + text + "')", 500);
            return;
        }
    });
};

var applySaveOnEnter = function(id) {
    // Hitting tener on item removes text input and saves item
    $("#wt-list-item-input-" + id).keypress(function (e) {
        if (e.which == 13) {
            e.preventDefault();
            var id = $(this).data("id");
            var text = $("#wt-list-item-input-" + id).val();
            if (id === 0) {
                saveText(null, text);
            } else {
                $("#wt-list-item-" + id).html("<p class=\"wt-list-item-text\"><input type=\"checkbox\" data-id=\"" 
                        + id + "\" class=\"wt-list-item-chk-done btn-tooltip\" id=\"wt-list-item-chk-done-" + id 
                        + "\" title=\"" + removeTitle() + "\" /> <input type=\"checkbox\" data-id=\"" + id 
                        + "\" class=\"wt-list-item-chk-strike btn-tooltip\" id=\"wt-list-item-chk-strike-" + id 
                        + "\" title=\"" + strikeTitle() + "\" /> <span id=\"wt-text-" + id + "\" class=\"wt-text\" data-id=\"" + id 
                        + "\">" + text + "</span></p>");
                applyEditItem(id);
                applyRemoveItem(id);
                applyStrikeItem(id);
                applySaveTextOfItem(id);
                applySaveOnEnter(id);
                applyTooltip();
                saveText(id, text);
            }

            $(this).val("");
        }
    });
};

var applyTooltip = function() {
    $(".btn-tooltip").tooltip();
};

$(document).ready(function(){

    $.getJSON("ajax.php?a=load", function(json) {
        var previd = 0;
        $.each(json.items, function(i, item) {
            var id = item.id;
            var text = item.text;
            if (i === 0) {
                previd = 0;
            }
            var strike = item.strike ? "wt-strike" : "";
            var checked = item.strike ? "checked=\"checked\"" : "";
            $("#wt-list-item-" + previd).after("<div id=\"wt-list-item-" + id 
                        + "\" class=\"wt-list-item\" data-id=\"" + id 
                        + "\"><p class=\"wt-list-item-text\"><input type=\"checkbox\" data-id=\"" 
                        + id + "\" class=\"wt-list-item-chk-done btn-tooltip\" id=\"wt-list-item-chk-done-" + id 
                        + "\" title=\"" + removeTitle() + "\" /> <input type=\"checkbox\" data-id=\"" + id 
                        + "\" class=\"wt-list-item-chk-strike btn-tooltip\" id=\"wt-list-item-chk-strike-" + id 
                        + "\" " + checked + " title=\"" + strikeTitle() + "\" /> <span id=\"wt-text-" 
                        + id + "\" class=\"wt-text " + strike + "\" data-id=\"" + id 
                        + "\">" + text + "</span></p></div>");
            applyEditItem(id);
            applyRemoveItem(id);
            applyStrikeItem(id);
            applyTooltip();
            previd = id;
        });
    });

    $(".wt-list-item-input:first").focus();

    applySaveTextOfItem(0);
    applySaveOnEnter(0);

});
