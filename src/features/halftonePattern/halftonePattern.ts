import { getTemporaryUrl, upload, ImageMimeType, ImageRef } from "@canva/asset";

export const applyHalftonePatternWebGL = (imageData: ImageData, dotSize: number, angle: number) => {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl");
  if (!gl) throw new Error("WebGL is not available");

  canvas.width = imageData.width;
  canvas.height = imageData.height;

  // Vertex shader
  const vertexShaderSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
      v_texCoord = a_texCoord;
    }
  `;

  // Fragment shader
  const fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_image;
    uniform float u_dotSize;
    uniform float u_angle;
    varying vec2 v_texCoord;
    void main() {
      vec2 coord = v_texCoord;
      float gray = texture2D(u_image, coord).r;
      float radius = (1.0 - gray) * u_dotSize;
      vec2 center = vec2(0.5, 0.5);
      vec2 rotatedCoord = vec2(
        cos(u_angle) * (coord.x - center.x) - sin(u_angle) * (coord.y - center.y) + center.x,
        sin(u_angle) * (coord.x - center.x) + cos(u_angle) * (coord.y - center.y) + center.y
      );
      float dist = distance(rotatedCoord, center);
      if (dist < radius) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      } else {
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
      }
    }
  `;

  // Compile shaders and link program
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vertexShader || !fragmentShader) {
    throw new Error("Shader compilation failed");
  }

  const program = createProgram(gl, vertexShader, fragmentShader);
  if (!program) {
    throw new Error("Program linking failed");
  }

  // Set up attributes and uniforms
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
  const dotSizeLocation = gl.getUniformLocation(program, "u_dotSize");
  const angleLocation = gl.getUniformLocation(program, "u_angle");

  // Create buffer for positions
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1,
  ]), gl.STATIC_DRAW);

  // Create buffer for texture coordinates
  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    0, 0,
    1, 0,
    0, 1,
    1, 1,
  ]), gl.STATIC_DRAW);

  // Create texture
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageData);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // Set up and draw
  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(texCoordLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

  gl.uniform1f(dotSizeLocation, dotSize);
  gl.uniform1f(angleLocation, angle);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  return canvas.toDataURL();
};

export async function transformRasterImage(
  ref: ImageRef,
  transformer: (ctx: CanvasRenderingContext2D, imageData: ImageData) => string
): Promise<{ dataUrl: string; mimeType: ImageMimeType }> {
  const { url } = await getTemporaryUrl({
    type: "IMAGE",
    ref,
  });

  const response = await fetch(url, { mode: "cors" });
  const imageBlob = await response.blob();
  const mimeType = imageBlob.type;

  if (!isSupportedMimeType(mimeType)) {
    throw new Error(`Unsupported mime type: ${mimeType}`);
  }

  const objectURL = URL.createObjectURL(imageBlob);
  const image = new Image();
  image.crossOrigin = "Anonymous";

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("Image could not be loaded"));
    image.src = objectURL;
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("CanvasRenderingContext2D is not available");
  }

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const newImageDataUrl = transformer(ctx, imageData);
  URL.revokeObjectURL(objectURL);

  return { dataUrl: newImageDataUrl, mimeType };
}

function isSupportedMimeType(
  input: string
): input is "image/jpeg" | "image/heic" | "image/png" | "image/webp" {
  const mimeTypes = ["image/jpeg", "image/heic", "image/png", "image/webp"];
  return mimeTypes.includes(input);
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}
