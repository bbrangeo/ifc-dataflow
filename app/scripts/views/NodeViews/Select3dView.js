define(['backbone', 'underscore', 'jquery', 'ThreeModelView', 'jqueryuislider'], function(Backbone, _, $, ThreeModelView) {

  return ThreeModelView.extend({

    template: _.template( $('#node-select3d-template').html() ),

    initialize: function(args) {

      ThreeModelView.prototype.initialize.apply(this, arguments);

      this.model.on('change:extra', function() { 
        var ex = this.model.get('extra') ;
        this.silentSyncUI( ex );
        this.model.trigger('updateRunner'); 
        this.model.workspace.trigger('requestRun');
      }, this);

    },

    renderNode: function() {
      ThreeModelView.prototype.renderNode.apply(this, arguments);

      var extra = this.model.get('extra');
      var val = extra.selectedIndex != undefined ? extra.selectedIndex : 0;
      var items = extra.items != undefined ? extra.items : [];

      this.$el.on('change', '.select-input', function(e){ 
        this.valChanged.call(this, e); 
        e.stopPropagation(); 
      }.bind(this));

      return this;
    },
 
    silentSyncUI: function(data){
      this.silent = true;
      this.$el.find('.select-input').val( data.selectedIndex );
      this.silent = false;
    },

    valChanged: function() {
      this.inputSet();
      this.model.trigger('updateRunner');
      //this.model.workspace.trigger('requestRun');
    },

    inputSet: function(e, ui) {
      if (this.silent) return;
      
      var newValue = { 
        selectedIndex: parseInt(this.$el.find('.select-input').val(), 10),
      };
      this.model.workspace.setNodeProperty({property: 'extra', _id: this.model.get('_id'), newValue: newValue });           
    }
  });

});