// https://www.mapbox.com/mapbox-gl-js/example/animate-camera-around-point

let mapBrazil;
let mapEurope;
let content;

let mapBrazilLoaded = false;
let mapEuropeLoaded = false;

let index = 0;

const captions = [
	{ 'brazil': 'Brazil', 'europe': 'The Netherlands' },
	{ 'brazil': 'Northern Corridor', 'europe': 'The Netherlands' },
	{ 'brazil': 'Multimodal concept', 'europe': 'Involved parties' },
	{ 'brazil': 'Northern Corridor', 'europe': 'Binnenhof, The Hague' },
	{ 'brazil': 'The Grain Railway Ferrogrão', 'europe': '' },
	{ 'brazil': 'Dutch Brazil 1630 – 1654', 'europe': 'The West India House, Amsterdam' }
];

window.onload = function() {
	document.querySelector('#next').addEventListener('click', clickNext);

	mapboxgl.accessToken = "pk.eyJ1IjoiYW5lY2RvdGUxMDEiLCJhIjoiY2oxMGhjbmpsMDAyZzJ3a2V0ZTBsNThoMiJ9.1Ce55CnAaojzkqgfX70fAw";

	mapBrazil = new mapboxgl.Map({
		container: "map-brazil",
		style: "mapbox://styles/mapbox/satellite-v9",
		center: [-52.51337751271399, -12.00251749886641],
		pitch: 45,
		zoom: 2,
	});


	mapEurope = new mapboxgl.Map({
		container: "map-europe",
		style: "mapbox://styles/mapbox/satellite-v9",
		center: [5.477269679600909, 52.43636159677473],
		pitch: 45,
		zoom: 2,
	});



	mapBrazil.on('load', () => {
		checkLoaded('brazil');
	});

	mapEurope.on('load', () => {
		checkLoaded('europe');
	});

}



function rotateCamera(timestamp) {
    // clamp the rotation between 0 -360 degrees
    // Divide timestamp by 100 to slow rotation to ~10 degrees / sec
    mapBrazil.rotateTo((timestamp / 100) % 360, {duration: 0});
    mapEurope.rotateTo((timestamp / 100) % 360, {duration: 0});
    // Request the next frame of the animation.
    requestAnimationFrame(rotateCamera);
}



function clickNext( e ) {

	e.preventDefault();

	if (content) {

		index++;
		if (index > content.length -1) {
			document.location.replace( '/' );
		} else {
			showScene(index);
		}
	}
	
}

function checkLoaded(place) {
	if (place === 'brazil') {
		mapBrazilLoaded = true;
	}
	if (place === 'europe') {
		mapEuropeLoaded = true;
	}

	if (mapBrazilLoaded && mapEuropeLoaded) {
		getData();

		rotateCamera(0);
	}
}

function getData() {
	fetch('/data.json', {
		method: 'get'
	}).then((response) => {

		return response.json();
	}).then((data) => {
		content = data;

		setTimeout(() => {
			showScene(0);
		}, 1000);

	});

}

function showScene(idx) {
	updateBrazilMap(idx);
	updateEuropeMap(idx);
	updateVideo(idx);
	updateContent(idx);
	updateAudio(idx);
}

function updateAudio(idx) {
	document.querySelectorAll('audio').forEach((audio) => {
		audio.pause();
	});

	const audio = document.querySelector('#audio-page-'+(idx+1));
	if (audio !== undefined) {
		audio.play();
	}

}

function updateBrazilMap(idx) {
	const features = content[idx].featuresBrazil;
	const overlay = content[idx].overlaysBrazil;
	const line = content[idx].lineBrazil;
	const center = content[idx].centerBrazil;
	const zoom = content[idx].zoomBrazil;
	updateMap(idx, mapBrazil, features, overlay, line, center, zoom);
	const caption = captions[idx].brazil;
	const captionElement = document.querySelector( '#map-brazil .caption' );
	updateCaptions(captionElement, caption);
}

function updateEuropeMap(idx) {
	const features = content[idx].featuresEurope;
	const overlay = content[idx].overlaysEurope;
	const line = content[idx].lineEurope;
	const center = content[idx].centerEurope;
	const zoom = content[idx].zoomEurope;
	updateMap(idx, mapEurope, features, overlay, line, center, zoom);

	const caption = captions[idx].europe;
	const captionElement = document.querySelector( '#map-europe .caption' );
	updateCaptions(captionElement, caption);
}

function updateCaptions(element, captions) {
	const captionEurope = 
	element.innerHTML = captions;

}

