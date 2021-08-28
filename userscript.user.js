// // ==UserScript==
// @name Enhanced playlist for CyTube
// @namespace enhancedplaylist
// @description Extra features for CyTube
// @grant GM_addStyle
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
    .qe_time_until {
        visibility: hidden;
        padding-right: 5px;
    }
` );

document.getElementById("videocontrols").insertAdjacentHTML("afterbegin", "<button class='btn btn-sm btn-default' id='toggle_button'>Export</span></button>");
document.body.insertAdjacentHTML("beforeend", `
    <div id="export_modal" class="modal fade in" aria-hidden="false" style="display: block; padding-right: 10px;">
    <div id="modal_backdrop" class="modal-backdrop fade in" style="height: 2088px;"></div>
    <div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><button class="close" id="close_button" data-dismiss="modal" aria-hidden="true">×</button>
    <h3>Playlist URLs</h3></div><div class="modal-body"><button class='btn btn-sm btn-default' id="toggle_export_titles_btn">Titles</button><Textarea id="playlist_area" class="form-control" type="text"></Textarea></div>
    <div class="modal-footer"></div></div></div></div>`);

var current = "", export_list = false, toggle_export_titles = true;

document.getElementById("export_modal").style.visibility="hidden";
document.getElementById("toggle_button").onclick = function(){toggle();};
document.getElementById("close_button").onclick = function(){toggle();};
document.getElementById("modal_backdrop").onclick = function(){toggle();};
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

setTimeout(function(){observeDOM( document.getElementById("queue"), function(m){
    var addedNodes = [], removedNodes = [], played = [];

    m.forEach(record => record.addedNodes.length & addedNodes.push(...record.addedNodes))
    m.forEach(record => record.removedNodes.length & removedNodes.push(...record.removedNodes))

    Array.from(addedNodes).forEach(li => {
        if(hasClass(li, "queue_entry") && !hasClass(li, "queue_played") && export_list){
            playlistRefresh();
            console.log('"'+li.children[0].innerHTML+'" added or moved, refreshing export');
        }
    });

    Array.from(removedNodes).forEach(li => {
        if(li == current || hasClass(li, "queue_active")){
            played.push(li);
        }
    });

    var c = 0;
    Array.from(document.getElementById("queue").children).forEach(li => {
        if(hasClass(li, "queue_entry") && !hasClass(li, "queue_played")){
            c++;
        }
    });

    var active = document.getElementsByClassName("queue_active")[0]
    if(active){
        if(current != active){
            current = active;
        }
        if(played[0] != null && active != null){
            active.insertAdjacentHTML("beforebegin", "<li class='queue_entry queue_temp queue_played'>"+played[0].innerHTML+"</li>");
        }
    }
    else{
        if(c == 0 && played[0] != null){
            current = document.getElementById("queue").insertAdjacentHTML("beforeend", "<li class='queue_entry queue_temp queue_played'>"+played[0].innerHTML+"</li>")
        }
    }
    getTimeUntil();
});},3000);

function getTimeUntil(){
    var time = 0;
    Array.from(document.getElementById("queue").children).forEach(li => {
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
    Array.from(document.getElementById("queue").children).forEach(li => {
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
