const changeBrush = tile => {
  if (!tile)
    return
  if (!brush)
    brush = {}
  if (tile instanceof Array) {
    if (brushDiv)
      brushDiv.classList.remove('selected')
    brush.type = 'default'
    brush.data = tile
    brushDiv = $(`#tile_${tile[0] * htile + tile[1]}`)
    if (brushDiv)
      brushDiv.classList.add('selected')
    $('#statusbar').innerHTML = `selected tile: ${brush.data.join(',')}`
  } else {
    brush.type = 'default'
    brush.data = tile
    $('#layerSelector').selectedIndex = 0
    map.activeLayer = -1
    $('#statusbar').innerHTML = `selected object: ${objectNames[tile]}`
  }
}

const createCheckbox = (text, func, checked) => {
  const label = $c('label')
  label.innerText = text
  const checkbox = $c('input')
  checkbox.type = "checkbox"
  checkbox.checked = checked
  checkbox.onclick = func
  label.appendChild(checkbox)
  return label
}

const createLayerSelector = (nLayers = null, collision = 0) => {
  if (!nLayers)
    nLayers = map.nLayers
  const select = $c('select')
  select.id = 'layerSelector'
  if (collision) {
    const opt = $c('option')
    opt.value = -1
    opt.innerText = `Collision`
    select.appendChild(opt)
  }
  for (let i = 0; i < nLayers; i++) {
    const opt = $c('option')
    opt.value = i
    opt.innerText = map.layerNames[i]
    //opt.innerText = `Layer ${i}`
    select.appendChild(opt)
  }
  select.value = 0
  select.addEventListener('change', e => {
    map.activeLayer = select.value
    $('#statusbar').innerHTML = `Active layer: ${select.value < 0 ? 'Collision' : select.value}`
  })
  return select
}

const createToolbar = () => {
  const pencil = $c('div')
  pencil.id = 'pencil'
  pencil.title = 'Pencil'
  pencil.className = 'tool'
  pencil.innerText = '\uf303'
  pencil.onclick = () => selectTool('pencil')
  const eraser = $c('div')
  eraser.id = 'eraser'
  eraser.title = 'Eraser'
  eraser.className = 'tool'
  eraser.innerText = '\uf12d'
  eraser.onclick = () => selectTool('eraser')
  const bucket = $c('div')
  bucket.id = 'bucket'
  bucket.title = 'Paint Bucket'
  bucket.className = 'tool'
  bucket.innerText = '\uf576'
  bucket.onclick = () => selectTool('bucket')
  const drop = $c('div')
  drop.id = 'drop'
  drop.title = 'Eye Dropper'
  drop.className = 'tool'
  drop.innerText = '\uf1fb'
  drop.onclick = () => selectTool('drop')
  const pick = $c('div')
  pick.id = 'drop'
  pick.title = 'Color Picker'
  pick.className = 'tool'
  const inp = $c('input')
  inp.type = "color"
  inp.onchange = () => changeColor(inp.value)

  pick.appendChild(inp)
  //pick.innerText = '\uf1fb'

  const tools = $c('div')
  tools.id = 'tools'
  tools.appendChild(pencil)
  tools.appendChild(eraser)
  tools.appendChild(bucket)
  tools.appendChild(drop)
  tools.appendChild(pick)
  $('#toolbar').appendChild(tools)
}

const createCollisionPallete = (nCollisionTiles = 1, tileWidth, tileHeight) => {
  const collisionTiles = $c('div')
  collisionTiles.id = 'collisionTiles'
  collisionTiles.style.width = `${(nCollisionTiles + 1) * tileWidth}px`
  for (let i = 1; i < nCollisionTiles + 1; i++) {
    const collisionTile = $c('div')
    collisionTile.id = 'collision_tile_' + i
    collisionTile.className = 'collisionTileIcon'
    collisionTile.title = objectNames[i]
    collisionTile.style.width = tileWidth + 'px'
    collisionTile.style.height = tileHeight + 'px'
    collisionTile.style.backgroundColor = 'hsl(' + (i * 30) % 360 + ', 50%, 50%)'
    collisionTile.onclick = () => changeBrush(i)
    collisionTiles.appendChild(collisionTile)
  }
  $('#toolbar').appendChild(collisionTiles)
}

