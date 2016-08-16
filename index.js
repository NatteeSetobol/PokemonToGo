var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var s2 = require('s2geometry-node');
var PokemonGO = require('./node_modules/pokemon-go-node-api/poke.io.js');
var a = new PokemonGO.Pokeio();
var lastCalled=false;

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true } ));

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.post('/heartbeat/', function(request, response) 
{
	var sqSplit;
	var ladcord = parseFloat(request.body.lat);
	var logcord = parseFloat(request.body.lng);

	a.playerInfo.latitude=ladcord;
	a.playerInfo.longitude=logcord;

	a.Heartbeat(function(err,hb)
	{

		var pokemons={};
		var pokemonNear = [];

		pokemons.error = null;

		//getNeigh(ladcord,logcord);

		if (hb)
		{
			if (hb.cells  == "undefined")
			{
				pokemons.error = "Cell not found";

			} else {

				for (var i = 0; i <  hb.cells.length; i++)
				{
					if (hb.cells[i].WildPokemon)
					{
						for (var j = 0; j < hb.cells[i].WildPokemon.length; j++)
						{
							var pmon={};
							pmon.sid = hb.cells[i].WildPokemon[j].SpawnPointId;
							pmon.id = hb.cells[i].WildPokemon[j].pokemon.PokemonId;
							pmon.name = a.pokemonlist[parseInt(hb.cells[i].WildPokemon[j].pokemon.PokemonId)-1].name;
							pmon.picture = a.pokemonlist[parseInt(hb.cells[i].WildPokemon[j].pokemon.PokemonId)-1].img;
							pmon.longitude= hb.cells[i].WildPokemon[j].Longitude;
							pmon.latitude = hb.cells[i].WildPokemon[j].Latitude;
							pmon.cp = hb.cells[i].WildPokemon[j].pokemon.cp;
							pmon.remaining = hb.cells[i].WildPokemon[j].TimeTillHiddenMs;
							pokemonNear.push(pmon);
						}

					}

				}

			} 

		} else {
			pokemons.error = "hb not found";
		}


		if (pokemons.error != null)
		{
			a=null;
			a = new PokemonGO.Pokeio();
			LoginToPTC();
		}

		pokemons.lat = ladcord;
		pokemons.log = logcord;
		pokemons.near = pokemonNear;
		response.end("" + JSON.stringify(pokemons) );
	});
	
});

app.get('/', function(request, response) {
	response.render('pages/index');
});

app.listen(app.get('port'), function() {
	LoginToPTC();
	console.log("starting pokemon app");

	/*
	var pinger = setInterval(
	
		function()
		{
					a.Heartbeat(function(err,hb)
					{
							console.log('ping');

							if (hb)
							{
								console.log('pong');
							} else {
								LoginToPTC();
								console.log("reloging in");
							}
					});
			
		},20000);
		*/
	
	console.log('Node app is running on port', app.get('port'));
});

function LoginToPTC()
{
	var username = process.env.PGO_USERNAME || 'AshyAssKetchup';
	var password = process.env.PGO_PASSWORD || 'password';
	var provider = process.env.PGO_PROVIDER || 'ptc';

	var location1 = {
		type: 'name',
		name: process.env.PGO_LOCATION || 'Times Square'
	};

	a.init(username,password,location1,provider, function(err)
	{
		a.GetProfile(function(err, profile) 
		{
		}
		);
	});
}


function getNeigh(lat,lng)
{
	var origin = new s2.S2CellId(new s2.S2LatLng(lat, lng)).parent(15);
  var walk = [origin.id()];
  // 10 before and 10 after
  var next = origin.next();
  var prev = origin.prev();

  for (var i = 0; i < 10; i++) 
  {
			// in range(10):
      walk.push(prev.id());
      walk.push(next.id());
      next = next.next();
      prev = prev.prev();
   }

   return walk;
}
