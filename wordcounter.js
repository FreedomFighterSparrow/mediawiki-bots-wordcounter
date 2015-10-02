/**
 * Created by dror on 01/10/15.
 */
'use strict';


/*
 * Possible libraries for word count:
 * MW's search API - doesn't always work
 * sugarjs "words" - splits string to array, then can use array.length
 * Wordcount.js
 *
 * All of the above do a very simple word count.
 */

var bot = require( 'nodemw' ),
	client = new bot( 'config.json'),
	csv = require('csv-string');


	/*
	getLanguageLinks( 'טיפולי פוריות', function( err, data ) {
		console.log( data );
	})
	*/


client.getAllPages( function( err, pages ) {
	console.log( 'All pages: %d', pages.length );

	//pages = pages.slice(1,100);
	pages.forEach( function( page ) {
		//@todo get main category. Right now I can't do this through the API, as the
		// db doesn't hold the categories in order,
		// and I can't manage to push the main category into pp_propname either
		//@todo output all to CSV
		//console.log( page.title );
		var output = [ page.title ];
		getWordCount(page.title, function(err, metadata) {
			output.push( metadata );

			getLanguageLinks(page.title, function(err, links) {
				links = JSON.stringify( links );
				//console.log( links );
				output.push( links == '[]' ? 'No langlinks' : links );

				getArticleType(page.title, function(err, type) {
					output.push( type );
					//console.log( output );
					console.log( csv.stringify( output ) );

					/*
					getArticleMainCategory(page.title, function(err, cat) {
						output += ', ' + cat;
						console.log( output );
					});
					*/
				});

			});
		});



	});

});



function getWordCount(keyword, callback) {
	var params = {
		action: 'query',
		list: 'search',
		srsearch: keyword,
		srprop: 'wordcount'
	};

	client.api.call(params, function(err, data) {
		var wordcount = 'error';
		if( !err && data && data.search ) {
			var firstItem = getFirstItem(data.search);
			if( firstItem ) {
				wordcount = firstItem.wordcount;
			}
		}
		callback(err, wordcount );
	});
}

function getLanguageLinks(title, callback) {
	client.api.call({
		action: 'query',
		prop: 'langlinks',
		titles: title
	}, function(err, data) {
		callback(err, (data && getFirstItem(data.pages).langlinks) || []);
	});
}

function getArticleType(title, callback) {
	var articletype = null;

	client.api.call({
		action: 'query',
		prop: 'pageprops',
		ppprop: 'ArticleType',
		titles: title
	}, function(err, data) {
		if( !err && data && data.pages ) {
			var firstItem = getFirstItem(data.pages);
			if( firstItem && firstItem.pageprops ) {
				articletype = firstItem.pageprops.ArticleType;
			}
		}
		callback( err, articletype );
	});
}

function getArticleMainCategory(title, callback) {
	var category = null;

	client.api.call({
		action: 'query',
		prop: 'pageprops',
		ppprop: 'ArticleMainCategory',
		titles: title
	}, function(err, data) {
		if( !err && data && data.pages ) {
			var firstItem = getFirstItem(data.pages);
			if( firstItem ) {
				category = firstItem.ArticleMainCategory;
			}
		}

		callback( err, category );
	});
}

// get the object being the first key/value entry of a given object
var getFirstItem = function(obj) {
	var key = Object.keys(obj).shift();
	return obj[key];
};

function writeCsvLine(data) {
	//process.stdout.write(csv.stringify(data));
	console.log( csv.stringify( data ) );
}
