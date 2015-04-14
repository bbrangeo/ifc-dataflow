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

        this._compile = this.compile;

        this.compile = function() {
            console.log("compile called");
            //this.markClean();
            var x = this._compile.call(this);

            console.log(x);
            return x;

            //console.log(x);
            //return x;
            
            // bijna goed, rendering reset met de verkeerde waarde, 
            // waardoor de change handler niet goed vuurt
            // this.markDirty();
            // this.markClean();
        }

        this.eval = function(bimserver) {
            if (this.items.length > 0) {
                return this.items[this.selectedIndex];
            } else {
                console.log("eval called")
                console.log(this.selectedIndex)
                var serializers = BimserverRequest(
                    bimserver.url,
                    "PluginInterface",
                    "getAllSerializers",
                    { "onlyEnabled": "true"},
                    bimserver.token);
                this.items = serializers;
                return {
                    extra: {
                        items: this.items
                    },
                    value: serializers[this.selectedIndex]
                }
            }
            
        };

        this.extend = function(args){
            if (args.selectedIndex != undefined && typeof args.selectedIndex === "number"){
                this.selectedIndex = args.selectedIndex;
            } else {
                this.selectedIndex = 0;
            }

            if (args.items != undefined && typeof args.items.length === "number"){
                this.items = args.items;
            } else {
                this.items = [];
            }
        }

    }.inherits( FLOOD.baseTypes.NodeType);

});