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
    "use strict";
    "use strict"
};

var removeTitle = function() {
    "use strict";
    return "Remove item";
}

var strikeTitle = function() {
    "use strict";
    return "Strike out item";
}

var escapeHtml = function(html) {
    "use strict";
    var text = autolinker.link(jQuery("<div/>").text(html).html());

    var priorityStyle = "";
//    var priority = parseInt(text.replace(/^.*([^\\])?!([0-9]+).*$/, "$2"));
//    if (!isNaN(priority)) {
//        var r = (85 + Math.pow(priority, 2)) % 256;
//        var g = (172 + Math.pow(priority, 2)) % 256;
//        var b = (204 + Math.pow(priority, 1)) % 256;
//        r = (r + 50) % 256;
//        g = (g + 50) % 256;
//        b = (b + 50) % 256;
//
//        var total = r + g + b;
//        var rf = 0;
//        var gf = 0;
//        var bf = 0;
//        if (total < ((255 * 3) / 3)) {
//            rf = r + (85 * 2) % 256;
//            gf = g + (85 * 2) % 256;
//            bf = b + (85 * 2) % 256;
//        } else if (total >= ((255 * 3) / 3) && total < (((255 * 3) / 3) * 2)) {
//            rf = r + (85) % 256;
//            gf = g + (85) % 256;
//            bf = b + (85) % 256;
//        } else {
//            rf = r - (85 * 2) % 256;
//            gf = g - (85 * 2) % 256;
//            bf = b - (85 * 2) % 256;
//        }
//
//        priorityStyle = "style=\"background-color:rgba(" + r + ", " + g + ", " + b 
//                + ", 1) ! important; color:rgba(" + rf + ", " + gf + ", " + bf + ", 1) ! important;\"";
//    }

    // TODO: This will not be needed when items are pulled from services on save.
    text = text.replace(/@&lt;(.*?)&gt;/, "<span class=\"label label-remind\">$1</span>");
    text = text.replace(/@\((.*?)\)/, "<span class=\"label label-remind\">$1</span>");
    text = text.replace(/([0-9]{1,2}:[0-9]{1,2} [0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/, "<span class=\"label label-remind\">$1</span>");
    text = text.replace(/([^\\])?(#[a-zA-Z0-9-_]+)/g, "$1<span class=\"label label-label\">$2</span>");
    //jtext = text.replace(/([^\\])?(![0-9]+)/, "$1<span class=\"label label-priority\">$2</span>");
    text = text.replace(/([^\\])?(![0-9]+)/, "$1<span class=\"label label-priority\"" + priorityStyle + ">$2</span>");
    return text;
};

var saveText = function(id, text, done) {
    "use strict"
    $.ajax({
        type: "POST",
        url: "services/save/" + encodeURIComponent(list) + "/" + id
                + "/" + done + "/" + encodeURIComponent(getHashVar(3)),
        data: { text: text },
        dataType: "json",
        success: function(json) {
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
        }
    });
};

var editing = false;
var applyEditItem = function(id) {
    "use strict";
    $(".wt-text a").on("click", function () {
        console.log("Clicked a link");
        if (!e) var e = window.event;
        e.cancelBubble = true;
        if (e.stopPropagation) e.stopPropagation();
    });
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
    "use strict";
    // Remove an item
    $("#wt-list-item-chk-done-" + id).on("click", function() {
        var id = $(this).data("id");
        $.getJSON("services/delete/" + id + "/" + encodeURIComponent(getHashVar(3)) , function(json) {
            $("#wt-list-item-" + id).remove();
            conn.send(JSON.stringify({"a": "message", "actiontype": "remove", "list": list, "id": id}));
        });
    });
};

var applyStrikeItem = function(id) {
    "use strict";
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
        $.getJSON("services/strike/" + id + "/" + strike
                + "/" + encodeURIComponent(getHashVar(3)), function(json) {
            var item = $("#wt-list-item-" + id);

            if (strike) {
                $(".wt-list-item:last").after(item);
            } else if ($(".wt-strike").size() > 0) {
                $(".wt-strike:first").parent().parent().before(item);
            }

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
    "use strict";
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
            t = setTimeout("saveText('" + id + "', '" + text + "', 'false')", 500);
            return;
        }
    });
};

var doApplySaveOnEnter = function(thiz, e) {
    "use strict";
    if (editing || $("#wt-list-item-input-0").is(":focus")) {
        editing = false;
    } else {
        return;
    }
    e.preventDefault();
    var id = thiz.data("id");
    var text = $("#wt-list-item-input-" + id).val();
    if (id === 0) {
        saveText(null, text, true);
    } else {
        // TODO: Retrieve the post-processed text instead of what the user entered. Primarily to grab the @<syntax>
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
        saveText(id, text, true);
    }

    thiz.val("");
}

var applySaveOnEnter = function(id) {
    "use strict";
    // Hitting tener on item removes text input and saves item
    $("#wt-list-item-input-" + id).keypress(function (e) {
        var thiz = $(this);
        thiz.on("blur", function() {
            doApplySaveOnEnter(thiz, e);
        });
        if (e.which === 13 || e.which === 27) {
            doApplySaveOnEnter(thiz, e);
        }
    });
};

var applyAllListClick = function() {
    "use strict";
    $(".wt-all-list-item").on("click", function() {
        window.location.hash = "#/list/" + $(this).data("list") + "/" + getHashVar(2);
    });
}

var applyTooltip = function() {
    if (!(/iPhone|iPod|iPad|Android|BlackBerry|phone/i).test(navigator.userAgent)) {
        $(".btn-tooltip").tooltip();
    }
};

var menuToggle = function() {
    $(".menu-toggle").unbind("click");
    $(".menu-toggle").on("click", function(e) {
        e.preventDefault();
        var wrapper = $("#wrapper");
        var clazz = "toggled";
        if (wrapper.hasClass(clazz)) {
            wrapper.removeClass(clazz);
        } else {
            wrapper.addClass(clazz);
        }
    });
}

var hideSideBar = function() {
    $("#wrapper").removeClass("toggled");
};

var setListsLink = function(secret) {
    $(".lists-link").attr("href", "#/lists/" + encodeURIComponent(secret));
};

var init = function() {
    "use strict";
    var hash = window.location.hash;
    hash = hash.replace(/^#/, "");
    var hashVars = hash.split("/");
    startConnection();
    switch(hashVars[1]) {
        case "list":
            list = hashVars[2];
            load(list);
            seedSideBar(hashVars[3]);
            setListsLink(hashVars[3]);
            break;
        case "lists":
            loadAll();
            seedSideBar(hashVars[2]);
            setListsLink(hashVars[2]);
            break;
        default:
            list = "public";
            load(list);
            seedSideBar(hashVars[3]);
            setListsLink(hashVars[3]);
    }
    menuToggle();
};

var isUndefined = function(o) {
    return undefined === o;
}

var getHashVar = function(key) {
    return window.location.hash.replace(/^#/, "").split("/")[key];
}

var loadAll = function() {
    $("#wt-list-item-0").hide();
    // Removes all list items if you've previously been on a list
    $(".wt-list-item").remove();
    $("title").text("all lists");
    $.getJSON("services/load-all/" + encodeURIComponent(getHashVar(2)), function(json) {
        // Mock items for testing grid layout
        //for (var i = 1; i < 100; i++) json.items.push(i);

        var total = $(json.items).size();
        var large = Math.floor(total / 4);
        var largeRemainder = total - (large * 3);
        var medium = Math.floor(total / 2);
        var mediumRemainder = total - medium;
        var small = Math.floor(total / 1);

        var list = $(".wt-list");
        if (total >= 4) {
            list.append("<div class='row'><div class='col-sm-12 col-md-6 col-lg-3' id='list-col-1'></div>"
                    + "<div class='col-sm-12 col-md-6 col-lg-3' id='list-col-2'></div>"
                    + "<div class='col-sm-12 col-md-6 col-lg-3' id='list-col-3'></div>"
                    + "<div class='col-sm-12 col-md-6 col-lg-3' id='list-col-4'></div></div>");
            $.each(json.items, function(i, item) {
                var coli = i + 1;
                var col;
                if (coli <= largeRemainder) {
                    col = $("#list-col-1");
                } else if (coli > largeRemainder && coli <= (largeRemainder + (large * 1))) {
                    col = $("#list-col-2");
                } else if (coli > (largeRemainder + (large * 1)) && coli <= (largeRemainder + (large * 2))) {
                    col = $("#list-col-3");
                } else {
                    col = $("#list-col-4");
                }
                col.append("<div class=\"wt-all-list-item\" data-list=\""
                        + escapeHtml(item) + "\"><a title=\"#" + escapeHtml(item) 
                        + "\" href=\"#/list/" + escapeHtml(item) + "/" + getHashVar(2) 
                        + "\">#" + escapeHtml(item) + "</a></div>");
            });
            list.append("</div>");
        } else {
            list.append("<div class='row'><div class='columns small-12 medium-12 large-12' id='list-col-1'></div></div>");
            $.each(json.items, function(i, item) {
                $("#list-col-1").append("<div class=\"wt-all-list-item\" data-list=\""
                        + escapeHtml(item) + "\"><a title=\"#" + escapeHtml(item) 
                        + "\" href=\"#/list/" + escapeHtml(item) + "/" + getHashVar(2) 
                        + "\">#" + escapeHtml(item) + "</a></div>");
            });
        }
        applyAllListClick();
    });
};

var seedSideBar = function(secret) {
    $.getJSON("services/load-all/" + encodeURIComponent(secret), function(json) {
        $.each(json.items, function(i, item) {
            $(".sidebar-nav").append("<li><div class=\"wt-all-list-item\" data-list=\""
                    + escapeHtml(item) + "\"><a title=\"#" + escapeHtml(item) 
                    + "\" href=\"#/list/" + escapeHtml(item) + "/" + encodeURIComponent(secret) 
                    + "\">#" + escapeHtml(item) + "</a></div></li>");
        });
    });
    hideSideBar();
};

var load = function(list) {
    $("#wt-list-item-0").show();
    $(".wt-list-item").remove();
    $(".wt-all-list-item").remove();
    $("title").text("#" + list);
    $.getJSON("services/load/" + encodeURIComponent(list) 
            + "/" + encodeURIComponent(getHashVar(3)), function(json) {
        addListItem(json.items);
    });
};

var search = function (q) {
    $(".wt-list-item").remove();
    $.getJSON("services/search/" + encodeURIComponent(q) 
            + "/" + encodeURIComponent(getHashVar(3)), function(json) {
        addListItem(json.items);
    });
};

var addListItem = function (items) {
    var previd = 0;
    $.each(items, function(i, item) {
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
};

var sortByPriority = function() {
    "use strict";
}

var handleMessage = function(json) {
    "use strict";
    var jsonObj = JSON.parse(json);
    if (jsonObj.a === "message" && jsonObj.list === list) {
        if (jsonObj.actiontype === "strike") {
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

// http://stackoverflow.com/a/901144/272159
var qs = function(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var startConnection = function() {
    "use strict";
    if (!connected) {
        conn = new WebSocket(webSocketUrl);

        conn.onopen = function(e) {
            connected = true;
            reConnecting = false;
        };

        conn.onclose = function(e) {
            connected = false;
            if (!reConnecting) {
                reConnect();
            }
        };

        conn.onerror = function(e) {
            connected = false;
            if (!reConnecting) {
                reConnect();
            }
        };

        conn.onmessage = function(e) {
            handleMessage(e.data);
        };
    }
}

var reConnect = function() {
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

    hideSideBar();

    $(".search-button").on("click", function () {
        search($("#q").val());
    });

    $("#q").keypress(function (e) {
        var thiz = $(this);
        if (e.which === 13 || e.which === 27) {
            search($("#q").val());
        }
    });

});
