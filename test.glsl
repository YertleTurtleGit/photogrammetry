#version 300 es
precision highp float;

in vec2 uv;
out vec4 fragColor;

uniform sampler2D uniform_1;

float luminance(vec4 image){
    return image.r*(.2126)+image.g*(.7152)+image.b*(.0722);
}

void main(){
    vec4 vec4_2=texture(uniform_1,uv);
    vec4 vec4_3=texture(uniform_1,vec2(uv[0]+(-.00048828125),uv[1]+(-.0008680555555555555)));
    vec4 vec4_4=texture(uniform_1,vec2(uv[0]+(0.),uv[1]+(-.0008680555555555555)));
    vec4 vec4_5=texture(uniform_1,vec2(uv[0]+(.00048828125),uv[1]+(-.0008680555555555555)));
    vec4 vec4_6=texture(uniform_1,vec2(uv[0]+(-.00048828125),uv[1]+(0.)));
    vec4 vec4_7=texture(uniform_1,vec2(uv[0]+(0.),uv[1]+(0.)));
    vec4 vec4_8=texture(uniform_1,vec2(uv[0]+(.00048828125),uv[1]+(0.)));
    vec4 vec4_9=texture(uniform_1,vec2(uv[0]+(-.00048828125),uv[1]+(.0008680555555555555)));
    vec4 vec4_10=texture(uniform_1,vec2(uv[0]+(0.),uv[1]+(.0008680555555555555)));
    vec4 vec4_11=texture(uniform_1,vec2(uv[0]+(.00048828125),uv[1]+(.0008680555555555555)));
    vec4 vec4_12=+(.5)*vec4_3+(0.)*vec4_4+(0.)*vec4_5+(0.)*vec4_6+(0.)*vec4_7+(0.)*vec4_8+(0.)*vec4_9+(0.)*vec4_10+(-.5)*vec4_11;
    fragColor=vec4_12;
}