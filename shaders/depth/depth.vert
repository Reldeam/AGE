attribute vec3 vertices;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

varying highp float depth;

void main(void)
{
    vec4 position = vec4(vertices, 1.0) * modelMatrix * viewMatrix * projectionMatrix;
    gl_Position = position;
    depth = (normalize(position).z + 1.0) / 2.0;
}