const createTexturePalette = (imgSrc, imgName, tileRealWidth, tileRealHeight, border, tileWidth, tileHeight, bottomOffset, isometric) => {

  createCollisionPallete(objectNames.length - 1, tileWidth, tileHeight)

  brush = null
  brushDiv = null
  customTiles = {}
  customTileId = 0
  randomTiles = {}
  randomTileId = 0
  loadedTextures = {}

  imgName = imgName.replace(/.*\\/, '')
  texture = new Texture(imgSrc, imgName, tileRealWidth, tileRealHeight, border, tileWidth, tileHeight, bottomOffset, isometric)
  loadedTextures[texture.name] = true
  textureData.push(texture)
  //console.log(texture)
  texture.load(() => {
    $('#statusbar').innerHTML = `Texture file ${imgName} loaded`
    const tWidth = (isometric ? tileRealWidth : tileWidth)
    const tHeight = (isometric ? tileRealHeight : tileHeight)
    htile = Math.round(texture.image.width / (texture.tileRealWidth + texture.border))
    vtile = Math.round(texture.image.height / (texture.tileRealHeight + texture.border))
    const tileIcons = $c('div')
    tileIcons.id = 'tileIcons'
    tileIcons.style.width = `${htile * tWidth}px`
    for (let i = 0; i < vtile; i++) {
      for (let j = 0; j < htile; j++) {
        const tileIcon = $c('div')
        tileIcon.id = 'tile_' + (i * htile + j)
        tileIcon.className = 'tileIcon'
        tileIcon.style.width = tWidth + 'px'
        tileIcon.style.height = tHeight + 'px'
        tileIcon.style.imageRendering = 'crisp-edges'
        tileIcon.style.imageRendering = 'pixelated'
        tileIcon.style.backgroundImage = `url('${texture.src}')`
        tileIcon.style.backgroundSize = `${htile * tWidth}px ${vtile * tHeight}px`
        tileIcon.style.backgroundPosition = `-${j * tWidth}px -${i * tHeight}px`
        tileIcon.onclick = () => changeBrush([i, j])
        tileIcons.appendChild(tileIcon)
      }
    }
    $('#toolbar').appendChild(tileIcons)
  })
}

const createNewCustomBrush = (tileWidth, tileHeight, htile, vtile) => {
  ++customTileId
  const tile = $c('div')
  tile.id = customTileId
  tile.className = 'tile'
  tile.style.width = tileWidth * htile + 'px'
  tile.style.height = tileHeight * vtile + 10 + 'px'
  const border = $c('div')
  border.title = `Select tile: custom tile ${tile.id}`
  border.style.width = tileWidth * htile + 'px'
  border.style.height = '10px'
  border.className = 'tileBorder'
  border.onclick = () => {
    brush = {
      'type': 'custom',
      'data': customTiles[tile.id]
    }
    if (brushDiv) {
      brushDiv.classList.remove('selected')
      brushDiv = null
    }
    $('#statusbar').innerHTML = `selected tile: custom tile ${tile.id}`
  }
  tile.appendChild(border)
  for (let i = 0; i < vtile; i++) {
    for (let j = 0; j < htile; j++) {
      const square = $c('div')
      square.className = 'square'
      square.style.width = tileWidth + 'px'
      square.style.height = tileHeight + 'px'
      square.onclick = () => {
        if (!brushDiv || brush.type != 'default')
          return
        square.style.backgroundImage = brushDiv.style.backgroundImage
        square.style.backgroundSize = brushDiv.style.backgroundSize
        square.style.backgroundPosition = brushDiv.style.backgroundPosition
        customTiles[tile.id][i][j] = brush.data
        if (brushDiv) {
          brushDiv.classList.remove('selected')
          brushDiv = null
        }
      }
      tile.appendChild(square)
    }
  }
  const borderDel = $c('div')
  borderDel.title = `Deleted tile: custom tile ${tile.id}`
  borderDel.style.width = tileWidth * htile + 'px'
  borderDel.style.height = '10px'
  borderDel.className = 'tileBorderDelete'
  borderDel.onclick = () => {
    tile.remove()
    brush = null
    delete customTiles[tile.id]
    $('#statusbar').innerHTML = `Deleted tile: custom tile ${tile.id}`
  }
  tile.appendChild(borderDel)
  $('#toolbar').appendChild(tile)
  customTiles[tile.id] = Array(vtile).fill().map(_ => Array(htile).fill(0))
}

