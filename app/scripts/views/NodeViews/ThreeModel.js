define(['backbone', 'underscore', 'jquery', 'BaseNodeView', 'ColladaLoader'], function(Backbone, _, $, BaseNodeView) {

  function request(bimserver, interface, method, params) {
      var request = new XMLHttpRequest();
      request.open('POST', bimserver.url + '/json', false);  // `false` makes the request synchronous
      
      var body = {
        "request": {
          "interface": interface, 
          "method": method, 
          "parameters": params
        }
      }

      if (bimserver.token) body.token = bimserver.token;

      request.send(JSON.stringify(body));

      if (request.status === 200)
          return JSON.parse(request.responseText).response.result;
  }

  return BaseNodeView.extend({

    initialize: function(args) {

      BaseNodeView.prototype.initialize.apply(this, arguments);

      this.model.on('change:selected', this.colorSelected, this);
      this.model.on('change:visible', this.changeVisibility, this);
      this.model.on('remove', this.onRemove, this);
      this.model.on('change:prettyLastValue', this.onEvalComplete, this );
      this.model.workspace.on('change:current', this.changeVisibility, this);

      this.onEvalComplete();

    },

    colorSelected: function(){

      BaseNodeView.prototype.colorSelected.apply(this, arguments);


      if ( !( this.threeGeom && this.model.get('visible')) ) return this;

      if (this.model.get('selected')) {
        var meshMat = new THREE.MeshPhongMaterial({color: 0x66d6ff });
      } else {
        var meshMat = new THREE.MeshPhongMaterial({color: 0x999999});
      }

      this.threeGeom.traverse(function(ele) {
        ele.material = meshMat;
      });

      return this;
    }, 

    formatPreview: function(data){
      return "TODO: formatPreview"
    },

    // 3D move to node subclass
    onRemove: function(){
      this.model.workspace.off('change:current', this.changeVisibility, this);
      scene.remove(this.threeGeom); 
    }, 

    evaluated: false,

    addPoints: function( rawGeom, threeGeom ){

      for ( var i = 0; i < rawGeom.vertices.length; i++ ) {
        var v = rawGeom.vertices[i];
        threeGeom.vertices.push( new THREE.Vector3( v[0], v[1], v[2] ) );
      }

      threeGeom._floodType = 1;

      return threeGeom;
    },

    addLineStrip: function( rawGeom, threeGeom ){

      for ( var i = 0; i < rawGeom.linestrip.length; i++ ) {
        var v = rawGeom.linestrip[i];
        threeGeom.vertices.push( new THREE.Vector3( v[0], v[1], v[2] ) );
      }

      threeGeom._floodType = 2;

      return threeGeom;
      
    },

    onEvalComplete: function(a, b, newValue){

      if (!newValue && this.evaluated) return;

      this.evaluated = true;

      var lastValue = this.model.get('prettyLastValue');
      var temp;

      if ( !lastValue ) return;

      if (lastValue.extra) {
        lastValue = lastValue.value;
      }

      console.log("going to render");
      console.log(lastValue);

      var downloadId = request(
        lastValue.bimserver,
        "Bimsie1ServiceInterface",
        "download",
        { 
          "roid": lastValue.oid,
          "serializerOid": lastValue.bimserver.colladaSerializer.oid,
          "showOwn": "false",
          "sync": "true"
        }
      );

      var downloadResult = request(
        lastValue.bimserver,
        "Bimsie1ServiceInterface",
        "getDownloadData",
        { "actionId": downloadId }
      );

      var xmlString = window.atob(downloadResult.file)
      var xmlParser = new DOMParser();
      var xmlDoc = xmlParser.parseFromString( xmlString, "application/xml" );

      var loader = new THREE.ColladaLoader();
      loader.options.convertUpAxis = true;
      loader.options.upAxis = 'Z';
      loader.parse(xmlDoc, function(collada) {

        if ( this.threeGeom ){
          scene.remove( this.threeGeom );
        }

        this.threeGeom = collada.scene;
        scene.add(this.threeGeom);
        this.changeVisibility();
        this.colorSelected();
      }.bind(this));
    }, 

    changeVisibility: function(){

      if ( !this.threeGeom ){
        return;
      }
        
      if (!this.model.get('visible') || !this.model.workspace.get('current') )
      {
        this.threeGeom.traverse(function(e) { e.visible = false; });
      } else if ( this.model.get('visible') )
      {
        this.threeGeom.traverse(function(e) { e.visible = true; });
      }

    },

    renderNode: function() {
      
      BaseNodeView.prototype.renderNode.apply(this, arguments);

      this.$toggleVis = this.$el.find('.toggle-vis');
      this.$toggleVis.show();

      var icon = this.$toggleVis.find('i');
      var label = this.$toggleVis.find('span');

      if (this.model.get('visible')){
        icon.addClass('icon-eye-open');
        icon.removeClass('icon-eye-close');
        label.html('Hide geometry');
      } else {
        icon.removeClass('icon-eye-open');
        icon.addClass('icon-eye-close');
        label.html('Show geometry');
      }

      return this;

    },

  });

});