varying lowp vec4 colour;
varying lowp vec2 uv;

uniform sampler2D uSampler;

void main(void)
{
    gl_FragColor = colour;
    //gl_FragColor = texture2D(uSampler, vec2(uv.s, uv.t));
}