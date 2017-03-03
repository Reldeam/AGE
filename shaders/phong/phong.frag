varying highp vec3 position;
varying highp vec3 normal;
varying lowp vec4 colour;
varying lowp vec2 uv;

uniform sampler2D uSampler;

void main(void)
{
    gl_FragColor = vec4(normal[0], normal[1], normal[2], 1);
    //gl_FragColor = vec4(position[0], position[1], position[2], 1);
    //gl_FragColor = colour;
    //gl_FragColor = texture2D(uSampler, vec2(uv.s, uv.t));
}