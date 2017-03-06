varying highp float depth;

void main(void)
{
    highp vec3 encode = fract(depth * vec3(1.0, 255.0, 65025.0));
    encode -= vec3(encode.y/255.0,encode.z/255.0,0.0);
    gl_FragColor = vec4(encode, 1.0);
}