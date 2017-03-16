#version 300 es
precision highp float;

in float fragDepth;
in vec3 fragNormal;
in vec2 fragUv;

in vec4 fragEmission;
in vec4 fragAmbient;
in vec4 fragDiffuse;
in vec4 fragSpecular;
in vec4 fragReflective;
in vec4 fragTransparent;

uniform sampler2D colourSampler;
uniform sampler2D normalSampler;
uniform sampler2D depthSampler;

out vec4 fragColor[4];

void main(void)
{
    fragColor[0] = vec4(0.25);
    fragColor[1] = vec4(0.5);
    fragColor[2] = vec4(0.75);
    fragColor[3] = vec4(1);
}