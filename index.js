/*
 * Lots of code here is copied 1:1 from actual game files
 *
 */

/** @enum {string} */
const enumSubShape = {
  rect: "rect",
  circle: "circle",
  star: "star",
  windmill: "windmill",
};

/** @enum {string} */
const enumSubShapeToShortcode = {
  [enumSubShape.rect]: "R",
  [enumSubShape.circle]: "C",
  [enumSubShape.star]: "S",
  [enumSubShape.windmill]: "W",
};

/** @enum {enumSubShape} */
const enumShortcodeToSubShape = {};
for (const key in enumSubShapeToShortcode) {
  enumShortcodeToSubShape[enumSubShapeToShortcode[key]] = key;
}

const arrayQuadrantIndexToOffset = [
  { x: 1, y: -1 }, // tr
  { x: 1, y: 1 }, // br
  { x: -1, y: 1 }, // bl
  { x: -1, y: -1 }, // tl
];

// From colors.js
/** @enum {string} */
const enumColors = {
  red: "red",
  green: "green",
  blue: "blue",

  yellow: "yellow",
  purple: "purple",
  cyan: "cyan",

  white: "white",
  uncolored: "uncolored",
};

/** @enum {string} */
const enumColorToShortcode = {
  [enumColors.red]: "r",
  [enumColors.green]: "g",
  [enumColors.blue]: "b",

  [enumColors.yellow]: "y",
  [enumColors.purple]: "p",
  [enumColors.cyan]: "c",

  [enumColors.white]: "w",
  [enumColors.uncolored]: "u",
};

/** @enum {string} */
const enumColorsToHexCode = {
  [enumColors.red]: "#ff666a",
  [enumColors.green]: "#78ff66",
  [enumColors.blue]: "#66a7ff",

  // red + green
  [enumColors.yellow]: "#fcf52a",

  // red + blue
  [enumColors.purple]: "#dd66ff",

  // blue + green
  [enumColors.cyan]: "#87fff5",

  // blue + green + red
  [enumColors.white]: "#ffffff",

  [enumColors.uncolored]: "#aaaaaa",
};

/** @enum {enumColors} */
const enumShortcodeToColor = {};
for (const key in enumColorToShortcode) {
  enumShortcodeToColor[enumColorToShortcode[key]] = key;
}

CanvasRenderingContext2D.prototype.beginCircle = function (x, y, r) {
  if (r < 0.05) {
    this.beginPath();
    this.rect(x, y, 1, 1);
    return;
  }
  this.beginPath();
  this.arc(x, y, r, 0, 2.0 * Math.PI);
};

const possibleShapesString = Object.keys(enumShortcodeToSubShape).join('');
const possibleColorsString = Object.keys(enumShortcodeToColor).join('');
const layerRegex = new RegExp('([' + possibleShapesString + '][' + possibleColorsString + ']|-{2}){4}');

/////////////////////////////////////////////////////

function radians(degrees) {
  return (degrees * Math.PI) / 180.0;
}

/**
 * Generates the definition from the given short key
 */
function fromShortKey(key) {
  const sourceLayers = key.split(":");
  if (sourceLayers.length > 4) {
    throw new Error("Only 4 layers allowed");
  }
  
  let layers = [];
  for (let i = 0; i < sourceLayers.length; ++i) {
    const text = sourceLayers[i];
    if (text.length % 2 !== 0) {
      throw new Error("Invalid layer: '" + text + "' -> must be even number of characters");
    }
    
    if (text === "--".repeat(4)) {
      throw new Error("Empty layers are not allowed");
    }
    
    // if (!layerRegex.test(text)) {
    //   throw new Error("Invalid syntax in layer " + (i + 1));
    // }
    
    const numSegs = text.length / 2

    const segs = Array(numSegs).fill(null)
    for (let seg = 0; seg < numSegs; ++seg) {
      const shapeText = text[seg * 2 + 0];
      const subShape = enumShortcodeToSubShape[shapeText];
      const color = enumShortcodeToColor[text[seg * 2 + 1]];
      if (subShape) {
        if (!color) {
          throw new Error("Invalid shape color key: " + key);
        }
        segs[seg] = {
          subShape,
          color,
        };
      } else if (shapeText !== "-") {
        throw new Error("Invalid shape key: " + shapeText);
      }
    }
    layers.push(segs);
  }

  return layers;
}

