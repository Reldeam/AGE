attribute vec3 vertices;
attribute vec4 colours;
attribute vec2 uvs;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

varying lowp vec4 colour;
varying highp vec2 uv;

void main(void)
{
    gl_Position =  vec4(vertices, 1.0) * modelMatrix * viewMatrix * projectionMatrix;
    colour = colours;
    uv = uvs;
}