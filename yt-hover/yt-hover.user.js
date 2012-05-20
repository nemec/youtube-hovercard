// ==UserScript==
// @name           Youtube Hovercard
// @version        1.0
// @description    Add video title and description under youtube links.
// @namespace      djnemec
// @require        https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// @include        http://*
// @include        https://*
// ==/UserScript==

var max_description_length = 200;


function secondstotime(totalSec, sep){
  sep = sep || ':';
  hours = parseInt( totalSec / 3600 ) % 24;
  minutes = parseInt( totalSec / 60 ) % 60;
  seconds = totalSec % 60;

  result = "";
  if(hours > 0){
    result += (hours < 10 ? "0" : "") + hours + sep;
  }
  if(hours > 0 || minutes > 0){
    result += (minutes < 10 ? "0" : "") + minutes + sep;
  }
  result += (seconds  < 10 ? "0" : "") + seconds;
  return result;
}


var hovercard = $(
  '<div id="yt-hover">' +
    '<div id="yt-hover-loading"></div>' +
    '<div id="yt-hover-thumb">' +
      '<div id="yt-hover-likes" class="yt-hover-overlay"></div>' +
      '<div id="yt-hover-time" class="yt-hover-overlay"></div>' +
    '</div>' +
    '<div id="yt-hover-title"></div>' +
    '<div id="yt-hover-auth">' +
      '<span>by </span>' +
      '<span id="yt-hover-author"></span>' +
    '</div>' +
    '<div id="yt-hover-desc"></div>' +
    '<div id="yt-hover-err"></div>' +
  '</div>');


var css_styles = {
  "#yt-hover": {
    "font-family": "arial, sans-serif",
    "position": "absolute",
    "z-index": 1000,
    "padding": "3px",
    "background": "white",
    "border": "1px solid black",
    "width": "300px"
  },
  "#yt-hover-thumb": {
    "top": 0,
    "width": "120px",
    "min-height": "30px",
    "position": "relative",
    "float": "left",
    "margin-right": "3px",
  },
  "#yt-hover-title": {
    "font-size": "13px",
    "font-weight": "bold"
  },
  "#yt-hover-auth": {
    "font-style": "italic",
    "font-size": "small"
  },
  "#yt-hover-desc": {
    "font-size": "small"
  },
  ".yt-hover-overlay": {
    "background": "rgb(0, 0, 0)",
    "background": "rgba(0, 0, 0, 0.6)",
    "color": "white",
    "position": "absolute",
    "font-size": "small",
    "padding": "0 4px",
    "margin": "3px",
    "-moz-border-radius": "3px",
    "border-radius": "3px",
  },
  "#yt-hover-time": {
    "bottom": 0,
    "right": 0
  },
  "#yt-hover-likes": {
    "bottom": 0,
    "left": 0
  },
  "#yt-hover-err": {
    "background": "#F778A1"
  }
};


// Apply given style dict to provided selector context (jq object or str)
// style_dict is a dictionary with keys being sub-selectors of the given
// context and values being dicts of css properties
/**
 * The javascript:
 * { "#idname": { "color": "black" } }
 *
 * becomes CSS:
 * #idname {
 *   color: black;
 * }
 */
function apply_css(obj_selector, style_dict){
  $.each(style_dict, function(selector, properties){
    var obj = $(obj_selector).find(selector).andSelf().filter(selector);
    $.each(properties, function(property, value){
      obj.css(property, value);
    });
  });
}


$(function(){
  var hovering = false;
  apply_css(hovercard, css_styles);
    
  function yt_hide(){
    if(!hovering){
      $("#yt-hover").fadeOut(function(){
        $(this).remove();
      });
    }
  }

  function fadein(){
    var card = hovercard.clone();
    card.children().hide();
    $("#yt-hover").remove();  // Remove existing hovercard if necessary
    card.mouseover(function(){ hovering = true; });
    card.mouseout(function(){ hovering = false; setTimeout(yt_hide, 100); });

    var link = $(this).first();
    var uri = parseUri(link.attr('href'));
    var vid = null;
    
    if(uri.host.search("youtube.com") >= 0){
      vid = uri.queryKey.v;
    }
    else if(uri.host.search("youtu.be") >= 0){
      vid = uri.directory.substr(1);
    }

    if(vid){
      hovering = true;
      $.ajax({
        url: 'https://gdata.youtube.com/feeds/api/videos/' + vid + '?v=2&alt=json',
        type: 'GET',
        dataType: 'json',
        beforeSend: function () {
          card.find("#yt-hover-loading").text(
            'Loading video data...').show();
        },
        success: function (data) {
          data = data.entry;
          if(data.title){
            card.find("#yt-hover-title").text(data.title.$t);
          }
          if(data.author.length > 0){
            card.find("#yt-hover-author").text(data.author[0].name.$t);
          }
          if(data.media$group){
            var media = data.media$group;
            if(media.media$thumbnail.length > 0){
              var thumb = media.media$thumbnail[0];
              card.find("#yt-hover-thumb").append(
                '<img src="' + thumb.url.replace("http", "https") + '" />');
            }
            if(media.media$description){
              card.find("#yt-hover-desc").text(
                media.media$description.$t.substr(
                  0, max_description_length));
            }
            if(media.media$content.length > 0){
              card.find("#yt-hover-time").text(
                secondstotime(media.media$content[0].duration));
            }
          }
          if(data.yt$rating){
              card.find("#yt-hover-likes").text(
                data.yt$rating.numLikes + "\u21EA");
          }
          card.children().show();
        },
        error: function(jqXHR, textStatus, errorThrown) {
          card.find("#yt-hover-err").text(
            'Error retrieving info: ' + errorThrown).show();
        },
        complete: function () {
          $('#yt-hover-loading').remove();
        }
      });
    }
    else{
      card.find("#yt-hover-err").text(
            'Could not parse valid video ID').show();
    }

    $("body").append(card);
    
    var pos = link.offset();
    pos.top += link.height();
    card.offset(pos);
    card.fadeIn();
  }
  
  function fadeout(){
    hovering = false;
    setTimeout(yt_hide, 100);
  }
  
  $('a[href*="youtube.com"]').livequery(function(){$(this).hoverIntent(fadein, fadeout)});
  $('a[href*="youtu.be"]').livequery(function(){$(this).hoverIntent(fadein, fadeout)});
});