function renderShape(layers) {
  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById(
    "result"
  ));
  const context = canvas.getContext("2d");

  context.save();
  context.clearRect(0, 0, 1000, 1000);

  const w = 512;
  const h = 512;
  const dpi = 1;

  context.translate((w * dpi) / 2, (h * dpi) / 2);
  context.scale((dpi * w) / 23, (dpi * h) / 23);

  context.fillStyle = "#e9ecf7";

  const quadrantSize = 10;
  const quadrantHalfSize = quadrantSize / 2;

  context.fillStyle = "rgba(40, 50, 65, 0.1)";
  context.beginCircle(0, 0, quadrantSize * 1.15);
  context.fill();

  for (let layerIndex = 0; layerIndex < layers.length; ++layerIndex) {
    const segments = layers[layerIndex];

    const layerScale = Math.max(0.1, 0.9 - layerIndex * 0.3);
    
    for (let segmentIndex = 0; segmentIndex < segments.length; ++segmentIndex) {
      const rotation = radians(360/segments.length);
      context.rotate(rotation);
      if (!segments[segmentIndex]) {
        continue;
      }
      const { subShape, color } = segments[segmentIndex];

      const spacer = 2

      context.translate(0, -(quadrantHalfSize + spacer));

      context.fillStyle = enumColorsToHexCode[color];
      context.strokeStyle = "#555";
      context.lineWidth = 0.25;

      const insetPadding = 0.0;

      switch (subShape) {
        case enumSubShape.rect: {
          context.beginPath();
          const dims = quadrantSize * layerScale;
          const moveInwards = dims * 0.3;
          context.rect(
            -moveInwards,
            -moveInwards,
            moveInwards * 2,
            moveInwards * 2
          );

          break;
        }
        case enumSubShape.star: {
          context.beginPath();
          const dims = quadrantSize * layerScale;

          let originX = insetPadding - quadrantHalfSize;
          let originY = -insetPadding + quadrantHalfSize - dims;

          const moveInwards = dims * 0.4;
          context.moveTo(originX, originY + moveInwards);
          context.lineTo(originX + dims, originY);
          context.lineTo(originX + dims - moveInwards, originY + dims);
          context.lineTo(originX, originY + dims);
          context.closePath();
          break;
        }

        case enumSubShape.windmill: {
          context.beginPath();
          const dims = quadrantSize * layerScale;

          let originX = insetPadding - quadrantHalfSize;
          let originY = -insetPadding + quadrantHalfSize - dims;
          const moveInwards = dims * 0.4;
          context.moveTo(originX, originY + moveInwards);
          context.lineTo(originX + dims, originY);
          context.lineTo(originX + dims, originY + dims);
          context.lineTo(originX, originY + dims);
          context.closePath();
          break;
        }

        case enumSubShape.circle: {
          context.beginPath();
          const dims = quadrantSize * layerScale;
          const moveInwards = dims * 0.4;
          context.beginCircle(0, 0, moveInwards);
          context.closePath();
          break;
        }

        default: {
          assertAlways(false, "Unkown sub shape: " + subShape);
        }
      }

      context.fill();
      context.stroke();

      // context.rotate(-rotation);
      context.translate(0, (quadrantHalfSize + spacer));
    }
  }

  context.restore();
}

/////////////////////////////////////////////////////

function showError(msg) {
  const errorDiv = document.getElementById("error");
  errorDiv.classList.toggle("hasError", !!msg);
  if (msg) {
    errorDiv.innerText = msg;
  } else {
    errorDiv.innerText = "Shape generated";
  }
}

// @ts-ignore
window.generate = () => {
  showError(null);
  // @ts-ignore
  const code = document.getElementById("code").value.trim();

  let parsed = null;
  try {
    parsed = fromShortKey(code);
  } catch (ex) {
    showError(ex);
    return;
  }

  renderShape(parsed);
};

// @ts-ignore
window.debounce = (fn) => {
  setTimeout(fn, 0);
};

// @ts-ignore
window.addEventListener("load", () => {
  if (window.location.search) {
    const key = window.location.search.substr(1);
    document.getElementById("code").value = key;
  }
  generate();
});

window.exportShape = () => {
  const canvas = document.getElementById("result");
  const imageURL = canvas.toDataURL("image/png");

  const dummyLink = document.createElement("a");
  dummyLink.download = "shape.png";
  dummyLink.href = imageURL;
  dummyLink.dataset.downloadurl = [
    "image/png",
    dummyLink.download,
    dummyLink.href,
  ].join(":");

  document.body.appendChild(dummyLink);
  dummyLink.click();
  document.body.removeChild(dummyLink);
};

window.viewShape = (key) => {
  document.getElementById("code").value = key;
  generate();
};

window.shareShape = () => {
  const code = document.getElementById("code").value.trim();
  const url = "https://tauqua.github.io/sigil-viewer/?" + code;
  alert("You can share this url: " + url);
};
