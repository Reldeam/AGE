var AGE = AGE || (function()
{
    var gl = null;
    var db = null;
    var frame = null;

    var meshes = {};
    var textures = {};

    var shaderPrograms = {};
    var currentShaderProgram = null;
    var programsLoading = 0;
    var onProgramsLoaded = null;

    //////////////////////////////////////////////////////////////////////////////////

    var ResourceManager = {
        resources : [],
        resourcesLoaded : 0,
        resourcesTotal : 0,
        onResourceLoaded : null,
        onAllResourcesLoaded : null
    };

    ResourceManager.newResource = function(src)
    {
        var rm = this;
        var resource = new Resource(src);

        resource.onLoad = function()
        {
            rm.resourcesLoaded++;
            if(typeof rm.onResourceLoaded === "function") rm.onResourceLoaded();
            if(rm.resourcesLoaded == rm.resourcesTotal && typeof rm.onAllResourcesLoaded === "function")
                rm.onAllResourcesLoaded();
        };

        this.resources.push(resource);
        this.resourcesTotal++;

        return resource;
    };

    ResourceManager.load = function()
    {
        for(var i = 0; i < this.resources.length; i++) {
            if(!this.resources[i].loaded && !this.resources[i].loading)
                this.resources[i].load();
        }
    };

    ResourceManager.getProgress = function(match)
    {
        if(typeof match === "undefined") {
            if(this.resourcesTotal == 0) return 0;
            return(this.resourcesLoaded / this.resourcesTotal);
        }

        var matchesLoaded = 0;
        var matchesTotal = 0;

        for(var i = 0; i < this.resources.length; i++) {
            if(this.resources[i].src.match(/match$/).length > 0) {
                matchesTotal++;
                if(this.resources[i].loaded == true) matchesLoaded++;
            }
        }

        if(matchesTotal == 0) return 0;
        return(matchesLoaded / matchesTotal);
    };

    //////////////////////////////////////////////////////////////////////////////////

    function Resource(src)
    {
        var resource = this;

        this.src = src;
        this.file = "";
        this.loaded = false;
        this.loading = false;
        this.bytesLoaded = 0;
        this.bytesTotal = 0;
        this.onLoad = null;
        this.onProgress = null;

        this.request = new XMLHttpRequest();

        this.request.onreadystatechange = function(event)
        {
            switch(this.readyState) {
                case 4:
                    switch(this.status) {
                        case 200:
                            resource.loaded = true;
                            resource.loading = false;
                            resource.file = this.responseText;
                            if(typeof resource.onLoad === "function") resource.onLoad();
                            break;
                    }
                    break;
            }
        };

        this.request.onprogress = function(event)
        {
            resource.bytesLoaded = event.loaded;
            resource.bytesTotal = event.total;
            if(typeof resource.onProgress === "function") resource.onProgress();
        };
    }

    Resource.prototype.load = function()
    {
        this.loading = true;
        this.request.open("GET", this.src);
        this.request.send();
    };

    Resource.prototype.getProgress = function()
    {
        if(bytesTotal == 0) return(0);
        return(bytesLoaded / bytesTotal);
    };

    Resource.prototype.getJSON = function()
    {
        return(JSON.parse(this.file));
    };

    Resource.prototype.getFile = function()
    {
        return(this.file);
    };

    var myResource = new Resource("shaders/shaders.library");
    myResource.load();

    //////////////////////////////////////////////////////////////////////////////////

    var Vector = {};

    /**
     * Either adds scalar u to vector v, or adds vector u to vector v where vector u
     * and v are of the same length.
     *
     * @param u {number|number[]}
     * @param v {number[]}
     * @returns {number[]}
     */
    Vector.add = function(u, v)
    {
        var i;

        if(typeof u == "number") {
            for(i = 0; i < v.length; i++) v[i] += u;
            return v;
        }

        if(u.length != v.length)
            throw new VectorException("Both vectors must be of equal length.");

        for(i = 0; i < u.length; i++) u[i] += v[i];
        return u;
    };

    /**
     * Subtracts u from v, see Vector.add().
     *
     * @param u {number|number[]}
     * @param v {number[]}
     * @returns {number[]}
     */
    Vector.subtract = function(u, v)
    {
        var i;

        if(typeof u == "number") {
            for(i = 0; i < v.length; i++) v[i] -= u;
            return v;
        }

        if(u.length != v.length)
            throw new VectorException("Both vectors must be of equal length.");

        for(i = 0; i < u.length; i++) v[i] -= u[i];
        return u;
    };

    /**
     * Dot product of vectors u and v.
     *
     * @param u {number[]}
     * @param v {number[]}
     * @returns {number}
     */
    Vector.dot = function(u, v)
    {
        if(u.length != v.length)
            throw new VectorException("u and v must be the same length.");

        var result = 0;

        for(var i = 0; i < u.length; i++) result += u[i] * v[i];

        return result;
    };

    /**
     * Cross product of 3-dimensional vectors u and v.
     *
     * @param u {number[]}
     * @param v {number[]}
     */
    Vector.cross = function(u, v)
    {
        if(u.length != 3 || v.length != 3)
            throw new VectorException("u and v must be of length 3 to compute the cross product.");

        var i = u[1] * v[2] - u[2] * v[1];
        var j = -1 * (u[0] * v[2] - u[2] * v[0]);
        var k = u[0] * v[1] - u[1] * v[0];

        return [i, j, k];
    };

    function VectorException(message)
    {
        this.name = "VectorException";
        this.message = message;
    }

    //////////////////////////////////////////////////////////////////////////////////

    var Matrix = {};

    /**
     * Alias for Vector.add().
     *
     * @param u {number|number[]}
     * @param v {number[]}
     * @returns {number[]}
     */
    Matrix.add = function(u, v)
    {
        try {
            return Vector.add(u, v);
        }
        catch(e) {
            throw e;
        }
    };

    /**
     * Alias for Vector.subtract().
     *
     * @param u {number|number[]}
     * @param v {number[]}
     * @returns {number[]}
     */
    Matrix.subtract = function(u, v)
    {
        try {
            return Vector.subtract(u, v);
        }
        catch(e) {
            throw e;
        }
    };

    /**
     * Multiplies u by v if both are matrices, or v by u if u is a scalar. If uColumns
     * if not given then u is assumed to be a square matrix (if not scalar).
     *
     * @param u {number|number[]}
     * @param v {number[]}
     * @param [uColumns] {number}.
     */
    Matrix.multiply = function(u, v, uColumns)
    {
        if(typeof u == "number") {
            for(var i = 0; i < v.length; i++) {
                v[i] *= u;
            }
            return v;
        }

        if(typeof uColumns == "undefined") {
            uColumns = Math.sqrt(u.length);
            if(uColumns != parseInt(uColumns))
                throw new MatrixException("u must be square if uColumns is undefined.");
            if(v.length % uColumns != 0)
                throw new MatrixException("v has the wrong size to multiply with u.");
        }

        var uRows = u.length / uColumns;
        if(uRows != parseInt(uColumns))
            throw new MatrixException("uColumns does not match u size.");

        var vColumns = v.length / uColumns;

        var uIndex, vIndex, mIndex = 0;
        var m = [];

        for(var ur = 0; ur < uRows; ur++) {
            for(var vc = 0; vc < vColumns; vc++) {
                m[mIndex] = 0;
                for(var uc = 0; uc < uColumns; uc++) {
                    uIndex = ur * uColumns + uc;
                    vIndex = uc * vColumns + vc;
                    m[mIndex] += u[uIndex] * v[vIndex];
                }
                mIndex++;
            }
        }

        return m;
    };

    /**
     * Creates an identity matrix with rows and columns equaling size.
     *
     * @param size {number}
     * @returns {number[]}
     */
    Matrix.createIdentity = function(size)
    {
        var identity = [];
        var spacing = size + 1;

        for(var i = 0; i < Math.pow(size, 2); i++) {
            if(i % spacing == 0) identity[i] = 1;
            else identity[i] = 0;
        }

        return identity;
    };

    /**
     * Creates a square matrix of zeros with rows and columns equaling size.
     *
     * @param size {number}
     * @returns {number[]}
     */
    Matrix.createZeros = function(size)
    {
        var matrix = [];
        for(var i = 0; i < Math.pow(size, 2); i++) {
            matrix[i] = 0;
        }

        return matrix;
    };

    function MatrixException(message)
    {
        this.name = "MatrixException";
        this.message = message;
    }

    //////////////////////////////////////////////////////////////////////////////////

    function Attribute(name, type, size, data)
    {
        this.name = name;
        this.size = size;

        switch(type) {
            case "float32" :
                data = new Float32Array(data);
                break;
            default:
                data = [];
                console.error("Unknown attribute type \"" + type + "\".");
                console.warn("An empty data set was loaded to attribute buffer.");
        }

        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    }

    //////////////////////////////////////////////////////////////////////////////////

    function Frame()
    {
        this.scene = null;
    }

    //////////////////////////////////////////////////////////////////////////////////

    function Object3D()
    {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.xScale = 1;
        this.yScale = 1;
        this.zScale = 1;
        this.matrix = Matrix.createIdentity(4);
        this.children = [];
    }

    Object3D.prototype.render = function() {};

    //////////////////////////////////////////////////////////////////////////////////

    Scene.prototype = new Object3D();
    Scene.prototype.constructor = Scene;

    function Scene()
    {
        Object3D.call(this);
    }

    Scene.prototype.render = function()
    {
        setShaderProgram("phong");

        for(var i = 0; i < this.children.length; i++) {
            this.children[i].render();
        }
    };

    Scene.prototype.addModel = function(model)
    {
        this.children.push(model);
    };

    Scene.prototype.removeModel = function(model) {};


    //////////////////////////////////////////////////////////////////////////////////

    Camera.prototype = new Object3D();
    Camera.prototype.constructor = Camera;

    function Camera()
    {
        Object3D.call(this);
    }

    //////////////////////////////////////////////////////////////////////////////////

    Model.prototype = new Object3D();
    Model.prototype.constructor = Model;

    function Model()
    {
        Object3D.call(this);
    }

    Model.prototype.render = function()
    {
        for(var i = 0; i < this.children.length; i++) {
            this.children[i].render();
        }
    };

    Model.prototype.addMesh = function(name)
    {
        var meshData = meshes[name];
        if(typeof meshData === "undefined") return null;

        var mesh = new Mesh(meshData);
        this.children.push(mesh);
        return mesh;
    };

    Model.prototype.removeMesh = function(mesh) {};

    //////////////////////////////////////////////////////////////////////////////////

    function MeshData(src)
    {
        this.loaded = false;
        this.onLoad = null;
        this.src = src;
        this.shaderPrograms = [];
        this.textures = [];
        this.indices = null;
        this.attributes = [];
    }

    MeshData.prototype.load = function(callback)
    {
        var mesh = this;

        getJSON(this.src, function(data)
        {
            mesh.shaderPrograms = data.shaderPrograms;

            mesh.indices = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indices);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);

            var i;

            for(i = 0; i < data.attributes.length; i++) {
                var attribute = data.attributes[i];
                mesh.attributes.push(new Attribute(attribute.name, attribute.type, attribute.size, attribute.data));
            }

            for(i = 0; i < data.textures.length; i++) {
                mesh.textures.push(data.textures[i].name);
                addTexture(data.textures[i].name, data.textures[i].src);
            }

            mesh.loaded = true;
            if(typeof mesh.onLoad === "function") mesh.onLoad();
            if(typeof callback === "function") callback();
        });
    };

    //////////////////////////////////////////////////////////////////////////////////

    Mesh.prototype = new Object3D();
    Mesh.prototype.constructor = Mesh;

    function Mesh(data)
    {
        Object3D.call(this);
        this.data = data;
    }

    Mesh.prototype.render = function()
    {
        for(var i = 0; i < this.data.attributes.length; i++) {
            var attribute = this.data.attributes[i];
            var attributeLocation = gl.getAttribLocation(getShaderProgram(), attribute.name);
            gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer);
            gl.vertexAttribPointer(attributeLocation, attribute.size, gl.FLOAT, false, 0, 0);
        }
    };

    //////////////////////////////////////////////////////////////////////////////////

    function ShaderProgram(vertShader, fragShader)
    {
        this.vertexShader = vertShader;
        this.fragmentShader = fragShader;
        this.program = null;
        this.compiled = false;
        this.onLoad = null;
    }

    ShaderProgram.prototype.load = function(callback)
    {
        var shaderProgram = this;

        this.vertexShader.onLoad = function()
        {
            if(shaderProgram.fragmentShader.loaded) {
                if(typeof shaderProgram.onLoad === "function") shaderProgram.onLoad();
                if(typeof callback === "function") callback();
            }
        };

        this.fragmentShader.onLoad = function()
        {
            if(shaderProgram.vertexShader.loaded) {
                if(typeof shaderProgram.onLoad === "function") shaderProgram.onLoad();
                if(typeof callback === "function") callback();
            }
        };

        this.vertexShader.load();
        this.fragmentShader.load();
    };

    ShaderProgram.prototype.compile = function()
    {
        if(!this.vertexShader.compile()) return false;
        if(!this.fragmentShader.compile()) return false;

        this.program = gl.createProgram();

        gl.attachShader(this.program, this.vertexShader.shader);
        gl.attachShader(this.program, this.fragmentShader.shader);
        gl.linkProgram(this.program);


        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error("[Program Compile Error] " + gl.getProgramInfoLog(this.program));
            return false;
        }

        this.compiled = true;
        return true;
    };

    //////////////////////////////////////////////////////////////////////////////////

    function Shader(src, type)
    {
        this.src = src;
        this.type = type;
        this.file = null;
        this.shader = null;
        this.loaded = false;
        this.compiled = false;
        this.onLoad = null;
    }

    Shader.prototype.load = function(callback)
    {
        var shader = this;

        getFile(this.src, function(file)
        {
            shader.file = file;
            shader.loaded = true;
            if(typeof shader.onLoad === "function") shader.onLoad();
            if(typeof callback === "function") callback();
        });
    };

    Shader.prototype.compile = function()
    {
        if(!this.loaded) return;

        var type = null;
        if(this.type == "vertex") type = gl.VERTEX_SHADER;
        else if(this.type == "fragment") type = gl.FRAGMENT_SHADER;

        if(type == null) return;

        this.shader = gl.createShader(type);
        gl.shaderSource(this.shader, this.file);
        gl.compileShader(this.shader);

        delete this.file;

        if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
            console.error("[Shader Compile Error] " + gl.getShaderInfoLog(this.shader));
            gl.deleteShader(this.shader);
            return false;
        }

        this.compiled = true;
        return true;
    };

    //////////////////////////////////////////////////////////////////////////////////

    VertexShader.prototype = new Shader();
    VertexShader.prototype.constructor = VertexShader;

    function VertexShader(src)
    {
        Shader.call(this, src, "vertex");
    }

    //////////////////////////////////////////////////////////////////////////////////

    FragmentShader.prototype = new Shader();
    FragmentShader.prototype.constructor = FragmentShader;

    function FragmentShader(src)
    {
        Shader.call(this, src, "fragment");
    }

    //////////////////////////////////////////////////////////////////////////////////

    function Texture() {}

    //////////////////////////////////////////////////////////////////////////////////

    function getFile(src, callback)
    {
        if(typeof callback !== "function") return;

            var xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4) {
                switch(this.status) {
                    case 200:
                        callback(this.responseText);
                        break;
                }
            }

        };

        xhttp.open("GET", src);
        xhttp.send();
    }

    function getJSON(src, callback)
    {
        if(typeof callback !== "function") return;

        getFile(src, function(file)
        {
            var json = JSON.parse(file);
            callback(json);
        })
    }

    function addShaderProgram(src)
    {
        programsLoading++;

        src = src.replace(/\/$/, "");

        if(!src.match(/\.program$/)) {
            var name = src.match(/[^\/\\]*$/)[0];
            src = src + "/" + name + ".program";
        }

        var directory = src.match(/.*\//)[0];

        getJSON(src, function(file)
        {
            if(!file.hasOwnProperty("name")) return;
            if(!file.hasOwnProperty("vertex")) return;
            if(!file.hasOwnProperty("fragment")) return;

            var vertShader = new VertexShader(directory + file.vertex);
            var fragShader = new FragmentShader(directory + file.fragment);

            shaderPrograms[file.name] = new ShaderProgram(vertShader, fragShader);

            if(--programsLoading == 0 && typeof onProgramsLoaded === "function")
                onProgramsLoaded();
        });
    }

    function compileShaderPrograms()
    {
        for (var name in shaderPrograms) {
            if (shaderPrograms.hasOwnProperty(name)) {

                shaderPrograms[name].onLoad = function()
                {
                    this.compile();
                };

                shaderPrograms[name].load();
            }
        }
    }

    function addTexture(name, src)
    {

    }

    function setShaderProgram(name)
    {
        var program = shaderPrograms[name].program;
        if(typeof program === "undefined") return false;

        gl.useProgram(program);
        currentShaderProgram = program;
        return true;
    }

    function getShaderProgram()
    {
        return currentShaderProgram
    }

    //////////////////////////////////////////////////////////////////////////////////

    return {
        bootstrap : function(canvas)
        {
            gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
            if (!gl) return;

            db = gl.getExtension('WEBGL_draw_buffers');
            if (!db) return;

            gl.clearColor(0, 0, 0, 1);         // Clear to black, fully opaque
            gl.clearDepth(1);                  // Clear everything
            gl.enable(gl.DEPTH_TEST);          // Enable depth testing
            gl.depthFunc(gl.LEQUAL);           // Near things obscure far things
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);

            if(programsLoading > 0) {
                onProgramsLoaded = function () {
                    compileShaderPrograms();
                };
            }

            else compileShaderPrograms();

            frame = new Frame();
        },

        addShaderProgram : function(src)
        {
            addShaderProgram(src);
        },

        addShaderLibrary : function(src, callback)
        {
            programsLoading++;

            src = src.replace(/\/$/, "");

            if(!src.match(/\.library/)) {
                var name = src.match(/[^\/\\]*$/)[0];
                src = src + "/" + name + ".library";
            }

            var directory = src.match(/.*\//)[0];

            getJSON(src, function(file)
            {
                for(var i = 0; i < file.length; i++) {
                    addShaderProgram(directory + file[i]);
                }

                programsLoading--;
            });
        },

        addMesh : function(name, src)
        {
            var mesh = new MeshData(src);
            meshes[name] = mesh;
            mesh.load();
        },

        newScene : function()
        {
            return new Scene();
        },

        setScene : function(scene)
        {
            frame.scene = scene;
            return true;
        },

        newModel : function()
        {
            return new Model();
        }
    };

    //////////////////////////////////////////////////////////////////////////////////

})();