const createNewRandomBrush = (tileWidth, tileHeight, htile) => {
  ++randomTileId
  const tile = $c('div')
  tile.id = randomTileId
  tile.className = 'tile'
  tile.style.width = tileWidth * htile + 'px'
  tile.style.height = tileHeight + 10 + 'px'
  const border = $c('div')
  border.title = `Select tile: random tile ${tile.id}`
  border.style.width = tileWidth * htile + 'px'
  border.style.height = '10px'
  border.className = 'tileBorder'
  border.onclick = () => {
    brush = {
      'type': 'random',
      'data': randomTiles[tile.id]
    }
    if (brushDiv) {
      brushDiv.classList.remove('selected')
      brushDiv = null
    }
    $('#statusbar').innerHTML = `selected tile: random tile ${tile.id}`
  }
  tile.appendChild(border)
  for (let j = 0; j < htile; j++) {
    const square = $c('div')
    square.className = 'square'
    square.style.width = tileWidth + 'px'
    square.style.height = tileHeight + 'px'
    square.onclick = () => {
      if (!brushDiv || brush.type != 'default')
        return
      square.style.backgroundImage = brushDiv.style.backgroundImage
      square.style.backgroundSize = brushDiv.style.backgroundSize
      square.style.backgroundPosition = brushDiv.style.backgroundPosition
      randomTiles[tile.id][j] = brush.data
      if (brushDiv) {
        brushDiv.classList.remove('selected')
        brushDiv = null
      }
    }
    tile.appendChild(square)
  }
  const borderDel = $c('div')
  borderDel.title = `Deleted tile: random tile ${tile.id}`
  borderDel.style.width = tileWidth * htile + 'px'
  borderDel.style.height = '10px'
  borderDel.className = 'tileBorderDelete'
  borderDel.onclick = () => {
    tile.remove()
    brush = null
    delete randomTiles[tile.id]
    $('#statusbar').innerHTML = `Deleted tile: random tile ${tile.id}`
  }
  tile.appendChild(borderDel)
  $('#toolbar').appendChild(tile)
  randomTiles[tile.id] = Array(htile).fill(0)
}




/////
function showWindow(id, title) {
  console.log('showing window')
  var node_1 = document.createElement('DIV');
  node_1.setAttribute('id', id);
  node_1.setAttribute('class', 'modal');

  var node_2 = document.createElement('DIV');
  node_2.setAttribute('class', 'space');
  node_1.appendChild(node_2);

  var node_3 = document.createElement('SPAN');
  node_3.setAttribute('class', 'close fa fa-window-close');
  // node_3.setAttribute('class', 'fa-rectangle-xmark')
  node_2.appendChild(node_3);
  //node_3.innerText = ' sdf'
  //var node_32 = document.createTextNode("\uf303");
  // node_3.appendChild(node_32);

  var node_4 = document.createElement('SECTION');
  node_4.setAttribute('class', 'contact-form');
  node_2.appendChild(node_4);

  var node_5 = document.createElement('H2');
  node_4.appendChild(node_5);

  var node_6 = document.createTextNode((new String(title)));
  node_5.appendChild(node_6);

  var node_7 = document.createElement('FORM');
  node_7.setAttribute('id', 'theform');
  node_4.appendChild(node_7);




  //node_1.style.display = "flex"

  //var modal = document.getElementById(id);
  //var span = document.getElementsByClassName("close")[0];


  //const form = document.querySelector('.contact-form');
  // const theform = document.getElementById('theform')
  var formData = forms[id]
  for (var i = 0; i < formData.length; i++) {
    var maindiv = document.createElement("div");
    maindiv.setAttribute("class", "input-group");
    if (formData[i].kind != 'hidden') {
      var label = document.createElement("label");
      label.innerText = formData[i].title
      maindiv.appendChild(label)
    }

    var el = document.createElement(formData[i].type)
    el.type = formData[i].kind
    el.id = formData[i].name
    el.name = formData[i].name
    if (formData[i].type == 'file') {
      el.accept = "image/*"
    }
    el.value = formData[i].value

    maindiv.appendChild(el)

    node_7.append(maindiv)
  }

  var node_8 = document.createElement('BUTTON');
  node_8.setAttribute('type', 'submit');
  node_7.appendChild(node_8);

  var node_82 = document.createTextNode((new String("Submit")));
  node_8.appendChild(node_82);
  ///////

  ///////////
  node_4.addEventListener('submit', function () {
    node_1.style.display = "none";
    node_1.remove()
    handleFormSubmit(event)
  });
  // const cat = localStorage.getItem('TiledDefaults')
  //console.log(JSON.parse(cat))
  node_3.onclick = function () {
    node_1.style.display = "none";
    node_1.remove()
  }
  document.querySelector('body').appendChild(node_1)
}


