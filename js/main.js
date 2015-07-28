var App = function() {

	this.topics = {};
	this.currentTopic = null;
	this.uuid = null;
	this.initUI();

	//refactor this into a fn()
	var urlParamUUID = this.getURLParameter("uuid");
	if(urlParamUUID) {
		console.log("urlParamUUID: " + urlParamUUID);	
		this.getUserDetails(urlParamUUID);
	} else {
		this.greet();
	}

}

App.prototype = {
	constructor:App,
	initUI: function(){ 
		console.log("initUI");

		var instance = this;

		$("#docs-by-topic").on("click",'a',function(e) {
			var i = $(this).index();
			console.log("doc clicked: " + i);

			if(instance.currentTopic && instance.topics) {
				var documents = instance.topics[instance.currentTopic];	
				var doc = documents[i];
				console.log(doc);
				var lightBoxHTML = '<h2>'+doc.title+'</h2><div class="margin-top">'+doc.docBody+'</div>';
				$("#mylightbox").html(lightBoxHTML);

				// Register user impression
				// Calls to get recommendations (content and item based)
			}
			

		});

		$(".topic").on("click", function(e) {
			e.preventDefault();
			var topic = $(this).attr('topic');
			if(topic) {
				console.log(topic + "clicked");	
				instance.currentTopic = topic;
				instance.getDocumentsByTopic(topic);
			}
		});

	},
	getUserDetails: function(uuid) {
		var instance = this;
		var settings = {
		  "async": true,
		  "crossDomain": true,
		  "url": "http://rmend-be.appspot.com//v1/user/uuid/" + uuid,
		  "method": "GET",
		  "headers": {}
		}

		$.ajax(settings).done(function (response) {
		  console.log(response);
		  if(response.uuid && response.userName) {
		  	instance.uuid = response.uuid;
		  	instance.greet(response.userName);	
		  }
		  
		}).fail(function(error){
			console.log("Error: user get");
			instance.greet(404);
		});
	},
	greet:function(name) {
		var msg;

		if(name && isNaN(name)) {
			msg = "Welcome " + name;		
		} else if (name == 404) {
			msg = "Welcome.. But we can't find you. No recommendations for you.";
		} else {
			msg = "Hey stranger. No recommendations for you.";
		}

		$("#welcome-greeting").text(msg);		
	},

	getDocumentsByTopic:function(topic) {
		var instance = this;
		var settings = {
		  "async": true,
		  "crossDomain": true,
		  "url": "http://rmend-be.appspot.com//v1/document/topic/" + topic,
		  "method": "GET",
		  "headers": {}
		}

		$.ajax(settings).done(function (response) {
		  console.log(response);
		  instance.currentTopic = topic;
		  instance.topics[topic] = response;
		  instance.updateTopicDocumentsView(response);
		}).fail(function(error){
			console.log("Error: topic get");
		});
	},

	updateTopicDocumentsView:function() {
		$("#docs-by-topic").empty();
		console.log("updateTopicDocumentsView");
		var currentTopic = this.currentTopic;
		var topics = this.topics;

		if(currentTopic && topics) {
			console.log("A");
			var i, doc;
			var documents = topics[currentTopic];
			for(i in documents) {
				doc = documents[i]
				console.log(doc);

				var docHTML = '<a href=#><div class="doc" data-featherlight="#mylightbox">' + doc.title.substring(0, 15); + '</div></a>'
				$("#docs-by-topic").append(docHTML);

			}	
		}
	},

	getURLParameter: function(name) {
	  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null
	}
}

// ------------------------------------------
// initialize app
// ------------------------------------------
var app;

$(document).ready(function(){
	console.log("ready");
	app = new App();

});

