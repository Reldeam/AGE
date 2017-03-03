var AGE = AGE || (function()
{
    var gl = null;
    var db = null;

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

        this.resources.push(resource);
        this.resourcesTotal++;

        return resource;
    };

    ResourceManager.removeResource = function(resource)
    {
        for(var i = 0; i < this.resources.length; i++) {
            if(resource === this.resources[i]) {
                if(resource.loaded) this.resourcesLoaded--;
                this.resourcesTotal--;
                this.resources.splice(i, 1);
                break;
            }
        }
    };

    ResourceManager.resourceLoaded = function()
    {
        this.resourcesLoaded++;
        if(typeof this.onResourceLoaded === "function") this.onResourceLoaded();
        if(this.resourcesLoaded == this.resourcesTotal && typeof this.onAllResourcesLoaded === "function")
            this.onAllResourcesLoaded();
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
                            ResourceManager.resourceLoaded();
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
        if(this.loaded) return JSON.parse(this.request.responseText);
        return null;
    };

    Resource.prototype.getFile = function()
    {
        if(this.loaded) return this.request.responseText;
        return "";
    };

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

    Matrix.view = Matrix.createIdentity(4);
    Matrix.projection = Matrix.createIdentity(4);

    Matrix.modelStack = [Matrix.createIdentity(4)];

    Matrix.model = function(matrix)
    {
        if(typeof matrix !== "undefined") Matrix.setModelMatrix(matrix);
        if(Matrix.modelStack.length > 0) return Matrix.modelStack[0];
        Matrix.modelStack = [Matrix.createIdentity(4)];
        return Matrix.modelStack[0];
    };

    Matrix.setModelMatrix = function(matrix)
    {
        Matrix.modelStack = [matrix];
    };

    Matrix.pushModelMatrix = function(matrix)
    {
        if(Matrix.modelStack.length > 0)
            matrix = Matrix.multiply(Matrix.modelStack[0], matrix);
        Matrix.modelStack.unshift(matrix);
        return matrix;
    };

    Matrix.popModelMatrix = function()
    {
        if(Matrix.modelStack.length > 1) Matrix.modelStack.shift();
        return Matrix.modelStack[0];
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

    var Frame = {
        scene : null,
        renderInterval : null,
        fps : 60,
        update : null
    };

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

    Object3D.prototype.addChild = function(object3D)
    {
        if(typeof object3D === "undefined") return;
        this.children.push(object3D);
    };

    Object3D.prototype.removeChild = function(object3D)
    {
        for(var i = 0; i < this.children.length; i++) {
            if(this.children[i] === object3D) {
                this.children.splice(i, 1);
                break;
            }
        }
    };

    Object3D.prototype.translate = function(x, y, z)
    {
        var t = Matrix.createIdentity(4);

        t[3] = x;
        t[7] = y;
        t[11] = z;

        this.x += x;
        this.y += y;
        this.z += z;

        this.matrix = Matrix.multiply(t, this.matrix);
    };

    Object3D.prototype.translation = function(x, y, z)
    {
        this.matrix[3] = x;
        this.matrix[7] = y;
        this.matrix[11] = z;
    };

    Object3D.prototype.scale = function(x, y, z)
    {
        var s = Matrix.createIdentity(4);

        s[0] = x;
        s[5] = y;
        s[10] = z;

        this.xScale *= x;
        this.yScale *= y;
        this.zScale *= z;

        this.matrix = Matrix.multiply(s, this.matrix);
    };

    /**
     * Rotates by angle degrees around the vector made by [x, y, z].
     * https://en.wikipedia.org/wiki/Rotation_matrix
     *
     * @param angle {number}
     * @param x {number}
     * @param y {number}
     * @param z {number}
     */
    Object3D.prototype.rotate = function(angle, x, y, z)
    {
        //Set to radians.
        angle *= Math.PI / 180;

        var uMagnitude = Math.sqrt(x*x + y*y + z*z);
        var ux = x / uMagnitude;
        var uy = y / uMagnitude;
        var uz = z / uMagnitude;

        var r = Matrix.createIdentity(4);

        r[0] = Math.cos(angle) + Math.pow(ux, 2) * (1 - Math.cos(angle));
        r[1] = ux * uy * (1 - Math.cos(angle)) - uz * Math.sin(angle);
        r[2] = ux * uz * (1 - Math.cos(angle)) + uy * Math.sin(angle);

        r[4] = ux * uy * (1 - Math.cos(angle)) + uz * Math.sin(angle);
        r[5] = Math.cos(angle) + Math.pow(uy, 2) * (1 - Math.cos(angle));
        r[6] = uy * uz * (1 - Math.cos(angle)) - ux * Math.sin(angle);

        r[8] = ux * uz * (1 - Math.cos(angle)) - uy * Math.sin(angle);
        r[9] = uy * uz * (1 - Math.cos(angle)) + ux * Math.sin(angle);
        r[10] = Math.cos(angle) + Math.pow(uz, 2) * (1 - Math.cos(angle));

        this.matrix = Matrix.multiply(r, this.matrix);
    };

    Object3D.prototype.render = function() {};

    //////////////////////////////////////////////////////////////////////////////////

    Scene.prototype = new Object3D();
    Scene.prototype.constructor = Scene;

    function Scene()
    {
        Object3D.call(this);
        this.camera = new Camera();
        this.addChild(this.camera);

        this.projectionMatrix = Matrix.createIdentity(4);
    }

    Scene.prototype.render = function()
    {
        if(Frame.update !== "null") Frame.update();

        if(ResourceManager.getProgress() != 1) return;

        setShaderProgram("phong");

        Matrix.setModelMatrix(this.matrix);

        for(var i = 0; i < this.children.length; i++) {
            this.children[i].render();
        }
    };

    Scene.prototype.perspective = function(fieldOfView, aspectRatio, near, far)
    {
        //Change to radians.
        fieldOfView *= Math.PI / 180;

        var height = Math.tan(fieldOfView / 2) * (2 * near);
        var width = height * aspectRatio;

        var left = -width / 2;
        var right = width / 2;
        var bottom = -height / 2;
        var top = height / 2;

        this.frustum(left, right, bottom, top, near, far)
    };

    Scene.prototype.frustum = function(left, right, bottom, top, near, far)
    {
        this.projectionMatrix = Matrix.createZeros(4);
        this.projectionMatrix[0] = 2 * near / (right - left);
        this.projectionMatrix[2] = (right + left) / (right - left);
        this.projectionMatrix[5] = 2 * near / (top - bottom);
        this.projectionMatrix[6] = (top + bottom) / (top - bottom);
        this.projectionMatrix[10] = -(far + near) / (far - near);
        this.projectionMatrix[11] = -2 * far * near / (far - near);
        this.projectionMatrix[14] = -1;
    };

    Scene.prototype.orthographic = function(left, right, bottom, top, near, far)
    {
        this.projectionMatrix = Matrix.createZeros(4);
        this.projectionMatrix[0] = 2 / (right - left);
        this.projectionMatrix[3] = -((right + left) / (right - left));
        this.projectionMatrix[5] = 2 / (top - bottom);
        this.projectionMatrix[7] = -((top + bottom) / (top - bottom));
        this.projectionMatrix[10] = -2 / (far - near);
        this.projectionMatrix[11] = -((far + near) / (far - near));
        this.projectionMatrix[15] = 1;
    };

    //////////////////////////////////////////////////////////////////////////////////

    Camera.prototype = new Object3D();
    Camera.prototype.constructor = Camera;

    function Camera()
    {
        Object3D.call(this);
    }

    Camera.prototype.translate = function(x, y, z)
    {
        x *= -1;
        y *= -1;
        z *= -1;

        Object3D.prototype.translate.call(this, x, y, z);
    };

    Camera.prototype.translation = function(x, y, z)
    {
        x *= -1;
        y *= -1;
        z *= -1;

        Object3D.prototype.translation.call(this, x, y, z);
    };

    Camera.prototype.rotate = function(angle, x, y, z)
    {
        angle *= -1;

        Object3D.prototype.rotate.call(this, angle, x, y, z);
    };

    //////////////////////////////////////////////////////////////////////////////////

    Model.prototype = new Object3D();
    Model.prototype.constructor = Model;

    function Model()
    {
        Object3D.call(this);
    }

    Model.prototype.render = function()
    {
        Matrix.pushModelMatrix(this.matrix);

        for(var i = 0; i < this.children.length; i++) {
            this.children[i].render();
        }

        Matrix.popModelMatrix();
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
        this.resource = ResourceManager.newResource(src);
        this.shaderPrograms = [];
        this.textures = [];
        this.indices = 0;
        this.indexBuffer = null;
        this.attributes = [];
    }

    MeshData.prototype.load = function(callback)
    {
        var mesh = this;

        this.resource.onLoad = function()
        {
            var data = mesh.resource.getJSON();

            mesh.shaderPrograms = data.shaderPrograms;

            mesh.indices = data.indices.length;
            mesh.indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
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
        };

        this.resource.load();
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
        Matrix.pushModelMatrix(this.matrix);

        var uniform = gl.getUniformLocation(getShaderProgram(), "modelMatrix");
        gl.uniformMatrix4fv(uniform, false, new Float32Array(Matrix.model()));

        uniform = gl.getUniformLocation(getShaderProgram(), "viewMatrix");
        gl.uniformMatrix4fv(uniform, false, new Float32Array(Matrix.view));

        uniform = gl.getUniformLocation(getShaderProgram(), "projectionMatrix");
        gl.uniformMatrix4fv(uniform, false, new Float32Array(Matrix.projection));

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.data.indexBuffer);

        for(var i = 0; i < this.data.attributes.length; i++) {
            var attribute = this.data.attributes[i];
            var attributeLocation = gl.getAttribLocation(getShaderProgram(), attribute.name);
            gl.enableVertexAttribArray(attributeLocation);
            gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer);
            gl.vertexAttribPointer(attributeLocation, attribute.size, gl.FLOAT, false, 0, 0);
        }

        gl.drawElements(gl.TRIANGLES, this.data.indices, gl.UNSIGNED_SHORT, 0);

        Matrix.popModelMatrix();
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
        this.file = "";
        this.resource = null;
        this.shader = null;
        this.loaded = false;
        this.compiled = false;
        this.onLoad = null;

        if(typeof src !== "undefined") this.resource = ResourceManager.newResource(src);
    }

    Shader.prototype.load = function(callback)
    {
        var shader = this;

        this.resource.onLoad = function()
        {
            shader.file = shader.resource.getFile();
            shader.loaded = true;
            if(typeof shader.onLoad === "function") shader.onLoad();
            if(typeof callback === "function") callback();
        };

        this.resource.load();
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

    function addShaderProgram(src)
    {
        programsLoading++;

        src = src.replace(/\/$/, "");

        if(!src.match(/\.program$/)) {
            var name = src.match(/[^\/\\]*$/)[0];
            src = src + "/" + name + ".program";
        }

        var directory = src.match(/.*\//)[0];

        var resource = ResourceManager.newResource(src);

        resource.onLoad = function()
        {
            var json = resource.getJSON();

            if(!json.hasOwnProperty("name")) return;
            if(!json.hasOwnProperty("vertex")) return;
            if(!json.hasOwnProperty("fragment")) return;

            var vertShader = new VertexShader(directory + json.vertex);
            var fragShader = new FragmentShader(directory + json.fragment);

            if(typeof shaderPrograms[json.name] !== "undefined") {
                ResourceManager.removeResource(shaderPrograms[json.name].vertexShader.resource);
                ResourceManager.removeResource(shaderPrograms[json.name].fragmentShader.resource);
            }

            shaderPrograms[json.name] = new ShaderProgram(vertShader, fragShader);

            if(--programsLoading == 0 && typeof onProgramsLoaded === "function")
                onProgramsLoaded();
        };

        resource.load();
    }

    function loadShaderPrograms()
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
                    loadShaderPrograms();
                };
            }

            else loadShaderPrograms();
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

            var resource = ResourceManager.newResource(src);

            resource.onLoad = function()
            {
                var json = resource.getJSON();

                for(var i = 0; i < json.length; i++) {
                    addShaderProgram(directory + json[i]);
                }

                programsLoading--;

            };

            resource.load();
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
            Frame.scene = scene;
            Matrix.projection = scene.projectionMatrix;
            Matrix.setModelMatrix(scene.matrix);
            Matrix.view = scene.camera.matrix;

            Frame.renderInterval = setInterval(function()
            {
                Frame.scene.render();
            }, 1000 / Frame.fps);

            return true;
        },

        newModel : function()
        {
            return new Model();
        },

        fps : function(number)
        {
            Frame.fps = number;
            if(Frame.renderInterval) clearInterval(Frame.renderInterval);
            Frame.renderInterval = setInterval(function()
            {
                Frame.scene.render();
            }, 1000 / Frame.fps);
        },

        update : function(method)
        {
            Frame.update = method;
        }
    };

    //////////////////////////////////////////////////////////////////////////////////

})();