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
        var bimserver = {url: url, token: token};
        this.url = url;
        this.token = token;
        this.ifcSerializer = request(
            bimserver,
            "Bimsie1ServiceInterface",
            "getSerializerByName",
            { "serializerName": "Ifc2x3" }
        );
        this.ifcDeserializer = request(
            bimserver,
            "Bimsie1ServiceInterface",
            "getDeserializerByName",
            { "deserializerName": "IfcStepDeserializer" }
        );
        this.bimQLQueryEngine = request(
            bimserver,
            "Bimsie1ServiceInterface",
            "getQueryEngineByName",
            { "name": "BimQL Engine"}
        );
        this.colladaSerializer = request(
            bimserver,
            "Bimsie1ServiceInterface",
            "getSerializerByName",
            { "serializerName": "Collada"}
        );
        
        var p = request(
            bimserver,
            "Bimsie1ServiceInterface",
            "getProjectsByName",
            { "name": "Bimflow working project"}
        );

        if (p.length) {
            this.workProject = p[0];
        } else {
            this.workProject = request(
                bimserver,
                "Bimsie1ServiceInterface",
                "addProject",
                { "projectName": "Bimflow working project"}
            );            
        }
    };

    function Serializer() {};

    function Project(id, parentId, name, oid, bimserver) {
        this.id = id;
        this.parentId = parentId;
        this.name = name;
        this.oid = oid;
        this.bimserver = bimserver;
    }

    function Model(oid, name, bimserver) {
        this.oid = oid;
        this.name = name;
        this.bimserver = bimserver;
    }

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
            var token = request(
                {url: url},
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
            this.items = request(
                bimserver,
                "PluginInterface",
                "getAllSerializers",
                { "onlyEnabled": "true"}
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

        this.eval = function(bimserver) {
            this.items = request(
                bimserver,
                "Bimsie1ServiceInterface",
                "getAllProjects",
                {
                  "onlyTopLevel": "false",
                  "onlyActive": "false"
                }
            );

            // TODO: Maybe this doesnt reflect in the UI accurately 
            if (this.selectedIndex >= this.items.length) {
                this.selectedIndex = 0;
            }

            var project = this.items[this.selectedIndex];
            return {
                extra: { items: this.items },
                value: new Project(
                    project.id, 
                    project.parentId, 
                    project.name, 
                    project.oid,
                    bimserver
                )
            };
        };

        this.extend = function(args){            
            this.selectedIndex = args.selectedIndex || 0;
            this.items = args.items || [];
        };

    }.inherits(FLOOD.baseTypes.NodeType);

    FLOOD.nodeTypes.GetRevision = function() {
        FLOOD.baseTypes.NodeType.call(this, {
            inputs: [ new FLOOD.baseTypes.InputPort("project", [Project])],
            outputs: [ new FLOOD.baseTypes.OutputPort("model", [Model])],
            typeName: "GetRevision" 
        });

        this.selectedIndex = 0;
        this.items = [];
 
        this.printExpression = function(){
            return this.selectedIndex;
        };

        this.eval = function(project) {
            this.items = request(
                project.bimserver,
                "Bimsie1ServiceInterface",
                "getAllRevisionsOfProject",
                { "poid": project.oid }
            );

            // TODO: Maybe this doesnt reflect in the UI accurately 
            if (this.selectedIndex >= this.items.length) {
                this.selectedIndex = 0;
            }

            var rev = this.items[this.selectedIndex];
            return {
                extra: { items: this.items },
                value: new Model(
                    rev.oid, 
                    rev.comment, 
                    project.bimserver
                )
            };
        };

        this.extend = function(args){            
            this.selectedIndex = args.selectedIndex || 0;
            this.items = args.items || [];
        };

    }.inherits(FLOOD.baseTypes.NodeType);

    FLOOD.nodeTypes.Query = function() {
        FLOOD.baseTypes.NodeType.call(this, {
            inputs: [ 
                new FLOOD.baseTypes.InputPort("model", [Model]),
                new FLOOD.baseTypes.InputPort("query", [String])
            ],
            outputs: [ new FLOOD.baseTypes.OutputPort("model", [Model])]
        });

        this.lastValue = "";

        this.printExpression = function(){
            return this.lastValue;
        };

        this.eval = function(model, query) {
            // TODO: download query
            // TODO: upload result as revision in tmp project
            // TODO: pass on revision to the next node as Model

            var bimserver = model.bimserver;
            var queryResult = request(
                bimserver,
                "Bimsie1ServiceInterface",
                "downloadQuery",
                { 
                    "roid": model.oid,
                    "qeid": bimserver.bimQLQueryEngine.oid,
                    "code": query,
                    "sync": "true",
                    "serializerOid": bimserver.ifcSerializer.oid
                }
            );

            var downloadResult = request(
                bimserver,
                "Bimsie1ServiceInterface",
                "getDownloadData",
                { "actionId": queryResult }
            );

            var newRevision = request(
                bimserver,
                "Bimsie1ServiceInterface",
                "checkin",
                { 
                    "poid": bimserver.workProject.oid,
                    "comment": "tmp query revision",
                    "deserializerOid": bimserver.ifcDeserializer.oid,
                    "fileSize": downloadResult.file.length,
                    "fileName": "bar",
                    "data": downloadResult.file,
                    "sync": "true"
                }
            );

            var revisions = request(
                bimserver,
                "Bimsie1ServiceInterface",
                "getAllRevisionsOfProject",
                { 
                    "poid": bimserver.workProject.oid
                }
            );

            var rev = revisions[revisions.length-1];

            return new Model(
                rev.oid, 
                rev.comment, 
                bimserver
            )
        };

        this.extend = function(args){            
            this.selectedIndex = args.selectedIndex || 0;
            this.items = args.items || [];
        };

    }.inherits(FLOOD.baseTypes.NodeType);
});