function handleFormSubmit(event) {

  event.preventDefault();

  const data = new FormData(event.target);

  const formJSON = Object.fromEntries(data.entries());
  //console.log(Object.fromEntries(data.entries()))

  if (formJSON.secret == 'defaultValues') {

    localStorage.setItem('TiledDefaults', JSON.stringify(formJSON));
    console.log(Object.fromEntries(data.entries()))
  } else if (formJSON.secret == 'newMap') {
    console.log('Making new map...')
    if (formJSON.collision == null) {
      console.log('no collision')
      formJSON.collision = 0
    } else {
      console.log('yes collision')
      formJSON.collision = 1
    }
    console.log(formJSON.collision)
    //(width, height, gridWidth, gridHeight, nLayers, isometric, collision)
    //createCanvasMap(...arguments.map(x => parseInt(x) || 0))
    createCanvasMap(parseInt(formJSON.mwidth), parseInt(formJSON.mheight), parseInt(formJSON.dwidth), parseInt(formJSON.dheight), parseInt(formJSON.nlayers), 0, formJSON.collision)
  } else if (formJSON.secret == 'loadMap') {
    console.log('loading tiled...')
    // console.log(formJSON.file)
    load(formJSON.file)
  } else if (formJSON.secret == 'tiledExport') {
    console.log('eporting tiled...')
    exportTiled(formJSON.fileName)
  } else if (formJSON.secret == 'expand') {
    console.log('expanding map...')
    map.expand(parseInt(formJSON.top), parseInt(formJSON.bottom), parseInt(formJSON.left), parseInt(formJSON.right))
    map.show(c)
  } else if (formJSON.secret == 'exportPNG') {
    console.log('export png...')
    exportPNG(formJSON.file)
  } else if (formJSON.secret == 'shrink') {
    console.log('shrinking map...')
    map.shrink(parseInt(formJSON.top), parseInt(formJSON.bottom), parseInt(formJSON.left), parseInt(formJSON.right))
    map.show(c)
  } else if (formJSON.secret == 'loadTexture') {
    console.log('Load Texture')
    //(imgSrc, imgName, tileRealWidth, tileRealHeight, border, tileWidth, tileHeight, bottomOffset, isometric)
    //  console.log(formJSON.thefile)
    createTexturePalette(formJSON.thefile, formJSON.thefile.name, parseInt(formJSON.twidth), parseInt(formJSON.theight), parseInt(formJSON.border), parseInt(formJSON.dwidth), parseInt(formJSON.dheight), parseInt(formJSON.bottomOffset), false)

  } else if (formJSON.secret == 'customBrush') {
    console.log('Custom Brush...')
    createNewCustomBrush(parseInt(formJSON.twidth), parseInt(formJSON.theight), parseInt(formJSON.htile), parseInt(formJSON.vtile))
  } else if (formJSON.secret == 'randomBrush') {
    console.log('Random Brush...')
    createNewRandomBrush(parseInt(formJSON.twidth), parseInt(formJSON.theight), parseInt(formJSON.htile), parseInt(formJSON.vtile))
  } else if (formJSON.secret == 'objects') {
    console.log('objects...')
    let arr = formJSON.objectList.split(',');
    console.log(arr)
  }
  // for multi-selects, we need special handling
  //formJSON.snacks = data.getAll('snacks');
  // console.log(JSON.stringify(formJSON, null, 2))
  //const results = document.querySelector('.results pre');
  //results.innerText = JSON.stringify(formJSON, null, 2);
}
function createInput(data) {

}
const defaults = {
  twidth: 16,
  theight: 16,
  border: 1,
  dwidth: 32,
  dheight: 32,
  mwidth: 15,
  mheight: 15,
  nlayers: 2
}
const dv = JSON.parse(localStorage.getItem('TiledDefaults'));
if (dv === null || dv.length <= 0) {
  localStorage.setItem('TiledDefaults', JSON.stringify(defaults));
  dv = defaults;
}

