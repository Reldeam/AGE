#version 300 es

in vec3 vertices;
in vec3 normals;
in vec2 uvs;

in vec4 emission;
in vec4 ambient;
in vec4 diffuse;
in vec4 specular;
in vec4 reflective;
in vec4 transparent;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out float fragDepth;
out vec3 fragNormal;
out vec2 fragUv;

out vec4 fragEmission;
out vec4 fragAmbient;
out vec4 fragDiffuse;
out vec4 fragSpecular;
out vec4 fragReflective;
out vec4 fragTransparent;

void main(void)
{
    mat4 transformMatrix = modelMatrix * viewMatrix * projectionMatrix;

    vec4 position4 = vec4(vertices, 1.0) * transformMatrix;
    gl_Position = position4;

    fragDepth = ((normalize(vec3(position4.xyz / position4.w)) + 1.0) / 2.0).z;

    transformMatrix[0][3] = 0.0;
    transformMatrix[1][3] = 0.0;
    transformMatrix[2][3] = 0.0;

    vec4 normal4 = vec4(normals, 1.0) * transformMatrix;
    fragNormal = (normalize(vec3(normal4.xyz / normal4.w)) + 1.0) / 2.0;

    fragUv = uvs;

    fragEmission = emission;
    fragAmbient = ambient;
    fragDiffuse = diffuse;
    fragSpecular = specular;
    fragReflective = reflective;
    fragTransparent = transparent;
}