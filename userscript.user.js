// // ==UserScript==
// @name Enhanced playlist for CyTube
// @namespace enhancedplaylist
// @description Extra features for CyTube
// @grant GM_addStyle
// @updateURL    https://raw.githubusercontent.com/MareEnthusiast/enhanced-cytube-playlist/main/userscript.user.js
// @downloadURL  https://raw.githubusercontent.com/MareEnthusiast/enhanced-cytube-playlist/main/userscript.user.js
// @include https://cytu.be/r/*
// @include https://www.cytu.be/r/*
// @run-at document-end
// @version 0.0.2
// ==/UserScript==

GM_addStyle ( `
    #playlist_area {
        background-color: #2e3338;
        color: #fff;
        font-weight: 400;
        width: 100%;
        height: 520px;
        border-width: 2px;
        padding: 5px;
        margin-top: 5px;
    }
    #export_modal {
        visibility: hidden;
    }
    #toggle_played_btn {
        width:100%;
        font-size: 16px;
        padding:5px;
        display:block;
    }
    #played_area {
        border-left: 1px solid;
        border-top: 1px solid;
        border-right: 1px solid;
    }
    .qe_time_until {
        visibility: hidden;
        padding-right: 5px;
    }
` );

document.getElementById("videocontrols").insertAdjacentHTML("afterbegin", "<button class='btn btn-sm btn-default' id='toggle_button'>Export</span></button>");
document.getElementById("queue").insertAdjacentHTML("beforebegin", "<div id='played_area'><span class='pointer glyphicon glyphicon-chevron-down' id='toggle_played_btn' title='Show played videos'></span><ul class='videolist' id='played'></ul></div>");
document.getElementById("played").style.maxHeight="0px";
document.body.insertAdjacentHTML("beforeend", `
    <div id="export_modal" class="modal fade in" aria-hidden="false" style="display: block; padding-right: 10px;">
    <div id="modal_backdrop" class="modal-backdrop fade in" style="height: 2088px;"></div>
    <div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><button class="close" id="close_button" data-dismiss="modal" aria-hidden="true">×</button>
    <h3>Playlist URLs</h3></div><div class="modal-body"><button class='btn btn-sm btn-default' id="toggle_export_titles_btn">Titles</button><Textarea id="playlist_area" class="form-control" type="text"></Textarea></div>
    <div class="modal-footer"></div></div></div></div>`);

var current = "", export_list = false, toggle_export_titles = true;
var toggleBtn = document.getElementById("toggle_played_btn");
var queue = document.getElementById("queue");
var played = document.getElementById("played");

document.getElementById("export_modal").style.visibility="hidden";
document.getElementById("toggle_button").onclick = function(){toggle();};
document.getElementById("close_button").onclick = function(){toggle();};
document.getElementById("modal_backdrop").onclick = function(){toggle();};

document.getElementById("toggle_played_btn").onclick = function(){
    if(queue.style.maxHeight=="26px"){
        played.style.maxHeight = "0px";
        queue.style.maxHeight = "500px";
        queue.style.overflowY = "auto";
        toggleBtn.classList = "pointer glyphicon glyphicon-chevron-down";
    }
    else{
        played.style.maxHeight = "474px";
        queue.style.maxHeight = "26px";
        queue.style.overflowY = "hidden";
        played.scrollTop = played.scrollHeight;
        toggleBtn.classList = "pointer glyphicon glyphicon-chevron-up";
    }
}

document.getElementById("toggle_export_titles_btn").onclick = function(){
    !toggle_export_titles ? toggle_export_titles = true : toggle_export_titles = false;
    playlistRefresh();
};

var observeDOM = (function(){
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

  return function( obj, callback ){
    if( !obj || obj.nodeType !== 1 ) return;

    if( MutationObserver ){
      var mutationObserver = new MutationObserver(callback)

      mutationObserver.observe( obj, { childList:true, subtree:true })
      return mutationObserver
    }

    else if( window.addEventListener ){
      obj.addEventListener('DOMNodeInserted', callback, false)
      obj.addEventListener('DOMNodeRemoved', callback, false)
    }
  }
})()

