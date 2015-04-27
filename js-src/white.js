var list = "public";

// start: websocket config
var connected = false;
var reConnecting = false;
var room = "";
var username = "";
var conn = null;
var autolinker = new Autolinker({
    stripPrefix: false,
    //truncate: 32,
    newWindow: true
});
// end: websocket config

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

var escapeHtml = function(html) {
    return autolinker.link(jQuery("<div/>").text(html).html());
};

var saveText = function(id, text) {
    "use strict"
    $.getJSON("ajax.php?a=save&id=" + id + "&text=" 
            + encodeURIComponent(text) + "&list=" + encodeURIComponent(list), function(json) {
        if (id === null) {
            $("#wt-list-item-0").after("<div id=\"wt-list-item-" + json.id 
                    + "\" class=\"wt-list-item\" data-id=\"" + json.id 
                    + "\"><p class=\"wt-list-item-text\"><input type=\"checkbox\" data-id=\"" 
                    + json.id + "\" class=\"wt-list-item-chk-done btn-tooltip\" id=\"wt-list-item-chk-done-" + json.id 
                    + "\" title=\"" + removeTitle() + "\" /> <input type=\"checkbox\" data-id=\"" + json.id 
                    + "\" class=\"wt-list-item-chk-strike btn-tooltip\" id=\"wt-list-item-chk-strike-" + json.id 
                    + "\" title=\"" + strikeTitle() + "\" /> <span id=\"wt-text-" + json.id + "\" class=\"wt-text\" data-id=\"" + json.id 
                    + "\">" + escapeHtml(text) + "</span></p></div>");
            conn.send(JSON.stringify({"a": "message", "actiontype": "add", "list": list, "text": text, "id": json.id}));
            applyEditItem(json.id);
            applyRemoveItem(json.id);
            applyStrikeItem(json.id);
            applySaveTextOfItem(json.id);
            applySaveOnEnter(json.id);
            applyTooltip();
        } else {
            conn.send(JSON.stringify({"a": "message", "actiontype": "save", "list": list, "text": text, "id": json.id}));
        }
    });
};

