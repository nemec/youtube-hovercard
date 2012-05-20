$(function(){
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
  };
  
  var hovercard = $(
    '<div id="yt-hover-thumb">' +
      '<div id="yt-hover-likes" class="yt-hover-overlay"></div>' +
      '<div id="yt-hover-time" class="yt-hover-overlay"></div>' +
    '</div>' +
    '<div id="yt-hover-title"></div>' +
    '<div id="yt-hover-auth">' +
      '<span>by </span>' +
      '<span id="yt-hover-author"></span>' +
    '</div>' +
    '<div id="yt-hover-desc"></div>'
  );

  var css_styles = {
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
    }
  }
  
  function onsuccess(card, data) {
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
    }

  add_link_preview("youtube.com", hovercard, css_styles,
    function(uri){
      return 'https://gdata.youtube.com/feeds/api/videos/' + uri.queryKey.v + '?v=2&alt=json'
    }, onsuccess);

  add_link_preview("youtu.be", hovercard, css_styles,
    function(uri){
      return 'https://gdata.youtube.com/feeds/api/videos/' + uri.directory.substr(1) + '?v=2&alt=json'
    }, onsuccess);
});
