varying highp vec3 position;
varying highp vec3 normal;
varying lowp vec4 colour;
varying lowp vec2 uv;

uniform sampler2D uSampler;

void main(void)
{
    //gl_FragColor = vec4(position.x, 0, 0, 1);
    //gl_FragColor = vec4(normal[0], normal[1], normal[2], 1);
    //gl_FragColor = texture2D(uSampler, vec2(uv.s, uv.t));
    //gl_FragColor = colour;

    highp vec4 encode = position.z * vec4(1.0, 255.0, 65025.0, 160581375.0);
    encode = fract(encode);

    encode -= encode.yzww * vec4(1.0/255.0,1.0/255.0,1.0/255.0,0.0);
    encode[3] = 1.0;
    gl_FragColor = encode;
}