
var labelConfig = {
  noHide: true,
  className: "my-label",
  direction: 'right',
  offset: [5, 5],
  zoomAnimation: true
};

var labelConfig2 = {
  noHide: true,
  className: "my-label2",
  direction: 'right',
  offset: [-15, -10],
  zoomAnimation: true
};

var rectStyle = {
  color: "#ff0000",
  weight: 1,
  opacity: 0.3,
  fillOpacity: 0,
  lineCap: 'butt'
};

var layerGroup = L.layerGroup();
map.addLayer( layerGroup );

var quadAdapter = {
  range: ['0','1','2','3'],
  encode: function( centroid, precision ){
    return quadtree.encode( centroid, precision );
  },
  bbox: function( str ){
    return quadtree.bbox( '' + str );
  },
  layers: function( currentHash, zoom ){
    var layers = {};
    if( zoom > 3 ) layers[ currentHash.substr( 0, zoom -3 ) ] = false;
    if( zoom > 2 ) layers[ currentHash.substr( 0, zoom -2 ) ] = false;
    if( zoom > 1 ) layers[ currentHash.substr( 0, zoom -1 ) ] = false;
    layers[ currentHash.substr( 0, zoom ) ] = true;
    return layers;
  }
};

var hashAdapter = {
  range: Object.keys( BASE32_CODES_DICT ),
  encode: function( centroid, precision ){
    return geohash.encode( centroid.lat, centroid.lng, precision );
  },
  bbox: function( str ){
    var box = geohash.decode_bbox( '' + str );
    return { minlat: box[0], minlng: box[1], maxlat: box[2], maxlng: box[3] };
  },
  layers: function( currentHash, zoom ){
    var layers = {};
    layers[ currentHash.substr( 0, Math.floor( zoom / 3 ) ) ] = true;
    return layers;
  }
};

var currentHash;
var adapter = quadAdapter;
// var adapter = hashAdapter;

var generateCurrentHash = function(){
  return adapter.encode( map.getCenter(), 30 );
};

var changeHashFunction = function( hashText ){
  if( hashText == 'geohash' ) adapter = hashAdapter;
  else adapter = quadAdapter;
  currentHash = generateCurrentHash();
  updateLayer();
};

function updateLayer(){
  // update current hash
  currentHash = generateCurrentHash();
  
  var zoom = map.getZoom();
  layerGroup.clearLayers();

  var layers = adapter.layers( currentHash, zoom );
  for( var attr in layers ){
    drawLayer( attr, layers[attr] );
  }
}

function drawRect( bounds, labelText, showDigit ){
  
  // http://leafletjs.com/reference.html#path-options
  var poly = L.rectangle( bounds, rectStyle );
  poly.addTo( layerGroup );

  // full (long) hash marker
  if( labelText.length > 1 ){
    var marker = new L.marker( poly.getBounds().getNorthWest(), { opacity: 0.0001 });
    marker.bindLabel( labelText, labelConfig );
    marker.addTo( layerGroup );
  }

  // large single digit marker
  if( showDigit ){
    var marker2 = new L.marker( poly.getBounds().getCenter(), { opacity: 0.0001 });
    marker2.bindLabel( labelText.substr( -1 , 1 ), labelConfig2 );
    marker2.addTo( layerGroup );
  }
}

function drawLayer( prefix, showDigit ){
  adapter.range.forEach( function( n ){

    var hash = '' + prefix + n;
    var bbox = adapter.bbox( hash );

    var bounds = L.latLngBounds(
      L.latLng( bbox.maxlat, bbox.minlng ),
      L.latLng( bbox.minlat, bbox.maxlng )
    );

    // console.log( hash );
    // console.log( bbox );
    // console.log( bounds );

    drawRect( bounds, hash, showDigit );
  });
}

// update on changes
map.on('zoomend', updateLayer);
map.on('moveend', updateLayer);

// init
changeHashFunction( 'quadtree' );
// updateLayer();