let brush = null,
  canvas,
  c,
  brushDiv = null,
  htile = null,
  vtile = null,
  tileImage,
  tileImagePath,
  map = null,
  customTiles = {},
  customTileId = 0,
  randomTiles = {},
  randomTileId = 0,
  lastpos,
  loadedTextures = {},
  texture,
  textureData = []
//objectNames = ['none', 'Player', 'Coin', 'Key', 'Shell', 'Hplatform', 'Beam', 'Long Beam', 'Ice Beam', 'High Jump', 'Power Suit', 'Morph', 'Bombs', 'Missle Supply 01', 'Missle Supply 02', 'Missle Supply 03', 'Missle Supply 04', 'Missle Supply 05', 'Missle Supply 06', 'Missle Supply 07', 'Missle Supply 08', 'Missle Supply 09', 'Missle Supply 10', 'Energy Tank 01', 'Energy Tank 02', 'Energy Tank 03', 'Energy Tank 04', 'Energy Tank 05', 'Energy Tank 06', 'Energy Tank 07', 'Energy Tank 08', 'Energy Tank 09', 'Energy Tank 10', 'Enemy1', 'Enemy2', 'Enemy3', 'Enemy4', 'Enemy5', 'Enemy6', 'Enemy7', 'Enemy8', 'Enemy9']
objectNames = ['none', 'Player', 'Key', 'Energy Tank', 'Enemy1', 'Enemy2', 'Enemy3', 'Enemy4', 'Enemy5', 'Enemy6', 'Enemy7', 'Enemy8', 'Enemy9']

const exportPNG = name => {
  canvas.toBlob(blob => {
    const link = document.createElement('a')
    const url = window.URL || window.webkitURL
    link.href = url.createObjectURL(blob)
    link.download = `${name}.png`
    link.click()
    $('#statusbar').innerHTML = `Saved ${name}.png`
  })
}
//width = # tiles accros, gridwidth = display size
const createCanvasMap = (width, height, gridWidth, gridHeight, nLayers, isometric, collision) => {
  map = new Map(width, height, gridWidth, gridHeight, nLayers, isometric, collision)
  const canvasToolbar = $c('div')
  canvasToolbar.id = "canvas-toolbar"
  const subLayer = $c('button')
  subLayer.innerText = "-"
  subLayer.onclick = () => {
    map.removeLayer()
    $('#layerSelector').innerHTML = createLayerSelector(null, collision).innerHTML
    $('#layerSelector').value = map.activeLayer
    $('#statusbar').innerHTML = "Removed layer"
    map.show(c)
  }
  const addLayer = $c('button')
  addLayer.innerText = "+"
  addLayer.onclick = () => {
    map.addLayer()
    $('#layerSelector').innerHTML = createLayerSelector(null, collision).innerHTML
    $('#layerSelector').value = map.activeLayer
    $('#statusbar').innerHTML = "Added new layer"
  }
  const nameLayer = $c('button')
  nameLayer.innerText = "N"
  nameLayer.onclick = () => {
    let newName = prompt('Rename Layer', map.layerNames[map.activeLayer])
    map.layerNames[map.activeLayer] = newName
    $('#layerSelector').value = map.activeLayer
    const options = Array.from($('#layerSelector').options);

    const optionToSelect = options.find(item => item.value === map.activeLayer);
    console.log(optionToSelect)
    optionToSelect.text = newName
    /*  map.addLayer()
    $('#layerSelector')
     $('#layerSelector').innerHTML = createLayerSelector(null, collision).innerHTML
     $('#layerSelector').value = map.activeLayer */
    $('#statusbar').innerHTML = "RenameLayer " + newName
  }
  layerSelector = createLayerSelector(nLayers, collision)
  canvasToolbar.appendChild(subLayer)
  canvasToolbar.appendChild(layerSelector)
  canvasToolbar.appendChild(addLayer)
  canvasToolbar.appendChild(nameLayer)

  const showGrid = createCheckbox('Show grid: ', function () { map.grid = this.checked, map.show(c) }, true)
  canvasToolbar.appendChild(showGrid)

  if (collision) {
    const showCollision = createCheckbox('Show collision: ', function () { map.showCollision = this.checked, map.show(c) }, false)
    canvasToolbar.appendChild(showCollision)
  }

  const clearLayer = $c('button')
  clearLayer.innerText = "Clear layer"
  clearLayer.onclick = () => {
    const layerName = map.activeLayer >= 0 ? map.activeLayer : 'collision'
    if (!confirm(`Are you sure you want to clear layer ${layerName}`))
      return
    let _map = map.collision
    if (map.activeLayer >= 0)
      _map = map.layers[map.activeLayer]
    for (let i = 0; i < _map.length; i++)
      for (let j = 0; j < _map[0].length; j++)
        _map[i][j] = 0
    map.show(c)
    $('#statusbar').innerHTML = `Cleared layer ${layerName}`
  }
  canvasToolbar.appendChild(clearLayer)

  canvas = $c('canvas')
  canvas.width = map.width
  canvas.height = map.height
  c = canvas.getContext('2d')
  c.imageSmoothingEnabled = false
  canvas.addEventListener('mousedown', e => {
    if (!brush || e.button != 0)
      return
    lastpos = [null, null]
    lButtonDown = true
    const pos = getPos(e)
    map.addTile(brush, map.activeLayer, pos.y, pos.x)
    lastpos[0] = pos.y
    lastpos[1] = pos.x
    map.show(c)
  })
  canvas.addEventListener('mouseup', e => {
    if (e.button !== 0)
      return
    lButtonDown = false
    lastpos = [null, null]
  })
  canvas.addEventListener('mouseout', e => {
    lButtonDown = false
    lastpos = [null, null]
  })
  canvas.addEventListener('mousemove', e => {
    if (!lButtonDown)
      return
    const pos = getPos(e)
    if ((pos.y == lastpos[0] && pos.x == lastpos[1])
      || pos.y < 0 || pos.x < 0 || pos.y >= map.intH || pos.x >= map.intW)
      return
    map.addTile(brush, map.activeLayer, pos.y, pos.x)
    lastpos[0] = pos.y
    lastpos[1] = pos.x
    map.show(c)
  })
  map.show(c)
  $('#canvasarea').innerHTML = ''
  $('#canvasarea').appendChild(canvasToolbar)
  $('#canvasarea').appendChild(canvas)
  $('#statusbar').innerHTML = `New map created`
}

