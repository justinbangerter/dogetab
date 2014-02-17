$(document).ready(function(){
  var ruler = $('<div style="visibility: hidden; white-space: nowrap; display: inline-block; padding: 0;"></div>')
  .appendTo($('body'));
  window.inputResize = function($elements, padding){

    padding = padding || 0;

    function width(pad){
      return function($el){
        return function(text){
          return ruler
          .text(text)
          .width() + pad;
        }
      }
    }

    function resize($el) {
      return function(pad){
        return function() {
          $el.css('width', width(pad)($el)($el.val())  + 'px');
        }
      }
    }

    $elements.each(function(){
      var $el = $(this);
      var r = resize($el)(padding);
      $el.focus(r)
      .blur(r)
      .keydown(r)
      .keyup(r);
      r();
    });

    }
});
