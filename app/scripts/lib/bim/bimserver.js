if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}

// web worker context
if (typeof require != 'function' && typeof window != "object") { 

    var define = function(name, x, y){
        if (typeof x === "function") x(FLOOD);
        if (typeof y === "function") y(FLOOD);
    };

}

define('BIMSERVER', ['FLOOD'], function(FLOOD) {
    function Bimserver(url, token) {
        this.url = url;
        this.token = token;
    };

    function Serializer() {};

    function Project(id, parentId, name, oid, bimserver) {
        this.id = id;
        this.parentId = parentId;
        this.name = name;
        this.oid = oid;
        this.bimserver = bimserver;
    }

    function Revision(oid, name, bimserver) {
        this.oid = oid;
        this.name = name;
        this.bimserver = bimserver;
    }

    function BimserverRequest(url, interface, method, params, token) {
        var request = new XMLHttpRequest();
        request.open('POST', url + '/json', false);  // `false` makes the request synchronous
        
        var body = {
          "request": {
            "interface": interface, 
            "method": method, 
            "parameters": params
          }
        }

        if (token) body.token = token;

        request.send(JSON.stringify(body));

        if (request.status === 200)
            return JSON.parse(request.responseText).response.result;
    }

    FLOOD.nodeTypes.InputString = function() {

        var typeData = {
            outputs: [  new FLOOD.baseTypes.OutputPort( "⇒", [String] ) ],
            typeName: "InputString" 
        };

        this.lastValue = "";

        FLOOD.baseTypes.NodeType.call(this, typeData);

        this.printExpression = function(){
            return this.lastValue;
        };

        this.compile = function(){
            this.markClean();
            return ["quote", this.lastValue];
        }

        this.extend = function(args){
            if (args.value != undefined && typeof args.value === "string"){
                this.lastValue = args.value;
            } else {
                this.lastValue = "";
            }
    
        }

    }.inherits(FLOOD.baseTypes.NodeType);

    FLOOD.nodeTypes.GetBimserver = function() {
        
        var typeData = {
            inputs: [
                new FLOOD.baseTypes.InputPort( "E-mail", [String]),
                new FLOOD.baseTypes.InputPort( "Password", [String]),
                new FLOOD.baseTypes.InputPort( "URL", [String])
            ],
            outputs: [  new FLOOD.baseTypes.OutputPort( "⇒", [Bimserver] ) ],
            typeName: "GetBimserver" 
        };

        FLOOD.baseTypes.NodeType.call(this, typeData );

        this.eval = function(email, password, url) {
            var token = BimserverRequest(
                url,
                "Bimsie1AuthInterface",
                "login",
                { "username": email, "password": password })

            return new Bimserver(url, token);

        };
    }.inherits( FLOOD.baseTypes.NodeType );

    FLOOD.nodeTypes.GetSerializer = function() {
        var typeData = {
            inputs: [ new FLOOD.baseTypes.InputPort( "bimserver", [Bimserver]) ],
            outputs: [  new FLOOD.baseTypes.OutputPort( "⇒", [Serializer] ) ],
            typeName: "GetSerializer" 
        };
        
        FLOOD.baseTypes.NodeType.call(this, typeData );

        this.selectedIndex = 0;
        this.items = [];
        
        this.printExpression = function(){
            return this.selectedIndex;
        };

        this.eval = function(bimserver) {
            this.items = BimserverRequest(
                bimserver.url,
                "PluginInterface",
                "getAllSerializers",
                { "onlyEnabled": "true"},
                bimserver.token
            );

            // TODO: Maybe this doesnt reflect in the UI accurately 
            if (this.selectedIndex >= this.items.length) {
                this.selectedIndex = 0;
            }
            
            return {
                extra: { items: this.items },
                value: this.items[this.selectedIndex]
            };
        };

        this.extend = function(args){            
            this.selectedIndex = args.selectedIndex || 0;
            this.items = args.items || [];
        };

    }.inherits( FLOOD.baseTypes.NodeType);

    FLOOD.nodeTypes.GetProject = function() {
        FLOOD.baseTypes.NodeType.call(this, {
            inputs: [ new FLOOD.baseTypes.InputPort("bimserver", [Bimserver])],
            outputs: [ new FLOOD.baseTypes.OutputPort("project", [Project])],
            typeName: "GetProject" 
        });

        this.selectedIndex = 0;
        this.items = [];

        this.printExpression = function(){
            return this.selectedIndex;
        };

        var createProject = function(project, bimserver) {
            return new Project(
                project.id, 
                project.parentId, 
                project.name, 
                project.oid,
                bimserver
            )
        };

        this.eval = function(bimserver) {
            this.items = BimserverRequest(
                bimserver.url,
                "Bimsie1ServiceInterface",
                "getAllProjects",
                {
                  "onlyTopLevel": "false",
                  "onlyActive": "false"
                },
                bimserver.token
            );

            // TODO: Maybe this doesnt reflect in the UI accurately 
            if (this.selectedIndex >= this.items.length) {
                this.selectedIndex = 0;
            }

            var project = this.items[this.selectedIndex];
            return {
                extra: { items: this.items },
                value: createProject(project, bimserver)
            };
        };

        this.extend = function(args){            
            this.selectedIndex = args.selectedIndex || 0;
            this.items = args.items || [];
        };

    }.inherits(FLOOD.baseTypes.NodeType)

    FLOOD.nodeTypes.GetRevision = function() {
        FLOOD.baseTypes.NodeType.call(this, {
            inputs: [ new FLOOD.baseTypes.InputPort("project", [Project])],
            outputs: [ new FLOOD.baseTypes.OutputPort("revision", [Revision])],
            typeName: "GetRevision" 
        });

        this.selectedIndex = 0;
        this.items = [];
 
        this.printExpression = function(){
            return this.selectedIndex;
        };

        var createRev = function(rev, project) {
            return new Revision(
                rev.oid, 
                rev.name, 
                project.bimserver
            )
        };

        this.eval = function(project) {
            this.items = BimserverRequest(
                project.bimserver.url,
                "Bimsie1ServiceInterface",
                "getAllRevisionsOfProject",
                { "poid": project.oid },
                project.bimserver.token
            );

            // TODO: Maybe this doesnt reflect in the UI accurately 
            if (this.selectedIndex >= this.items.length) {
                this.selectedIndex = 0;
            }

            var revision = this.items[this.selectedIndex];
            return {
                extra: { items: this.items },
                value: createRev(this.items[this.selectedIndex], project)
            };
        };

        this.extend = function(args){            
            this.selectedIndex = args.selectedIndex || 0;
            this.items = args.items || [];
        };

    }.inherits(FLOOD.baseTypes.NodeType)

});