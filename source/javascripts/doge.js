(function($, _, window) {
    window.dogeination = {};
    var suchcolors = [
      "#0066FF", "#FF3399", "#33CC33", "#FFFF99", "#FFFF75", "#8533FF",
      "#33D6FF", "#FF5CFF", "#19D1A3", "#FF4719", "#197519", "#6699FF", "#4747D1",
      "#D1D1E0", "#FF5050", "#FFFFF0", "#CC99FF", "#66E0C2", "#FF4DFF", "#00CCFF" ];
    var suchwords = [];

    function addWord(word, weight) {
      weight = weight || 3;
      for(var i = 0; i < weight; i++){
        suchwords.push(word);
      }
    };

    addWord('such bill');
    addWord('very split');
    addWord('much fair');
    addWord('so money');
    addWord('shared responsibilities');
    addWord('very equal');
    addWord('shibe 5eva');
    addWord('not expensive');
    addWord('mr. barles', 1);
    addWord('wow', 16);
    function randomFrom(arr){
      return arr[Math.floor(Math.random() * arr.length)];
    }
    var overlay = $('.such.overlay');
    window.dogeination.dogelay = 2500;
    var timeout = false;
    function doShibe(){
      //var left = overlay.position().left + Math.random() * overlay.width() + 'px';
      var fontSize = Math.max(20, (Math.random() * 50 + 24));
      var top = overlay.position().top + Math.random() * (overlay.height() - 2 * fontSize);
      $('<span></span>')
      .addClass('wow')
      .css('left', Math.random() * 80 + '%')
      .css('top', top + 'px')
      .css('font-size', fontSize + 'px')
      .css('color', randomFrom(suchcolors))
      .text(randomFrom(suchwords))
      .appendTo(overlay);

      if ($(".wow").length > 8 ) {
        $('.wow').first().remove();
      }
      timeout = setTimeout(doShibe, window.dogeination.dogelay);
    }
    function redoShibe() {
      if(timeout) window.clearTimeout(timeout);
      timeout = setTimeout(doShibe, window.dogeination.dogelay);
    }
    redoShibe();

    window.dogeination.suchwords = suchwords;
    window.dogeination.suchcolors = suchcolors;
    window.dogeination.addWord = addWord;
    window.dogeination.redoShibe = redoShibe;
})($, _, window);