const changeColor = value => {
  map.backgroundColor = value
  document.body.style.backgroundColor = value;
}
const selectTool = tool => {
  switch (tool) {
    case 'eraser':
      if (!brush)
        brush = {
          'type': 'default'
        }
      if (brush.type == 'custom')
        brush.type = 'default'
      brush.data = 0
      if (brushDiv) {
        brushDiv.classList.remove('selected')
        brushDiv = null
      }
      $('#statusbar').innerHTML = "Eraser selected"
      break
    case 'bucket':
      if (!brush)
        return
      if (brush.type == 'custom')
        brush.type = 'default'
      brush.type = 'bucket'
      if (brushDiv) {
        brushDiv.classList.remove('selected')
        brushDiv = null
      }
      $('#statusbar').innerHTML = "Paint Bucket selected"
      break
    case 'drop':
      brush.type = 'drop'
      if (brushDiv) {
        brushDiv.classList.remove('selected')
        brushDiv = null
      }
      $('#statusbar').innerHTML = "Eye Dropper selected"
      break
    case 'pencil':
      if (!brush)
        return
      brush.type = 'default'
      $('#statusbar').innerHTML = "Pencil selected"
      break;
  }
}

const save = (name) => {
  const URL = window.URL || window.webkitURL
  map['textures'] = Object.keys(loadedTextures)
  //console.log(textureData)
  // makeTiled()
  let blob = new Blob([JSON.stringify(map)], { type: 'text/json' })
  let link = $c('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${name}.json`
  link.click()
}
const exportTiled = (name) => {
  const URL = window.URL || window.webkitURL
  map['textures'] = Object.keys(loadedTextures)
  //console.log(textureData)
  var tiled = makeTiled()
  let blob = new Blob([JSON.stringify(tiled)], { type: 'text/json' })
  let link = $c('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${name}.json`
  link.click()
}
const makeTiled = () => {
  console.log('making tiled json')
  var mapLayers = JSON.parse(JSON.stringify(map.layers))
  var tilesets = makeTextureArray()
  var layers = makeLayersArray(mapLayers, tilesets[0].columns)
  if (map.collision != null) {
    var objects = makeObjectArray(map.collision)
    //console.log(objects)
    layers.unshift(objects)
  }
  tiledObj = {}
  tiledObj.backgroundcolor = map.backgroundColor
  tiledObj.layers = layers
  tiledObj.tilesets = tilesets
  tiledObj.height = map.intH
  tiledObj.nextobjectid = 1
  tiledObj.displayWidth = map.gridWidth
  tiledObj.displayHeight = map.gridHeight
  tiledObj.orientation = "orthogonal"
  tiledObj.renderorder = "right-down"
  tiledObj.tileheight = tilesets[0].tileheight
  tiledObj.tilewidth = tilesets[0].tilewidth
  tiledObj.version = 1
  tiledObj.tiledversion = "0"
  tiledObj.width = map.intW
  // tiledObj.collisionInfo = map.collision
  // tiledObj.editor = map
  //console.log(layers)
  return tiledObj
}
const makeTextureArray = () => {
  var tempArray = []
  for (var i = 0; i < textureData.length; i++) {
    var td = textureData[i]
    var tempObj = {}

    tempObj.columns = Math.round(td.image.width / (td.tileRealWidth + td.border))
    tempObj.firstgid = 0
    tempObj.image = td.name
    tempObj.imageheight = td.image.height
    tempObj.imagewidth = td.image.width
    tempObj.margin = td.border
    tempObj.name = td.baseName
    tempObj.spacing = td.border
    tempObj.tilecount = (Math.round(td.image.width / (td.tileRealWidth + td.border))) * (Math.round(td.image.height / (td.tileRealHeight + td.border)))
    tempObj.tileheight = td.tileRealHeight
    tempObj.tilewidth = td.tileRealWidth
    tempArray.push(tempObj)
  }

  return tempArray


  /* {
    columns: 16,
    firstgid: 0,
    image: 'test.png',
    imageheight: 64,
    imagewidth: 145,
    margin: 1,
    name: 'test',
    spacing: 1,
    tilecount: 112,
    tileheight: 8,
    tilewidth: 8
  } */


}
const makeLayersArray = (layers, cols) => {

  var layer1 = makeIndexes(layers, cols)
  layersTemp = []
  for (var l = 0; l < layer1.length; l++) {
    var layerObj = {}


    layerObj.height = map.intH

    var lay = [].concat(...layer1[l])
    layerObj.data = lay

    layerObj.name = "layer" + l,
      layerObj.opacity = 1
    layerObj.type = "tilelayer"
    layerObj.visible = true
    layerObj.width = map.intW
    layerObj.x = 0
    layerObj.y = 0

    layersTemp.push(layerObj)
  }


  return layersTemp

}
const makeObjectArray = (objects) => {

  var obArray = []
  var count = 0
  for (var i = 0; i < map.collisionData.length; i++) {
    obArray.push(makeObject(map.collisionData[i], count))
    count++
  }

  tempObj = {}
  tempObj.draworder = "topdown",
    tempObj.height = 0,
    tempObj.name = "things",
    tempObj.objects = obArray,
    tempObj.opacity = 1,
    tempObj.properties = [],
    tempObj.type = "objectgroup",
    tempObj.visible = true,
    tempObj.width = 0,
    tempObj.x = 0,
    tempObj.y = 0

  return tempObj
}
const makeObject = (data, count) => {
  if (data.type > 0) {
    console.log(data)
    var tempObj = {}
    tempObj.id = count
    tempObj.name = objectNames[data.type]
    tempObj.index = data.type
    tempObj.rotation = 0
    tempObj.visible = true
    tempObj.height = 8
    tempObj.width = 8
    tempObj.x = data.posx
    tempObj.y = data.posy
    return tempObj
  }


  /*   {
      "class":"npc",
      "gid":5,
      "height":0,
      "id":1,
      "name":"villager",
      "properties":[
        {
          "name":"hp",
          "type":"int",
          "value":12
        }],
      "rotation":0,
      "visible":true,
      "width":0,
      "x":32,
      "y":32
    } */
}
const makeIndexes = (layers, cols) => {
  for (let l = 0; l < layers.length; l++) {
    for (let i = 0; i < layers[l].length; i++) {
      for (let j = 0; j < layers[l][i].length; j++) {
        const x = layers[l][i][j][1]
        const y = layers[l][i][j][0]
        var ind = ((cols) * y) + x
        if (Number.isNaN(ind)) {
          layers[l][i][j] = 0
        } else {
          layers[l][i][j] = ind
        }

      }
    }
  }
  return layers
}
const makeCoordinates = (array, columns) => {
  for (var r = 0; r < array.length; r++) {
    for (var c = 0; c < array[0].length; c++) {
      var value = array[r][c]
      var coo = indexToCoordinate(value, columns)
      array[r][c] = coo
    }
  }
}
const indexToCoordinate = (value, columns) => {
  if (value == 0) {
    return 0
  } else {
    mapColumn = value % columns
    mapRow = Math.floor(value / columns)
    return [mapRow, mapColumn]
  }


}
const load = async file => {
  const url = window.URL || window.webkitURL
  filePath = url.createObjectURL(file)
  const request = await fetch(filePath)
  const response = await request.json()
  data = response
  //////////

  /* console.log(data.layers[1])
  var newArray = listToMatrix(data.layers[1].data, data.layers[1].width)
  console.log(newArray)
  makeCoordinates(newArray) */

  ///////////////
  let valid = true
  for (const texture of data.tilesets)
    if (!(texture.image in loadedTextures))
      valid = false
  if (!valid) {
    $('#statusbar').innerHTML = `Missing textures: ${data.textures.join(', ')}`
    return
  }
  /*todo refactor createCanvasMap */
  // createCanvasMap(data.width, data.height, data.gridWidth, data.gridHeight, data.nLayers, data.isometric, data.collision)
  //width = # tiles accros, gridwidth = display size
  var collision = makeCollisionLayer(data.layers[0].objects, data.width, data.height)
  createCanvasMap(data.width, data.height, data.displayWidth, data.displayHeight, data.layers.length - 1, 0, collision)
  map.collision = collision
  console.log(map.collision)
  map.load(data)
  map.show(c)
  // $('#layerSelector').innerHTML = createLayerSelector(map.nLayers, map.collision).innerHTML
  $('#statusbar').innerHTML = `Map ${file.name} loaded with success!`
}

createToolbar()

// code here only for example
window.onload = () => {
  const init = () => {
    const url = new URL(document.location)
    example = url.searchParams.get('example')
    if (example === '01') {
      createCanvasMap(20, 20, 64, 32, 1, 1)
      createTexturePalette(
        'myCityTiles/myCityTiles-64x32.png',
        'myCityTiles-64x32.png', 64, 96, 0, 64, 32, 0, 1
      )
      $('#canvasarea').style.width = '60%'
    }
  }
  init()
}

function makeCollisionLayer(objInfo, width, height) {
  console.log(objInfo)
  var tempcol = Array(height).fill().map(_ => Array(width).fill(0))

  for (var i = 0; i < objInfo.length; i++) {
    tempcol[objInfo[i].y][objInfo[i].x] = objInfo[i].index
  }
  return tempcol
  //
}


function docWrite(variable) {
  document.write(variable);
}
function listToMatrix(list, elementsPerSubArray) {
  var matrix = [], i, k;

  for (i = 0, k = -1; i < list.length; i++) {
    if (i % elementsPerSubArray === 0) {
      k++;
      matrix[k] = [];
    }

    matrix[k].push(list[i]);
  }

  return matrix;
}