var editing = false;
var applyEditItem = function(id) {
    $("#wt-text-" + id).on("click", function() {
        editing = true;
        var id = $(this).data("id");
        var clickedText = $("#wt-text-" + id).text();
        $("#wt-list-item-" + id)
                .html("<input class=\"wt-list-item-input\" type=\"text\" id=\"wt-list-item-input-" 
                    + id + "\" data-id=\"" + id + "\" placeholder=\"Enter new item here\" />");
        $("#wt-list-item-input-" + id).val(clickedText);
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
        $.getJSON("ajax.php?a=delete&id=" + id 
                + "&list=" + encodeURIComponent(list), function(json) {
            $("#wt-list-item-" + id).remove();
            conn.send(JSON.stringify({"a": "message", "actiontype": "remove", "list": list, "id": id}));
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
        if (strike) {
            text.addClass("wt-strike");
        } else {
            text.removeClass("wt-strike");
        }
        $.getJSON("ajax.php?a=strike&id=" + id + "&strike=" + strike 
                + "&list=" + encodeURIComponent(list), function(json) {
            conn.send(JSON.stringify({"a": "message", "actiontype": "strike", "list": list, "strike": strike, "id": id}));
        }).fail(function() {
            if (strike) {
                text.removeClass("wt-strike");
            } else {
                text.addClass("wt-strike");
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

var doApplySaveOnEnter = function(thiz, e) {
    if (editing || $("#wt-list-item-input-0").is(":focus")) {
        editing = false;
    } else {
        return;
    }
    e.preventDefault();
    var id = thiz.data("id");
    console.log("id: " + id);
    var text = $("#wt-list-item-input-" + id).val();
    if (id === 0) {
        saveText(null, text);
    } else {
        $("#wt-list-item-" + id).html("<p class=\"wt-list-item-text\"><input type=\"checkbox\" data-id=\"" 
                + id + "\" class=\"wt-list-item-chk-done btn-tooltip\" id=\"wt-list-item-chk-done-" + id 
                + "\" title=\"" + removeTitle() + "\" /> <input type=\"checkbox\" data-id=\"" + id 
                + "\" class=\"wt-list-item-chk-strike btn-tooltip\" id=\"wt-list-item-chk-strike-" + id 
                + "\" title=\"" + strikeTitle() + "\" /> <span id=\"wt-text-" + id + "\" class=\"wt-text\" data-id=\"" + id 
                + "\">" + escapeHtml(text) + "</span></p>");
        applyEditItem(id);
        applyRemoveItem(id);
        applyStrikeItem(id);
        applySaveTextOfItem(id);
        applySaveOnEnter(id);
        applyTooltip();
        saveText(id, text);
    }

    thiz.val("");
}

var applySaveOnEnter = function(id) {
    // Hitting tener on item removes text input and saves item
    $("#wt-list-item-input-" + id).keypress(function (e) {
        var thiz = $(this);
        thiz.on("blur", function() {
            doApplySaveOnEnter(thiz, e);
        });
        if (e.which == 13) {
            doApplySaveOnEnter(thiz, e);
        }
    });
};

var applyTooltip = function() {
    if (!(/iPhone|iPod|iPad|Android|BlackBerry|phone/i).test(navigator.userAgent)) {
        $(".btn-tooltip").tooltip();
    }
};

var init = function() {
    "use strict";
    var hash = window.location.hash;
    hash = hash.replace(/^#/, "");
    var hashVars = hash.split("/");
    switch(hashVars[1]) {
        case "list":
            list = hashVars[2];
            startConnection(list);
            load(list);
            break;
        default:
            list = "public";
            startConnection(list);
            load(list);
    }
};

var load = function(list) {
    $(".wt-list-item").remove();
    $("title").text("#" + list);
    $.getJSON("ajax.php?a=load&list=" + encodeURIComponent(list), function(json) {
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
                        + "\">" + escapeHtml(text) + "</span></p></div>");
            applyEditItem(id);
            applyRemoveItem(id);
            applyStrikeItem(id);
            applyTooltip();
            previd = id;
        });
    });
};

function handleMessage(json) {
    "use strict";
    console.log("websocket: handleMessage: json: " + json);
    var jsonObj = JSON.parse(json);
    if (jsonObj.a === "message" && jsonObj.list === list) {
        console.log("websocket: You got the right list.");
        if (jsonObj.actiontype === "strike") {
            console.log("websocket: Striking item");
            var text = $("#wt-text-" + jsonObj.id);
            if (jsonObj.strike) {
                text.addClass("wt-strike");
            } else {
                text.removeClass("wt-strike");
            }
            $("#wt-list-item-chk-strike-" + jsonObj.id).prop("checked", jsonObj.strike);
        } else if (jsonObj.actiontype === "remove") {
            $("#wt-list-item-" + jsonObj.id).remove();
        } else if (jsonObj.actiontype === "add") {
            $("#wt-list-item-0").after("<div id=\"wt-list-item-" + jsonObj.id 
                    + "\" class=\"wt-list-item\" data-id=\"" + jsonObj.id 
                    + "\"><p class=\"wt-list-item-text\"><input type=\"checkbox\" data-id=\"" 
                    + jsonObj.id + "\" class=\"wt-list-item-chk-done btn-tooltip\" id=\"wt-list-item-chk-done-" + jsonObj.id 
                    + "\" title=\"" + removeTitle() + "\" /> <input type=\"checkbox\" data-id=\"" + jsonObj.id 
                    + "\" class=\"wt-list-item-chk-strike btn-tooltip\" id=\"wt-list-item-chk-strike-" + jsonObj.id 
                    + "\" title=\"" + strikeTitle() + "\" /> <span id=\"wt-text-" + jsonObj.id + "\" class=\"wt-text\" data-id=\"" + jsonObj.id 
                    + "\">" + jsonObj.text + "</span></p></div>");
            applyEditItem(jsonObj.id);
            applyRemoveItem(jsonObj.id);
            applyStrikeItem(jsonObj.id);
            applySaveTextOfItem(jsonObj.id);
            applySaveOnEnter(jsonObj.id);
            applyTooltip();
        } else if (jsonObj.actiontype === "save") {
            $("#wt-list-item-" + jsonObj.id).html("<p class=\"wt-list-item-text\"><input type=\"checkbox\" data-id=\"" 
                    + jsonObj.id + "\" class=\"wt-list-item-chk-done btn-tooltip\" id=\"wt-list-item-chk-done-" + jsonObj.id 
                    + "\" title=\"" + removeTitle() + "\" /> <input type=\"checkbox\" data-id=\"" + jsonObj.id 
                    + "\" class=\"wt-list-item-chk-strike btn-tooltip\" id=\"wt-list-item-chk-strike-" + jsonObj.id 
                    + "\" title=\"" + strikeTitle() + "\" /> <span id=\"wt-text-" + jsonObj.id + "\" class=\"wt-text\" data-id=\"" + jsonObj.id 
                    + "\">" + jsonObj.text + "</span></p>");
            applyEditItem(jsonObj.id);
            applyRemoveItem(jsonObj.id);
            applyStrikeItem(jsonObj.id);
            applySaveTextOfItem(jsonObj.id);
            applySaveOnEnter(jsonObj.id);
            applyTooltip();
        }
    }
}

function loginToRoom(room, username) {
    "use strict";
    console.log("websocket: loginToRoom");
    try {
        console.log("websocket: Starting try");
        var request = {"a": "login", "room": room};
        console.log("websocket: Trying to login: " + request);
        conn.send(JSON.stringify(request));
    } catch (ex) {
    }
}

function startConnection(list) {
    "use strict";
    if (!connected) {
        conn = new WebSocket(webSocketUrl);
        console.log("websocket: Just made connection object.");

        conn.onopen = function(e) {
            console.log("websocket: onopen");
            connected = true;
            reConnecting = false;
            loginToRoom(list);
        };

        conn.onclose = function(e) {
            console.log("websocket: onclose");
            connected = false;
            if (!reConnecting) {
                reConnect();
            }
        };

        conn.onerror = function(e) {
            console.log("websocket: onerror");
            connected = false;
            if (!reConnecting) {
                reConnect();
            }
        };

        conn.onmessage = function(e) {
            console.log("websocket: onmessage");
            handleMessage(e.data);
        };
    } else {
        loginToRoom(list);
    }
}

function reConnect() {
    "use strict";
    reConnecting = true;
    if (!connected) {
        init();
        setTimeout(reConnect, 2000);
    }
}

$(document).ready(function(){

    init();

    $(window).on("hashchange", function() { 
        init();
    });

    $(".wt-list-item-input:first").focus();

    applySaveTextOfItem(0);
    applySaveOnEnter(0);

});