let forms = {
  defaults: [
    { type: 'input', name: 'twidth', title: 'Tile Width', kind: 'numbrer', value: dv.twidth },
    { type: 'input', name: 'theight', title: 'Tile Height', kind: 'numbrer', value: dv.theight },
    { type: 'input', name: 'border', title: 'Tile Border', kind: 'number', value: dv.border },
    { type: 'input', name: 'dwidth', title: 'Tile Display Width', kind: 'number', value: dv.dwidth },
    { type: 'input', name: 'dheight', title: 'Tile Display Height', kind: 'number', value: dv.dheight },
    { type: 'input', name: 'mwidth', title: 'Width in Tiles', kind: 'number', value: dv.mwidth },
    { type: 'input', name: 'mheight', title: 'Height in Tiles', kind: 'number', value: dv.mheight },
    { type: 'input', name: 'nlayers', title: '# of Layers', kind: 'number', value: dv.nlayers },
    { type: 'input', name: 'secret', kind: 'hidden', value: 'defaultValues' }

  ],
  objects: [
    { type: 'input', name: 'objectList', title: 'Collision Objects', kind: 'text', value: '' },
    { type: 'input', name: 'secret', kind: 'hidden', value: 'objects' }
  ],

  newMap: [
    { type: 'input', name: 'mwidth', title: 'Width in Tiles', kind: 'number', value: dv.mwidth },
    { type: 'input', name: 'mheight', title: 'Height in Tiles', kind: 'number', value: dv.mheight },
    { type: 'input', name: 'dwidth', title: 'Tile Display Width', kind: 'number', value: dv.dwidth },
    { type: 'input', name: 'dheight', title: 'Tile Display Height', kind: 'number', value: dv.dheight },
    { type: 'input', name: 'nlayers', title: '# of Layers', kind: 'number', value: dv.nlayers },
    { type: 'input', name: 'collision', title: 'Collision', kind: 'checkbox', value: 'collision' },
    { type: 'input', name: 'secret', kind: 'hidden', value: 'newMap' },


  ],
  loadMap: [
    { type: 'input', name: 'file', title: 'Map File', kind: 'file', value: '' },
    { type: 'input', name: 'secret', kind: 'hidden', value: 'loadMap' }
  ],
  exportPNG: [
    { type: 'input', name: 'fileName', title: 'Image Name', kind: 'text', value: '' },
    { type: 'input', name: 'secret', kind: 'hidden', value: 'exportPNG' }
  ],
  tiledExport: [
    { type: 'input', name: 'fileName', title: 'File Name', kind: 'text', value: '' },
    { type: 'input', name: 'secret', kind: 'hidden', value: 'tiledExport' }
  ],
  expand: [
    { type: 'input', name: 'top', title: 'Add Top', kind: 'numbrer', value: '' },
    { type: 'input', name: 'bottom', title: 'Add Bottom', kind: 'numbrer', value: '' },
    { type: 'input', name: 'left', title: 'Add Left', kind: 'number', value: '' },
    { type: 'input', name: 'right', title: 'Add Right', kind: 'number', value: '' },
    { type: 'input', name: 'secret', kind: 'hidden', value: 'expand' }
  ],
  shrink: [
    { type: 'input', name: 'top', title: 'Shrink Top', kind: 'numbrer', value: '' },
    { type: 'input', name: 'bottom', title: 'Shrink Bottom', kind: 'numbrer', value: '' },
    { type: 'input', name: 'left', title: 'Shrink Left', kind: 'number', value: '' },
    { type: 'input', name: 'right', title: 'Shrink Right', kind: 'number', value: '' },
    { type: 'input', name: 'secret', kind: 'hidden', value: 'shrink' }
  ],
  loadTexture: [
    { type: 'input', name: 'thefile', title: 'Texture', kind: 'file', value: '' },
    { type: 'input', name: 'twidth', title: 'Tile Width', kind: 'numbrer', value: dv.twidth },
    { type: 'input', name: 'theight', title: 'Tile Height', kind: 'numbrer', value: dv.theight },
    { type: 'input', name: 'border', title: 'Tile Border', kind: 'number', value: dv.border },
    { type: 'input', name: 'dwidth', title: 'Tile Display Width', kind: 'number', value: dv.dwidth },
    { type: 'input', name: 'dheight', title: 'Tile Display Height', kind: 'number', value: dv.dheight },
    { type: 'input', name: 'bottomOffset', title: 'Bottom Offset', kind: 'number', value: 0 },
    { type: 'input', name: 'secret', kind: 'hidden', value: 'loadTexture' },
  ],
  customBrush: [
    { type: 'input', name: 'twidth', title: 'Tile Display Width', kind: 'numbrer', value: dv.dwidth },
    { type: 'input', name: 'theight', title: 'Tile Display Height', kind: 'numbrer', value: dv.dheight },
    { type: 'input', name: 'htile', title: 'Tiles Wide', kind: 'number', value: '' },
    { type: 'input', name: 'vtile', title: 'Tiles Hight', kind: 'number', value: '' },
    { type: 'input', name: 'secret', kind: 'hidden', value: 'customBrush' },
  ],
  randomBrush: [
    { type: 'input', name: 'twidth', title: 'Tile Display Width', kind: 'numbrer', value: dv.dwidth },
    { type: 'input', name: 'theight', title: 'Tile Display Height', kind: 'numbrer', value: dv.dheight },
    { type: 'input', name: 'htile', title: 'Tiles Wide', kind: 'number', value: '' },
    { type: 'input', name: 'vtile', title: 'Tiles Hight', kind: 'number', value: '' },
    { type: 'input', name: 'secret', kind: 'hidden', value: 'randomBrush' },
  ]
}
