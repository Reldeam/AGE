attribute vec3 vertices;
attribute vec3 normals;
attribute vec4 colours;
attribute vec2 uvs;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

varying highp vec3 position;
varying highp vec3 normal;
varying lowp vec4 colour;
varying lowp vec2 uv;

void main(void)
{
    gl_Position = vec4(vertices, 1.0) * modelMatrix * viewMatrix * projectionMatrix;
    position = normalize(vec3(gl_Position[0], gl_Position[1], gl_Position[2]) / gl_Position[3]);
    normal = normals;
    colour = colours;
    uv = uvs;
}