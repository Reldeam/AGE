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
    mat4 transformMatrix = modelMatrix * viewMatrix * projectionMatrix;

    gl_Position = vec4(vertices, 1.0) * transformMatrix;
    position = (normalize(vec3(gl_Position[0], gl_Position[1], gl_Position[2]) / gl_Position[3]) + 1.0) / 2.0;

    transformMatrix[0][3] = 0.0;
    transformMatrix[1][3] = 0.0;
    transformMatrix[2][3] = 0.0;

    vec4 normals4 = vec4(normals, 1.0) * transformMatrix;
    normal = (normalize(vec3(normals4[0], normals4[1], normals4[2]) / normals4[3]) + 1.0) / 2.0;

    colour = colours;
    uv = uvs;
}