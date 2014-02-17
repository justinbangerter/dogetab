//= require dependencies.js
$(document).ready(function() {
  Views.AppView = new Views.AppView;
  function rand(range){
    return Math.random() * 2 * range - range;
  };
  function shake($el){
    $el.animate({
        translate: rand(10) + 'px,' + rand(10) + 'px'
    }, 5);
    var center = $el.width()/2;
  }
  new Konami(function() {
    dogeination.dogelay = 1;
    dogeination.suchwords.length = 0;
    dogeination.addWord('rage',10);
    dogeination.addWord('so bite',10);
    dogeination.addWord('10/10 Konami',10);
    dogeination.addWord('very secret',10);
    dogeination.addWord('much distract',10);
    var $el = $('.suchdoge')
    .css('background',
      'url("/images/rage.png") no-repeat scroll center center / contain  rgba(0, 0, 0, 0)');
    dogeination.redoShibe();
    function doshake($el) {
      window.setTimeout(function(){ shake($el); doshake($el); }, 10);
    }
    doshake($el);
  });
});
