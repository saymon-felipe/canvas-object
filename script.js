// Obtém o elemento canvas
const canvas = $("#canvas")[0];
const ctx = canvas.getContext('2d');

// Array para armazenar os elementos retângulo
let elements = [];
let texts = [];

// Variáveis para controle de desenho
let drawingRectangleRequested = false;
let isDrawingRectangle = false;
let startX = 0;
let startY = 0;

// Variáveis para controle de seleção e movimentação
let selectedElement = null;
let isDragging = false;
let offset = { x: 0, y: 0 };

let selectedText = null;

// Variáveis para redimensionamento
let resizingHandle = null;
let originalSize = { width: 0, height: 0 };



const clearButton = $("#clear-canvas");
clearButton.on("click", () => {
  clearCanvas();
})


const btnText = $('#texto');
btnText.on('click', function () {
  requestText();
});

const btnRetangle = $('#btn-retangulo');
btnRetangle.on('click', function () {
  requestRectangleDraw();
});

const insertText = $("#insert-text");
insertText.on("click", function () {
  let input = $("#texto-input");
  if (input.val() != "") {
    addText(input.val());
  }
  hideRequestText();
})

const exportButton = $("#export");
exportButton.on("click", function () {
  const link = document.createElement('a');
  const imagemBase64 = canvas.toDataURL('image/png');
  link.href = imagemBase64;
  link.download = 'canvas.png';
  link.click();
})



function TextClass(x, y, text, font, fillStyle) {
  this.x = x;
  this.y = y;
  this.text = text;
  this.font = font;
  this.fillStyle = fillStyle
}



// Event listener para o evento mousedown
$(canvas).on('mousedown', function (event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  selectedElement = verifyClick(x, y);
  selectedText = verifyClickInText(x, y);

  if (selectedText) {
    isDragging = true;
    stopChangeColorInputsEventListener();
  }

  if (selectedElement) {
    isDragging = true;
    offset.x = x - selectedElement.x;
    offset.y = y - selectedElement.y;

    resizingHandle = checkHandlerResizing(x, y);
    if (resizingHandle) {
      originalSize.width = selectedElement.width;
      originalSize.height = selectedElement.height;
    }
    startChangeColorInputsEventListener();
  } else if (!selectedText && !selectedElement) {
    startX = x;
    startY = y;
    if (drawingRectangleRequested) {
      isDrawingRectangle = true;
    }
    stopChangeColorInputsEventListener();
  }
  drawElements();
});

// Event listener para o evento mousemove
$(canvas).on('mousemove', function (event) {
    const rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
  
    if (isDrawingRectangle) {
      const width = x - startX;
      const height = y - startY;
      drawElements();
      drawRectangle(startX, startY, width, height);
    } else if (isDragging) {
      if (resizingHandle) {
        const diffX = x - resizingHandle.x;
        const diffY = y - resizingHandle.y;
  
        const handleSize = 5;
  
        if (resizingHandle.handler === 'nw-resize') {
          selectedElement.x += diffX;
          selectedElement.y += diffY;
          selectedElement.width -= diffX;
          selectedElement.height -= diffY;
          resizingHandle.x += diffX;
          resizingHandle.y += diffY;
        } else if (resizingHandle.handler === 'ne-resize') {
          selectedElement.y += diffY;
          selectedElement.width += diffX;
          selectedElement.height -= diffY;
          resizingHandle.x += diffX;
          resizingHandle.y += diffY;
        } else if (resizingHandle.handler === 'se-resize') {
          selectedElement.width += diffX;
          selectedElement.height += diffY;
          resizingHandle.x += diffX;
          resizingHandle.y += diffY;
        } else if (resizingHandle.handler === 'sw-resize') {
          selectedElement.x += diffX;
          selectedElement.width -= diffX;
          selectedElement.height += diffY;
          resizingHandle.x += diffX;
          resizingHandle.y += diffY;
        }
  
        // Limitar o tamanho mínimo do elemento
        if (selectedElement.width < handleSize) {
          selectedElement.width = handleSize;
        }
        if (selectedElement.height < handleSize) {
          selectedElement.height = handleSize;
        }
  
        drawElements();
      } else {
        if (selectedText) {
          selectedText.x = x;
          selectedText.y = y;
        } 
        
        if (selectedElement) {
          selectedElement.x = x - offset.x;
          selectedElement.y = y - offset.y;
        }
        drawElements();
      }
    }
  
    const resizeCursor = checkHandlerResizing(x, y);
    if (resizeCursor) {
      canvas.style.cursor = getCursorByHandle(resizeCursor.handler);
    } else {
      canvas.style.cursor = 'default';
    }
  });

