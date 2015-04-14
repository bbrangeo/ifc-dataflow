define(['backbone', 'underscore', 'jquery', 'BaseNodeView', 'jqueryuislider'], function(Backbone, _, $, BaseNodeView) {

  return BaseNodeView.extend({

    template: _.template( $('#node-select-template').html() ),

    initialize: function(args) {

      BaseNodeView.prototype.initialize.apply(this, arguments);

      this.model.on('change:extra', function() { 
        
        var ex = this.model.get('extra') ;
        console.log("changed", ex)
        this.silentSyncUI( ex );

        this.model.trigger('updateRunner'); 
        this.model.workspace.trigger('requestRun');
        
      }, this);

    },

    renderNode: function() {
      BaseNodeView.prototype.renderNode.apply(this, arguments);

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
      console.log(data)
      this.silent = false;
    },

    valChanged: function() {
      console.log("change handler")
        this.inputSet();
        this.model.trigger('updateRunner');
        //this.model.workspace.trigger('requestRun');
    },

    inputSet: function(e, ui) {
        if (this.silent) return;
        console.log("CALLED SET WHOO")
        var newValue = { 
          selectedIndex: parseInt(this.$el.find('.select-input').val(), 10),

        };
        this.model.workspace.setNodeProperty({property: 'extra', _id: this.model.get('_id'), newValue: newValue });           
    }


  });

});