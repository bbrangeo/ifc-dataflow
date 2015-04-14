define(['backbone', 'underscore', 'jquery', 'BaseNodeView', 'jqueryuislider'], function(Backbone, _, $, BaseNodeView) {

  return BaseNodeView.extend({

    template: _.template( $('#node-inputstring-template').html() ),

    initialize: function(args) {

      BaseNodeView.prototype.initialize.apply(this, arguments);
      //this.rendered = false;

      this.model.on('change:extra', function() { 
        console.log("changed!")
        var ex = this.model.get('extra') ;

        this.silentSyncUI( ex );

        this.model.trigger('updateRunner'); 
        this.model.workspace.trigger('requestRun');
        
      }, this);

    },
 
    render: function() {
      BaseNodeView.prototype.render.apply(this, arguments);

      //if (this.rendered) return this;


      var that = this;
      var extra = this.model.get('extra');
      var val = extra.value != undefined ? extra.value : this.model.get('lastValue');

      console.log("render", val)

      this.inputText = this.$el.find(".text-input");
      this.inputText.val(val);
      this.inputText.change( function(e){ that.valChanged.call(that, e); e.stopPropagation(); });

      return this;
    },

    silentSyncUI: function(data){
      this.silent = true;
      this.inputText.val( data.value );
      this.silent = false;
    },

    valChanged: function() {
        this.inputSet();
        this.model.workspace.trigger('updateRunner');
    },

    inputSet: function(e, ui) {
        if (this.silent) return;
        var newValue = { value: this.inputText.val() };
        this.model.workspace.setNodeProperty({property: 'extra', _id: this.model.get('_id'), newValue: newValue });           
    }
  });

});