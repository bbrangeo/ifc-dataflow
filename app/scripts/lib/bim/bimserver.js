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
            "getSerializerByContentType",
            { "contentType": "application/ifc" }
        );
        this.ifcDeserializer = request(
            bimserver,
            "Bimsie1ServiceInterface",
            "getDeserializerByName",
            { "deserializerName": "Ifc2x3tc1 Step Deserializer" }
        );

        this.csvSerializer = request(
            bimserver,
            "Bimsie1ServiceInterface",
            "getSerializerByContentType",
            {"contentType": "text/csvl"});

        this.bimQLQueryEngine = request(
            bimserver,
            "Bimsie1ServiceInterface",
            "getQueryEngineByName",
            { "name": "BimQL Engine Geometry"}
        );
        this.colladaSerializer = request(
            bimserver,
            "Bimsie1ServiceInterface",
            "getSerializerByContentType",
            { "contentType": "application/collada"}
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
                { "projectName": "Bimflow working project", "schema": "ifc2x3tc1"}
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

    function Model(oid, name, bimserver, colorMap) {
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
            ).filter(function(p) {
                return p.name !== 'Bimflow working project';
            });

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

            console.log("query on", model.name)

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

            // split csv file to obtain guids
            // var guids = atob(downloadResult.file)
            //     .split("\n")
            //     .map(function(l) { return l.split(";"); })
            //     .filter(function(l) { return l[2] === "GlobalId"; })
            //     .map(function(l) { return l[3]; });

            // console.log("number of guids", guids.length)

            // var guids = ["2OrWItJ6zAwBNp0OUxK$CR"];

            // var downloadGeometry = request(
            //     bimserver,
            //     "Bimsie1ServiceInterface",
            //     "downloadByGuids",
            //     {"roids": [model.oid],
            //      "guids": guids,
            //      "serializerOid": bimserver.ifcSerializer.oid,
            //      "deep": "false",
            //      "sync": "true"});

            // var downloadGeometryResult = request(
            //     bimserver,
            //     "Bimsie1ServiceInterface",
            //     "getDownloadData",
            //     { "actionId": downloadGeometry }
            // );


            var newRevision = request(
                bimserver,
                "Bimsie1ServiceInterface",
                "checkin",
                { 
                    "poid": bimserver.workProject.oid,
                    "comment": "tmp query revision",
                    "deserializerOid": bimserver.ifcDeserializer.oid,
                    "fileSize": downloadResult.file.length,
                    "fileName": queryResult,
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


    FLOOD.nodeTypes.MergeModels = function() {
        FLOOD.baseTypes.NodeType.call(this, {
            inputs: [ 
                new FLOOD.baseTypes.InputPort("model1", [Model]),
                new FLOOD.baseTypes.InputPort("model2", [Model])
            ],
            outputs: [ new FLOOD.baseTypes.OutputPort("model", [Model])],
            typeName: "MergeModels" 
        });

        this.lastValue = "";

        this.printExpression = function(){
            return this.lastValue;
        };

        this.eval = function(model1, model2) {
            var bimserver = model1.bimserver;

            // TODO: Test multiple bimservers
            console.log("MERGING", [model1.oid, model1.bimserver], [model2.oid, model2.bimserver])
            
            if (model1.bimserver.url !== model2.bimserver.url) {
                var download2 = request(
                    model2.bimserver, 
                    'Bimsie1ServiceInterface', 
                    'downloadRevisions',
                    {
                        'roids': [model2.oid],
                        'serializerOid': model2.bimserver.ifcSerializer.oid,
                        'sync': 'true'
                    }
                );
                var downloadResult2 = request(
                    model2.bimserver, 
                    'Bimsie1ServiceInterface', 
                    'getDownloadData',
                    { 'actionId': download2 }
                );
                var newRev2 = request(
                    bimserver,
                    "Bimsie1ServiceInterface",
                    "checkin",
                    { 
                        "poid": bimserver.workProject.oid,
                        "comment": "tmp query revision",
                        "deserializerOid": bimserver.ifcDeserializer.oid,
                        "fileSize": downloadResult2.file.length,
                        "fileName": "bar",
                        "data": downloadResult2.file,
                        "sync": "true"
                    }
                );
                var revisions2 = request(
                    bimserver,
                    "Bimsie1ServiceInterface",
                    "getAllRevisionsOfProject",
                    { 
                        "poid": bimserver.workProject.oid
                    }
                );
                model2 = revisions2[revisions2.length-1]
            } 

            var download = request(
                bimserver, 
                'Bimsie1ServiceInterface', 
                'downloadRevisions',
                {
                    'roids': [model1.oid, model2.oid],
                    'serializerOid': bimserver.ifcSerializer.oid,
                    'sync': 'true'
                }
            );

            var downloadResult = request(
                bimserver, 
                'Bimsie1ServiceInterface', 
                'getDownloadData',
                { 'actionId': download }
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

    FLOOD.nodeTypes.GetObjectInfo = function() {
        FLOOD.baseTypes.NodeType.call(this, {
            inputs: [ 
                new FLOOD.baseTypes.InputPort("model", [Model]),
            ],
            outputs: [ new FLOOD.baseTypes.OutputPort("report", [Object])],
            typeName: "GetObjectInfo" 
        });

        this.lastValue = "";

        this.printExpression = function(){
            return this.lastValue;
        };

        this.eval = function(model) {
            var bimserver = model.bimserver;
            
            var objectInfoSerializer = request(
                bimserver,
                "Bimsie1ServiceInterface",
                "getSerializerByName",
                { "serializerName": "ObjectInfo" }
            );

            var download = request(
                bimserver, 
                'Bimsie1ServiceInterface', 
                'downloadRevisions',
                {
                    'roids': [model.oid],
                    'serializerOid': objectInfoSerializer.oid,
                    'sync': 'true'
                }
            );

            var downloadResult = request(
                bimserver, 
                'Bimsie1ServiceInterface', 
                'getDownloadData',
                { 'actionId': download }
            );


            

            var reportHtml = atob(downloadResult.file);
            var entNames = reportHtml.match(/<h1>(.*?)<\/h1>/g).map(function(name) {
                return name.substring(4, name.length-5);
            });

            var counts = {};

            entNames.forEach(function(n) { 
                if (counts[n]) {
                    counts[n] = counts[n] + 1
                } else {
                    counts[n] = 1
                }
            });

            return counts
        };

        this.extend = function(args){            
            this.selectedIndex = args.selectedIndex || 0;
            this.items = args.items || [];
        };

    }.inherits(FLOOD.baseTypes.NodeType);

    FLOOD.nodeTypes.mvdXML = function() {
        FLOOD.baseTypes.NodeType.call(this, {
            inputs: [ 
                new FLOOD.baseTypes.InputPort("model", [Model]),
                new FLOOD.baseTypes.InputPort("mvdxml", [String])
            ],
            outputs: [ new FLOOD.baseTypes.OutputPort("model", [Model])],
            typeName: "mvdXML" 
        });

        this.eval = function(model, mvdxml) {
            // get guids with issues from mvdxmlserver
            var req = new XMLHttpRequest();
            req.open('POST', 'http://localhost:3001', false);  // `false` makes the request synchronous
            req.setRequestHeader('Content-type', "application/json");

            var downloadId = request(
                model.bimserver,
                "Bimsie1ServiceInterface",
                "download",
                { 
                  "roid": model.oid,
                  "serializerOid": model.bimserver.ifcSerializer.oid,
                  "showOwn": "false",
                  "sync": "true"
                }
            );

            var downloadResult = request(
                model.bimserver,
                "Bimsie1ServiceInterface",
                "getDownloadData",
                { "actionId": downloadId }
            );

            var body = {
                mvdxml: mvdxml,
                ifcdata: downloadResult.file
            }

            req.send(JSON.stringify(body));

            if (req.status === 200)
                guids = JSON.parse(req.responseText).response;
            else
                throw "request to mvdxmlserver failed ("+ req.status +"): "+ req.responseText;


            var coloredGuids = {};
            guids.forEach(function(guid) {
                coloredGuids[guid] = "ff0000";
            })

            model.coloredGuids = coloredGuids;

            return model;
        }
        


    }.inherits(FLOOD.baseTypes.NodeType);


    FLOOD.nodeTypes.checkIn = function() {
        FLOOD.baseTypes.NodeType.call(this, {
            inputs: [ 
                new FLOOD.baseTypes.InputPort("project", [Project])
            ],
            outputs: [ new FLOOD.baseTypes.OutputPort("model", [Model])],
            typeName: "checkIn" 
        });

        this.file = "";
        this.model = null;

        this.printExpression = function(){
            return this.model;
        };

        this.eval = function(project) {
            console.log(this.file, project)

            // TODO: Create new model
        };

        this.extend = function(args){            
            this.file = args.file || 0;
            this.model = args.model || [];
        };
    }.inherits(FLOOD.baseTypes.NodeType);  

});