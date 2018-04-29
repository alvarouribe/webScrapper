let today = new Date();
console.log('Running...');

const curl = require("curl");
const jsdom = require("jsdom");
var website = "https://www.jbhifi.co.nz";
var amountOfPages = 5;

//connection to the db
var MongoClient = require('mongodb').MongoClient;
var mongoUrl = "mongodb://localhost:27017/";

for(var page = 1; page <= amountOfPages; page++) {
  scrap(website + "/cameras/all-cameras/?p="+ page +"&s=displayPrice&sd=2");
}

async function scrap(url) {
  await curl.get(url, null, (err,resp,body)=> {
    if(resp.statusCode == 200) {
      var result = parseData(body);
      // console.log(result);
      insertData(result);
      let finishingDate = new Date();
      console.log(`it took: ${(finishingDate - today) / 1000} to finish`);
    } else {
      //some error handling
      console.log("error while fetching url");
    }
  });
}

async function insertData(myobj) {

  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/";

  await MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("webScrapper");

    dbo.collection("jb").insertMany(myobj, function(err, res) {
      if (err) throw err;
      console.log("Number of documents inserted: " + res.insertedCount);
      db.close();
    });
  });
}

function cleanPrice(htmlToClean) {
  htmlToClean = htmlToClean.replace(/(\r\n\t|\n|\r\t)/gm,"");
  htmlToClean = htmlToClean.replace('<span class="currency">$</span>', "");
  htmlToClean = htmlToClean.replace('<sup></sup>', "");
  return htmlToClean.trim();
}

function parseData(html) {
	const {JSDOM} = jsdom;
	const dom = new JSDOM(html);
  const $ = (require('jquery'))(dom.window);

  //let's start extracting the data
  var items = $(".product-tile");
  var results = [];

  for(var i = 0; i < items.length; i++) {
    var content = $(items[i]).children('.content');
    var aContent = $($(content).find('a')[0]);
    var productTitle = $($(aContent).find('h4')[0]).html();
    var productPrice = $($(aContent).find('.footer .price .regular')[0]).html();
    var onSale = false;
    if (productPrice && productTitle) {
      //if price is on sale then we need to search for .onSale class
      if (productPrice.trim() === "&nbsp;") {
        productPrice = $($(aContent).find('.footer .price .onSale')[0]).html();
        onSale = true;
      }
      productPrice = cleanPrice(productPrice);
      results.push({
        "title": productTitle,
        "price": productPrice,
        "onSale": onSale,
        "date": today
      });
    }
  }
  return results;
}