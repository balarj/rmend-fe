var App = function() {

	console.log("initializing app");

	this.topics = {};
	this.currentTopic = null;
	this.uuid = null; //c3b1abc4-0b87-4d76-be09-b7440de2f690
	this.uid = null;
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
		var instance = this;

		// topic click handler
		$(".topic").on("click", function(e) {
			e.preventDefault();
			var topic = $(this).attr('topic');
			if(topic) {
				console.log(topic + "clicked");	
				instance.currentTopic = topic;
				instance.getDocumentsByTopic(topic);
			}
		});

		// document (under topic) click handler
		$("#docs-by-topic").on("click",'a',function(e) {
			var index = $(this).index();
			console.log("doc clicked | index: " + index);

			var doc = instance.getDocumentAtIndex(index);
			if(doc) {
				var lightBoxHTML = '<h2>'+doc.title+'</h2><div class="margin-top">'+doc.docBody+'</div>';
				$("#mylightbox").html(lightBoxHTML);

				// user impression
				if(instance.uid) {
					instance.sendUserImpression(instance.uid,doc.docNum);
				}
			}
			
			// Calls to get recommendations (content and item based)	
	
		});

	},
	getUserDetails: function(uuid) {
		var instance = this;
		var settings = {
		  "async": true,
		  "crossDomain": true,
		  "url": Config.BASE_URL + "/user/uuid/" + uuid,
		  "method": "GET",
		  "headers": {}
		}

		$.ajax(settings).done(function (response) {
		  console.log(response);
		  if(response.uuid && response.uid && response.userName) {
		  	instance.uuid = response.uuid;
		  	instance.uid = response.uid;
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
		  "url": Config.BASE_URL + "/document/topic/" + topic,
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
	getDocumentAtIndex:function(index) {
		if(this.currentTopic && this.topics) {
			var documents = this.topics[this.currentTopic];	
			var doc = documents[index];
			return doc;
		}
		return null;
	},
	updateTopicDocumentsView:function() {
		$("#docs-by-topic").empty();
		
		var currentTopic = this.currentTopic;
		var topics = this.topics;

		if(currentTopic && topics) {
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
	sendUserImpression:function(uid,docNum){
		var settings = {
		  "async": true,
		  "crossDomain": true,
		  "url": Config.BASE_URL + "/view/impression?referrer=POSTMAN-CLIENT",
		  "method": "PUT",
		  "headers": {
		    "content-type": "application/json"
		  },
		  "processData": false,
		  data : JSON.stringify({
		  	"uid":uid,
			"docNum":docNum
		  })
		}

		console.log(settings);

		$.ajax(settings).done(function (response) {
		  console.log(response);
		}).fail(function(error){
			console.log("Error: user impression PUT");
		});
		

		// XHR
		// ---------------------------
		/* 
		var data = JSON.stringify({
		  "uid": 7000001,
		  "docNum": 4646595069
		});

		var xhr = new XMLHttpRequest();
		xhr.withCredentials = true;

		xhr.addEventListener("readystatechange", function () {
		  if (this.readyState === this.DONE) {
		    console.log(this.responseText);
		  }
		});

		xhr.open("PUT", "http://rmend-be.appspot.com//v1/view/impression?referrer=POSTMAN-CLIENT");
		xhr.setRequestHeader("content-type", "application/json");

		xhr.send(data);
		*/
		// ---------------------------


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
	app = new App();
});