// Event listener para o evento mouseup
$(canvas).on('mouseup', function () {
  if (isDrawingRectangle) {
    const rect = canvas.getBoundingClientRect();
    const width = event.clientX - rect.left - startX;
    const height = event.clientY - rect.top - startY;

    const newElement = { 
      x: startX,
      y: startY,
      width: width,
      height: height,
      borderRadius: 0
    };
    elements.push(newElement);

    cancelRectangleDraw();
  } else if (isDragging) {
    isDragging = false;
    resizingHandle = null;
    originalSize = { width: 0, height: 0 };
  }
  drawElements();
});

// Event listener para o evento click no canvas
$(canvas).on('click', function (event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (!verifyClick(x, y)) {
    selectedElement = null;
  }

  if (!verifyClickInText(x, y)) {
    selectedText = null;
  }

  drawElements();
});

function clearCanvas() {
  selectedElement = null;
  selectedText = null;
  elements = [];
  texts = [];
  drawElements();
}

function requestRectangleDraw() {
  drawingRectangleRequested = true;
  canvas.style.cursor = 'crosshair';
}

function cancelRectangleDraw() {
  drawingRectangleRequested = false;
  isDrawingRectangle = false;
  canvas.style.cursor = 'default';
}

function requestText() {
  let textContainer = $("#texto-container");
  let textInput = $("#texto-input")
  textContainer.css("display", "flex");
  setTimeout(() => {
    textInput.focus();
  }, 10)
}

function hideRequestText() {
  let textContainer = $("#texto-container");
  let textInput = $("#texto-input");
  textInput.val("");
  textContainer.hide();
}

// Função para obter o cursor do mouse com base no manipulador de redimensionamento
function getCursorByHandle(handle) {
  switch (handle) {
    case 'nw-resize':
      return 'nwse-resize';
    case 'ne-resize':
      return 'nesw-resize';
    case 'se-resize':
      return 'nwse-resize';
    case 'sw-resize':
      return 'nesw-resize';
    default:
      return 'default';
  }
}

function stopChangeColorInputsEventListener() {
  let divColorControls = $("#rectangle-personalization-container");
  divColorControls.hide();

  let borderColor = $("#corBorda");
  let fillColor = $("#corPreenchimento");
  let borderRadius = $("#borderRadius");

  borderColor.off("input", changeBorderColor);
  fillColor.off("input", changeBackgroundColor);
  borderRadius.off("input", changeBorderRadius);
}

function startChangeColorInputsEventListener() {
  let divColorControls = $("#rectangle-personalization-container");
  divColorControls.css("display", "flex");

  let borderColor = $("#corBorda");
  let fillColor = $("#corPreenchimento");
  let borderRadius = $("#borderRadius");

  function changeBorderRadius(event) {
    let value = event.target.value;
    if (selectedElement == null) {
      return;
    }
    selectedElement.borderRadius = value;
    drawElements();
  }
  
  borderColor.on("input", function (event) {
      changeBorderColor(event);
  });

  fillColor.on("input", function (event) {
      changeBackgroundColor(event);
  });

  borderRadius.on("input", function (event) {
    changeBorderRadius(event);
  });

  // Definir os valores dos inputs de cor com base nas cores atuais do elemento selecionado
  borderColor.value = selectedElement.strokeStyle || "#000000";
  fillColor.value = selectedElement.fillStyle || "#000000";
  borderRadius.value = selectedElement.borderRadius || "0";
}

function changeBorderColor(event) {
  let value = event.target.value;
    if (selectedElement == null) {
      return;
    }
    selectedElement.strokeStyle = value;
    drawElements();
}

function changeBackgroundColor(event) {
  let value = event.target.value;
    if (selectedElement == null) {
      return;
    }
    selectedElement.fillStyle = value;
    drawElements();
}

