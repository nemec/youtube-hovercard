// ==UserScript==
// @name           Link Preview
// @version        1.0
// @description    Lets you preview links by hovering over them.
// @namespace      djnemec
// @require        https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// @include        http://*
// @include        https://*
// ==/UserScript==

var LinkPreview = {
  hovering: false,
  
  // Never apply hover for links (hrefs) that contain these strings
  blacklist: ["facebook.com", "reddit.com/user/"],
  
  registered_hosts: {},

  hovercard: $(
    '<div id="link-preview">' +
      '<div id="link-preview-loading"></div>' +
      '<div id="link-preview-content"></div>' +
      '<div id="link-preview-err"></div>' +
    '</div>'),

  css_styles: {
    "#link-preview": {
      "font-family": "arial, sans-serif",
      "position": "absolute",
      "z-index": 1000,
      "padding": "3px",
      "background": "white",
      "border": "1px solid black",
      "width": "300px"
    },
    "#link-preview-err": {
      "background": "#F778A1"
    }
  },


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
  apply_css: function(obj_selector, style_dict){
    if(style_dict != null){
      $.each(style_dict, function(selector, properties){
        var obj = $(obj_selector).find(selector).andSelf().filter(selector);
        $.each(properties, function(property, value){
          obj.css(property, value);
        });
      });
    }
  },
    
  fadeout: function(){
    LinkPreview.hovering = false;
    setTimeout(LinkPreview.hide, 100);
  },

  hide: function(){
    if(!LinkPreview.hovering){
      $("#link-preview").fadeOut(function(){
        $(this).remove();
      });
    }
  }
}

function add_link_preview(host, inner_hcard, css, make_url, onsuccess){
  var hovercard = $(LinkPreview.hovercard);
  // Insert the custom DOM elements
  hovercard.find("#link-preview-content").append(inner_hcard);
  LinkPreview.apply_css(hovercard, LinkPreview.css_styles);
  LinkPreview.apply_css(hovercard, css);

  function fadein(link){  
    try{
      var card = hovercard.clone();
      card.children().hide();
      $("#link-preview").remove();  // Remove existing hovercard if necessary
      card.mouseover(function(){ LinkPreview.hovering = true; });
      card.mouseout(function(){
        LinkPreview.hovering = false; 
        setTimeout(LinkPreview.hide, 100);
      });

      var uri = link.attr("href");
      var target_url = make_url(parseUri(uri));
      if(uri && target_url){
        LinkPreview.hovering = true;
        $.ajax({
          url: target_url,
          type: 'GET',
//          dataType: 'json',  // Let it guess...
          beforeSend: function () {
            card.find("#link-preview-loading").text(
              'Loading data...').show();
          },
          success: function(data){
            onsuccess(card, data);
            card.children().show();
          },
          error: function(jqXHR, textStatus, errorThrown) {
            if(LinkPreview.hovering){
              card.find("#link-preview-err").text(
                'Error retrieving info: ' + errorThrown).show();
            }
          },
          complete: function () {
            $('#link-preview-loading').remove();
          }
        });
      }
      else{
        card.find("#link-preview-err").text(
          'Could not get correct parameters').show();
      }
      
      $("body").append(card);
  
      var pos = link.offset();
      pos.top += link.height();
      card.offset(pos);
      card.fadeIn();
    }
    catch(e){
      console.log(e.stack);
      if(LinkPreview.hovering){
        card.find("#link-preview-err").text(e).show();
      }
    }
  }
  
  LinkPreview.registered_hosts[host] = fadein;
}

$(function(){
  // Bind to all links. When hovered, loop through each of the registered
  // hosts for one that matches somewhere in the url and then execute the
  // fadein function for that (and only that) match.
  $('a').livequery(function(){
    $(this).hoverIntent(function(){
      var linkelem = $(this).first();
      var link = linkelem.attr("href");
      $.each(LinkPreview.blacklist, function(i, host){
        if(link.search(host) >= 0){
          link = undefined;
          return false;
        }
      });
      if(link === undefined){
        return;
      }
      $.each(LinkPreview.registered_hosts, function(host, fadein){
        if(link.search(host) >= 0){
          fadein(linkelem);
          return false;
        }
      });
    }, LinkPreview.fadeout);
  });
});
