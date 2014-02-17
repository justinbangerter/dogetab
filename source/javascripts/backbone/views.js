function makeId(collection, attr){
  return _(_(collection.pluck(attr)).push(0)).max() + 1;
}

var renders = (function () {
  var r = {};

  var f = function() {
    var x = JSON.stringify(r);
    x = x.substring(1,x.length - 1);
    return x.split(',').join('\n');
  }
  f.add = function(label){
    if(!r[label]) r[label] = 0;
    r[label] = r[label] + 1;
  }

  return f;
})();

var Views = (function () {
  var Views = {};

  var filters = {
    alphanum: clean(/[^a-zA-Z0-9 \-\.\,\:]/g),
    alpha: clean(/[^a-zA-Z \-\.]/g),
    num: clean(/[^0-9\-\.]/g),
    natnum: clean(/[^0-9]/g),
    posnum: clean(/[^0-9\.]/g)
  };

  function clean(filter){
    return function(dirty){
      return String(dirty).replace(filter,"")
    }
  }

  function tmpl(selector) {
    return _.template($(selector).html());
  }

  function getEl(ctx, selector) {
    return function() {
      return ctx.$(selector);
    };
  }

  Views.Portion = Backbone.View.extend({
      template: tmpl('#portion-tmpl'),
      tagName: 'td',
      className: 'buddy',
      initialize: function() {
        this.listenTo(this.model, 'destroy', this.remove);
      },
      render: function() {
        renders.add('portion');
        this.$el.html(this.template(this.model.toJSON()));
        return this;
      },
      events: {
        'click input[type="checkbox"]': 'clicked'
      },
      clicked: function (e){
        this.model.setIncluded(e.target.checked)
        .updateStorage();
      }
  });

  Views.Item = Backbone.View.extend({
      template: tmpl('#item-tmpl'),
      tagName: 'tr',
      className: 'item',
      events: {
        'click .remove': 'clear',
        'blur .name': 'setName',
        'blur .qty': 'setQty',
        'blur .price': 'setPrice'
      },
      clear: function() {
        this.model.del();
      },
      initialize: function() {
        this.$end = function() { return this.$('.item-end') };

        this.listenTo(this.model, 'destroy', this.remove);
        this.listenTo(this.model, 'relational:change:portions', this.portionChange);
        this.listenTo(this.model, 'add:portions', function(portion){
          this.addOnePortion(portion).portionChange();
        });
        this.listenTo(this.model, 'remove:portions', function(portion){
          this.portionChange();
        });


        this.listenTo(Models.portions, 'reset', this.addAllPortions);
      },
      hasPortions: function(){
        return this.model.get('portions').where({
            included: true
        }).length == 0;
      },
      portionChange: function (){
        var action = this.hasPortions() ? 'addClass': 'removeClass';
        this.$el[action]('unpaid');
        return this;
      },
      sortedPortions: function(){
        return _(this.model.get('portions').sortBy(function(p){
          return p.get('buddy').get('order');
        }));
      },
      render: function() {
        renders.add('item');
        this.$el.html(this.template(this.model.toJSON()));
        this.addAllPortions().portionChange();
        inputResize(this.$('.name'), 5);
        inputResize(this.$('.qty'), 10);
        inputResize(this.$('.price'), 10);
        return this;
      },
      addAllPortions: function(){
        this.$('.buddy').remove();
        this.sortedPortions().each(function(portion){
          this.addOnePortion(portion);
        }, this);
        return this;
      },
      addOnePortion: function(portion) {
        new Views.Portion({
            model: portion
        }).render().$el.insertBefore(this.$end());
        return this;
      },
      setName: function(e){
        var cleaned = filters.alphanum(e.target.value);
        this.model.safeSet('name',cleaned);
        $(e.target).val(cleaned);
      },
      setQty: function(e){
        var cleaned = filters.posnum(e.target.value);
        this.model.safeSet('qty',cleaned);
        $(e.target).val(cleaned);
      },
      setPrice: function(e){
        var cleaned = filters.posnum(e.target.value);
        this.model.safeSet('price',cleaned);
        $(e.target).val((+cleaned).toFixed(2));
      }
  });

  Views.BuddyTotal = Backbone.View.extend({
      template: tmpl('#buddy-total-tmpl'),
      tagName: 'td',
      className: 'text-center',
      initialize: function(){
        this.listenTo(Models.items, 'change:price', this.render);
        this.listenTo(Models.items, 'change:qty', this.render);
        this.listenTo(this.model, 'remove', this.remove);
        this.listenTo(Models.portions, 'reset', this.render);
        this.listenTo(Models.portions, 'updated', this.render);
      },
      render: function(){
        renders.add('buddy_total');
        this.$el.html(this.template({
              total: this.model.total()
        }));
        return this;
      }
  });

  Views.GrandTotal = Backbone.View.extend({
      template: tmpl('#grand-total-tmpl'),
      tagName: 'td',
      id: 'grand-total',
      className: 'suchnumber',
      initialize: function(){
        this.listenTo(Models.items, 'add', this.render);
        this.listenTo(Models.items, 'remove', this.render);
        this.listenTo(Models.items, 'reset', this.render);
        this.listenTo(Models.items, 'change:price', this.render);
        this.listenTo(Models.items, 'change:qty', this.render);
      },
      render: function(){
        renders.add('grand_total');
        this.$el.html(this.template({
              total: Models.items.total()
        }));
        return this;
      }
  });

  Views.Totals = Backbone.View.extend({
      el: '#total',
      initialize: function() {
        this.$total_end = this.$('#total-end');
        this.$total_label = this.$('#total-label');
        this.listenTo(Models.buddies, 'add', this.addOneBuddy);
        this.listenTo(Models.buddies, 'reset', this.addAllBuddies);
        this.render();
      },
      addOneBuddy: function(buddy){
        new Views.BuddyTotal({
            model: buddy
        }).render().$el.insertBefore(this.$total_end);
      },
      addAllBuddies: function(buddies){
        _(buddies.sortBy(function(b){
          return b.get('order');
        })).each(this.addOneBuddy, this);
      },
      render: function() {
        renders.add('total');
        new Views.GrandTotal()
          .render()
          .$el
          .insertAfter(this.$total_label);
        this.addAllBuddies(Models.buddies);
        return this;
      }
  });

  Views.BuddyHeader = Backbone.View.extend({
      template: tmpl('#buddy-header-tmpl'),
      tagName: 'th',
      className: 'buddy',
      events: {
        'click .remove.buddy': 'removeBuddy',
        'blur .buddy-name': 'renameBuddy'
      },
      initialize: function(){
        this.listenTo(this.model, 'remove', this.remove);
      },
      render: function(){
        renders.add('buddy_header');
        this.$el.html(this.template(this.model.toJSON()))
        inputResize(this.$('.buddy-name'),4);
        return this;
      },
      renameBuddy: function(e) {
        this.model.safeSet('name', e.target.value);
      },
      removeBuddy: function(e) {
        this.model.del();
      }
  });

  Views.AppView = Backbone.View.extend({
      el: '#app',
      headerTemplate: tmpl('#header-tmpl'),
      newItemTemplate: tmpl('#new-item-tmpl'),
      buddyNewTemplate: tmpl('#buddy-new-tmpl'),
      events: {
        'click .remove.all': 'clearAll',
        'click .add.buddy': 'createBuddy',
        'keypress #new-item': 'createItem',
        'click #add-item': 'createItem',
      },
      initialize: function() {
        this.items = Models.items;
        this.buddies = Models.buddies;
        this.portions = Models.portions;

        this.totalsView = new Views.Totals();

        this.$header = this.$('#item-header');
        this.$new_item = this.$('#new-item');
        this.$name = getEl(this, '#new-name');
        this.$price = getEl(this, '#new-price');
        this.$qty = getEl(this, '#new-qty');
        this.$header_end = getEl(this, '.header-end');
        this.$new_end = getEl(this, '#new-end');

        this.listenTo(this.items, 'add', this.addOneItem);
        this.listenTo(this.items, 'reset', this.addAllItems);

        this.listenTo(this.buddies, 'add', this.addOneBuddy);
        this.listenTo(this.buddies, 'remove', this.clearBuddyTmpl);

        //reset all
        _([
            this.items,
            this.buddies,
            Models.portions
        ]).each(function(x){
        x.fetch({reset: true});
        });
        //XXX workaround: repair collections
        Models.portions.each(function(x){
          x.collection = Models.portions;
        });
        this.render();
      },
      render: function() {
        this.firstLoad();
        renders.add('app');
        this.$header.html(this.headerTemplate());
        this.$new_item.html(this.newItemTemplate());
        inputResize(this.$('.name'), 5);
        inputResize(this.$('.qty'), 10);
        inputResize(this.$('.price'), 10);
        this.addAllBuddies();
        return this;
      },
      firstLoad: function(){
        var empty = true;
        empty &= Models.buddies.isEmpty();
        empty &= Models.items.isEmpty();
        empty &= Models.portions.isEmpty();
        if(empty) {
          this.items.create({
              _id: makeId(Models.items, '_id'),
              name: 'very twinkie',
              price: 9000.01,
              qty: 1
          })
          this.createBuddy();
          this.createBuddy();
        }
      },
      clearAll: function(e){
        function del(x) { x.del(); }
        _(Models.buddies.toArray()).each(del);
        _(Models.items.toArray()).each(del);
        _(Models.portions.toArray()).each(function(x){
          x.destroy();
        });
      },
      createBuddy: function(e) {
        this.buddies.create({
            _id: makeId(Models.buddies, '_id')
        }).createPortions();
      },
      clearBuddyTmpl: function(buddy) {
        $('.buddy'+buddy.get('_id')).remove();
      },
      addOneBuddy: function(buddy){
        var buddyHeader = new Views.BuddyHeader({
            model: buddy
        }).render().$el.insertBefore(this.$header_end());
        this.$new_end().before(
          this.buddyNewTemplate(buddy.toJSON())
        );
      },
      addAllBuddies: function() {
        $('th.buddy').filter(function(){
          return !$(this).hasClass('add');
        }).remove();
        this.sortedBuddies().each(this.addOneBuddy, this);
      },
      sortedBuddies: function(){
        return _(this.buddies.sortBy(function(buddy){
          return buddy.get('order');
        }));
      },
      createItem: function(e) {
        if('click' === e.type || e.which === keys.ENTER){
          var app = this;
          function val(y) {
            return app['$'+y]().val().trim();
          }
          if(val('name') && val('price')) {
            this.items.create(this.newItemAttributes())
            .createPortions(this.readNewInclusions());
            this.$price().val('');
            this.$qty().val('');
            this.$name().val('').focus();
          }
        }
      },
      readNewInclusions: function() {
        var result = {};
        $('.new.buddy').each(function(){
          result[$(this).data('buddyid')] = $('input',this).attr('checked');
        });
        return result;
      },
      newItemAttributes: function() {
        return {
          _id: makeId(Models.items, '_id'),
          name: filters.alphanum(this.$name().val()),
          price: filters.posnum(this.$price().val()),
          qty: filters.posnum(this.$qty().val() || 1)
        }
      },
      addOneItem: function(item){
        new Views.Item({
            model: item
        }).render().$el.insertAfter(this.$new_item);
      },
      addAllItems: function() {
        $('.item').remove();
        this.items.each(this.addOneItem, this);
      }
  });

  return Views;
})();