observeDOM( queue, function(m){
    var addedNodes = [], removedNodes = [];

    m.forEach(record => record.addedNodes.length & addedNodes.push(...record.addedNodes))
    m.forEach(record => record.removedNodes.length & removedNodes.push(...record.removedNodes))

    Array.from(addedNodes).forEach(li => {
        if(hasClass(li, "queue_entry") && !hasClass(li, "queue_played") && export_list){
            playlistRefresh();
            console.log('"'+li.children[0].innerHTML+'" added or moved, refreshing export');
        }
    });

    Array.from(removedNodes).forEach(li => {
        if(hasClass(li, "queue_entry")){
            if(li == current || document.getElementById("queue").childElementCount == 0){
                played.insertAdjacentHTML("beforeend", "<li class='queue_entry queue_temp queue_played'>"+li.innerHTML+"</li>");
                played.scrollTop = played.scrollHeight;
            }
        }
    });

    var active = document.getElementsByClassName("queue_active")[0]
    if(active && current != active){
        current = active;
    }
    getTimeUntil();
});

function getTimeUntil(){
    var time = 0;
    Array.from(queue.children).forEach(li => {
        if(hasClass(li, "queue_entry")){
            if(hasClass(li, "queue_played") && hasClass(li.children[2], "qe_time_until") || hasClass(li, "queue_active") && hasClass(li.children[2], "qe_time_until")){
                if(li.children[2].innerHTML != ""){li.children[2].innerHTML = "";}
            }
            if(!hasClass(li, "queue_played")){
                if(!hasClass(li, "queue_active")){
                    if(li.children[2]){
                        if(hasClass(li.children[2], "qe_time_until") && li.children[2].innerHTML != "Time until: "+fancyTimeFormat(time)+" |"){
                            li.children[2].innerHTML = "Time until: "+fancyTimeFormat(time)+" |";
                        }
                        else if(!hasClass(li.children[2], "qe_time_until")){
                            li.children[1].insertAdjacentHTML("afterend", "<span class='qe_time qe_time_until'>Time until: "+fancyTimeFormat(time)+" |</span>");
                            li.onmouseover = function(){li.children[2].style.visibility = "visible";}
                            li.onmouseleave = function(){li.children[2].style.visibility = "hidden";}
                        }
                    }
                }
                var currentDuration = li.children[1].innerHTML.split(":");
                if(currentDuration[2]){
                    time += (+currentDuration[0]) * 60 * 60 + Number(+currentDuration[1]) * 60 + Number(+currentDuration[2]);
                }
                else{
                    time += (+currentDuration[0]) * 60 + Number(+currentDuration[1]);
                }
            }
        }
    });
}

function playlistRefresh(){
    document.getElementById("playlist_area").value = "";
    Array.from(played.children).forEach(li => {
        if(toggle_export_titles){
            document.getElementById("playlist_area").value += li.children[0].text + "\n" + li.children[0].href + "\n\n";
        }
        else{
            document.getElementById("playlist_area").value += li.children[0].href + "\n";
        }
    });
    Array.from(queue.children).forEach(li => {
        if(toggle_export_titles){
            document.getElementById("playlist_area").value += li.children[0].text + "\n" + li.children[0].href + "\n\n";
        }
        else{
            document.getElementById("playlist_area").value += li.children[0].href + "\n";
        }
    });
}

function toggle(){
    if(!export_list){playlistRefresh();}
    !export_list ? document.getElementById("export_modal").style.visibility = "visible" : document.getElementById("export_modal").style.visibility = "hidden";
    !export_list ? export_list = true : export_list = false;
}

function hasClass(element, className) {
    return (' ' + element.className + ' ').indexOf(' ' + className+ ' ') > -1;
}

function fancyTimeFormat(duration){
    var hrs = ~~(duration / 3600);
    var mins = ~~((duration % 3600) / 60);
    var secs = ~~duration % 60;

    var ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}
