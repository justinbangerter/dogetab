var Models = (function () {
  Models = {};

  function safeSet(property, value){
    this.set(property, value).save();
    this.get('portions').each(function(p){
      Models.portions.localStorage.update(p);
    });
    return this;
  }

  function deleteModel(model, attr){
    var opts = {};
    opts[attr] = model;

    _(Models.portions.where(opts)).each(function(p){
      p.destroy();
    });
    model.destroy();
    Models.portions.trigger('updated');
  }

  function portionId(buddy, item){
    return [
      buddy.get('_id'),
      '-',
      item.get('_id')
    ].join('');
  }

  Models.validPortions = function() {
    var result = [];
    Models.buddies.each(function(buddy){
      Models.items.each(function(item){
        result.push(portionId(buddy,item));
      });
    });
    return result;
  }


  Models.Buddy = Backbone.RelationalModel.extend({
      idAttribute: '_id',
      initialize: function(){
        var order = _(_(Models.buddies.pluck('order')).push(0)).max() + 1;
        this.set('order', order);
      },
      createPortions: function() {
        var buddy = this;
        Models.items.each(function(item){
          Models.portions.create({
              _id: portionId(buddy, item),
              item: item,
              buddy: buddy
          });
        });
        Models.portions.trigger('updated');
        return this;
      },
      defaults: {
        name: 'Doge',
        order: 1
      },
      del: function() {
        deleteModel(this, 'buddy');
      },
      safeSet: function(){
        return safeSet.apply(this, arguments);
      },
      portions: function() {
        return this.get('portions').where({
            included: true
        });
      },
      total: function() {
        var portions = this.portions();

        if(portions.length == 0) return 0;

        return portions.map(function(portion) {
          var item = portion.get('item');
          return item.get('qty') * item.get('price') / item.portionCount();
        })
        .reduce(function(memo, n) {
          return memo + n;
        });
      }
  });

  Models.Buddies = Backbone.Collection.extend({
      model: Models.Buddy,
      localStorage: new Backbone.LocalStorage('dogebill_buddies'),
  });
  Models.buddies = new Models.Buddies();

  Models.Item = Backbone.RelationalModel.extend({
      idAttribute: '_id',
      defaults: {
        name: 'very twinkie',
        price: 9000.01,
        qty: 1
      },
      createPortions: function(inclusions){
        var item = this;
        Models.buddies.each(function(buddy){
          Models.portions.create({
              _id: portionId(buddy, item),
              item: item,
              buddy: buddy,
              included: inclusions[buddy.get('_id')]
          });
        });
        Models.portions.trigger('updated');
        return this;
      },
      del: function() {
        deleteModel(this, 'item');
      },
      portionCount: function(){
        return this.get('portions')
        .where({ included: true})
        .length;
      },
      addBuddy: function(buddy){
        Models.portions.add(
          this.get('portions').add({
              included: true,
              buddy: buddy,
              item: this
          })
        );
      },
      safeSet: function(){
        return safeSet.apply(this, arguments);
      }
  });

  Models.Items = Backbone.Collection.extend({
      model: Models.Item,
      localStorage: new Backbone.LocalStorage('dogebill_items'),
      prices: function() {
        return this.map(function(x) {
          return x.get('qty') * x.get('price');
        });
      },
      total: function() {
        var prices = this.prices();
        if(prices.length == 0) return 0;
        return prices.reduce(function(a,b) {
          return a + b;
        })
      }
  });

  Models.items = new Models.Items();

  Models.Portion = Backbone.RelationalModel.extend({
      idAttribute: '_id',
      initialize: function(){
      },
      defaults: {
        included: true
      },
      setIncluded: function(bool) {
        this.set('included', bool);
        Models.portions.trigger('updated');
        return this;
      },
      updateStorage: function() {
        this.save();
        this.collection.each(function(p){
          Models.portions.localStorage.update(p);
        });
        return this;
      },
      relations: [{
          type: Backbone.HasOne,
          key: 'buddy',
          relatedModel: 'Models.Buddy',
          collectionType: 'Models.Buddies',
          reverseRelation: {
            key: 'portions',
            includeInJSON: '_id'
          }
      },{
        type: Backbone.HasOne,
        key: 'item',
        relatedModel: 'Models.Item',
        collectionType: 'Models.Items',
        reverseRelation: {
          key: 'portions',
          includeInJSON: '_id'
        }
      }]
  });

  Models.Portions = Backbone.Collection.extend({
      model: Models.Portion,
      localStorage: new Backbone.LocalStorage('dogebill_portions')
  });
  Models.portions = new Models.Portions();

  return Models;
})();