function updateMap(idx, map, features, overlay, line, center, zoom) {

	document.body.className = 'scene' + idx;

	if (map.getLayer('scene-overlay')) {
		map.removeLayer('scene-overlay');		
	}

	if (map.getSource('scene-overlay')){
		map.removeSource('scene-overlay');
	}

	if (map.getLayer('scene-points')) {
		map.removeLayer('scene-points');		
	}

	if (map.getSource('scene-points')){
		map.removeSource('scene-points');
	}


	// if (map.getLayer('line-brazil')) {
	// 	map.removeLayer('line-brazil');		
	// }


	const featuresGeoJson = {
		"type": "FeatureCollection",
		"features": []
	};

	if (features && features.length > 0) {
		features.forEach(function(feature){
			if(feature.type === 'point'){
				featuresGeoJson.features.push(buildGeoJSON(feature));
			}
		});

		if(map.getSource('scene-points') === undefined){
			map.addSource('scene-points', {
				"type": "geojson",
				data: featuresGeoJson
			});
		} else {
			map.getSource('scene-points').setData(featuresGeoJson);
		}
		if(map.getLayer('scene-points') === undefined){
			map.addLayer({
				"id": "scene-points",
				"type": "circle",
				"source": 'scene-points',
				"paint": {				
					'circle-radius': 10,				
					'circle-color': 'rgba(0, 255, 0, .5)',		 
					// 'fill-opacity': 0.2
				}
			});
		}
	}

	if (overlay && overlay.length > 0) {
		map.addLayer({
			'id': 'scene-overlay',
			'type': 'fill',
			'source': {
				'type': 'geojson',
				'data': {
					'type': 'Feature',
					'geometry': {
						'type': 'Polygon',
						'coordinates': overlay
					}
				}
			},
			'layout': {},
			'paint': {
				'fill-color': '#40ff00',
				'fill-opacity': 0.2
			}
		});
	}

	if (center) {
		map.fitBounds([center, center], {duration: 0});
	}
	

	if (zoom !== undefined) {
		map.setZoom(zoom);	
	}
	
}

function buildGeoJSON(feature){
	let point = {
		"type": "Feature",
		"geometry": {
			"type": "Point",
			"coordinates": [feature.location.longitude, feature.location.latitude]
		},
		properties: ''
	};
	return point;
}

function updateVideo(idx) {
	var columnSet = document.querySelector( '.columns' );
	var leftColumn = document.querySelector( '.columns > div:first-child' );
	if ( idx == 4 ) {
		columnSet.classList.add( 'video' );

		const videoDiv = document.createElement('div');
		videoDiv.innerHTML = '<video src="content/videos/06/video_ferrograo_06_web.mp4" autoplay loop>';
		videoDiv.setAttribute( 'id', 'video-container' );

		leftColumn.appendChild( videoDiv );
	} else {
		columnSet.classList.remove( 'video' );

		const videoDiv = document.querySelector( '#video-container' );
		if ( videoDiv != undefined ) {
			const videoFrame = videoDiv.querySelector( 'video' );
			if ( videoFrame != undefined ) videoDiv.removeChild( videoFrame );

			videoDiv.parentNode.removeChild( videoDiv );
		}
	}

}

function updateContent(idx){

	const scene = content[idx];

	document.querySelector('#content').innerHTML = '';
	const contentContainer = document.createElement('div');

	const images = [];
	const videos = [];
	scene.content.forEach(function(item){
		if(item.type === 'image'){
			images.push(item);
		} else if (item.type === 'video'){
			videos.push(item);
		}
	});

	contentContainer.innerHTML = `
		<h1>${scene.title}</h1>
		<div>
			${images.map((item) => `
				<img src="content/images/${item.src}" />
			`).join('')}
		</div>
		<div>
			${videos.map((item, i) => `
				<video src="content/videos/${item.src}" autoplay loop>
			`).join('')}
		</div>
	`;

	document.querySelector('#content').appendChild(contentContainer);

	const captionContainer = document.createElement('div');
	captionContainer.className = 'caption';
	captionContainer.setAttribute( 'id', 'content-caption' );
	captionContainer.innerHTML = `${scene.description}`;
	document.querySelector('#content').appendChild(captionContainer);

	addExtraPadding( );
	
}


function addExtraPadding( ) {
	var contentDiv = document.getElementById( 'content' ).firstChild;
	var captionDiv = document.getElementById( 'content-caption' );
	contentDiv.style.paddingBottom = captionDiv.offsetHeight + 'px';
}