function changeBorderRadius(event) {
  let value = event.target.value;
  if (selectedElement == null) {
    return;
  }
  selectedElement.borderRadius = value;
  drawElements();
}

function checkHandlerResizing(x, y) {
  const handleSize = 5;

  if (selectedElement == null) {
      return;
  }

  const handles = [
    { handler: 'nw-resize', x: selectedElement.x - 5, y: selectedElement.y - 5 },
    { handler: 'ne-resize', x: selectedElement.x + selectedElement.width - 5, y: selectedElement.y - 5 },
    { handler: 'se-resize', x: selectedElement.x + selectedElement.width - 5, y: selectedElement.y + selectedElement.height - 5 },
    { handler: 'sw-resize', x: selectedElement.x - 5, y: selectedElement.y + selectedElement.height - 5 },
  ];

  for (let i = 0; i < handles.length; i++) {
    const handle = handles[i];
    if (x >= handle.x && x <= handle.x + handleSize && y >= handle.y && y <= handle.y + handleSize) {
      return handle;
    }
  }

  return null;
}

// Função para desenhar o retângulo
function drawRectangle(x, y, width, height) {
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.stroke();
  ctx.closePath();
}

function addText(parameterText) {
  const text = parameterText;
  const font = "24px Arial";
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const fillStyle = "black";
  const newText = new TextClass(x, y, text, font, fillStyle);
  texts.push(newText);
  drawElements();
}

function drawText() {
  texts.forEach(function(text) {
    ctx.font = text.font || "12px Arial";
    ctx.fillStyle = text.fillStyle;
    ctx.fillText(text.text, text.x, text.y);
  });
}

function drawRectangles() {
  for (let i = 0; i < elements.length; i++) {
    let element = elements[i];

    if (!element.fillStyle) {
      element.fillStyle = "transparent";
    }
    
    if (!element.strokeStyle) {
      element.strokeStyle = "black";
    }

    ctx.strokeStyle = element.strokeStyle;
    ctx.fillStyle = element.fillStyle;

    ctx.beginPath();
    ctx.roundRect(element.x, element.y, element.width, element.height, element.borderRadius);
    ctx.stroke(); // Desenha a borda com a cor definida em strokeStyle
    ctx.fill(); // Preenche o retângulo com a cor definida em fillStyle
    ctx.closePath();

    if (element === selectedElement) {
      element.fillStyle = selectedElement.fillStyle;
      element.strokeStyle = selectedElement.strokeStyle;
      element.borderRadius = selectedElement.borderRadius;
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.closePath();

      ctx.beginPath();
      const secondRectX = element.x - 5;
      const secondRectY = element.y - 5;
      const secondRectWidth = element.width + 10;
      const secondRectHeight = element.height + 10;
      ctx.rect(secondRectX, secondRectY, secondRectWidth, secondRectHeight);
      ctx.strokeStyle = 'blue';
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.closePath();

      // Desenhar pontos nos vértices
      const vertexSize = 3;
      const vertices = [
        { x: element.x - vertexSize / 2, y: element.y - vertexSize / 2 },
        { x: element.x + element.width - vertexSize / 2, y: element.y - vertexSize / 2 },
        { x: element.x + element.width - vertexSize / 2, y: element.y + element.height - vertexSize / 2 },
        { x: element.x - vertexSize / 2, y: element.y + element.height - vertexSize / 2 },
      ];

      ctx.fillStyle = 'red';
      vertices.forEach((vertex) => {
        ctx.fillRect(vertex.x, vertex.y, vertexSize, vertexSize);
      });
    } else {
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.closePath();
    }
  }
}

function drawElements() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawRectangles();
    drawText();
  }
  

// Função para verificar se um clique ocorreu dentro de um elemento
function verifyClick(x, y) {
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    if (
      x >= element.x &&
      x <= element.x + element.width &&
      y >= element.y &&
      y <= element.y + element.height
    ) {
      return element;
    }
  }
  return null;
}

function verifyClickInText(x, y) {
  return texts.find(function(text) {
    const metrics = ctx.measureText(text.text);
    const textWidth = metrics.width;
    const textHeight = parseInt(text.font);

    return x >= text.x &&
           x <= text.x + textWidth &&
           y >= text.y - textHeight &&
           y <= text.y;
  });
}

drawElements();
