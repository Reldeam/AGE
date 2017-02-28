var AGE = AGE || (function()
{
    var gl = null;

    var shaderPrograms = {};
    var programsLoading = 0;
    var onProgramsLoaded = null;

    /////////////////////////////////////////////////////////////////////////////////

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
            console.log("Unable to initialize the shader program: " + gl.getProgramInfoLog(this.program));
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

        if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
            gl.deleteShader(this.shader);
            console.log("An error occurred compiling the shaders: " + gl.getShaderInfoLog(this.shader));
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

    function getFile(src, callback)
    {
        if(typeof callback !== "function") return;

            var xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function()
        {
            if (this.readyState == 4 && this.status == 200)
               callback(this.responseText);
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

    addShaderProgram = function(src)
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
    };

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

        console.log(shaderPrograms);
    }

    //////////////////////////////////////////////////////////////////////////////////

    return {
        bootstrap : function(canvas)
        {
            gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

            if (!gl) {
                console.log("Unable to initialize WebGL.");
                return;
            }

            gl.clearColor(0, 0, 0, 1);         // Clear to black, fully opaque
            gl.clearDepth(1);                  // Clear everything
            gl.enable(gl.DEPTH_TEST);          // Enable depth testing
            gl.depthFunc(gl.LEQUAL);           // Near things obscure far things
            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);

            onShaderProgramsCompiled = function()
            {

            };

            if(programsLoading > 0) {
                onProgramsLoaded = function () {
                    compileShaderPrograms();
                };
            }

            else compileShaderPrograms();

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
                    console.log(directory + file[i]);
                    addShaderProgram(directory + file[i]);
                }

                programsLoading--;
            });
        }
    };

    //////////////////////////////////////////////////////////////////////////////////

})();